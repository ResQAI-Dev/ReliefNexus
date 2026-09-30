import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import api from "../../../lib/api/apiClient";
import { useAuth } from "../../../context/AuthContext";

type DisasterReport = {
  id?: string;
  reporterName?: string;
  disasterType?: string;
  description?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  severity?: string;
  status?: string;
  riskPredictionId?: string | null;
  assignedVolunteerUserId?: string;
  assignedVolunteerName?: string;
  assignedAt?: string;
  fieldUpdateNotes?: string | null;
  fieldSituation?: string | null;
  fieldUpdateLatitude?: number | null;
  fieldUpdateLongitude?: number | null;
  fieldUpdatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type FieldDraft = {
  situation: string;
  notes: string;
  latitude: string;
  longitude: string;
};

const normalize = (value?: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const formatStatus = (value?: string) =>
  String(value || "Assigned")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");

const formatDate = (value?: string | null) => {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No date"
    : date.toLocaleString();
};

const severityClass = (value?: string) => {
  switch (normalize(value)) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const disasterImage = (type?: string) => {
  const value = String(type || "").toLowerCase();

  if (value.includes("flood")) return "/assets/disasters/flood.jpg";
  if (value.includes("landslide")) return "/assets/disasters/landslide.jpg";
  if (value.includes("earthquake")) return "/assets/disasters/earthquake.jpg";
  if (value.includes("tsunami")) return "/assets/disasters/tsunami.jpg";
  if (value.includes("fire") || value.includes("wildfire")) {
    return "/assets/disasters/wildfire.jpg";
  }
  if (value.includes("drought")) return "/assets/disasters/drought.jpg";
  if (value.includes("cyclone") || value.includes("storm")) {
    return "/assets/disasters/cyclone.svg";
  }
  if (value.includes("lightning") || value.includes("thunder")) {
    return "/assets/disasters/lightning.jpg";
  }
  return "/images/disasters/disaster-default (1).svg";
};

const unwrapArray = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const FieldVolunteerAssignedIncidents = () => {
  const { user } = useAuth();

  const [reports, setReports] = useState<DisasterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");
  const [draftByReport, setDraftByReport] = useState<
    Record<string, FieldDraft>
  >({});

  const loadAssignedReports = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(silent);
    setError("");

    try {
      const response = await api.get("/disaster-reports/assigned-to-me");
      setReports(unwrapArray<DisasterReport>(response.data));
    } catch (err: any) {
      console.error("Assigned incidents load failed:", err);
      setError(
        err?.response?.data?.message ||
          "Assigned incidents could not be loaded from the API.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAssignedReports();

    const interval = window.setInterval(() => {
      void loadAssignedReports(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const active = reports.filter((report) =>
      ["assigned", "inprogress", "fieldupdatesubmitted"].includes(
        normalize(report.status),
      ),
    ).length;

    const completed = reports.filter((report) =>
      ["fieldcompleted", "resolved"].includes(normalize(report.status)),
    ).length;

    const highPriority = reports.filter((report) =>
      ["high", "critical"].includes(normalize(report.severity)),
    ).length;

    return {
      total: reports.length,
      active,
      completed,
      highPriority,
    };
  }, [reports]);

  const ensureDraft = (report: DisasterReport): FieldDraft => {
    const id = String(report.id || "");

    return (
      draftByReport[id] || {
        situation: report.fieldSituation || "",
        notes: report.fieldUpdateNotes || "",
        latitude:
          report.fieldUpdateLatitude != null
            ? String(report.fieldUpdateLatitude)
            : report.latitude != null
              ? String(report.latitude)
              : "",
        longitude:
          report.fieldUpdateLongitude != null
            ? String(report.fieldUpdateLongitude)
            : report.longitude != null
              ? String(report.longitude)
              : "",
      }
    );
  };

  const updateDraft = (
    report: DisasterReport,
    patch: Partial<FieldDraft>,
  ) => {
    const id = String(report.id || "");

    setDraftByReport((current) => ({
      ...current,
      [id]: {
        ...ensureDraft(report),
        ...patch,
      },
    }));
  };

  const runAction = async (
    report: DisasterReport,
    action: "start" | "update" | "complete",
  ) => {
    if (!report.id) return;

    const id = String(report.id);
    setActionLoading(`${action}-${id}`);
    setActionError("");

    const draft = ensureDraft(report);

    try {
      if (action === "start") {
        await api.patch(`/disaster-reports/${id}/field-start`);
      }

      if (action === "update") {
        if (!draft.situation.trim() && !draft.notes.trim()) {
          throw new Error(
            "Enter the current situation or field notes before submitting the update.",
          );
        }

        await api.patch(`/disaster-reports/${id}/field-update`, {
          notes: draft.notes.trim() || null,
          situation: draft.situation.trim() || null,
          latitude: draft.latitude.trim()
            ? Number(draft.latitude)
            : null,
          longitude: draft.longitude.trim()
            ? Number(draft.longitude)
            : null,
        });
      }

      if (action === "complete") {
        if (!draft.situation.trim() && !draft.notes.trim()) {
          throw new Error(
            "Submit at least one field observation before completing the response.",
          );
        }

        await api.patch(`/disaster-reports/${id}/field-update`, {
          notes: draft.notes.trim() || null,
          situation: draft.situation.trim() || null,
          latitude: draft.latitude.trim()
            ? Number(draft.latitude)
            : null,
          longitude: draft.longitude.trim()
            ? Number(draft.longitude)
            : null,
        });

        await api.patch(`/disaster-reports/${id}/field-complete`);
      }

      await loadAssignedReports();
      setOpenReportId(id);
    } catch (err: any) {
      console.error(`Field ${action} failed:`, err);
      setActionError(
        err?.response?.data?.message ||
          err?.message ||
          `The field ${action} action could not be completed.`,
      );
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[26px] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-blue-600">
              Field Volunteer Operations
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              My Assigned Incidents
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              Incidents assigned by a Relief Coordinator or System
              Administrator appear here. Field Response is performed from
              this authenticated Field Volunteer account.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <UserRound size={16} className="text-blue-600" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Signed in as
              </p>
              <p className="text-xs font-black text-slate-900">
                {user?.fullName || "Field Volunteer"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadAssignedReports()}
              disabled={loading}
              className="ml-2 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              title="Refresh assigned incidents"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Assigned Incidents", stats.total, "Total linked to me"],
          ["Active Response", stats.active, "Requires field action"],
          ["High Priority", stats.highPriority, "High or Critical"],
          ["Field Completed", stats.completed, "Completed on site"],
        ].map(([label, value, subtitle]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {value}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">{subtitle}</p>
          </div>
        ))}
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {actionError}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading assigned incidents...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <CheckCircle2 size={30} className="mx-auto text-emerald-500" />
          <p className="mt-3 text-sm font-black text-slate-800">
            No incidents are currently assigned to you.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            New assignments will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const id = String(report.id || "");
            const status = normalize(report.status);
            const completed = ["fieldcompleted", "resolved"].includes(status);
            const draft = ensureDraft(report);
            const isOpen = openReportId === id;

            return (
              <article
                key={id}
                className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenReportId((current) => (current === id ? null : id))
                  }
                  className="w-full p-4 text-left sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <img
                        src={disasterImage(report.disasterType)}
                        alt={report.disasterType || "Disaster"}
                        className="h-16 w-24 shrink-0 rounded-2xl border border-slate-200 object-cover"
                        onError={(event) => {
                          event.currentTarget.src =
                            "/images/disasters/disaster-default (1).svg";
                        }}
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                            Assigned Incident
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${severityClass(
                              report.severity,
                            )}`}
                          >
                            {report.severity || "Unknown"}
                          </span>
                        </div>
                        <h2 className="mt-1 truncate text-lg font-black text-slate-950">
                          {report.location || "Unknown location"}
                        </h2>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {report.disasterType || "Disaster"}  Assigned to{" "}
                          {report.assignedVolunteerName || "you"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-xl bg-blue-50 px-3 py-2 text-[9px] font-black text-blue-700">
                        Step 7
                      </span>
                      <span className="rounded-xl bg-slate-50 px-3 py-2 text-[9px] font-black text-slate-600">
                        {formatStatus(report.status)}
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5">
                    <div className="grid gap-3 lg:grid-cols-[.85fr_1.15fr]">
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={15} className="text-blue-600" />
                            <p className="text-xs font-black text-slate-900">
                              Incident Brief
                            </p>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Reporter
                              </p>
                              <p className="mt-1 text-xs font-black text-slate-800">
                                {report.reporterName || "Unknown"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Disaster
                              </p>
                              <p className="mt-1 text-xs font-black text-slate-800">
                                {report.disasterType || "Unknown"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Assigned
                              </p>
                              <p className="mt-1 text-xs font-black text-slate-800">
                                {formatDate(report.assignedAt)}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Last Update
                              </p>
                              <p className="mt-1 text-xs font-black text-slate-800">
                                {formatDate(report.fieldUpdatedAt)}
                              </p>
                            </div>
                          </div>

                          {report.description && (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Incident description
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                {report.description}
                              </p>
                            </div>
                          )}

                          {report.latitude != null &&
                            report.longitude != null && (
                              <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10px] font-semibold text-blue-800">
                                <MapPin size={13} />
                                {Number(report.latitude).toFixed(5)},{" "}
                                {Number(report.longitude).toFixed(5)}
                              </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="flex items-center gap-2">
                            <Clock3 size={14} className="text-emerald-700" />
                            <p className="text-xs font-black text-emerald-900">
                              Response Lifecycle
                            </p>
                          </div>
                          <div className="mt-3 grid gap-2">
                            <div className="rounded-xl bg-white p-3">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Assignment
                              </p>
                              <p className="mt-1 text-xs font-black text-slate-800">
                                 Completed by coordinator
                              </p>
                            </div>
                            <div className="rounded-xl bg-white p-3">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Field response
                              </p>
                              <p className="mt-1 text-xs font-black text-slate-800">
                                {completed
                                  ? " Completed"
                                  : status === "inprogress" ||
                                      status === "fieldupdatesubmitted"
                                    ? "In progress"
                                    : "Ready to start"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-white p-3">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Resolution
                              </p>
                              <p className="mt-1 text-xs font-black text-slate-800">
                                {status === "resolved"
                                  ? " Resolved"
                                  : "Waiting for coordinator"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                              Process 7  Assigned Volunteer
                            </p>
                            <h3 className="mt-1 text-lg font-black text-slate-950">
                              Field Response
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Record what is happening on site, submit the
                              latest observations and complete the field
                              response when the work is finished.
                            </p>
                          </div>

                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[8px] font-black text-blue-700">
                            {completed ? "Completed" : "Volunteer Action"}
                          </span>
                        </div>

                        {completed ? (
                          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                              Field response completed
                            </p>
                            <p className="mt-1 text-sm font-black text-emerald-900">
                              {report.fieldSituation ||
                                "Field response completed."}
                            </p>
                            <p className="mt-2 text-[10px] leading-4 text-emerald-800">
                              Your final field notes were recorded at{" "}
                              {formatDate(report.fieldUpdatedAt)}. The incident
                              is now ready for Step 8 Resolution.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-5 space-y-4">
                            {status === "assigned" && (
                              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[9px] font-black uppercase text-blue-700">
                                      Start assignment
                                    </p>
                                    <p className="mt-1 text-[10px] leading-4 text-blue-800">
                                      Starting the field response changes the
                                      incident status to In Progress.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void runAction(report, "start")
                                    }
                                    disabled={
                                      actionLoading === `start-${id}`
                                    }
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                  >
                                    {actionLoading === `start-${id}`
                                      ? "Starting..."
                                      : "Start Field Response"}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="space-y-3">
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                  Current situation
                                </label>
                                <textarea
                                  value={draft.situation}
                                  onChange={(event) =>
                                    updateDraft(report, {
                                      situation: event.target.value,
                                    })
                                  }
                                  rows={4}
                                  placeholder="Describe the latest situation at the incident location..."
                                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none focus:border-blue-400"
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                  Field notes
                                </label>
                                <textarea
                                  value={draft.notes}
                                  onChange={(event) =>
                                    updateDraft(report, {
                                      notes: event.target.value,
                                    })
                                  }
                                  rows={4}
                                  placeholder="Record observations, actions taken, resource needs or safety issues..."
                                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none focus:border-blue-400"
                                />
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                    Field latitude
                                  </label>
                                  <input
                                    value={draft.latitude}
                                    onChange={(event) =>
                                      updateDraft(report, {
                                        latitude: event.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none focus:border-blue-400"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                    Field longitude
                                  </label>
                                  <input
                                    value={draft.longitude}
                                    onChange={(event) =>
                                      updateDraft(report, {
                                        longitude: event.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none focus:border-blue-400"
                                  />
                                </div>
                              </div>
                            </div>

                            {report.fieldUpdatedAt && (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                  Last submitted situation
                                </p>
                                <p className="mt-1 text-xs text-slate-700">
                                  {report.fieldSituation ||
                                    "No situation text"}
                                </p>
                                <p className="mt-2 text-[10px] text-slate-500">
                                  Updated {formatDate(report.fieldUpdatedAt)}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  void runAction(report, "update")
                                }
                                disabled={
                                  actionLoading === `update-${id}` ||
                                  status === "assigned"
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Send size={13} />
                                {actionLoading === `update-${id}`
                                  ? "Submitting..."
                                  : "Submit Field Update"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void runAction(report, "complete")
                                }
                                disabled={
                                  actionLoading === `complete-${id}` ||
                                  status === "assigned"
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <CheckCircle2 size={13} />
                                {actionLoading === `complete-${id}`
                                  ? "Completing..."
                                  : "Complete Field Response"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {refreshing && (
        <div className="fixed bottom-5 right-5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black text-slate-600 shadow-lg">
          Refreshing assignments...
        </div>
      )}
    </div>
  );
};

export default FieldVolunteerAssignedIncidents;



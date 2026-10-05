import { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api/apiClient";
import { useAuth } from "../../../context/AuthContext";

type Report = {
  id: string;
  disasterType?: string;
  description?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  severity?: string;
  riskScore?: number | null;
  riskLevel?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedVolunteerUserId?: string | null;
  assignedVolunteerName?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  fieldUpdateNotes?: string | null;
  fieldSituation?: string | null;
  fieldUpdateLatitude?: number | null;
  fieldUpdateLongitude?: number | null;
  fieldUpdatedAt?: string | null;
};

type Action = "start" | "update" | "complete";

const imageMap: Record<string, string> = {
  avalanche: "/assets/disasters/avalanche.jpg",
  cyclone: "/assets/disasters/cyclone.jpg",
  drought: "/assets/disasters/drought.jpg",
  earthquake: "/assets/disasters/earthquake.jpg",
  flood: "/assets/disasters/flood.jpg",
  hailstorm: "/assets/disasters/hailstorm.jpg",
  landslide: "/assets/disasters/landslide.jpg",
  lightning: "/assets/disasters/lightning.jpg",
  tornado: "/assets/disasters/tornado.jpg",
  tsunami: "/assets/disasters/tsunami.jpg",
  "volcanic eruption": "/assets/disasters/volcanic-eruption.jpg",
  wildfire: "/assets/disasters/wildfire.jpg",
};

const normalizeStatus = (status?: string) =>
  String(status || "").replace(/\s+/g, "").toLowerCase();

const formatDate = (value?: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getImage = (type?: string) =>
  imageMap[String(type || "").trim().toLowerCase()] ||
  "/assets/disasters/landslide.jpg";

const StatusBadge = ({ status }: { status?: string }) => {
  const key = normalizeStatus(status);

  const styles =
    key === "assigned"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : key === "inprogress"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : key === "fieldupdatesubmitted"
          ? "bg-violet-50 text-violet-700 border-violet-100"
          : key === "fieldcompleted"
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-slate-50 text-slate-600 border-slate-200";

  const label =
    key === "inprogress"
      ? "In Progress"
      : key === "fieldupdatesubmitted"
        ? "Field Update Submitted"
        : key === "fieldcompleted"
          ? "Field Completed"
          : status || "Unknown";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${styles}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

const SeverityBadge = ({ severity }: { severity?: string }) => {
  const value = String(severity || "Medium");
  const key = value.toLowerCase();

  const styles =
    key === "critical"
      ? "bg-red-50 text-red-700 border-red-100"
      : key === "high"
        ? "bg-orange-50 text-orange-700 border-orange-100"
        : key === "low"
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold ${styles}`}
    >
      {value}
    </span>
  );
};


const Icon = ({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "alert":
      return (
        <svg {...common}>
          <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "location":
      return (
        <svg {...common}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "workflow":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.5" />
          <circle cx="19" cy="6" r="2.5" />
          <circle cx="19" cy="18" r="2.5" />
          <path d="M7.5 11 16.5 7M7.5 13l9 4" />
        </svg>
      );
    case "update":
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M15 3v4h4M9 12h6M9 16h6" />
        </svg>
      );
    case "assist":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0M14 20a4 4 0 0 1 7 0" />
        </svg>
      );
    case "complete":
      return (
        <svg {...common}>
          <path d="M4 5h16v14H4z" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
          <path d="M9 3v15M15 6v15" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <path d="m9 6 9 6-9 6z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      );
    case "message":
      return (
        <svg {...common}>
          <path d="M4 5h16v11H8l-4 4z" />
          <path d="M8 9h8M8 12h5" />
        </svg>
      );
    case "file":
      return (
        <svg {...common}>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v5h4M9 13h6M9 16h6" />
        </svg>
      );
    default:
      return <span className="block h-2 w-2 rounded-full bg-current" />;
  }
};

const ActionCard = ({
  title,
  subtitle,
  icon,
  disabled,
  primary,
  loading,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  disabled?: boolean;
  primary?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    onClick={onClick}
    className={`group flex min-h-[78px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
      primary
        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        : disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
          : "border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50/40"
    }`}
  >
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
        primary ? "bg-white/15" : "bg-slate-100"
      }`}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon name={icon} size={20} />}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-extrabold">{title}</span>
      <span
        className={`mt-1 block text-xs ${
          primary ? "text-blue-100" : "text-slate-400"
        }`}
      >
        {subtitle}
      </span>
    </span>
  </button>
);

export default function FieldVolunteerDisasterReports() {
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [availableReports, setAvailableReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [claimLoading, setClaimLoading] = useState("");
  const [error, setError] = useState("");

  const [notes, setNotes] = useState("");
  const [situation, setSituation] = useState("");
  const [fieldLatitude, setFieldLatitude] = useState("");
  const [fieldLongitude, setFieldLongitude] = useState("");
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/disaster-reports/assigned-to-me");

      const raw: Report[] = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      const normalizedUserId = String(user?.id || "").toLowerCase();

      // Reports already assigned to this Field Volunteer
      const mine = raw.filter(
        (item: Report) =>
          item.assignedVolunteerUserId &&
          normalizedUserId &&
          String(item.assignedVolunteerUserId).toLowerCase() ===
            normalizedUserId
      );

      // Low-risk reports that are waiting for a Field Volunteer.
      // The backend puts reports with Risk Score < 75 into VolunteerQueue.
      const available = raw.filter(
        (item: Report) =>
          normalizeStatus(item.status) === "volunteerqueue" &&
          !item.assignedVolunteerUserId
      );

      setReports(mine);
      setAvailableReports(available);
    } catch (err: any) {
      console.error("Failed to load Field Volunteer disaster reports:", err);

      setReports([]);
      setAvailableReports([]);

      setError(
        err?.response?.data?.message ||
          "Unable to load disaster reports."
      );
    } finally {
      setLoading(false);
    }
  };
  const claimDisaster = async (report: Report) => {
    const key = `claim-${report.id}`;

    setClaimLoading(key);
    setError("");

    try {
      await api.patch(`/disaster-reports/${report.id}/claim`);

      // Reload both available and assigned lists.
      await loadReports();

      // Open the newly assigned report immediately.
      const latestResponse = await api.get("/disaster-reports");

      const latestRaw: Report[] = Array.isArray(latestResponse.data)
        ? latestResponse.data
        : Array.isArray(latestResponse.data?.data)
          ? latestResponse.data.data
          : [];

      const latest = latestRaw.find(
        (item: Report) => item.id === report.id
      );

      if (latest) {
        openReport(latest);
      }
    } catch (err: any) {
      console.error("Failed to claim disaster:", err);

      setError(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : "This disaster could not be claimed. It may already be assigned to another volunteer.")
      );
    } finally {
      setClaimLoading("");
    }
  };
  useEffect(() => {
    if (user?.id) void loadReports();
  }, [user?.id]);

  const stats = useMemo(
    () => ({
      assigned: reports.filter(
        (r) => normalizeStatus(r.status) === "assigned"
      ).length,
      inProgress: reports.filter(
        (r) => normalizeStatus(r.status) === "inprogress"
      ).length,
      updates: reports.filter(
        (r) => normalizeStatus(r.status) === "fieldupdatesubmitted"
      ).length,
      completed: reports.filter(
        (r) => normalizeStatus(r.status) === "fieldcompleted"
      ).length,
    }),
    [reports]
  );

  const openReport = (report: Report) => {
    setSelected(report);
    setError("");
    setShowUpdateForm(false);
    setNotes(report.fieldUpdateNotes || "");
    setSituation(report.fieldSituation || "");
    setFieldLatitude(
      report.fieldUpdateLatitude != null
        ? String(report.fieldUpdateLatitude)
        : report.latitude != null
          ? String(report.latitude)
          : ""
    );
    setFieldLongitude(
      report.fieldUpdateLongitude != null
        ? String(report.fieldUpdateLongitude)
        : report.longitude != null
          ? String(report.longitude)
          : ""
    );
  };

  const refreshSelected = async () => {
    await loadReports();

    if (!selected?.id) return;

    try {
      const response = await api.get("/disaster-reports/assigned-to-me");
      const raw = Array.isArray(response.data) ? response.data : [];
      const latest = raw.find((item: Report) => item.id === selected.id);

      if (latest) {
        setSelected(latest);
        setNotes(latest.fieldUpdateNotes || "");
        setSituation(latest.fieldSituation || "");
      }
    } catch {
      // Main list already refreshed; keep the current detail view.
    }
  };

  const runAction = async (report: Report, action: Action) => {
    const key = `${action}-${report.id}`;
    setActionLoading(key);
    setError("");

    try {
      if (action === "start") {
        await api.patch(`/disaster-reports/${report.id}/field-start`);
      }

      if (action === "update") {
        if (!notes.trim()) {
          setError("Please enter field notes before submitting the update.");
          return;
        }

        await api.patch(`/disaster-reports/${report.id}/field-update`, {
          notes: notes.trim(),
          situation: situation.trim() || null,
          latitude: fieldLatitude ? Number(fieldLatitude) : null,
          longitude: fieldLongitude ? Number(fieldLongitude) : null,
        });
      }

      if (action === "complete") {
        await api.patch(`/disaster-reports/${report.id}/field-complete`);
      }

      await refreshSelected();
      setShowUpdateForm(false);
    } catch (err: any) {
      console.error("Field workflow action failed:", err);
      setError(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : "The workflow action could not be completed.")
      );
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-500">
          Loading assigned disasters...
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="space-y-7">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-xl">
              <Icon name="alert" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                My Assigned Disasters
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Respond to verified disaster reports assigned to you and submit
                field updates.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Assigned", stats.assigned, "bg-blue-50 text-blue-700"],
            ["In Progress", stats.inProgress, "bg-amber-50 text-amber-700"],
            ["Updates", stats.updates, "bg-violet-50 text-violet-700"],
            ["Completed", stats.completed, "bg-emerald-50 text-emerald-700"],
          ].map(([label, value, style]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span
                className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-extrabold ${style}`}
              >
                {label}
              </span>
              <p className="mt-4 text-3xl font-black text-slate-950">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Live workflow records
              </p>
            </div>
          ))}
        </div>

        {/* =====================================================
            AVAILABLE DISASTERS
            Low-risk reports (<75%) waiting for a volunteer
           ===================================================== */}

        {availableReports.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                    
                  </span>

                  <h2 className="text-xl font-black text-slate-950">
                    Available Disasters
                  </h2>

                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                    {availableReports.length}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  New low-risk disaster reports are available for Field Volunteers.
                </p>
              </div>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                Risk score below 75%
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {availableReports.map((report) => (
                <article
                  key={report.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={getImage(report.disasterType)}
                      alt={report.disasterType || "Disaster"}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-800 shadow">
                        {report.disasterType || "Disaster"}
                      </span>

                      <SeverityBadge severity={report.severity} />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
                      <p className="text-xs font-bold text-white/80">
                         {report.location || "Location unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">
                          {report.disasterType || "Disaster Report"}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Reported {formatDate(report.createdAt)}
                        </p>
                      </div>

                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        Available
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                      {report.description || "No description provided."}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Risk Score
                        </p>

                        <p className="mt-1 text-xl font-black text-emerald-600">
                          {typeof report.riskScore === "number"
                            ? `${Math.round(report.riskScore)}%`
                            : "< 75%"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Location
                        </p>

                        <p className="mt-1 truncate text-xs font-bold text-slate-700">
                          {report.location || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => openReport(report)}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        disabled={
                          claimLoading === `claim-${report.id}`
                        }
                        onClick={() => void claimDisaster(report)}
                        className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {claimLoading === `claim-${report.id}`
                          ? "Claiming..."
                          : "Accept Disaster"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================
            MY ASSIGNED DISASTERS
           ===================================================== */}
        {reports.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              
            </div>
            <h2 className="mt-5 text-lg font-extrabold text-slate-900">
              No assigned disasters
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              New disasters you accept will appear here. Low-risk reports are shown above under Available Disasters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="relative h-52 overflow-hidden bg-slate-100">
                  <img
                    src={getImage(report.disasterType)}
                    alt={report.disasterType || "Disaster"}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                    <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-800 shadow">
                      {report.disasterType || "Disaster"}
                    </span>
                    <SeverityBadge severity={report.severity} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        {report.disasterType || "Disaster Report"}
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                        <Icon name="location" size={15} />
                        {report.location || "Location unavailable"}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                    {report.description || "No description provided."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Coordinates
                      </p>
                      <p className="mt-1 truncate font-mono text-xs font-bold text-slate-700">
                        {report.latitude != null && report.longitude != null
                          ? `${report.latitude}, ${report.longitude}`
                          : "Not available"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Last Update
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-700">
                        {formatDate(report.fieldUpdatedAt || report.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openReport(report)}
                    className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    View &amp; Manage Response
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-y-0 left-[255px] right-0 z-[100] max-[767px]:left-0 overflow-y-auto overscroll-contain bg-[#f5f8fc]">
          <div className="min-h-full bg-[#f5f8fc]">
            {/* Modal top bar */}
            <div className="relative z-20 border-b border-slate-200 bg-white shadow-sm">
              <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-5">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Icon name="back" size={18} />
                </button>

                <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
                  <span>My Assigned Disasters</span>
                  <span className="text-slate-300">/</span>
                  <span>{selected.disasterType || "Disaster"}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-700">Manage Response</span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 sm:block"
                  >
                    Message Admin
                  </button>
                  <button
                    type="button"
                    className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 sm:block"
                  >
                    View Full Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-500 shadow-sm hover:bg-slate-50"
                  >
                    
                  </button>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-[1540px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
              {/* Page heading */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl shadow-sm">
                    <Icon name="alert" size={20} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                        {selected.disasterType || "Disaster"}
                      </h2>
                      <SeverityBadge severity={selected.severity} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage your field response, submit updates, and complete
                      the operation.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-6 xl:grid-cols-[minmax(540px,0.95fr)_minmax(580px,1.05fr)]">
                {/* LEFT: Report details */}
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-[320px] overflow-hidden sm:h-[390px]">
                      <img
                        src={getImage(selected.disasterType)}
                        alt={selected.disasterType || "Disaster"}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                        <span className="rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-lg">
                          {selected.disasterType || "DISASTER"}
                        </span>
                        <SeverityBadge severity={selected.severity} />
                      </div>

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent px-5 pb-5 pt-24 text-white">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-bold">
                              <Icon name="location" size={17} />
                              <span>
                                {selected.location || "Location unavailable"}
                              </span>
                            </div>
                            <p className="mt-1 font-mono text-xs text-white/80">
                              {selected.latitude != null &&
                              selected.longitude != null
                                ? `${selected.latitude}, ${selected.longitude}`
                                : "Coordinates unavailable"}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs font-semibold text-white/70">
                              Reported on
                            </p>
                            <p className="mt-1 text-xs font-bold">
                              {formatDate(selected.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-black text-slate-950">
                            {selected.disasterType || "Disaster Report"}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {selected.description ||
                              "No description provided."}
                          </p>
                        </div>
                        <StatusBadge status={selected.status} />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {[
                          [
                            "",
                            "Disaster Type",
                            selected.disasterType || "Unknown",
                          ],
                          ["location", "Location", selected.location || "Unknown"],
                          [
                            "",
                            "Coordinates",
                            selected.latitude != null &&
                            selected.longitude != null
                              ? `${selected.latitude}, ${selected.longitude}`
                              : "Not available",
                          ],
                          [
                            "",
                            "Reported By",
                            selected.reporterName || "Unknown reporter",
                          ],
                          [
                            "",
                            "Contact",
                            selected.reporterEmail || "Not available",
                          ],
                          [
                            "",
                            "Last Updated",
                            formatDate(
                              selected.fieldUpdatedAt || selected.updatedAt
                            ),
                          ],
                        ].map(([icon, label, value]) => (
                          <div
                            key={label}
                            className="flex min-h-[70px] items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                              <Icon name={String(icon)} size={18} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                {label}
                              </p>
                              <p className="mt-1 truncate text-sm font-bold text-slate-800">
                                {value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Map preview */}
                      {selected.latitude != null &&
                        selected.longitude != null && (
                          <div className="relative mt-4 h-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            <iframe
                              title="Disaster location map"
                              className="h-full w-full border-0"
                              loading="lazy"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${selected.longitude - 0.015}%2C${selected.latitude - 0.012}%2C${selected.longitude + 0.015}%2C${selected.latitude + 0.012}&layer=mapnik&marker=${selected.latitude}%2C${selected.longitude}`}
                            />
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=15/${selected.latitude}/${selected.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute right-3 top-3 rounded-xl bg-slate-900/85 px-3 py-2 text-xs font-extrabold text-white shadow-lg"
                            >
                              Open in Maps
                            </a>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Workflow */}
                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                        <Icon name="workflow" size={20} />
                      </div>
                      <h3 className="text-xl font-black text-slate-950">
                        Response Workflow
                      </h3>
                    </div>

                    <div className="mt-7 overflow-x-auto pb-2">
                      <div className="flex min-w-[650px] items-start">
                        {[
                          ["Assigned", true, "Assigned"],
                          [
                            "In Progress",
                            ["inprogress", "fieldupdatesubmitted", "fieldcompleted"].includes(
                              normalizeStatus(selected.status)
                            ),
                            "Not started",
                          ],
                          [
                            "Updates",
                            ["fieldupdatesubmitted", "fieldcompleted"].includes(
                              normalizeStatus(selected.status)
                            ),
                            selected.fieldUpdateNotes ? "1 update" : "0 updates",
                          ],
                          [
                            "Completed",
                            normalizeStatus(selected.status) === "fieldcompleted",
                            normalizeStatus(selected.status) === "fieldcompleted"
                              ? "Completed"
                              : "Pending",
                          ],
                          ["Resolved", false, "Pending"],
                        ].map(([label, done, caption], index) => (
                          <div
                            key={String(label)}
                            className="flex min-w-[118px] flex-1 items-start"
                          >
                            <div className="w-full text-center">
                              <div className="relative flex items-center justify-center">
                                {index > 0 && (
                                  <span
                                    className={`absolute right-1/2 top-1/2 h-1 w-full -translate-y-1/2 ${
                                      done ? "bg-blue-600" : "bg-slate-200"
                                    }`}
                                  />
                                )}
                                <span
                                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-sm font-black shadow-sm ${
                                    done
                                      ? "bg-blue-600 text-white"
                                      : label === "In Progress" &&
                                          normalizeStatus(selected.status) ===
                                            "assigned"
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  {done ? <Icon name="check" size={17} /> : label === "In Progress" &&
                                      normalizeStatus(selected.status) ===
                                        "assigned"
                                    ? <Icon name="play" size={15} />
                                    : <Icon name="check" size={16} />}
                                </span>
                              </div>
                              <p className="mt-3 text-xs font-black text-slate-900">
                                {label}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {label === "Assigned"
                                  ? formatDate(selected.createdAt)
                                  : caption}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {normalizeStatus(selected.status) === "assigned"
                            ? "Start your field response to mark this report as In Progress."
                            : normalizeStatus(selected.status) ===
                                "fieldcompleted"
                              ? "Field operation completed. The control center can now resolve the report."
                              : "Keep the control center updated with the latest field situation."}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Once you start, you can submit field updates, notes,
                          and coordinates.
                        </p>
                      </div>

                      {normalizeStatus(selected.status) === "assigned" && (
                        <button
                          type="button"
                          disabled={actionLoading === `start-${selected.id}`}
                          onClick={() => void runAction(selected, "start")}
                          className="shrink-0 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          {actionLoading === `start-${selected.id}`
                            ? "Starting..."
                            : "Start Response"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <ActionCard
                      title="Add Field Update"
                      subtitle="Share progress, photos and notes"
                      icon="update"
                      disabled={
                        !["inprogress", "fieldupdatesubmitted"].includes(
                          normalizeStatus(selected.status)
                        )
                      }
                      onClick={() => setShowUpdateForm(true)}
                    />

                    <ActionCard
                      title="Request Assistance"
                      subtitle="Get support from the control center"
                      icon="assist"
                      disabled
                    />

                    <ActionCard
                      title="Mark as Complete"
                      subtitle="Finish field operation"
                      icon="complete"
                      disabled={
                        !["inprogress", "fieldupdatesubmitted"].includes(
                          normalizeStatus(selected.status)
                        )
                      }
                      loading={actionLoading === `complete-${selected.id}`}
                      onClick={() => void runAction(selected, "complete")}
                    />
                  </div>

                  {showUpdateForm && (
                    <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                            Field Update
                          </p>
                          <h3 className="mt-1 text-xl font-black text-slate-950">
                            Add Field Update
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowUpdateForm(false)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-500 hover:bg-slate-200"
                        >
                          
                        </button>
                      </div>

                      <label className="mt-5 block">
                        <span className="text-sm font-bold text-slate-700">
                          Notes
                        </span>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          placeholder="Describe what you observed at the location..."
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </label>

                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <label>
                          <span className="text-sm font-bold text-slate-700">
                            Current Situation
                          </span>
                          <select
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                          >
                            <option value="">Select situation</option>
                            <option value="Stable">Stable</option>
                            <option value="Under Control">Under Control</option>
                            <option value="Needs Assistance">Needs Assistance</option>
                            <option value="Critical">Critical</option>
                            <option value="Evacuation Required">
                              Evacuation Required
                            </option>
                          </select>
                        </label>

                        <label>
                          <span className="text-sm font-bold text-slate-700">
                            Latitude
                          </span>
                          <input
                            value={fieldLatitude}
                            onChange={(e) => setFieldLatitude(e.target.value)}
                            placeholder="Latitude"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-blue-500"
                          />
                        </label>

                        <label>
                          <span className="text-sm font-bold text-slate-700">
                            Longitude
                          </span>
                          <input
                            value={fieldLongitude}
                            onChange={(e) => setFieldLongitude(e.target.value)}
                            placeholder="Longitude"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-blue-500"
                          />
                        </label>
                      </div>

                      <div className="mt-5 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowUpdateForm(false)}
                          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === `update-${selected.id}`}
                          onClick={() => void runAction(selected, "update")}
                          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
                        >
                          {actionLoading === `update-${selected.id}`
                            ? "Submitting..."
                            : "Submit Field Update"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                          
                        </div>
                        <h3 className="text-xl font-black text-slate-950">
                          Field Updates
                        </h3>
                      </div>
                      <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-50 px-2 text-xs font-black text-blue-700">
                        {selected.fieldUpdateNotes ? 1 : 0}
                      </span>
                    </div>

                    {selected.fieldUpdateNotes ? (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm leading-6 text-slate-700">
                          {selected.fieldUpdateNotes}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                          {selected.fieldSituation && (
                            <span className="rounded-full bg-white px-3 py-1.5">
                              {selected.fieldSituation}
                            </span>
                          )}
                          {selected.fieldUpdateLatitude != null &&
                            selected.fieldUpdateLongitude != null && (
                              <span className="rounded-full bg-white px-3 py-1.5 font-mono">
                                {selected.fieldUpdateLatitude},{" "}
                                {selected.fieldUpdateLongitude}
                              </span>
                            )}
                          <span className="rounded-full bg-white px-3 py-1.5">
                            {formatDate(selected.fieldUpdatedAt)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowUpdateForm(true)}
                          disabled={
                            !["inprogress", "fieldupdatesubmitted"].includes(
                              normalizeStatus(selected.status)
                            )
                          }
                          className="mt-4 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-extrabold text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                        >
                         Add Another Update
                        </button>
                      </div>
                    ) : (
                      <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl text-slate-400 shadow-sm">
                          
                        </div>
                        <h4 className="mt-4 text-sm font-black text-slate-800">
                          No updates yet
                        </h4>
                        <p className="mt-1 max-w-md text-sm text-slate-500">
                          Start your response and submit field updates to keep
                          everyone informed.
                        </p>
                        <button
                          type="button"
                          disabled={
                            !["inprogress", "fieldupdatesubmitted"].includes(
                              normalizeStatus(selected.status)
                            )
                          }
                          onClick={() => setShowUpdateForm(true)}
                          className="mt-5 rounded-xl border border-blue-500 bg-white px-5 py-3 text-sm font-extrabold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Add Your First Update
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}







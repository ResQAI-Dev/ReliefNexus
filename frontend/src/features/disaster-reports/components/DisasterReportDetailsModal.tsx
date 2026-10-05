import {
  CheckCircle2,
  MapPin,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";

import type {
  DisasterReport,
  VolunteerUser,
} from "../types/disasterReports.types";

import DisasterReportWorkflow from "./DisasterReportWorkflow";

type Props = {
  report: DisasterReport;
  users: VolunteerUser[];
  selectedVolunteer: string;
  setSelectedVolunteer: (value: string) => void;
  actionLoading: string;
  error: string;
  onClose: () => void;
  onAction: (
    action: "review" | "verify" | "assign" | "resolve" | "reject"
  ) => void;
};

const imageMap: Record<string, string> = {
  flood: "/assets/disasters/flood.jpg",
  landslide: "/assets/disasters/landslide.jpg",
  earthquake: "/assets/disasters/earthquake.jpg",
  cyclone: "/assets/disasters/cyclone.jpg",
  drought: "/assets/disasters/drought.jpg",
  wildfire: "/assets/disasters/wildfire.jpg",
  lightning: "/assets/disasters/lightning.jpg",
  tornado: "/assets/disasters/tornado.jpg",
  tsunami: "/assets/disasters/tsunami.jpg",
  hailstorm: "/assets/disasters/hailstorm.jpg",
  avalanche: "/assets/disasters/avalanche.jpg",
  "volcanic eruption":
    "/assets/disasters/volcanic-eruption.jpg",
};

const imageFor = (type?: string | null) =>
  imageMap[String(type || "").toLowerCase()] ||
  "/assets/disasters/flood.jpg";

export default function DisasterReportDetailsModal({
  report,
  users,
  selectedVolunteer,
  setSelectedVolunteer,
  actionLoading,
  error,
  onClose,
  onAction,
}: Props) {
  const status = String(report.status || "Submitted");

  const canReview =
    status === "Submitted";

  const canVerify =
    status === "UnderReview" ||
    status === "Reviewed";

  const canAssign =
    status === "Verified";

  const canResolve =
    status === "Assigned" ||
    status === "Response" ||
    status === "InProgress" ||
    status === "FieldUpdateSubmitted" ||
    status === "FieldCompleted";

  const isDone =
    status === "Resolved" ||
    status === "Rejected";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-[#f8fafc] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              Disaster Report
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              {report.disasterType || "Disaster Report"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img
                src={imageFor(report.disasterType)}
                alt={report.disasterType || "Disaster"}
                className="h-64 w-full object-cover"
              />

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase text-blue-700">
                    {report.disasterType || "Unknown"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase text-slate-600">
                    {report.status || "Submitted"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {report.description ||
                    "No additional description was provided."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Risk Score
                </p>

                <p className="mt-2 text-2xl font-black text-blue-700">
                  {typeof report.riskScore === "number"
                    ? `${Math.round(report.riskScore)}%`
                    : "Not available"}
                </p>

                {report.riskLevel && (
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {report.riskLevel}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Severity
                </p>

                <p className="mt-2 text-xl font-black text-slate-900">
                  {report.severity || "Medium"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 text-blue-600" size={19} />

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Report Location
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    {report.location || "Location unavailable"}
                  </p>

                  {report.latitude != null &&
                    report.longitude != null && (
                      <p className="mt-2 font-mono text-xs text-slate-500">
                        {report.latitude},{" "}
                        {report.longitude}
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 text-blue-600" size={19} />

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Reporter
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    {report.reporterName ||
                      "Affected User"}
                  </p>

                  {report.reporterEmail && (
                    <p className="mt-1 text-xs text-slate-500">
                      {report.reporterEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <DisasterReportWorkflow report={report} />

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Administrative Action
                </p>

                <h3 className="mt-1 text-base font-black text-slate-950">
                  Manage response
                </h3>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              {canReview && (
                <button
                  type="button"
                  disabled={actionLoading === `review-${report.id}`}
                  onClick={() => onAction("review")}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {actionLoading === `review-${report.id}`
                    ? "Reviewing..."
                    : "Start Review"}
                </button>
              )}

              {canVerify && (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={actionLoading === `verify-${report.id}`}
                    onClick={() => onAction("verify")}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {actionLoading === `verify-${report.id}`
                      ? "Verifying..."
                      : "Verify Report"}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading === `reject-${report.id}`}
                    onClick={() => onAction("reject")}
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    Reject Report
                  </button>
                </div>
              )}

              {canAssign && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Assign Field Volunteer
                    </label>

                    <select
                      value={selectedVolunteer}
                      onChange={(event) =>
                        setSelectedVolunteer(event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                    >
                      <option value="">
                        Select active Field Volunteer
                      </option>

                      {users.map((volunteer) => (
                        <option
                          key={volunteer.id}
                          value={volunteer.id}
                        >
                          {volunteer.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={
                      !selectedVolunteer ||
                      actionLoading === `assign-${report.id}`
                    }
                    onClick={() => onAction("assign")}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === `assign-${report.id}`
                      ? "Assigning..."
                      : "Assign Volunteer"}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading === `reject-${report.id}`}
                    onClick={() => onAction("reject")}
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    Reject Report
                  </button>
                </div>
              )}

              {canResolve && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert
                        size={18}
                        className="mt-0.5 text-blue-600"
                      />

                      <div>
                        <p className="text-sm font-black text-blue-900">
                          Field response in progress
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                          Review the field operation and resolve the
                          disaster report when the response has been
                          completed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading === `resolve-${report.id}`}
                    onClick={() => onAction("resolve")}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {actionLoading === `resolve-${report.id}`
                      ? "Resolving..."
                      : "Resolve Report"}
                  </button>
                </div>
              )}

              {isDone && (
                <div
                  className={
                    status === "Resolved"
                      ? "rounded-xl border border-emerald-100 bg-emerald-50 p-4"
                      : "rounded-xl border border-red-100 bg-red-50 p-4"
                  }
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={20}
                      className={
                        status === "Resolved"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    />

                    <div>
                      <p
                        className={
                          status === "Resolved"
                            ? "text-sm font-black text-emerald-900"
                            : "text-sm font-black text-red-900"
                        }
                      >
                        {status === "Resolved"
                          ? "Disaster report resolved"
                          : "Disaster report rejected"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        No further administrative action is required.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

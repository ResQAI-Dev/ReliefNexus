import { useEffect, useMemo, useState, type ReactNode } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Activity,
  Bell,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  Download,
  FileText,
  FileClock,
  Gauge,
  Globe2,
  HardDrive,
  MapPin,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import api from "../../../lib/api/apiClient";

/* ============================================================
   SHARED TYPES
============================================================ */

export type SystemHealthData = {
  apiAvailability?: number | null;
  databaseHealth?: number | null;
  aiServices?: number | null;
  storage?: number | null;
  cpuUtilization?: number | null;
  memoryUtilization?: number | null;
  diskUtilization?: number | null;
  apiResponseHealth?: number | null;
};

export type AuditLogItem = {
  id?: string;
  action?: ReactNode;
  description?: string;
  userEmail?: string;
  role?: string;
  createdAt?: string;
  status?: string;
  severity?: string;
};

export type ReportSummary = {
  totalIncidents: number;
  resolved: number;
  active: number;
  highCritical: number;
  aiPredictions: number;
  volunteerAssignments: number;
  fieldResponses: number;
  averageRiskScore: number;
  severity: { name: string; count: number }[];
  workflow: { name: string; count: number }[];
  monthly: { name: string; count: number }[];
};

type SystemReportMapItem = {
  id?: string;
  disasterType?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  fieldUpdateLatitude?: number | null;
  fieldUpdateLongitude?: number | null;
  severity?: string;
  status?: string;
  riskScore?: number | null;
  createdAt?: string;
};

export type SystemSettingsValue = {
  maintenanceMode: boolean;
  emailNotifications: boolean;
  aiApprovalRequired: boolean;
  auditLogging: boolean;
  locationSharing: boolean;
  autoBackup: boolean;
};

export type LocationSharingData = {
  enabled: boolean;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string;
  accuracyMeters?: number | null;
  lastSharedAt?: string | null;
  sharedWith?: { name: string; role: string; status: string }[];
};

export type AdminProfile = {
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  profileImageUrl?: string | null;
};

/* ============================================================
   SHARED UI
============================================================ */

const clampPercent = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, value));
};

const percentText = (value?: number | null) => {
  const n = clampPercent(value);
  return n == null ? "" : `${Math.round(n)}%`;
};

const statusText = (value?: number | null) => {
  const n = clampPercent(value);
  if (n == null) return "No data";
  if (n >= 90) return "Operational";
  if (n >= 70) return "Degraded";
  return "Critical";
};

const formatDate = (value?: string | null) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const initials = (name?: string) =>
  (name || "SA")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "SA";

const Card = ({
  title,
  eyebrow,
  action,
  onAction,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  onAction?: () => void;
  children: ReactNode;
}) => (
  <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-lg font-black text-[#101c35]">{title}</h2>
      </div>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700 transition hover:bg-blue-100"
        >
          {action}
        </button>
      )}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

const Metric = ({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
    </div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-3xl font-black text-[#101c35]">{value}</p>
    <p className="mt-1 text-[10px] font-semibold text-emerald-600">{detail}</p>
  </div>
);

const Progress = ({ label, value }: { label: string; value?: number | null }) => {
  const n = clampPercent(value);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500">
        <span>{label}</span>
        <span>{n == null ? "" : `${Math.round(n)}%`}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${n ?? 0}%` }}
        />
      </div>
    </div>
  );
};

/* ============================================================
   01. SYSTEM MONITORING
============================================================ */

export function SystemMonitoringModule({
  data,
  loading = false,
  onRefresh,
}: {
  data: SystemHealthData | null;
  loading?: boolean;
  onRefresh?: () => void;
}) {
  const avg = useMemo(() => {
    const values = [
      data?.apiAvailability,
      data?.databaseHealth,
      data?.aiServices,
      data?.storage,
    ].filter((v): v is number => typeof v === "number");
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-[#081b35] px-6 py-7 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-500/20 to-transparent" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">Infrastructure</p>
            <h1 className="mt-2 text-3xl font-black">System Monitoring</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Live platform health across API, database, AI services, storage and runtime utilization.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[9px] font-black uppercase tracking-wider text-blue-200">Average Health</p>
            <p className="mt-1 text-2xl font-black">{avg == null ? "" : `${avg}%`}</p>
            <p className="text-[10px] text-slate-300">{statusText(avg)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="API" value={percentText(data?.apiAvailability)} detail={statusText(data?.apiAvailability)} icon={<Server size={18} />} />
        <Metric label="Database" value={percentText(data?.databaseHealth)} detail={statusText(data?.databaseHealth)} icon={<Database size={18} />} />
        <Metric label="AI Services" value={percentText(data?.aiServices)} detail={statusText(data?.aiServices)} icon={<Cloud size={18} />} />
        <Metric label="Storage" value={percentText(data?.storage)} detail={statusText(data?.storage)} icon={<HardDrive size={18} />} />
      </div>

      <Card title="Service Health" eyebrow="Runtime telemetry" action="Refresh" onAction={onRefresh}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <RefreshCw className="animate-spin" size={17} /> Loading live health...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <Progress label="CPU Utilization" value={data?.cpuUtilization} />
            <Progress label="Memory Utilization" value={data?.memoryUtilization} />
            <Progress label="Disk Utilization" value={data?.diskUtilization} />
            <Progress label="API Response Health" value={data?.apiResponseHealth} />
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <div>
              <p className="text-sm font-black text-slate-900">Platform status</p>
              <p className="text-xs text-slate-500">{avg == null ? "Waiting for telemetry" : statusText(avg)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-600" size={20} />
            <div>
              <p className="text-sm font-black text-slate-900">API monitoring</p>
              <p className="text-xs text-slate-500">Track availability and response quality.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
          <div className="flex items-center gap-3">
            <Cpu className="text-violet-600" size={20} />
            <div>
              <p className="text-sm font-black text-slate-900">AI runtime</p>
              <p className="text-xs text-slate-500">Monitor AI service readiness.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   02. AUDIT LOGS
============================================================ */

export function AuditLogsModule({
  logs,
  loading = false,
}: {
  logs: AuditLogItem[];
  loading?: boolean;
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const status = String(
        log.status || log.severity || "Success"
      ).toLowerCase();

      const matchesFilter =
        filter === "All" ||
        status === filter.toLowerCase();

      const searchable = [
        log.userEmail,
        log.role,
        log.action,
        log.description,
        log.status,
        log.severity,
        log.createdAt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [logs, filter, search]);

  const totalEvents = logs.length;

  const agentRuns = logs.filter((log) =>
    String(log.action || "")
      .toLowerCase()
      .includes("agent")
  ).length;

  const approvalEvents = logs.filter((log) =>
    String(log.action || "")
      .toLowerCase()
      .includes("approval")
  ).length;

  const criticalEvents = logs.filter((log) =>
    ["critical", "failed", "error"].includes(
      String(log.status || log.severity || "").toLowerCase()
    )
  ).length;

  const statusStyle = (value?: string) => {
    const status = String(value || "Success").toLowerCase();

    if (
      ["critical", "failed", "error"].includes(status)
    ) {
      return {
        badge:
          "border-red-200 bg-red-50 text-red-700",
        dot: "bg-red-500",
      };
    }

    if (
      ["warning", "pending", "needs approval"].includes(status)
    ) {
      return {
        badge:
          "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      };
    }

    if (
      ["approved", "success", "successful", "completed"].includes(
        status
      )
    ) {
      return {
        badge:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      };
    }

    return {
      badge:
        "border-blue-200 bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
    };
  };

  const exportLogs = () => {
    const headers = [
      "Time",
      "User",
      "Role",
      "Action",
      "Description",
      "Status",
    ];

    const rows = filtered.map((log) => [
      formatDate(log.createdAt),
      log.userEmail || "System",
      log.role || "System",
      log.action || "Activity",
      log.description || "",
      log.status || log.severity || "Success",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8",
      })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "reliefnexus-audit-trail.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[28px] bg-[#081b35] px-7 py-7 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-500/20 to-transparent" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">
              Security & Transparency
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Audit Trail
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Detailed chronological activity across users,
              AI agents, tools, approvals and protected system
              operations.
            </p>

            <p className="mt-2 text-[10px] text-slate-400">
              Every recorded event is displayed from the
              platform audit log.
            </p>
          </div>

          <button
            type="button"
            onClick={exportLogs}
            className="rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Audit Events
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {totalEvents}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Recorded platform activity
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">
            Agent Activity
          </p>

          <p className="mt-2 text-3xl font-black text-blue-950">
            {agentRuns}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            AI-related audit events
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">
            Approval Events
          </p>

          <p className="mt-2 text-3xl font-black text-amber-950">
            {approvalEvents}
          </p>

          <p className="mt-1 text-xs text-amber-700">
            Governance activity
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wider text-red-700">
            Critical / Failed
          </p>

          <p className="mt-2 text-3xl font-black text-red-950">
            {criticalEvents}
          </p>

          <p className="mt-1 text-xs text-red-700">
            Events requiring attention
          </p>
        </div>

      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
              Activity Explorer
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-950">
              Filter Audit Activity
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search user, action, agent..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white sm:w-72"
            />

            <div className="flex flex-wrap gap-2">
              {[
                "All",
                "Success",
                "Warning",
                "Critical",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black transition ${
                    filter === item
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* TIMELINE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
            Chronological Activity
          </p>

          <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-black text-slate-950">
              Audit Trail
            </h2>

            <span className="text-xs text-slate-400">
              Showing {filtered.length} of {logs.length} events
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading audit activity...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-black text-slate-700">
              No audit activity found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try changing the search or status filter.
            </p>
          </div>
        ) : (
          <div className="p-5">

            <div className="relative">

              <div className="absolute bottom-4 left-[15px] top-4 w-px bg-slate-200" />

              <div className="space-y-4">

                {filtered.map((log, index) => {
                  const key =
                    `${log.createdAt || "event"}-${log.action || "activity"}-${index}`;

                  const status =
                    log.status ||
                    log.severity ||
                    "Success";

                  const styles = statusStyle(status);

                  const isOpen =
                    expanded === key;

                  return (
                    <div
                      key={key}
                      className="relative pl-10"
                    >

                      {/* TIMELINE DOT */}
                      <div
                        className={`absolute left-[9px] top-5 z-10 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${styles.dot}`}
                      />

                      {/* EVENT CARD */}
                      <div className="rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm">

                        <div className="p-4">

                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="text-sm font-black text-slate-900">
                                  {log.action ||
                                    "System Activity"}
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${styles.badge}`}
                                >
                                  {status}
                                </span>

                              </div>

                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {log.description ||
                                  "No description recorded."}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-slate-400">

                                <span>
                                  User:{" "}
                                  <strong className="text-slate-600">
                                    {log.userEmail ||
                                      "System"}
                                  </strong>
                                </span>

                                <span>
                                  Role:{" "}
                                  <strong className="text-slate-600">
                                    {log.role ||
                                      "System"}
                                  </strong>
                                </span>

                                <span>
                                  {formatDate(
                                    log.createdAt
                                  )}
                                </span>

                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setExpanded(
                                  isOpen ? null : key
                                )
                              }
                              className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-100"
                            >
                              {isOpen
                                ? "Hide details"
                                : "Show details"}
                            </button>

                          </div>

                          {isOpen && (
                            <div className="mt-4 border-t border-slate-100 pt-4">

                              <div className="grid gap-3 md:grid-cols-2">

                                <div className="rounded-xl bg-slate-50 p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    Event
                                  </p>

                                  <p className="mt-2 text-xs font-bold text-slate-700">
                                    {log.action ||
                                      "Activity"}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    Timestamp
                                  </p>

                                  <p className="mt-2 text-xs font-bold text-slate-700">
                                    {formatDate(
                                      log.createdAt
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    User
                                  </p>

                                  <p className="mt-2 break-all text-xs font-bold text-slate-700">
                                    {log.userEmail ||
                                      "System"}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    Role
                                  </p>

                                  <p className="mt-2 text-xs font-bold text-slate-700">
                                    {log.role ||
                                      "System"}
                                  </p>
                                </div>

                              </div>

                              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-950 p-4">

                                <div className="flex items-center justify-between">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-300">
                                    Raw Audit Record
                                  </p>

                                  <span className="rounded bg-white/10 px-2 py-1 text-[9px] font-bold text-slate-400">
                                    AUDIT DATA
                                  </span>
                                </div>

                                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-300">
                                  {JSON.stringify(
                                    log,
                                    null,
                                    2
                                  )}
                                </pre>

                              </div>

                            </div>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
export function SystemReportsModule({
  summary,
}: {
  summary: ReportSummary;
}) {
  const maxWorkflow = Math.max(...summary.workflow.map((item) => item.count), 1);
  const maxMonthly = Math.max(...summary.monthly.map((item) => item.count), 1);
  const totalSeverity = Math.max(summary.severity.reduce((sum, item) => sum + item.count, 0), 1);

  const [mapReports, setMapReports] = useState<SystemReportMapItem[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let active = true;

    const loadMapReports = async () => {
      setMapLoading(true);
      setMapError("");

      try {
        const response = await api.get("/disaster-reports");
        const payload = response.data;

        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (active) {
          setMapReports(rows as SystemReportMapItem[]);
        }
      } catch (error) {
        console.error("System Reports map data could not be loaded:", error);
        if (active) {
          setMapReports([]);
          setMapError("Live incident locations could not be loaded from the API.");
        }
      } finally {
        if (active) {
          setMapLoading(false);
        }
      }
    };

    void loadMapReports();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const container = document.getElementById("reliefnexus-system-reports-map");
    if (!container) return;

    const map = L.map(container, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const validReports = mapReports
      .map((report) => {
        const latitude =
          report.latitude != null
            ? Number(report.latitude)
            : report.fieldUpdateLatitude != null
              ? Number(report.fieldUpdateLatitude)
              : NaN;

        const longitude =
          report.longitude != null
            ? Number(report.longitude)
            : report.fieldUpdateLongitude != null
              ? Number(report.fieldUpdateLongitude)
              : NaN;

        return { report, latitude, longitude };
      })
      .filter(
        (item) =>
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude) &&
          item.latitude >= -90 &&
          item.latitude <= 90 &&
          item.longitude >= -180 &&
          item.longitude <= 180
      );

    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const severityMeta = (value?: string) => {
      const severity = String(value || "Medium").toLowerCase();

      if (severity === "critical") {
        return {
          label: "Critical",
          fill: "#ef4444",
          border: "#991b1b",
        };
      }

      if (severity === "high") {
        return {
          label: "High",
          fill: "#f97316",
          border: "#9a3412",
        };
      }

      if (severity === "low") {
        return {
          label: "Low",
          fill: "#10b981",
          border: "#047857",
        };
      }

      return {
        label: "Medium",
        fill: "#f59e0b",
        border: "#b45309",
      };
    };

    validReports.forEach(({ report, latitude, longitude }) => {
      const meta = severityMeta(report.severity);
      const risk =
        report.riskScore != null && Number.isFinite(Number(report.riskScore))
          ? `${Number(report.riskScore).toFixed(1)}`
          : "N/A";

      const popup = `
        <div style="min-width:220px;font-family:Inter,system-ui,sans-serif">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px">
            <strong style="font-size:14px;color:#0f172a">
              ${escapeHtml(report.disasterType || "Disaster Incident")}
            </strong>
            <span style="border-radius:999px;padding:4px 8px;background:${meta.fill}18;color:${meta.border};font-size:10px;font-weight:800">
              ${escapeHtml(meta.label)}
            </span>
          </div>
          <div style="font-size:11px;line-height:1.6;color:#475569">
            <div><b>Location:</b> ${escapeHtml(report.location || "Location unavailable")}</div>
            <div><b>Status:</b> ${escapeHtml(report.status || "Submitted")}</div>
            <div><b>Risk score:</b> ${escapeHtml(risk)}</div>
            <div><b>Coordinates:</b> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</div>
          </div>
        </div>
      `;

      L.circleMarker([latitude, longitude], {
        radius: meta.label === "Critical" ? 10 : meta.label === "High" ? 8 : 7,
        color: "#ffffff",
        weight: 2.5,
        fillColor: meta.fill,
        fillOpacity: 0.92,
        opacity: 1,
      })
        .bindPopup(popup)
        .addTo(map);
    });

    if (validReports.length > 0) {
      const bounds = L.latLngBounds(
        validReports.map(({ latitude, longitude }) => [latitude, longitude] as [number, number])
      );
      map.fitBounds(bounds.pad(0.12), {
        maxZoom: 10,
        animate: false,
      });
    }

    window.setTimeout(() => map.invalidateSize(), 120);

    return () => {
      map.remove();
    };
  }, [mapReports]);

  const csvEscape = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const exportCsv = () => {
    const rows: unknown[][] = [
      ["RELIEFNEXUS SYSTEM REPORT"],
      ["Generated At", new Date().toISOString()],
      [],
      ["EXECUTIVE SUMMARY"],
      ["Metric", "Value", "Detail"],
      ["Total Incidents", summary.totalIncidents, "All operational cases"],
      ["Resolved", summary.resolved, `${summary.totalIncidents ? Math.round((summary.resolved / summary.totalIncidents) * 100) : 0}% of incidents`],
      ["Active", summary.active, "Cases still in response"],
      ["High / Critical", summary.highCritical, "Priority incidents"],
      ["AI Predictions", summary.aiPredictions, "Agent 01 outputs"],
      ["Volunteer Assignments", summary.volunteerAssignments, "Assigned response cases"],
      ["Field Responses", summary.fieldResponses, "Completed field work"],
      ["Average Risk", summary.averageRiskScore.toFixed(1), "AI risk score"],
      [],
      ["INCIDENT SEVERITY"],
      ["Severity", "Count", "Percentage"],
      ...summary.severity.map((item) => [item.name, item.count, `${Math.round((item.count / totalSeverity) * 100)}%`]),
      [],
      ["8-STEP RESPONSE WORKFLOW"],
      ["Step", "Count"],
      ...summary.workflow.map((item) => [item.name, item.count]),
      [],
      ["MONTHLY INCIDENT TREND"],
      ["Month", "Incidents"],
      ...summary.monthly.map((item) => [item.name, item.count]),
      [],
      ["MAPPED INCIDENT REGISTER"],
      ["ID", "Disaster Type", "Location", "Latitude", "Longitude", "Severity", "Status", "Risk Score", "Created At"],
      ...mapReports.map((report) => [
        report.id || "",
        report.disasterType || "",
        report.location || "",
        report.latitude ?? report.fieldUpdateLatitude ?? "",
        report.longitude ?? report.fieldUpdateLongitude ?? "",
        report.severity || "",
        report.status || "",
        report.riskScore ?? "",
        report.createdAt || "",
      ]),
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reliefnexus-system-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const generatedAt = new Date().toLocaleString();
    const severityRows = summary.severity.length
      ? summary.severity.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.count}</td><td>${Math.round((item.count / totalSeverity) * 100)}%</td></tr>`).join("")
      : `<tr><td colspan="3" class="empty">No incident severity data available.</td></tr>`;
    const workflowRows = summary.workflow.length
      ? summary.workflow.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.count}</td></tr>`).join("")
      : `<tr><td colspan="2" class="empty">No workflow activity available.</td></tr>`;
    const monthlyRows = summary.monthly.length
      ? summary.monthly.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.count}</td></tr>`).join("")
      : `<tr><td colspan="2" class="empty">No monthly incident data available.</td></tr>`;
    const incidentRows = mapReports.length
      ? mapReports.map((report) => `<tr><td>${escapeHtml(report.id || "")}</td><td>${escapeHtml(report.disasterType || "")}</td><td>${escapeHtml(report.location || "")}</td><td>${escapeHtml(report.severity || "")}</td><td>${escapeHtml(report.status || "")}</td><td>${escapeHtml(report.riskScore ?? "")}</td><td>${escapeHtml(report.createdAt ? new Date(report.createdAt).toLocaleString() : "")}</td></tr>`).join("")
      : `<tr><td colspan="7" class="empty">No disaster reports are currently available from the API.</td></tr>`;

    const popup = window.open("", "_blank", "width=1200,height=900");
    if (!popup) {
      window.alert("Please allow pop-ups for ReliefNexus to generate the PDF report.");
      return;
    }

    popup.document.write(`<!doctype html><html><head><title>ReliefNexus System Report</title><meta charset="utf-8"/><style>
      @page { size: A4; margin: 14mm; }
      * { box-sizing: border-box; } body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; font-size: 10px; }
      .cover { padding: 28px; border-radius: 18px; background: linear-gradient(135deg,#071a33,#123b6c,#2176a8); color: white; margin-bottom: 22px; }
      .eyebrow { font-size: 8px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #bae6fd; } h1 { margin: 7px 0 4px; font-size: 28px; } .subtitle { color: #dbeafe; font-size: 11px; line-height: 1.6; }
      .meta { margin-top: 14px; display: flex; justify-content: space-between; gap: 20px; font-size: 9px; color: #dbeafe; }
      h2 { margin: 22px 0 9px; font-size: 15px; color: #0f2f56; } h3 { margin: 0 0 8px; font-size: 11px; color: #334155; }
      .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin: 10px 0 18px; }
      .kpi { border: 1px solid #dbe4ee; border-radius: 10px; padding: 10px; background: #f8fbff; } .kpi .label { font-size: 7px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 800; } .kpi .value { font-size: 18px; font-weight: 900; margin-top: 5px; } .kpi .detail { color: #64748b; font-size: 8px; margin-top: 3px; }
      .section { break-inside: avoid; margin-bottom: 18px; } table { width: 100%; border-collapse: collapse; margin-top: 6px; } th { background: #eaf2fb; color: #163b63; font-size: 8px; text-align: left; padding: 7px; border: 1px solid #d8e2ec; } td { padding: 6px 7px; border: 1px solid #e2e8f0; font-size: 8px; vertical-align: top; } tr:nth-child(even) td { background: #f8fafc; } .empty { text-align: center; color: #94a3b8; padding: 14px; }
      .two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } .note { padding: 10px 12px; background: #f1f5f9; border-left: 3px solid #2176a8; color: #475569; line-height: 1.5; }
      .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 8px; display: flex; justify-content: space-between; }
      @media print { .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .kpi { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
      <div class="cover"><div class="eyebrow">Emergency Analytics  ReliefNexus</div><h1>System Operations Report</h1><div class="subtitle">Comprehensive operational intelligence covering disaster incidents, AI risk predictions, response workflow, volunteer activity and field operations.</div><div class="meta"><span>Generated: ${escapeHtml(generatedAt)}</span><span>Source: ReliefNexus live operational data</span></div></div>
      <h2>Executive Summary</h2>
      <div class="grid">
        <div class="kpi"><div class="label">Total Incidents</div><div class="value">${summary.totalIncidents}</div><div class="detail">All operational cases</div></div>
        <div class="kpi"><div class="label">Resolved</div><div class="value">${summary.resolved}</div><div class="detail">${summary.totalIncidents ? Math.round((summary.resolved / summary.totalIncidents) * 100) : 0}% of incidents</div></div>
        <div class="kpi"><div class="label">Active</div><div class="value">${summary.active}</div><div class="detail">Cases still in response</div></div>
        <div class="kpi"><div class="label">High / Critical</div><div class="value">${summary.highCritical}</div><div class="detail">Priority incidents</div></div>
        <div class="kpi"><div class="label">AI Predictions</div><div class="value">${summary.aiPredictions}</div><div class="detail">Agent 01 outputs</div></div>
        <div class="kpi"><div class="label">Volunteer Assignments</div><div class="value">${summary.volunteerAssignments}</div><div class="detail">Assigned response cases</div></div>
        <div class="kpi"><div class="label">Field Responses</div><div class="value">${summary.fieldResponses}</div><div class="detail">Completed field work</div></div>
        <div class="kpi"><div class="label">Average Risk</div><div class="value">${summary.averageRiskScore.toFixed(1)}</div><div class="detail">AI risk score</div></div>
      </div>
      <div class="two"><div class="section"><h2>Incident Severity</h2><table><thead><tr><th>Severity</th><th>Count</th><th>Share</th></tr></thead><tbody>${severityRows}</tbody></table></div><div class="section"><h2>8-Step Response Workflow</h2><table><thead><tr><th>Workflow Step</th><th>Count</th></tr></thead><tbody>${workflowRows}</tbody></table></div></div>
      <div class="section"><h2>Monthly Incident Trend</h2><table><thead><tr><th>Month</th><th>Incidents</th></tr></thead><tbody>${monthlyRows}</tbody></table></div>
      <div class="section"><h2>Incident Intelligence Register</h2><div class="note">${mapReports.length} incident record(s) were returned by the live disaster-report API. The dashboard map uses available latitude/longitude values; reports without coordinates remain included in the operational dataset but cannot be plotted.</div><table><thead><tr><th>ID</th><th>Disaster</th><th>Location</th><th>Severity</th><th>Status</th><th>Risk</th><th>Created</th></tr></thead><tbody>${incidentRows}</tbody></table></div>
      <div class="footer"><span>ReliefNexus  System Administrator Report</span><span>Confidential operational analytics</span></div>
      <script>window.onload=function(){setTimeout(function(){window.print();},450);};</script>
    </body></html>`);
    popup.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#071a33] via-[#123b6c] to-[#2176a8] px-6 py-7 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100">
                Live Intelligence
              </p>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">System Reports</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              Operational analytics across incidents, AI decisions, volunteers and field response.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[10px] font-black text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              <FileText size={15} />
              Export PDF
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-[10px] font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Incidents" value={String(summary.totalIncidents)} detail="Operational cases" icon={<Bell size={18} />} />
        <Metric label="Resolved" value={String(summary.resolved)} detail={`${summary.totalIncidents ? Math.round((summary.resolved / summary.totalIncidents) * 100) : 0}% resolved`} icon={<CheckCircle2 size={18} />} />
        <Metric label="Active" value={String(summary.active)} detail="Cases still in response" icon={<Activity size={18} />} />
        <Metric label="High / Critical" value={String(summary.highCritical)} detail="Priority incidents" icon={<ShieldCheck size={18} />} />
        <Metric label="AI Predictions" value={String(summary.aiPredictions)} detail="Agent 01 outputs" icon={<Gauge size={18} />} />
        <Metric label="Volunteer Assignments" value={String(summary.volunteerAssignments)} detail="Assigned response cases" icon={<Users size={18} />} />
        <Metric label="Field Responses" value={String(summary.fieldResponses)} detail="Completed field work" icon={<MapPin size={18} />} />
        <Metric label="Average Risk" value={summary.averageRiskScore.toFixed(1)} detail="AI risk score" icon={<Cpu size={18} />} />
      </div>

      {/* LIVE INCIDENT MAP */}
      <Card
        title="Global Disaster Intelligence Map"
        eyebrow="Live Operations"
        action={
          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {mapLoading ? "Loading live data" : `${mapReports.length} reports`}
          </div>
        }
      >
        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-inner">
          <div id="reliefnexus-system-reports-map" className="h-[440px] w-full" />

          <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-2xl border border-white/10 bg-slate-950/90 p-3 text-white shadow-2xl backdrop-blur-xl">
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
              Incident severity
            </p>
            {[
              ["Critical", "#ef4444"],
              ["High", "#f97316"],
              ["Medium", "#f59e0b"],
              ["Low", "#10b981"],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2 py-1 text-[9px] font-bold">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-2 ring-white/10"
                  style={{ backgroundColor: color }}
                />
                {label}
              </div>
            ))}
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-[500] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-xl border border-white/10 bg-slate-950/85 px-3 py-2 text-[8px] font-bold text-slate-200 shadow-xl backdrop-blur-xl">
              <span className="text-slate-400">Coverage:</span>{" "}
              {mapReports.filter(
                (report) =>
                  Number.isFinite(Number(report.latitude ?? report.fieldUpdateLatitude)) &&
                  Number.isFinite(Number(report.longitude ?? report.fieldUpdateLongitude))
              ).length}{" "}
              mapped incidents
            </div>

            {mapError ? (
              <div className="rounded-xl border border-red-400/20 bg-red-950/80 px-3 py-2 text-[8px] font-bold text-red-200 shadow-xl backdrop-blur-xl">
                {mapError}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-slate-950/85 px-3 py-2 text-[8px] font-bold text-emerald-200 shadow-xl backdrop-blur-xl">
                Live API  Sri Lanka incident coordinates
              </div>
            )}
          </div>

          {!mapLoading && mapReports.length === 0 && !mapError && (
            <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
              <div className="rounded-2xl border border-white/10 bg-slate-950/85 px-5 py-4 text-center text-white shadow-2xl backdrop-blur-xl">
                <p className="text-xs font-black">No disaster reports available</p>
                <p className="mt-1 text-[9px] text-slate-400">
                  The map will populate automatically when reports with coordinates are available.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card
        title="Incident Intelligence Register"
        eyebrow="Detailed operational data"
        action={
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700">
            {mapReports.length} live records
          </span>
        }
      >
        {mapReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
            <FileText className="mx-auto text-slate-300" size={28} />
            <p className="mt-3 text-xs font-black text-slate-700">No disaster report records available</p>
            <p className="mt-1 text-[10px] text-slate-400">Detailed incident rows will appear automatically when the live API returns reports.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[920px] w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-4 py-3">Incident</th>
                  <th className="px-4 py-3">Disaster</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {mapReports.map((report, index) => (
                  <tr key={report.id || index} className="border-t border-slate-100 hover:bg-blue-50/30">
                    <td className="px-4 py-3 text-[10px] font-bold text-slate-700">{report.id ? report.id.slice(0, 8) : `Incident ${index + 1}`}</td>
                    <td className="px-4 py-3 text-[10px] font-black text-slate-800">{report.disasterType || ""}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-600">{report.location || ""}</td>
                    <td className="px-4 py-3 text-[10px] font-bold text-slate-700">{report.severity || ""}</td>
                    <td className="px-4 py-3 text-[10px] font-bold text-slate-700">{report.status || ""}</td>
                    <td className="px-4 py-3 text-[10px] font-black text-blue-700">{report.riskScore != null ? Number(report.riskScore).toFixed(1) : ""}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Incident Severity" eyebrow="Distribution">
          <div className="space-y-4">
            {summary.severity.map((item) => {
              const ratio = (item.count / totalSeverity) * 100;
              return (
                <div key={item.name}>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-black">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="text-slate-900">{item.count} ({Math.round(ratio)}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-blue-600" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="8-Step Workflow" eyebrow="Performance">
          <div className="space-y-3">
            {summary.workflow.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-[9px] font-black text-slate-500">
                  <span>{item.name}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-violet-600" style={{ width: `${(item.count / maxWorkflow) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Monthly Incidents" eyebrow="Trend">
          <div className="flex h-48 items-end gap-3">
            {summary.monthly.map((item) => (
              <div key={item.name} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end rounded-xl bg-slate-50 px-1">
                  <div className="w-full rounded-lg bg-blue-600" style={{ height: `${Math.max(7, (item.count / maxMonthly) * 100)}%` }} />
                </div>
                <span className="text-[9px] font-black text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


/* ============================================================
   04. SYSTEM SETTINGS
============================================================ */

export function SystemSettingsModule({
  initial,
  onSave,
}: {
  initial: SystemSettingsValue;
  onSave?: (settings: SystemSettingsValue) => Promise<void> | void;
}) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => setSettings(initial), [initial]);

  const toggle = (key: keyof SystemSettingsValue) =>
    setSettings((current) => ({ ...current, [key]: !current[key] }));

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await onSave?.(settings);
      setMessage("System settings saved successfully.");
    } catch {
      setMessage("Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const rows: [keyof SystemSettingsValue, string, string, ReactNode][] = [
    ["maintenanceMode", "Maintenance Mode", "Temporarily place the platform into maintenance mode.", <Settings2 size={18} />],
    ["emailNotifications", "Email Notifications", "Enable system notification delivery.", <Bell size={18} />],
    ["aiApprovalRequired", "AI Human Approval", "Require administrator approval for AI-generated operational decisions.", <ShieldCheck size={18} />],
    ["auditLogging", "Audit Logging", "Record important administrator and security events.", <FileClock size={18} />],
    ["locationSharing", "Location Sharing", "Allow authorized response workflows to use current location sharing.", <Globe2 size={18} />],
    ["autoBackup", "Automatic Backup", "Automatically back up operational system data and configuration.", <Database size={18} />],
  ];

  return (
    <div className="space-y-6">
      <Card title="System Settings" eyebrow="Configuration" action={saving ? "Saving..." : "Save Settings"} onAction={saving ? undefined : save}>
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map(([key, title, description, icon]) => (
            <div key={key} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">{icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${settings[key] ? "bg-blue-600" : "bg-slate-300"}`}
                aria-label={title}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${settings[key] ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
        {message && <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{message}</div>}
      </Card>
    </div>
  );
}

/* ============================================================
   05. LOCATION SHARING
============================================================ */

export function LocationSharingModule({
  data,
  onToggle,
}: {
  data: LocationSharingData;
  onToggle?: (enabled: boolean) => Promise<void> | void;
}) {
  const [working, setWorking] = useState(false);

  const toggle = async () => {
    setWorking(true);
    try {
      await onToggle?.(!data.enabled);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#0b1f3a] via-[#29588d] to-[#67b7d9] px-6 py-7 text-white shadow-xl">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100">Safety</p>
            <h1 className="mt-2 text-3xl font-black">Location Sharing</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">Manage authorized location sharing for disaster-response operations.</p>
          </div>
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={working}
            className={`rounded-xl px-4 py-2.5 text-[10px] font-black ${data.enabled ? "bg-red-500 text-white" : "bg-white text-slate-900"}`}
          >
            {working ? "Updating..." : data.enabled ? "Disable Sharing" : "Enable Sharing"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.6fr]">
        <Card title="Sharing Status" eyebrow="Authorization">
          <div className={`rounded-2xl p-5 ${data.enabled ? "bg-emerald-50" : "bg-slate-50"}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${data.enabled ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                <MapPin size={19} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{data.enabled ? "Location sharing ON" : "Location sharing OFF"}</p>
                <p className="mt-1 text-xs text-slate-500">{data.enabled ? "Authorized response teams can view the latest shared position." : "Your location is not currently shared."}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="Accuracy" value={data.accuracyMeters != null ? `${data.accuracyMeters} m` : ""} detail="Location precision" icon={<Gauge size={18} />} />
            <Metric label="Last Shared" value={data.lastSharedAt ? formatDate(data.lastSharedAt).split(",")[0] : ""} detail={data.lastSharedAt ? formatDate(data.lastSharedAt) : "No update"} icon={<RefreshCw size={18} />} />
          </div>
        </Card>

        <Card title="Current Location" eyebrow="Map intelligence">
          <div className="relative h-[340px] overflow-hidden rounded-2xl bg-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(59,130,246,.18),transparent_35%),linear-gradient(135deg,#dceef7,#edf4ec)]" />
            <div className="absolute left-[38%] top-[44%] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow-xl" />
            <div className="absolute left-[38%] top-[44%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/70 bg-blue-400/10" />
            <div className="absolute bottom-4 left-4 rounded-xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Selected Location</p>
              <p className="mt-1 text-sm font-black text-slate-900">{data.locationLabel || "Location unavailable"}</p>
              {data.latitude != null && data.longitude != null && (
                <p className="mt-1 text-[10px] text-slate-500">{data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Shared With" eyebrow="Authorized response teams">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(data.sharedWith || []).map((item) => (
            <div key={`${item.name}-${item.role}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRound size={17} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
                <p className="text-[10px] text-slate-400">{item.role}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">{item.status}</span>
            </div>
          ))}
          {!data.sharedWith?.length && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">No authorized recipients configured.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   06. PROFILE
============================================================ */

export function AdminProfileModule({
  profile: suppliedProfile,
  onLogout,
}: {
  profile?: AdminProfile | null;
  onLogout?: () => void;
}) {
  const [profile, setProfile] = useState<AdminProfile | null>(suppliedProfile || null);
  const [loading, setLoading] = useState(!suppliedProfile);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/users/me");
      setProfile(response.data as AdminProfile);
    } catch {
      setError("Could not load profile data from the API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!suppliedProfile) void loadProfile();
  }, [suppliedProfile]);

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading profile...</div>;
  }

  if (error) {
    return <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">{error}</div>;
  }

  const name = profile?.fullName || "System Administrator";
  const image = profile?.profileImageUrl;
  const role = profile?.role || "System Administrator";
  const email = profile?.email || "";
  const active = profile?.isActive;

  return (
    <div className="space-y-6">

      {/* PROFILE HERO */}
      <section className="relative overflow-hidden rounded-[30px] bg-[#081d38] shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#081d38] via-[#123f67] to-[#65bdd7]" />
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-5">
            {image ? (
              <img
                src={image}
                alt="Profile"
                className="h-24 w-24 rounded-3xl object-cover ring-4 ring-white/20 shadow-2xl"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 text-3xl font-black text-white ring-4 ring-white/20 shadow-2xl">
                {initials(name)}
              </div>
            )}

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-200">
                System Account
              </p>

              <h1 className="mt-1 text-2xl font-black text-white lg:text-3xl">
                {name}
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-200">
                {role}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                  {email}
                </span>

                <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                  active
                    ? "bg-emerald-400/20 text-emerald-100"
                    : "bg-red-400/20 text-red-100"
                }`}>
                  ?-? {active ? "Active account" : "Inactive account"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="self-start rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-black text-white backdrop-blur transition hover:bg-white/20 lg:self-center"
          >
            Logout
          </button>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-500">
            Account Status
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <span className="text-lg">?o"</span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                {active ? "Active" : "Inactive"}
              </p>
              <p className="text-[10px] text-slate-400">
                Current account state
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-600">
            Access Level
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <span className="text-lg">?-?</span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                Administrator
              </p>
              <p className="text-[10px] text-slate-400">
                System management access
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">
            Member Since
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <span className="text-lg">?-?</span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                {formatDate(profile?.createdAt)}
              </p>
              <p className="text-[10px] text-slate-400">
                Account creation date
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* MAIN INFORMATION */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">

        {/* ACCOUNT INFORMATION */}
        <Card title="Account Information" eyebrow="Personal & access details">
          <div className="grid gap-3 sm:grid-cols-2">

            {[
              ["Full Name", name],
              ["Email Address", email],
              ["Role", role],
              ["Account Status", active ? "Active" : "Inactive"],
              ["Member Since", formatDate(profile?.createdAt)],
              ["Last Login", formatDate(profile?.lastLoginAt)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-100 hover:bg-blue-50/30"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {label}
                </p>

                <p className="mt-2 break-words text-sm font-black text-slate-800">
                  {value || "No data available"}
                </p>
              </div>
            ))}

          </div>
        </Card>

        {/* IDENTITY */}
        <Card title="Identity" eyebrow="Profile overview">
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-slate-50 via-white to-blue-50 p-7">

            {image ? (
              <img
                src={image}
                alt="Profile"
                className="h-32 w-32 rounded-full object-cover ring-8 ring-white shadow-xl"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-4xl font-black text-white ring-8 ring-white shadow-xl">
                {initials(name)}
              </div>
            )}

            <p className="mt-5 text-base font-black text-slate-900">
              {name}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              {role}
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                {active ? "Account Active" : "Account Inactive"}
              </span>
            </div>

          </div>
        </Card>

      </div>

      {/* LOCATION */}
      <Card title="Location & Operational Context" eyebrow="Current location services">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">

          <div className="relative h-[300px] overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,.18),transparent_30%),radial-gradient(circle_at_75%_70%,rgba(16,185,129,.14),transparent_35%)]" />

            <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-2xl">
              <MapPin size={24} />
            </div>

            <div className="absolute left-5 top-5 rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Location Service
              </p>
              <p className="mt-1 text-xs font-black text-slate-800">
                Location sharing
              </p>
            </div>

            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-black text-slate-900">
                Manage current location
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Manage your current location through the Location Sharing module.
              </p>
            </div>

          </div>

          <div className="flex flex-col justify-center rounded-3xl border border-slate-100 bg-slate-50/70 p-6">

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-500">
              Operational Context
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-900">
              System Administrator
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your account provides system-level access for managing users,
              roles, AI operations and platform controls.
            </p>

            <div className="mt-5 space-y-3">

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-500">
                  Role
                </p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {role}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                  Account
                </p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {active ? "Active and available" : "Currently inactive"}
                </p>
              </div>

            </div>

          </div>

        </div>
      </Card>

    </div>
  );
}





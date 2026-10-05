import AdvancedAIAgentWorkspace from "../../ai-assistant/pages/AdvancedAIAgentWorkspace";
import "../../ai-assistant/styles/agent-experience.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import NotificationBell from "../../../components/notifications/NotificationBell";
import {
  SystemMonitoringModule,
  AuditLogsModule,
  SystemReportsModule,
  SystemSettingsModule,
  LocationSharingModule,
  AdminProfileModule,
  type ReportSummary,
  type SystemSettingsValue,
  type LocationSharingData,
  type AdminProfile,
} from "../components/SystemAdminSupportModules";
const DisasterReportsPage = lazy(() => import("../../disaster-reports/pages/DisasterReportsPage"));
const EmergencyAlertsPage = lazy(() => import("../../emergency-alerts/pages/EmergencyAlertsPage"));
const RiskPredictionPage = lazy(() => import("../../risk-prediction/pages/RiskPredictionPage"));
const VulnerabilityImpactPage = lazy(() => import("../../vulnerability-impact/pages/VulnerabilityImpactPage"));
const ResourceOptimizationPage = lazy(() => import("../../resource-optimization/pages/ResourceOptimizationPage"));
import { Fragment, lazy, Suspense, useEffect, useMemo, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api/apiClient";

const PageLoadingFallback = () => (
  <div className="flex min-h-[420px] items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      <span className="text-sm font-medium">Loading module...</span>
    </div>
  </div>
);
const LogoIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
    <path d="M5 20V10" />
    <path d="M10 20V6" />
    <path d="M15 20V3" />
    <path d="M20 20V8" />
  </svg>
);
const DashboardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const UsersIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c.6-3.4 2.6-5 6-5s5.4 1.6 6 5" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M17 15c2.2.5 3.5 2.1 4 5" />
  </svg>
);
const VolunteerIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="3" />
    <path d="M5 21c.7-4.2 3-6 7-6s6.3 1.8 7 6" />
    <path d="M5 11H3M21 11h-2" />
  </svg>
);
const RequestIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const SparkIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
    <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
  </svg>
);
const MonitorIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
const AuditIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 4h14v16H5z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
const ReportIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 19V5M4 19h16" />
    <path d="m7 15 3-4 3 2 5-6" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    <path d="m19 13 2 1-2 3-2-1a7.6 7.6 0 0 1-2 1l-.3 2h-3.5l-.3-2a7.6 7.6 0 0 1-2-1l-2 1-2-3 2-1a7.6 7.6 0 0 1 0-2l-2-1 2-3 2 1a7.6 7.6 0 0 1 2-1l.3-2h3.5l.3 2a7.6 7.6 0 0 1 2 1l2-1 2 3-2 1a7.6 7.6 0 0 1 0 2Z" />
  </svg>
);
const UserIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="3" />
    <path d="M5 21c.8-4.3 3.1-6.5 7-6.5s6.2 2.2 7 6.5" />
  </svg>
);
const RiskIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3 2.8 19h18.4L12 3Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);
const ImpactIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </svg>
);
const ResourceIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m12 3 8 4-8 4-8-4 8-4Z" />
    <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
  </svg>
);
const AlertIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10.3 3.3 2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="m5 12 4 4L19 6" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10 17l5-5-5-5M15 12H3M21 4v16" />
  </svg>
);

type Section =
  | "dashboard"
  | "users"
  | "relief-requests"
  | "location-sharing"
  | "user-profiles"
  | "disaster-reports"
  | "emergency-alerts"
  | "risk-prediction"
  | "vulnerability-impact"
  | "resource-optimization"
  | "risk-information"
  | "relief-resources"  | "role-requests"
  | "permissions"
  | "ai-agents"
  | "ai-risk-prediction"
  | "ai-vulnerability-impact"
  | "ai-resource-optimization"
  | "ai-early-warning"
  | "ai-volunteer-assignment"  | "monitoring"
  | "audit-logs"
  | "reports"
  | "settings"
  | "profile";

type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
};

type RoleRequest = {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  roleRequestStatus?: string;
  profileImageUrl?: string;
  isActive?: boolean;
  permissions?: string[];
  createdAt?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  district?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

type SystemHealth = {
  apiAvailability?: number;
  databaseHealth?: number;
  aiServices?: number;
  storage?: number;
  cpuUtilization?: number;
  memoryUtilization?: number;
  diskUtilization?: number;
  apiResponseHealth?: number;
};

type AuditLog = {
  id?: string;
  action?: string;
  description?: string;
  userEmail?: string;
  createdAt?: string;
};

type AgentStatus = {
  name: string;
  description: string;
  status: "Running" | "Idle" | "Offline" | "Unknown";
  confidence: number | null;
  icon: ReactNode;
  execution: any | null;
};
const roles = [
  "AffectedUser",
  "FieldVolunteer",
  "ReliefCoordinator",
  "SystemAdministrator",
];
const permissionList = [
  "View Risk Information",
  "Report Disaster",
  "Share Location",
  "View Emergency Alerts",
  "Manage Relief Requests",
  "Manage Relief Resources",
  "Manage Users",
  "Manage Role Requests",
  "AI Agent Monitoring",
  "Configure Permissions",
  "View Audit Logs",
  "View Reports",
];
const menuItems: Array<{
  id: Section;
  label: string;
  icon: ReactNode;
}> = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { id: "users", label: "User Management", icon: <UsersIcon /> },
  { id: "role-requests", label: "Role Requests", icon: <RequestIcon /> },
  { id: "permissions", label: "Permissions", icon: <ShieldIcon /> },
  { id: "ai-agents", label: "AI Operations Center", icon: <SparkIcon /> },
  { id: "monitoring", label: "System Monitoring", icon: <MonitorIcon /> },
  { id: "audit-logs", label: "Audit Logs", icon: <AuditIcon /> },
  { id: "reports", label: "Reports", icon: <ReportIcon /> },
  { id: "settings", label: "System Settings", icon: <SettingsIcon /> },
  { id: "profile", label: "Profile", icon: <UserIcon /> },
];
const userManagementItems = [
  "Affected Users",
  "Field Volunteers",
  "Relief Coordinators",
  "Disaster Reports",
  "Relief Requests",
  "Risk Information",
  "Location Sharing",
  "User Profiles",
  "Risk Prediction",
  "Vulnerability & Impact",
  "Resource Optimization",
  "Early Warning & Coordination",
];
const aiAgentManagementItems = [
  "Risk Prediction",
  "Vulnerability & Impact",
  "Resource Optimization",
  "Early Warning & Coordination",
  "Volunteer Assignment",
];
const agentDefinitions = [
  {
    name: "Risk Prediction Agent",
    description: "Disaster risk scoring and prediction",
    icon: <RiskIcon />,
  },
  {
    name: "Vulnerability & Impact Agent",
    description: "Affected population and impact assessment",
    icon: <ImpactIcon />,
  },
  {
    name: "Resource Optimization Agent",
    description: "Relief resource allocation recommendations",
    icon: <ResourceIcon />,
  },
  {
    name: "Early Warning & Coordination Agent",
    description: "Warnings and response coordination",
    icon: <AlertIcon />,
  },
  {
    name: "Volunteer Assignment Agent",
    description: "Volunteer response planning and assignment recommendations",
    icon: <UsersIcon />,
  },
];
const roleLabel = (role?: string) => {
  switch (role) {
    case "AffectedUser":
      return "Affected User";
    case "FieldVolunteer":
      return "Field Volunteer";
    case "ReliefCoordinator":
      return "Relief Coordinator";
    case "SystemAdministrator":
      return "System Administrator";
    default:
      return role || "Unknown";
  }
};
const formatDate = (value?: string) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};
type DisasterReportRecord = {
  id?: string;
  reporterUserId?: string;
  reporterName?: string;
  reporterEmail?: string;
  disasterType?: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  severity?: string;
  status?: string;
  riskPredictionId?: string | null;
  assignedVolunteerUserId?: string;
  assignedVolunteerName?: string;
  fieldUpdateNotes?: string | null;
  fieldSituation?: string | null;
  fieldUpdateLatitude?: number | null;
  fieldUpdateLongitude?: number | null;
  fieldUpdatedAt?: string | null;
  riskScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

const AdminLiveApiSection = ({
  title,
  description,
  endpoint,
}: {
  title: string;
  description: string;
  endpoint: string;
}) => {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(endpoint);
        const payload = response.data;

        const data = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (active) {
          setRows(data);
        }
      } catch (err) {
        console.error(`${title} load failed:`, err);

        if (active) {
          setError(`${title} could not be loaded from the API.`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

  return () => {
      active = false;
    };
  }, [endpoint, title]);

  const getValue = (
    row: Record<string, unknown>,
    keys: string[]
  ) => {
    for (const key of keys) {
      if (
        row[key] !== undefined &&
        row[key] !== null &&
        String(row[key]).trim() !== ""
      ) {
        return String(row[key]);
      }
    }

    return "N/A";
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="User Management"
        title={title}
        description={description}
      />

      <DashboardCard
        title={title}
        subtitle={`${rows.length} records shown`}
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading {title.toLowerCase()}...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No {title.toLowerCase()} records are available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status / Level</th>
                  <th className="px-4 py-3">Score / Quantity</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={getValue(row, ["id"]) + index}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                      {getValue(row, [
                        "disasterType",
                        "resourceType",
                        "title",
                        "name",
                        "eventType",
                      ])}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {getValue(row, [
                        "location",
                        "resourceLocation",
                      ])}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {getValue(row, [
                        "status",
                        "riskLevel",
                        "severity",
                        "approvalStatus",
                      ])}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {getValue(row, [
                        "riskScore",
                        "availableQuantity",
                        "allocatedQuantity",
                        "recommendedQuantity",
                      ])}
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500">
                      {getValue(row, [
                        "createdAt",
                        "updatedAt",
                      ])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
};

const SystemAdministratorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [section, setSection] = useState<Section>("dashboard");
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [selectedUserModule, setSelectedUserModule] = useState("Affected Users");
  const [aiAgentManagementOpen, setAiAgentManagementOpen] = useState(false);
  const [selectedAiModule, setSelectedAiModule] = useState("Risk Prediction");

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
    const [agentExecutions, setAgentExecutions] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [disasterReports, setDisasterReports] =
    useState<DisasterReportRecord[]>([]);
  const [reliefResources] = useState<any[]>([]);
  const [riskPredictions] = useState<any[]>([]);
  const [vulnerabilityAssessments] = useState<any[]>([]);
  const [emergencyAlerts] = useState<any[]>([]);
  const [reliefRequests, setReliefRequests] = useState<any[]>([]);
  const [reliefRequestsLoading, setReliefRequestsLoading] = useState(false);
  const [reliefRequestsError, setReliefRequestsError] = useState("");

  const [locationShares, setLocationShares] = useState<any[]>([]);
  const [locationSharesLoading, setLocationSharesLoading] = useState(false);
  const [locationSharesError, setLocationSharesError] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [selectedPermissionRole, setSelectedPermissionRole] =
    useState("FieldVolunteer");

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "View Risk Information",
    "Report Disaster",
    "Share Location",
    "View Emergency Alerts",
  ]);

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    emailNotifications: true,
    aiApprovalRequired: true,
    auditLogging: true,
  });

  const hasPermission = (permission: string) =>
    user?.role === "SystemAdministrator" ||
    (user?.permissions ?? []).includes(permission);

  useEffect(() => {
    const path = location.pathname;

    // Dedicated Agentic AI pages MUST be checked before
    // generic operational routes because /ai-risk-prediction
    // also contains /risk-prediction.
    if (path.includes("/ai-risk-prediction")) {
      setSection("ai-risk-prediction");
      setSelectedAiModule("Risk Prediction");
    } else if (path.includes("/ai-vulnerability-impact")) {
      setSection("ai-vulnerability-impact");
      setSelectedAiModule("Vulnerability & Impact");
    } else if (path.includes("/ai-resource-optimization")) {
      setSection("ai-resource-optimization");
      setSelectedAiModule("Resource Optimization");
    } else if (path.includes("/ai-early-warning")) {
      setSection("ai-early-warning");
      setSelectedAiModule("Early Warning & Coordination");
    } else if (path.includes("/ai-volunteer-assignment")) {
      setSection("ai-volunteer-assignment");
      setSelectedAiModule("Volunteer Assignment");
    } else if (path.includes("/disaster-reports")) {
      setSection("disaster-reports");
    } else if (path.includes("/relief-requests")) {
      setSection("relief-requests");
    } else if (path.includes("/risk-prediction")) {
      setSection("risk-prediction");
    } else if (path.includes("/vulnerability-impact")) {
      setSection("vulnerability-impact");
    } else if (path.includes("/resource-optimization")) {
      setSection("resource-optimization");
    } else if (path.includes("/emergency-alerts")) {
      setSection("emergency-alerts");
    } else if (path.includes("/risk-information")) {
      setSection("risk-information");
    } else if (path.includes("/relief-resources")) {
      setSection("relief-resources");
    } else if (path.includes("/location-sharing")) {
      setSection("location-sharing");
    } else if (path.includes("/user-profiles")) {
      setSection("user-profiles");
    } else if (path.includes("/users")) {
      setSection("users");
    } else if (path.includes("/role-requests")) {
      setSection("role-requests");
    } else if (path.includes("/permissions")) {
      setSection("permissions");
    } else if (path.includes("/ai-agents")) {
      setSection("ai-agents");
    } else if (path.includes("/monitoring")) {
      setSection("monitoring");
    } else if (path.includes("/audit-logs")) {
      setSection("audit-logs");
    } else if (path.includes("/reports")) {
      setSection("reports");
    } else if (path.includes("/settings")) {
      setSection("settings");
    } else if (path.includes("/profile")) {
      setSection("profile");
    } else {
      setSection("dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (section === "ai-agents") {
      setAiAgentManagementOpen(true);
    }
  }, [section]);
  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    const [
      usersResult,
      requestsResult,
      auditResult,
      agentsResult,
      healthResult,
    ] = await Promise.allSettled([
      api.get("/users"),
      api.get("/users/pending-role-requests"),
      api.get("/audit-logs"),
      api.get("/risk-predictions/agent-executions"),
      api.get("/auth/system-health"),
    ]);

    if (usersResult.status === "fulfilled") {
      const data = Array.isArray(usersResult.value.data)
        ? usersResult.value.data
        : usersResult.value.data?.data || [];
      setUsers(data);
    }

    if (requestsResult.status === "fulfilled") {
      const data = Array.isArray(requestsResult.value.data)
        ? requestsResult.value.data
        : requestsResult.value.data?.data || [];
      setRoleRequests(data);
    }

    if (auditResult.status === "fulfilled") {
      const data = Array.isArray(auditResult.value.data)
        ? auditResult.value.data
        : auditResult.value.data?.data || [];
      setAuditLogs(data);
    }

    if (agentsResult.status === "fulfilled") {
      const raw = Array.isArray(agentsResult.value.data)
        ? agentsResult.value.data
        : agentsResult.value.data?.data ||
          agentsResult.value.data?.agents ||
          [];

      setAgentExecutions(raw);



      const mapped = agentDefinitions.map((definition) => {
        const expectedAgentName = definition.name;

        const executions = raw.filter((item: any) =>
          String(item.agentName || item.name || item.type || "")
            .trim()
            .toLowerCase() === expectedAgentName.toLowerCase()
        );

        const latestExecution = executions
          .slice()
          .sort((a: any, b: any) => {
            const dateA = new Date(
              a.startedAt || a.createdAt || 0
            ).getTime();

            const dateB = new Date(
              b.startedAt || b.createdAt || 0
            ).getTime();

            return dateB - dateA;
          })[0];

        const executionStatus = String(
          latestExecution?.status || ""
        ).toLowerCase();

        const displayStatus: AgentStatus["status"] =
          executionStatus === "running"
            ? "Running"
            : executionStatus === "completed"
              ? "Idle"
              : executionStatus === "failed"
                ? "Offline"
                : latestExecution
                  ? "Idle"
                  : "Unknown";

        return {
          ...definition,
          status: displayStatus,
          confidence:
            typeof latestExecution?.confidence === "number"
              ? latestExecution.confidence
              : typeof latestExecution?.confidenceScore === "number"
                ? latestExecution.confidenceScore
                : null,
          execution: latestExecution || null,
        };
      });

      setAgentStatuses(mapped);
    }

    if (healthResult.status === "fulfilled") {
      const raw = healthResult.value.data?.data || healthResult.value.data;

      if (raw && typeof raw === "object") {
        setSystemHealth(raw);
      }
    }





    setLoading(false);

    window.setTimeout(() => {
      const currentPath = window.location.pathname;

      const isOperationalOrAiPage =
        currentPath.includes("/risk-prediction") ||
        currentPath.includes("/vulnerability-impact") ||
        currentPath.includes("/resource-optimization") ||
        currentPath.includes("/emergency-alerts") ||
        currentPath.includes("/ai-risk-prediction") ||
        currentPath.includes("/ai-vulnerability-impact") ||
        currentPath.includes("/ai-resource-optimization") ||
        currentPath.includes("/ai-early-warning") ||
        currentPath.includes("/ai-volunteer-assignment") ||
        currentPath.includes("/ai-agents");

      if (!isOperationalOrAiPage) {
}
    }, 300);
  };

  useEffect(() => {
    // Render the dashboard shell first, then load admin data in the background.
    const timer = window.setTimeout(() => {
      void loadAdminData();
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const loadDisasterReports = async () => {
    try {
      const response = await api.get("/disaster-reports");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setDisasterReports(data);
    } catch (err) {
      console.error("Disaster reports could not be loaded:", err);
    }
  };

  const loadReliefRequests = async () => {
    setReliefRequestsLoading(true);
    setReliefRequestsError("");

    try {
      const response = await api.get("/relief-requests");

      setReliefRequests(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error(err);
      setReliefRequestsError(
        "Relief requests could not be loaded from the API."
      );
    } finally {
      setReliefRequestsLoading(false);
    }
  };

  const loadLocationShares = async () => {
    setLocationSharesLoading(true);
    setLocationSharesError("");

    try {
      const response = await api.get("/location-sharing");

      setLocationShares(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error(err);
      setLocationSharesError(
        "Location-sharing data could not be loaded from the API."
      );
    } finally {
      setLocationSharesLoading(false);
    }
  };

  useEffect(() => {
    if (section === "disaster-reports") {
      void loadDisasterReports();
    }

    if (section === "relief-requests") {
      void loadReliefRequests();
    }

    if (section === "location-sharing") {
      void loadLocationShares();
    }
  }, [section]);

  const goToSection = (nextSection: Section) => {
    setNotice("");
    setError("");
    // Close AI workspace when navigating back to normal dashboard sections.
    if (
      nextSection !== "ai-agents" &&
      nextSection !== "ai-risk-prediction" &&
      nextSection !== "ai-vulnerability-impact" &&
      nextSection !== "ai-resource-optimization" &&
      nextSection !== "ai-early-warning" &&
      nextSection !== "ai-volunteer-assignment"
    ) {
      setAiAgentManagementOpen(false);
    }
    setSection(nextSection);

    navigate(
      nextSection === "dashboard"
        ? "/dashboard/system-administrator"
        : `/dashboard/system-administrator/${nextSection}`
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUserModuleClick = (child: string) => {
    setUserManagementOpen(true);
    setSelectedUserModule(child);
    setNotice("");
    setError("");
    setUserSearch("");

    const routes: Record<string, Section> = {
      "Disaster Reports": "disaster-reports",
      "Relief Requests": "relief-requests",
      "Emergency Alerts": "emergency-alerts",
      "Risk Information": "risk-information",
      "Relief Resources": "relief-resources",
      "Location Sharing": "location-sharing",
      "User Profiles": "user-profiles",

      // Existing operational pages
      "Risk Prediction": "risk-prediction",
      "Vulnerability & Impact": "vulnerability-impact",
      "Resource Optimization": "resource-optimization",
      "Early Warning & Coordination": "emergency-alerts",
    };

    if (child === "Affected Users") {
      setRoleFilter("AffectedUser");
      goToSection("users");
      return;
    }

    if (child === "Field Volunteers") {
      setRoleFilter("FieldVolunteer");
      goToSection("users");
      return;
    }

    if (child === "Relief Coordinators") {
      setRoleFilter("ReliefCoordinator");
      goToSection("users");
      return;
    }

    setRoleFilter("All");

    if (routes[child]) {
      goToSection(routes[child]);
      return;
    }

    goToSection("users");
  };

  const handleAiModuleClick = (child: string) => {
    setAiAgentManagementOpen(true);
    setSelectedAiModule(child);
    setNotice("");
    setError("");

    const aiRoutes: Record<string, Section> = {
      "Risk Prediction": "ai-risk-prediction",
      "Vulnerability & Impact": "ai-vulnerability-impact",
      "Resource Optimization": "ai-resource-optimization",
      "Early Warning & Coordination": "ai-early-warning",
      "Volunteer Assignment": "ai-volunteer-assignment",
    };

    const targetSection = aiRoutes[child];

    if (targetSection) {
      setSection(targetSection);
      navigate(`/dashboard/system-administrator/${targetSection}`);
      return;
    }

    setSection("ai-risk-prediction");
    navigate("/dashboard/system-administrator/ai-risk-prediction");
  };
  const showMessage = (message: string) => {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 3500);
  };

  const handleUserAction = async (
    action: "activate" | "deactivate" | "delete",
    target: UserRecord
  ) => {
    const key = `${action}-${target.id}`;

    setActionLoading(key);
    setError("");
    setNotice("");

    try {
      if (action === "delete") {
        await api.delete(`/users/${target.id}`);

        setUsers((current) =>
          current.filter((item) => item.id !== target.id)
        );

        showMessage(`${target.fullName} was deleted successfully.`);
      } else {
        await api.put(`/users/${target.id}`, {
          ...target,
          isActive: action === "activate",
        });

        setUsers((current) =>
          current.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  isActive: action === "activate",
                }
              : item
          )
        );

        showMessage(
          `${target.fullName} was ${
            action === "activate" ? "activated" : "deactivated"
          }.`
        );
      }
    } catch (err) {
      console.error(err);
      setError("The action could not be completed by the API.");
    } finally {
      setActionLoading("");
    }
  };

  const handleRoleChange = async (
    target: UserRecord,
    role: string
  ) => {
    const key = `role-${target.id}`;

    setActionLoading(key);
    setError("");

    try {
      await api.put(`/users/${target.id}`, {
        fullName: target.fullName,
        email: target.email,
        role,
        isActive: target.isActive,
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === target.id
            ? { ...item, role }
            : item
        )
      );

      showMessage(`${target.fullName}'s role was updated.`);
    } catch (err) {
      console.error(err);
      setError("Role update failed. Check the backend endpoint.");
    } finally {
      setActionLoading("");
    }
  };

  const handleRoleRequest = async (
    request: RoleRequest,
    action: "approve" | "reject"
  ) => {
    const key = `${action}-${request.id}`;

    setActionLoading(key);
    setError("");

    try {
      await api.put(`/users/${request.id}/${action}-role`);

      setRoleRequests((current) =>
        current.filter((item) => item.id !== request.id)
      );

      showMessage(
        `${request.fullName || request.email || "Request"} was ${action}d.`
      );

      await loadAdminData();
    } catch (err) {
      console.error(err);
      setError("The role request could not be processed.");
    } finally {
      setActionLoading("");
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  };

  const savePermissions = async () => {
    setActionLoading("permissions");
    setError("");

    try {
      await api.put("/permissions/role", {
        role: selectedPermissionRole,
        permissions: selectedPermissions,
      });

      showMessage(
        `Permissions saved for ${roleLabel(selectedPermissionRole)}.`
      );
    } catch (err) {
      console.error(err);
      setError(
        "Permission API is not available yet. The UI is ready for the backend."
      );
    } finally {
      setActionLoading("");
    }
  };

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return users.filter((item) => {
      const matchesSearch =
        !query ||
        item.fullName.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All" || item.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, roleFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter((item) => item.isActive).length;
  const pendingRequests = roleRequests.length;
  const activeAgents = agentStatuses.length;

  const visibleMenuItems = menuItems.filter((item) => {
    if (user?.role === "SystemAdministrator") return true;

    const permissionMap: Record<Section, string | null> = {
      "ai-risk-prediction": null,
      "ai-vulnerability-impact": null,
      "ai-resource-optimization": null,
      "ai-early-warning": null,
      "ai-volunteer-assignment": null,
      dashboard: null,
      users: null,
      "disaster-reports": "Report Disaster",
      "emergency-alerts": "View Emergency Alerts",
      "risk-information": "View Risk Information",
      "relief-resources": "Manage Relief Resources",
      "relief-requests": "Manage Relief Requests",
      "location-sharing": "Share Location",
      "user-profiles": "Manage Users",
      "role-requests": "Manage Role Requests",
      permissions: "Configure Permissions",
      "ai-agents": null,
      monitoring: null,
      "audit-logs": "View Audit Logs",
      reports: "View Reports",
      settings: null,
      profile: null,
      "risk-prediction": "Manage Users",
      "vulnerability-impact": "Manage Users",
      "resource-optimization": "Manage Users",
    };

    const permission = permissionMap[item.id];

    return permission === null || hasPermission(permission);
  });

  const visibleUserManagementItems =
    userManagementItems.filter((child) => {
      if (user?.role === "SystemAdministrator") return true;

      const permissionMap: Record<string, string> = {
        "Disaster Reports": "Report Disaster",
        "Relief Requests": "Manage Relief Requests",
        "Emergency Alerts": "View Emergency Alerts",
        "Risk Information": "View Risk Information",
        "Relief Resources": "Manage Relief Resources",
        "Location Sharing": "Share Location",
        "Affected Users": "Manage Users",
        "Field Volunteers": "Manage Users",
        "Relief Coordinators": "Manage Users",
        "User Profiles": "Manage Users",
      };

      return hasPermission(
        permissionMap[child] || "Manage Users"
      );
    });

  const visibleAiAgentManagementItems =
    aiAgentManagementItems.filter(
      () =>
        user?.role === "SystemAdministrator" ||
        hasPermission("AI Agent Monitoring")
    );

  const reportSummary = useMemo<ReportSummary>(() => {
    const normalizedStatus = (value?: string) =>
      String(value || "submitted")
        .toLowerCase()
        .replace(/[\s_-]/g, "");

    const totalIncidents = disasterReports.length;
    const resolved = disasterReports.filter((item) =>
      ["resolved", "closed", "completed"].includes(
        normalizedStatus(item.status)
      )
    ).length;
    const active = disasterReports.filter((item) => {
      const status = normalizedStatus(item.status);
      return status !== "resolved" && status !== "closed" && status !== "rejected";
    }).length;
    const highCritical = disasterReports.filter((item) => {
      const severity = String(item.severity || "").toLowerCase();
      return severity === "high" || severity === "critical";
    }).length;
    const volunteerAssignments = disasterReports.filter(
      (item) => Boolean(item.assignedVolunteerUserId)
    ).length;
    const fieldResponses = disasterReports.filter((item) => {
      const status = normalizedStatus(item.status);
      return status === "fieldcompleted" || status === "resolved";
    }).length;
    const riskLinked = disasterReports.filter(
      (item: any) => Boolean(item.riskPredictionId)
    ).length;

    const severityNames = ["Critical", "High", "Medium", "Low"];
    const severity = severityNames.map((name) => ({
      name,
      count: disasterReports.filter(
        (item) => String(item.severity || "").toLowerCase() === name.toLowerCase()
      ).length,
    }));

    const stageReached = (item: DisasterReportRecord) => {
      const status = normalizedStatus(item.status);
      if (status === "resolved" || status === "closed") return 8;
      if (status === "fieldcompleted") return 7;
      if (status === "fieldstarted" || status === "fieldupdated") return 7;
      if (item.assignedVolunteerUserId) return 6;
      if (["volunteerqueue", "assigned"].includes(status)) return 6;
      if (["warninggenerated", "alertgenerated", "earlywarning"].includes(status)) return 5;
      if (["resourcedoptimized", "resourceoptimized", "resourcesallocated"].includes(status)) return 4;
      if (riskLinked || status !== "submitted") return 3;
      return 1;
    };

    const workflowNames = [
      "Report Submitted",
      "Risk Prediction",
      "Vulnerability",
      "Resource Optimization",
      "Early Warning",
      "Volunteer Assignment",
      "Field Response",
      "Resolution",
    ];
    const workflow = workflowNames.map((name, index) => ({
      name,
      count: disasterReports.filter((item) => stageReached(item) >= index + 1).length,
    }));

    const monthNames: string[] = [];
    const now = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      monthNames.push(d.toLocaleString([], { month: "short" }));
    }
    const monthly = monthNames.map((name, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const count = disasterReports.filter((item) => {
        if (!item.createdAt) return false;
        const created = new Date(item.createdAt);
        return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
      }).length;
      return { name, count };
    });

    const riskScores = disasterReports
      .map((item: any) => Number(item.riskScore))
      .filter((value) => Number.isFinite(value));

    return {
      totalIncidents,
      resolved,
      active,
      highCritical,
      aiPredictions: riskLinked,
      volunteerAssignments,
      fieldResponses,
      averageRiskScore: riskScores.length
        ? riskScores.reduce((sum, value) => sum + value, 0) / riskScores.length
        : 0,
      severity,
      workflow,
      monthly,
    };
  }, [disasterReports]);

  const locationSharingData = useMemo<LocationSharingData>(() => {
    const first = locationShares[0] || {};
    return {
      enabled: Boolean(first.enabled ?? first.isActive ?? false),
      latitude: first.latitude != null ? Number(first.latitude) : null,
      longitude: first.longitude != null ? Number(first.longitude) : null,
      locationLabel: first.locationLabel || first.location || "Location unavailable",
      accuracyMeters: first.accuracyMeters != null ? Number(first.accuracyMeters) : null,
      lastSharedAt: first.lastSharedAt || first.updatedAt || first.createdAt || null,
      sharedWith: [],
    };
  }, [locationShares]);

  const adminProfile: AdminProfile = {
    fullName: user?.fullName,
    email: user?.email,
    role: user?.role || "SystemAdministrator",
    isActive: user?.isActive,
    createdAt: user?.createdAt,
  };

  const renderContent = () => {
    if (aiAgentManagementOpen) {
      const aiAgentMap: Record<string, "risk" | "vulnerability" | "resource" | "warning" | "volunteer"> = {
        "Risk Prediction": "risk",
        "Vulnerability & Impact": "vulnerability",
        "Resource Optimization": "resource",
        "Early Warning & Coordination": "warning",
        "Volunteer Assignment": "volunteer",
      };

      const selectedAgent =
        aiAgentMap[selectedAiModule] || "risk";

      return (
        <AdvancedAIAgentWorkspace
          agent={selectedAgent}
        />
      );
    }
    switch (section) {
      case "disaster-reports":
        return <DisasterReportsPage users={users} />;

      case "users":

  return (
          <UsersSection
            users={filteredUsers}
            search={userSearch}
            setSearch={setUserSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            actionLoading={actionLoading}
            onAction={handleUserAction}
            onRoleChange={handleRoleChange}
            selectedModule={selectedUserModule}
            onRefresh={loadAdminData}
          />
        );

            case "emergency-alerts":
              return <Suspense fallback={<PageLoadingFallback />}><EmergencyAlertsPage /></Suspense>;

            case "risk-prediction":
              return <Suspense fallback={<PageLoadingFallback />}><RiskPredictionPage /></Suspense>;

            case "vulnerability-impact":
              return <Suspense fallback={<PageLoadingFallback />}><VulnerabilityImpactPage /></Suspense>;

            case "resource-optimization":
              return <Suspense fallback={<PageLoadingFallback />}><ResourceOptimizationPage /></Suspense>;

      case "risk-information":

  return (
          <AdminLiveApiSection
            title="Risk Information"
            description="Review real risk predictions generated by the multi-hazard risk engine."
            endpoint="/risk-predictions"
          />
        );

      case "relief-resources":

  return (
          <AdminLiveApiSection
            title="Relief Resources"
            description="Review real relief resources currently stored in the system."
            endpoint="/resources"
          />
        );

      case "relief-requests":

  return (
          <div className="space-y-6">
            <PageHeading
              eyebrow="User Management"
              title="Relief Requests"
              description="Review real emergency assistance and relief requests."
            />

            <DashboardCard
              title="Relief Requests"
              subtitle={`${reliefRequests.length} records shown`}
            >
              {reliefRequestsLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Loading relief requests...
                </div>
              ) : reliefRequestsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {reliefRequestsError}
                </div>
              ) : reliefRequests.length === 0 ? (
                <EmptyState text="No relief requests found." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-3">Requester</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reliefRequests.map((request: any, index: number) => (
                        <tr
                          key={String(request.id || index)}
                          className="border-b border-slate-50"
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                            {String(
                              request.requesterName ||
                              request.fullName ||
                              request.userName ||
                              request.email ||
                              "Unknown"
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {String(
                              request.requestType ||
                              request.type ||
                              request.resourceType ||
                              "N/A"
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {String(
                              request.location ||
                              request.address ||
                              "N/A"
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {String(
                              request.status ||
                              request.requestStatus ||
                              "N/A"
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">
                            {String(
                              request.createdAt ||
                              request.updatedAt ||
                              "N/A"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DashboardCard>
          </div>
        );

      case "location-sharing":

  return (
          <div className="space-y-6">
            {locationSharesLoading ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                Loading live location-sharing dataN/A
              </div>
            ) : locationSharesError ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
                {locationSharesError}
              </div>
            ) : (
              <LocationSharingModule
                data={locationSharingData}
                onToggle={async (enabled: boolean) => {
                  try {
                    await api.put("/location-sharing", { enabled });
                    showMessage(`Location sharing ${enabled ? "enabled" : "disabled"}.`);
                    await loadLocationShares();
                  } catch (err) {
                    console.error(err);
                    setError("Location-sharing settings could not be updated.");
                  }
                }}
              />
            )}
          </div>
        );

      case "user-profiles":

  return (
          <UsersSection
            users={filteredUsers}
            search={userSearch}
            setSearch={setUserSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            actionLoading={actionLoading}
            onAction={handleUserAction}
            onRoleChange={handleRoleChange}
            selectedModule="User Profiles"
            onRefresh={loadAdminData}
          />
        );

      case "role-requests":

  return (
          <RoleRequestsSection
            requests={roleRequests}
            actionLoading={actionLoading}
            onAction={handleRoleRequest}
          />
        );

      case "permissions":

  return (
          <PermissionsSection
            selectedRole={selectedPermissionRole}
            setSelectedRole={setSelectedPermissionRole}
            permissions={selectedPermissions}
            onToggle={togglePermission}
            onSave={savePermissions}
            actionLoading={actionLoading}
          />
        );

    
case "ai-risk-prediction":
  return <AdvancedAIAgentWorkspace agent="risk" />;

case "ai-vulnerability-impact":
  return <AdvancedAIAgentWorkspace agent="vulnerability" />;

case "ai-resource-optimization":
  return <AdvancedAIAgentWorkspace agent="resource" />;

case "ai-early-warning":
  return <AdvancedAIAgentWorkspace agent="warning" />;

case "ai-volunteer-assignment":
  return <AdvancedAIAgentWorkspace agent="volunteer" />;

        case "ai-agents":
      return (
        <AdvancedAIAgentWorkspace
          agent={
            selectedAiModule === "Vulnerability & Impact"
              ? "vulnerability"
              : selectedAiModule === "Resource Optimization"
                ? "resource"
                : selectedAiModule === "Early Warning & Coordination"
                  ? "warning"
                  : selectedAiModule === "Volunteer Assignment"
                    ? "volunteer"
                    : "risk"
          }
        />
      );



      
case "monitoring":
        return (
          <div className="space-y-8">
            <MonitoringSection
              systemHealth={systemHealth}
            />

            <AIAgentMonitoringSection
              executions={agentExecutions}
              agentStatuses={agentStatuses}
            />

            <AIAuditTrailSection
              executions={agentExecutions}
            />
          </div>
        );
case "audit-logs":
        return <AuditLogsSection logs={auditLogs} />;

      case "reports":
        return <ReportsSection summary={reportSummary} />;

      case "settings":

  return (
          <SettingsSection
            settings={systemSettings}
            setSettings={setSystemSettings}
            onSave={() =>
              showMessage("System settings saved locally.")
            }
          />
        );

      case "profile":

  return (
          <ProfileSection
            user={user}
            onLogout={handleLogout}
            profile={adminProfile}
          />
        );

      default:

  return (
          <OverviewSection
            totalUsers={totalUsers}
            activeUsers={activeUsers}
            pendingRequests={pendingRequests}
            activeAgents={activeAgents}
            agentStatuses={agentStatuses}
            users={users}
            roleRequests={roleRequests}
            auditLogs={auditLogs}
            onNavigate={goToSection}
            loading={loading}
            systemHealth={systemHealth}
            disasterReports={disasterReports}
            riskPredictions={riskPredictions}
            vulnerabilityAssessments={vulnerabilityAssessments}
            reliefResources={reliefResources}
            emergencyAlerts={emergencyAlerts}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-[#101c35]">
      <div className="flex min-h-screen">
        <aside
          className="
            fixed inset-y-0 left-0 z-[9999] hidden
            h-screen w-[238px]
            overflow-hidden
            bg-[#0b1d38] text-white pointer-events-auto
            lg:flex lg:flex-col
          "
        >
          <div className="border-b border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={() => goToSection("dashboard")}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <LogoIcon />
              </div>

              <div>
                <div className="text-base font-extrabold">
                  Relief<span className="text-blue-400">Nexus</span>
                </div>

                <div className="text-[9px] font-medium tracking-wide text-slate-400">
                  Disaster Management Platform
                </div>
              </div>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <p className="px-3 pb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Administration
            </p>

            <nav className="space-y-0.5">
              {visibleMenuItems.map((item) => {
                const isSupportItem = ["monitoring", "audit-logs", "reports", "settings", "profile"].includes(item.id);
                const previousSupport = item.id === "monitoring";

                if (previousSupport) {

  return (
                    <Fragment key={item.id}>
                      <p className="px-3 pb-2 pt-4 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Support Modules
                      </p>
                      <button
                        type="button"
                        onClick={() => goToSection(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                          section === item.id
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    </Fragment>
                  );
                }

                if (isSupportItem) {

  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToSection(item.id)}
                      className={`ml-1 flex w-[calc(100%-4px)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                        section === item.id
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                }
                if (item.id === "users") {

  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setUserManagementOpen((open) => !open)
                        }
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                          section === "users"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="flex h-5 w-5 items-center justify-center">
                          {item.icon}
                        </span>

                        <span className="flex-1">{item.label}</span>

                        <span
                          className={`transition-transform ${
                            userManagementOpen ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDownIcon />
                        </span>
                      </button>

                      {userManagementOpen && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                          {visibleUserManagementItems.map((child) => (
                            <button
                              key={child}
                              type="button"
                              onClick={() =>
                                handleUserModuleClick(child)
                              }
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition ${
                                section === ({ "Risk Information": "risk-information", "Relief Resources": "relief-resources", "Location Sharing": "location-sharing", "Disaster Reports": "disaster-reports", "Relief Requests": "relief-requests", "Emergency Alerts": "emergency-alerts", "User Profiles": "user-profiles", "Risk Prediction": "risk-prediction", "Vulnerability & Impact": "vulnerability-impact", "Resource Optimization": "resource-optimization", "Early Warning & Coordination": "emergency-alerts" } as Record<string, Section>)[child]
                                  ? "bg-white/10 text-white"
                                  : "text-slate-400 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              <span>{child}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === "ai-agents") {

  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setAiAgentManagementOpen((open) => !open)
                        }
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                          section === "ai-agents"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="flex h-5 w-5 items-center justify-center">
                          {item.icon}
                        </span>

                        <span className="flex-1">{item.label}</span>

                        <span
                          className={`transition-transform ${
                            aiAgentManagementOpen ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDownIcon />
                        </span>
                      </button>

                      {aiAgentManagementOpen && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                          {visibleAiAgentManagementItems.map((child) => (
                            <button
                              key={child}
                              type="button"
                              onClick={() =>
                                handleAiModuleClick(child)
                              }
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition ${
                                selectedAiModule === child
                                  ? "bg-white/10 text-white"
                                  : "text-slate-400 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              <span>{child}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

  return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      section === item.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center">
                      {item.icon}
                    </span>

                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="shrink-0 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <LogoutIcon />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:ml-[238px]">
          <header className="sticky top-0 z-20 flex h-[56px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 lg:hidden">
                <LogoIcon />
              </div>

              <div className="hidden min-w-0 w-[340px] md:flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <SearchIcon />

                <input
                  value={userSearch}
                  onChange={(event) =>
                    setUserSearch(event.target.value)
                  }
                  placeholder="Search incidents, users, reports..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="md:hidden">
                <p className="text-sm font-bold">
                  Admin Control Center
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <button
                type="button"
                onClick={() => goToSection("profile")}
                className="flex items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {(user?.fullName || "Admin")
                    .split(" ")
                    .map((part: string) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800">
                    {user?.fullName || "System Administrator"}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    System Administrator
                  </p>
                </div>

                <ChevronDownIcon />
              </button>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[2400px] px-4 py-6 sm:px-6 lg:px-8 2xl:px-10">
            {notice && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {notice}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};


const userModuleDescription = (module: string) => {
  const descriptions: Record<string, string> = {
    "Affected Users": "Manage affected community members and review their account status.",
    "Field Volunteers": "Manage field volunteers, availability, and application roles.",
    "Relief Coordinators": "Manage relief coordinators and their operational access.",
    "Disaster Reports": "Review and manage disaster reports submitted by users and field teams.",
    "Relief Requests": "Review and manage requests for emergency assistance and relief.",
    "Emergency Alerts": "Review active emergency alerts and coordinate warning information.",
    "Risk Information": "Review disaster risk information and AI-generated risk assessments.",
    "Relief Resources": "Monitor relief resources and their availability across the system.",
    "Location Sharing": "Review location-sharing activity used for disaster response coordination.",
    "User Profiles": "Review user profile information and account details.",
  };

  return descriptions[module] || "Manage and monitor this system module.";
};

const UsersSection = ({
  users,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  actionLoading,
  onAction,
  onRoleChange,
  selectedModule,
}: {
  users: UserRecord[];
  search: string;
  setSearch: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  actionLoading: string;
  onAction: (
    action: "activate" | "deactivate" | "delete",
    user: UserRecord
  ) => void;
  onRoleChange: (user: UserRecord, role: string) => void;
  selectedModule: string;
  onRefresh: () => Promise<void>;
}) => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="User Management"
      title={selectedModule}
      description={userModuleDescription(selectedModule)}
    />

    <DashboardCard title={selectedModule} subtitle={`${users.length} records shown`}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <SearchIcon />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
        >
          <option value="All">All roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
              <th className="px-3 py-3 font-bold">User</th>
              <th className="px-3 py-3 font-bold">Role</th>
              <th className="px-3 py-3 font-bold">Status</th>
              <th className="px-3 py-3 font-bold">Created</th>
              <th className="px-3 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-50 last:border-0"
              >
                <td className="px-3 py-4">
                  <p className="text-sm font-bold text-slate-800">
                    {item.fullName}
                  </p>
                  <p className="text-[11px] text-slate-400">{item.email}</p>
                </td>
                <td className="px-3 py-4">
                  <select
                    value={item.role}
                    onChange={(event) =>
                      onRoleChange(item, event.target.value)
                    }
                    disabled={actionLoading === `role-${item.id}`}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-4 text-xs text-slate-400">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-3 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onAction(
                          item.isActive ? "deactivate" : "activate",
                          item
                        )
                      }
                      disabled={actionLoading.includes(item.id)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {item.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction("delete", item)}
                      disabled={actionLoading.includes(item.id)}
                      className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            No users match your search.
          </div>
        )}
      </div>
    </DashboardCard>
  </div>
);
const RoleRequestsSection = ({
  requests,
  actionLoading,
  onAction,
}: {
  requests: RoleRequest[];
  actionLoading: string;
  onAction: (
    request: RoleRequest,
    action: "approve" | "reject"
  ) => void;
}) => {
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);

  const getInitials = (name?: string) =>
    (name || "User")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const formatDateTime = (value?: string) => {
    if (!value) return "Not provided";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not provided";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getRoleDescription = (role?: string) => {
    const normalized = String(role || "").toLowerCase();
    if (normalized.includes("field") || normalized.includes("volunteer")) {
      return "Support field operations, community assistance, and disaster relief activities.";
    }
    if (normalized.includes("coordinator")) {
      return "Coordinate response teams, operational activities, and emergency workflows.";
    }
    if (normalized.includes("affected")) {
      return "Access services and submit information related to disaster impacts and assistance needs.";
    }
    return "Operational access for the requested ReliefNexus role.";
  };

  const InfoIcon = ({
    type,
  }: {
    type: "user" | "mail" | "phone" | "calendar" | "pin";
  }) => {
    const paths: Record<string, ReactNode> = {
      user: (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 21c.8-4.3 3.1-6.5 7-6.5s6.2 2.2 7 6.5" />
        </>
      ),
      mail: (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      ),
      phone: (
        <path d="M6.5 3.5 9 5l-1.5 3-1.2.8a14 14 0 0 0 8.9 8.9l.8-1.2 3-1.5 1.5 2.5-1.5 2.2c-.6.8-1.6 1.2-2.6.9C9.2 18.5 5.5 14.8 3.4 7.6c-.3-1 .1-2 .9-2.6Z" />
      ),
      calendar: (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 9h16" />
        </>
      ),
      pin: (
        <>
          <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2" />
        </>
      ),
    };

  return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="shrink-0"
      >
        {paths[type]}
      </svg>
    );
  };

  const DetailItem = ({
    icon,
    label,
    value,
    wide = false,
  }: {
    icon: "user" | "mail" | "phone" | "calendar" | "pin";
    label: string;
    value?: string;
    wide?: boolean;
  }) => (
    <div className={`flex min-w-0 gap-3 ${wide ? "md:col-span-2" : ""}`}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <InfoIcon type={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-700">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Access Control"
        title="Role Requests"
        description="Review registration requests and approve the correct operational role."
      />

      <DashboardCard
        title="Pending Requests"
        subtitle={`${requests.length} ${requests.length === 1 ? "request" : "requests"} awaiting review`}
      >
        {requests.length === 0 ? (
          <EmptyState text="There are no pending role requests." />
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const isApproving = actionLoading === `approve-${request.id}`;
              const isRejecting = actionLoading === `reject-${request.id}`;

  return (
                <div
                  key={request.id}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 text-sm font-extrabold text-blue-600 ring-1 ring-blue-100">
                      {getInitials(request.fullName)}
                      {request.profileImageUrl && (
                        <img
                          src={request.profileImageUrl}
                          alt={`${request.fullName || "User"}'s profile`}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-slate-800">
                          {request.fullName || "Unknown user"}
                        </p>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Pending Review
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {request.email || "No email"}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-blue-600">
                        {roleLabel(request.role)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={() => onAction(request, "approve")}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isApproving ? "Approving..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={isRejecting}
                      onClick={() => onAction(request, "reject")}
                      className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRejecting ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>

      {selectedRequest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071326]/70 p-3 backdrop-blur-md sm:p-5"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_35px_100px_rgba(2,12,32,0.38)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#071a35] via-[#0d3770] to-[#1769e8] px-5 pb-5 pt-5 text-white sm:px-7 sm:pb-6">
              <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:32px_32px]" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" />
                    Access Control
                  </div>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Applicant Profile
                  </h2>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-blue-100 sm:text-sm">
                    Review the applicant details before approving this role request.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close profile"
                >
                  <span className="text-xl leading-none"></span>
                </button>
              </div>

              <div className="relative mt-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white text-xl font-extrabold text-blue-600 shadow-xl">
                    {getInitials(selectedRequest.fullName)}
                    {selectedRequest.profileImageUrl && (
                      <img
                        src={selectedRequest.profileImageUrl}
                        alt={`${selectedRequest.fullName || "User"}'s profile`}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-extrabold sm:text-xl">
                        {selectedRequest.fullName || "Unknown user"}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/20 bg-amber-300/15 px-2.5 py-1 text-[9px] font-bold text-amber-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                        Pending Review
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-blue-100 sm:text-sm">
                      {selectedRequest.email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
                  <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-blue-200">Requested Role</p>
                    <p className="mt-1 text-xs font-bold text-white">{roleLabel(selectedRequest.role)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-blue-200">Submitted</p>
                    <p className="mt-1 text-xs font-bold text-white">{formatDateTime(selectedRequest.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7faff] px-4 py-5 sm:px-7 sm:py-6">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200">
                      <InfoIcon type="user" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-500">Requested Role</p>
                      <h4 className="mt-1 text-lg font-extrabold text-slate-900">
                        {roleLabel(selectedRequest.role)}
                      </h4>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        {getRoleDescription(selectedRequest.role)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Request Information</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {selectedRequest.roleRequestStatus || "Pending"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold text-slate-400">Submitted</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {formatDateTime(selectedRequest.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <InfoIcon type="user" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Registration Information</h4>
                    <p className="mt-0.5 text-[10px] text-slate-400">Applicant details submitted during registration.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem icon="user" label="Full Name" value={selectedRequest.fullName} />
                  <DetailItem icon="mail" label="Email Address" value={selectedRequest.email} />
                  <DetailItem icon="phone" label="Phone Number" value={selectedRequest.phoneNumber} />
                  <DetailItem
                    icon="calendar"
                    label="Date of Birth"
                    value={selectedRequest.dateOfBirth ? new Date(selectedRequest.dateOfBirth).toLocaleDateString() : undefined}
                  />
                  <DetailItem icon="user" label="Gender" value={selectedRequest.gender} />
                  <DetailItem icon="pin" label="District" value={selectedRequest.district} />
                  <DetailItem icon="pin" label="Address" value={selectedRequest.address} wide />
                  <DetailItem icon="user" label="Emergency Contact" value={selectedRequest.emergencyContactName} />
                  <DetailItem icon="phone" label="Emergency Phone" value={selectedRequest.emergencyContactPhone} />
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <InfoIcon type="calendar" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Application Review</h4>
                      <p className="text-[10px] text-slate-400">Role request context</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-700">
                      Requested access as a {roleLabel(selectedRequest.role)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {getRoleDescription(selectedRequest.role)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Profile Image</h4>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {selectedRequest.profileImageUrl ? "Uploaded by applicant" : "No image uploaded"}
                      </p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                      Identity
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/50 p-4">
                    <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 text-3xl font-extrabold text-blue-600 shadow-inner">
                      {getInitials(selectedRequest.fullName)}
                      {selectedRequest.profileImageUrl && (
                        <img
                          src={selectedRequest.profileImageUrl}
                          alt={`${selectedRequest.fullName || "User"}'s profile`}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Applicant ID</p>
                  <p className="mt-1 truncate font-mono text-[10px] font-semibold text-slate-600">
                    {selectedRequest.id}
                  </p>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Current Status</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {selectedRequest.roleRequestStatus || "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[10px] text-slate-400">
                  Review the submitted information before changing the request status.
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === `reject-${selectedRequest.id}`}
                    onClick={() => {
                      onAction(selectedRequest, "reject");
                      setSelectedRequest(null);
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {actionLoading === `reject-${selectedRequest.id}` ? "Rejecting..." : "Reject Request"}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === `approve-${selectedRequest.id}`}
                    onClick={() => {
                      onAction(selectedRequest, "approve");
                      setSelectedRequest(null);
                    }}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                  >
                    {actionLoading === `approve-${selectedRequest.id}` ? "Approving..." : "Approve Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
type OverviewProps = {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  activeAgents: number;
  agentStatuses: AgentStatus[];
  users: UserRecord[];
  roleRequests: RoleRequest[];
  auditLogs: AuditLog[];
  onNavigate: (section: Section) => void;
  loading: boolean;
  disasterReports: DisasterReportRecord[];
  riskPredictions: any[];
  vulnerabilityAssessments: any[];
  reliefResources: any[];
  emergencyAlerts: any[];
};

const OverviewSection = ({
  totalUsers,
  activeUsers,
  pendingRequests,
  activeAgents,
  agentStatuses,
  users,
  roleRequests,
  onNavigate,
  loading,
  systemHealth,
  disasterReports,
  riskPredictions,
  vulnerabilityAssessments,
  reliefResources,
  emergencyAlerts,
}: OverviewProps & { systemHealth: SystemHealth | null }) => {
  const normalize = (value?: string) =>
    String(value || "unknown").trim().toLowerCase().replace(/[\s_-]+/g, "");

  const activeVolunteers = users.filter(
    (item) => item.role === "FieldVolunteer" && item.isActive
  ).length;

  const mappedReports = useMemo(
    () =>
      disasterReports.filter((report) => {
        const latitude = Number(report.latitude);
        const longitude = Number(report.longitude);

  return (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        );
      }),
    [disasterReports]
  );

  useEffect(() => {
    const container = document.getElementById("reliefnexus-risk-map");
    if (!container) return;

    const map = L.map(container, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: true,
      preferCanvas: true,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles N/A Esri N/A Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        maxZoom: 18,
        maxNativeZoom: 18,
      }
    );

    satelliteLayer.addTo(map);

    const severityConfig: Record<
      string,
      { color: string; radius: number }
    > = {
      critical: { color: "#ef4444", radius: 28000 },
      high: { color: "#f97316", radius: 23000 },
      medium: { color: "#eab308", radius: 17000 },
      low: { color: "#10b981", radius: 12000 },
    };

    const escapeHtml = (value: unknown) =>
      String(value ?? "").replace(/[&<>'"]/g, (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[character] || character
      );

    mappedReports.forEach((report) => {
      const latitude = Number(report.latitude);
      const longitude = Number(report.longitude);
      const severity = normalize(report.severity);
      const config =
        severityConfig[severity] || {
          color: "#3b82f6",
          radius: 10000,
        };

      L.circle([latitude, longitude], {
        radius: config.radius,
        color: config.color,
        fillColor: config.color,
        fillOpacity: 0.12,
        opacity: 0.55,
        weight: 2,
      }).addTo(map);

      L.circleMarker([latitude, longitude], {
        radius: severity === "critical" ? 9 : severity === "high" ? 7.5 : 6.5,
        color: "#ffffff",
        weight: 2.5,
        fillColor: config.color,
        fillOpacity: 1,
      })
        .bindPopup(
          `<div style="min-width:235px;font-family:Inter,Arial,sans-serif;padding:4px">
            <div style="font-size:13px;font-weight:900;color:#0f172a;margin-bottom:9px">
              ${escapeHtml(report.disasterType || "Disaster Report")}
            </div>
            <div style="display:flex;justify-content:space-between;gap:14px;font-size:11px;margin-bottom:6px">
              <span style="color:#64748b">Severity</span><b style="color:${config.color}">${escapeHtml(report.severity || "Unknown")}</b>
            </div>
            <div style="display:flex;justify-content:space-between;gap:14px;font-size:11px;margin-bottom:6px">
              <span style="color:#64748b">Status</span><b style="color:#0f172a">${escapeHtml(report.status || "Unknown")}</b>
            </div>
            <div style="font-size:11px;color:#475569;margin-bottom:6px"><b>Location:</b> ${escapeHtml(report.location || "Unavailable")}</div>
            <div style="font-size:11px;color:#475569"><b>Risk score:</b> ${report.riskScore != null ? escapeHtml(report.riskScore) : "Not available"}</div>
          </div>`
        )
        .addTo(map);
    });

    if (mappedReports.length > 1) {
      const bounds = L.latLngBounds(
        mappedReports.map((report) => [
          Number(report.latitude),
          Number(report.longitude),
        ] as [number, number])
      );

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.28), {
          maxZoom: 8,
          animate: false,
        });
      }
    }

    const timer = window.setTimeout(() => map.invalidateSize(true), 250);

  return () => {
      window.clearTimeout(timer);
      map.remove();
    };
  }, [mappedReports]);

  const activeIncidents = disasterReports.filter((report) =>
    [
      "active",
      "open",
      "pending",
      "inprogress",
      "monitoring",
      "assigned",
      "volunteerqueue",
    ].includes(normalize(report.status))
  ).length;

  const resolvedIncidents = disasterReports.filter((report) =>
    ["resolved", "closed", "complete", "completed"].includes(
      normalize(report.status)
    )
  ).length;

  const highCritical = disasterReports.filter((report) =>
    ["high", "critical"].includes(normalize(report.severity))
  ).length;

  const riskValues = disasterReports
    .map((report) => Number(report.riskScore))
    .filter((value) => Number.isFinite(value));

  const averageRisk = riskValues.length
    ? Math.round(
        riskValues.reduce((sum, value) => sum + value, 0) / riskValues.length
      )
    : null;

  const healthValues = [
    systemHealth?.apiAvailability,
    systemHealth?.databaseHealth,
    systemHealth?.aiServices,
    systemHealth?.storage,
  ].filter((value): value is number => typeof value === "number");

  const healthAverage = healthValues.length
    ? Math.round(
        healthValues.reduce((sum, value) => sum + value, 0) / healthValues.length
      )
    : null;

  const severityItems = [
    { label: "Critical", key: "critical", color: "bg-red-500", text: "text-red-700" },
    { label: "High", key: "high", color: "bg-orange-500", text: "text-orange-700" },
    { label: "Medium", key: "medium", color: "bg-amber-400", text: "text-amber-700" },
    { label: "Low", key: "low", color: "bg-emerald-500", text: "text-emerald-700" },
  ].map((item) => ({
    ...item,
    count: disasterReports.filter(
      (report) => normalize(report.severity) === item.key
    ).length,
  }));

  const severityTotal = severityItems.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const monthBuckets = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1
      );
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString(undefined, { month: "short" }),
      };
    });
  }, []);

  const riskTrend = useMemo(() => {
    return monthBuckets.map((month) => {
      const values = disasterReports
        .filter((report) => {
          if (!report.createdAt) return false;
          const date = new Date(report.createdAt);

  return (
            !Number.isNaN(date.getTime()) &&
            `${date.getFullYear()}-${date.getMonth()}` === month.key
          );
        })
        .map((report) => Number(report.riskScore))
        .filter((value) => Number.isFinite(value));

      return {
        label: month.label,
        average: values.length
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : null,
      };
    });
  }, [disasterReports, monthBuckets]);

  const recentIncidents = useMemo(
    () =>
      disasterReports
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 5),
    [disasterReports]
  );

  const healthItems = [
    { label: "API Services", value: systemHealth?.apiAvailability },
    { label: "Database", value: systemHealth?.databaseHealth },
    { label: "AI Services", value: systemHealth?.aiServices },
    { label: "Storage", value: systemHealth?.storage },
  ];

  const healthState = (value: number | undefined) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { label: "No data", ring: "#dbe3ee", percent: 0 };
    }
    if (value >= 90) {
      return {
        label: "Healthy",
        ring: "#22c55e",
        percent: Math.max(0, Math.min(100, value)),
      };
    }
    if (value >= 70) {
      return {
        label: "Warning",
        ring: "#f59e0b",
        percent: Math.max(0, Math.min(100, value)),
      };
    }
    return {
      label: "Critical",
      ring: "#ef4444",
      percent: Math.max(0, Math.min(100, value)),
    };
  };

  const availableAgents = agentStatuses.filter(
    (agent) => agent.status !== "Offline"
  ).length;

  const kpis = [
    {
      label: "Total Users",
      value: totalUsers,
      note: `${activeUsers} active accounts`,
      meta: totalUsers
        ? `${Math.round((activeUsers / totalUsers) * 100)}% active`
        : "No users",
      icon: <UsersIcon />,
      iconClass: "bg-blue-50 text-blue-600 ring-blue-100",
      accent: "from-blue-500 to-cyan-400",
      valueClass: "text-slate-950",
    },
    {
      label: "Active Incidents",
      value: activeIncidents,
      note: `${highCritical} high / critical`,
      meta: disasterReports.length
        ? `${Math.round((activeIncidents / disasterReports.length) * 100)}% of reports`
        : "No incidents",
      icon: <RiskIcon />,
      iconClass: "bg-red-50 text-red-600 ring-red-100",
      accent: "from-red-500 to-orange-400",
      valueClass: "text-slate-950",
    },
    {
      label: "High / Critical",
      value: highCritical,
      note: "Priority incidents",
      meta: severityTotal ? `${highCritical}/${severityTotal} classified` : "No severity data",
      icon: <AlertIcon />,
      iconClass: "bg-orange-50 text-orange-600 ring-orange-100",
      accent: "from-orange-500 to-amber-400",
      valueClass: "text-slate-950",
    },
    {
      label: "Pending Requests",
      value: pendingRequests,
      note: pendingRequests ? "Needs administrator review" : "Queue clear",
      meta: pendingRequests ? "Action required" : "All caught up",
      icon: <RequestIcon />,
      iconClass: "bg-amber-50 text-amber-600 ring-amber-100",
      accent: "from-amber-500 to-yellow-400",
      valueClass: "text-slate-950",
    },
    {
      label: "AI Agents",
      value: activeAgents,
      note: `${availableAgents}/4 available`,
      meta: availableAgents === 4 ? "All systems online" : "Review agent status",
      icon: <SparkIcon />,
      iconClass: "bg-violet-50 text-violet-600 ring-violet-100",
      accent: "from-violet-500 to-indigo-400",
      valueClass: "text-slate-950",
    },
    {
      label: "Active Volunteers",
      value: activeVolunteers,
      note: "Field response network",
      meta: `${users.filter((item) => item.role === "FieldVolunteer").length} registered`,
      icon: <VolunteerIcon />,
      iconClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      accent: "from-emerald-500 to-teal-400",
      valueClass: "text-slate-950",
    },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* ESSENTIAL COMMAND HERO */}
      <section
        className="relative overflow-hidden rounded-[24px] border border-slate-800/20 bg-[#06182d] shadow-[0_18px_50px_rgba(15,39,70,.18)]"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(3,15,31,.98) 0%,rgba(4,27,51,.90) 42%,rgba(5,27,52,.52) 72%,rgba(5,27,52,.82) 100%),url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=2400&q=92')",
          backgroundSize: "cover",
          backgroundPosition: "center 45%",
        }}
      >
        <div className="relative grid gap-5 px-6 py-6 lg:grid-cols-[1.55fr_.8fr] lg:items-center lg:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.2em] text-blue-100 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              System Administrator Command Center
            </div>

            <h1 className="text-[34px] font-black leading-none tracking-[-.04em] text-white sm:text-[42px]">
              Disaster Management
              <span className="block text-blue-300">Control Center</span>
            </h1>

            <p className="mt-2 max-w-xl text-[11px] leading-5 text-slate-200/90">
              Monitor live incidents, AI operations, system health and response readiness from one focused control center.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Incidents", disasterReports.length],
                ["High / Critical", highCritical],
                ["Resolved", resolvedIncidents],
                ["Mapped", mappedReports.length],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-white/10 bg-white/[.07] px-3 py-2.5 backdrop-blur-md"
                >
                  <p className="text-[7px] font-black uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-slate-950/55 p-5 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-[.18em] text-slate-400">
                Command status
              </span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[7px] font-black text-emerald-300">
                LIVE
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-white/10">
                <MonitorIcon />
              </div>
              <div>
                <p className="text-sm font-black">
                  {loading ? "Synchronizing..." : "System monitoring active"}
                </p>
                <p className="mt-1 text-[8px] text-slate-400">
                  Live API, database and AI indicators
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Avg risk</p>
                <p className="mt-1 text-lg font-black">{averageRisk ?? "N/A"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Health</p>
                <p className="mt-1 text-lg font-black">{healthAverage == null ? "N/A" : `${healthAverage}%`}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE KPIs */}
      <section>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-400">
              Command Metrics
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Key operational indicators at a glance
            </p>
          </div>
          <span className="hidden rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-slate-400 sm:inline-flex">
            Live data
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((item) => (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-[20px] border border-slate-200/90 bg-white p-4 shadow-[0_10px_32px_rgba(15,23,42,.055)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_38px_rgba(15,23,42,.08)]"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`}
              />

              <div className="flex items-start justify-between gap-3 pt-0.5">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-[14px] ring-4 ${item.iconClass}`}
                >
                  {item.icon}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[7px] font-black uppercase tracking-[.12em] text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              <div className="mt-4">
                <p className="text-[8px] font-black uppercase tracking-[.15em] text-slate-400">
                  {item.label}
                </p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p
                    className={`text-[30px] font-black leading-none tracking-[-.03em] ${item.valueClass}`}
                  >
                    {item.value}
                  </p>
                  <span className="pb-0.5 text-[8px] font-black text-slate-300">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="truncate text-[9px] font-semibold text-slate-500">
                  {item.note}
                </p>
                <p className="mt-1 truncate text-[8px] text-slate-400">
                  {item.meta}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MAP + FOUR AI AGENTS */}
      <div className="grid gap-5 xl:grid-cols-[1.55fr_.95fr]">
        <DashboardCard
          title="Disaster Risk Intelligence Map"
          subtitle="Live geographic overview of reported incidents across Sri Lanka"
          action={
            <button
              type="button"
              onClick={() => onNavigate("disaster-reports")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              View Reports
            </button>
          }
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
            <div id="reliefnexus-risk-map" className="h-[350px] w-full" />

            <div className="absolute left-3 top-3 z-[500] rounded-2xl border border-white/10 bg-slate-950/90 p-3 text-white shadow-2xl backdrop-blur-xl">
              <p className="mb-2 text-[7px] font-black uppercase tracking-[.18em] text-slate-400">
                Risk level
              </p>
              {severityItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 py-1 text-[8px] font-bold"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="absolute right-3 top-3 z-[500] rounded-2xl border border-white/10 bg-slate-950/85 px-3 py-2 text-[7px] font-black text-emerald-300 shadow-xl backdrop-blur-xl">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              LIVE MAP
            </div>

            <div className="absolute bottom-3 left-3 z-[500] grid grid-cols-3 gap-2">
              {[
                ["Mapped", mappedReports.length],
                ["High+", highCritical],
                ["Risk", averageRisk ?? "N/A"],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-white shadow-xl backdrop-blur-xl"
                >
                  <p className="text-[7px] uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-base font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="AI Operations Summary"
          subtitle="Four response agents  live operational metrics"
          action={
            <button
              type="button"
              onClick={() => onNavigate("ai-agents")}
              className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[9px] font-black text-blue-700 transition hover:bg-blue-100"
            >
              Manage Agents
            </button>
          }
        >
          {(() => {
            const readNumber = (
              row: Record<string, any>,
              keys: string[],
            ): number | null => {
              for (const key of keys) {
                const value = row?.[key];
                if (value !== undefined && value !== null && value !== "") {
                  const numeric = Number(value);
                  if (Number.isFinite(numeric)) return numeric;
                }
              }
              return null;
            };

            const latestByDate = (rows: any[]) =>
              [...rows]
                .filter(
                  (row) =>
                    row &&
                    (row.createdAt ||
                      row.updatedAt ||
                      row.completedAt ||
                      row.startedAt),
                )
                .sort((a, b) => {
                  const aTime = new Date(
                    a.createdAt ||
                      a.updatedAt ||
                      a.completedAt ||
                      a.startedAt ||
                      0,
                  ).getTime();
                  const bTime = new Date(
                    b.createdAt ||
                      b.updatedAt ||
                      b.completedAt ||
                      b.startedAt ||
                      0,
                  ).getTime();
                  return bTime - aTime;
                })[0] || null;

            const predictionScores: number[] = riskPredictions
              .map((row: any) =>
                readNumber(row, [
                  "riskScore",
                  "score",
                  "overallRiskScore",
                ]),
              )
              .filter(
                (value: number | null): value is number =>
                  value !== null,
              );

            const predictionAverage =
              predictionScores.length > 0
                ? predictionScores.reduce(
                    (sum, value) => sum + value,
                    0,
                  ) / predictionScores.length
                : null;

            const highRiskPredictions = riskPredictions.filter(
              (row: any) => {
                const level = String(
                  row?.riskLevel || row?.risk || row?.severity || "",
                ).toLowerCase();
                const score = readNumber(row, [
                  "riskScore",
                  "score",
                  "overallRiskScore",
                ]);

  return (
                  level === "high" ||
                  level === "critical" ||
                  (score !== null && score >= 70)
                );
              },
            ).length;

            const populations: number[] = vulnerabilityAssessments
              .map((row: any) =>
                readNumber(row, [
                  "affectedPopulation",
                  "population",
                  "populationAtRisk",
                  "exposedPopulation",
                  "estimatedPopulation",
                ]),
              )
              .filter(
                (value: number | null): value is number =>
                  value !== null,
              );

            const vulnerabilityScores: number[] =
              vulnerabilityAssessments
                .map((row: any) =>
                  readNumber(row, [
                    "vulnerabilityScore",
                    "vulnerability",
                    "vulnerabilityPercentage",
                    "vulnerabilityPercent",
                  ]),
                )
                .filter(
                  (value: number | null): value is number =>
                    value !== null,
                );

            const impactScores: number[] = vulnerabilityAssessments
              .map((row: any) =>
                readNumber(row, [
                  "impactScore",
                  "impact",
                  "impactPercentage",
                  "impactPercent",
                ]),
              )
              .filter(
                (value: number | null): value is number =>
                  value !== null,
              );

            const totalAffectedPopulation =
              populations.length > 0
                ? populations.reduce(
                    (sum, value) => sum + value,
                    0,
                  )
                : null;

            const avgVulnerability =
              vulnerabilityScores.length > 0
                ? vulnerabilityScores.reduce(
                    (sum, value) => sum + value,
                    0,
                  ) / vulnerabilityScores.length
                : null;

            const avgImpact =
              impactScores.length > 0
                ? impactScores.reduce(
                    (sum, value) => sum + value,
                    0,
                  ) / impactScores.length
                : null;

            const totalResourceStock = reliefResources.reduce(
              (sum: number, row: any) => {
                const value = readNumber(row, [
                  "totalQuantity",
                  "total",
                  "quantity",
                  "stockQuantity",
                ]);
                return sum + (value ?? 0);
              },
              0,
            );

            const allocatedResourceStock = reliefResources.reduce(
              (sum: number, row: any) => {
                const value = readNumber(row, [
                  "allocatedQuantity",
                  "allocated",
                  "allocatedStock",
                ]);
                return sum + (value ?? 0);
              },
              0,
            );

            const availableResourceStock = reliefResources.reduce(
              (sum: number, row: any) => {
                const direct = readNumber(row, [
                  "availableQuantity",
                  "available",
                  "availableStock",
                ]);

                if (direct !== null) return sum + direct;

                const total = readNumber(row, [
                  "totalQuantity",
                  "total",
                  "quantity",
                  "stockQuantity",
                ]);
                const allocated = readNumber(row, [
                  "allocatedQuantity",
                  "allocated",
                  "allocatedStock",
                ]);

  return (
                  sum +
                  Math.max(
                    (total ?? 0) - (allocated ?? 0),
                    0,
                  )
                );
              },
              0,
            );

            const activeAlertCount = emergencyAlerts.filter(
              (row: any) => {
                const status = String(
                  row?.status || "",
                ).toLowerCase();

  return (
                  row?.isActive === true ||
                  status === "active" ||
                  !status
                );
              },
            ).length;

            const criticalAlertCount = emergencyAlerts.filter(
              (row: any) =>
                String(row?.severity || "").toLowerCase() ===
                "critical",
            ).length;

            const highAlertCount = emergencyAlerts.filter(
              (row: any) =>
                String(row?.severity || "").toLowerCase() ===
                "high",
            ).length;

            const cards = [
              {
                id: "agent-01",
                short: "01",
                title: "Risk Prediction",
                subtitle: "Risk intelligence",
                icon: <RiskIcon />,
                iconBox: "bg-blue-50 text-blue-600",
                border: "border-blue-100",
                soft: "bg-blue-50/45",
                status:
                  agentStatuses.find(
                    (agent) =>
                      agent.name === "Risk Prediction Agent",
                  )?.status || "Ready",
                primaryLabel: "Predictions",
                primaryValue: riskPredictions.length,
                secondaryLabel: "Avg risk",
                secondaryValue:
                  predictionAverage === null
                    ? "N/A"
                    : predictionAverage.toFixed(1),
                foot:
                  highRiskPredictions > 0
                    ? `${highRiskPredictions} high / critical`
                    : "No high-risk predictions",
                latest: latestByDate(riskPredictions),
              },
              {
                id: "agent-02",
                short: "02",
                title: "Vulnerability & Impact",
                subtitle: "Community exposure",
                icon: <ImpactIcon />,
                iconBox: "bg-violet-50 text-violet-600",
                border: "border-violet-100",
                soft: "bg-violet-50/45",
                status:
                  agentStatuses.find(
                    (agent) =>
                      agent.name ===
                      "Vulnerability & Impact Agent",
                  )?.status || "Ready",
                primaryLabel: "Assessments",
                primaryValue:
                  vulnerabilityAssessments.length,
                secondaryLabel: "Population",
                secondaryValue:
                  totalAffectedPopulation === null
                    ? "N/A"
                    : totalAffectedPopulation.toLocaleString(),
                foot:
                  avgVulnerability !== null ||
                  avgImpact !== null
                    ? `${avgVulnerability === null ? "N/A" : `${avgVulnerability.toFixed(1)}%`} vulnerability  ${avgImpact === null ? "N/A" : `${avgImpact.toFixed(1)}%`} impact`
                    : "No impact summary",
                latest: latestByDate(
                  vulnerabilityAssessments,
                ),
              },
              {
                id: "agent-03",
                short: "03",
                title: "Resource Optimization",
                subtitle: "Relief capacity",
                icon: <ResourceIcon />,
                iconBox: "bg-emerald-50 text-emerald-600",
                border: "border-emerald-100",
                soft: "bg-emerald-50/45",
                status:
                  agentStatuses.find(
                    (agent) =>
                      agent.name ===
                      "Resource Optimization Agent",
                  )?.status || "Ready",
                primaryLabel: "Resource records",
                primaryValue: reliefResources.length,
                secondaryLabel: "Available",
                secondaryValue:
                  reliefResources.length === 0
                    ? "N/A"
                    : availableResourceStock.toLocaleString(),
                foot:
                  reliefResources.length > 0
                    ? `${allocatedResourceStock.toLocaleString()} allocated  ${totalResourceStock.toLocaleString()} total`
                    : "No resource inventory",
                latest: latestByDate(
                  reliefResources,
                ),
              },
              {
                id: "agent-04",
                short: "04",
                title: "Early Warning & Coordination",
                subtitle: "Coordination operations",
                icon: <AlertIcon />,
                iconBox: "bg-red-50 text-red-600",
                border: "border-red-100",
                soft: "bg-red-50/45",
                status:
                  agentStatuses.find(
                    (agent) =>
                      agent.name ===
                      "Early Warning & Coordination Agent",
                  )?.status || "Ready",
                primaryLabel: "Active alerts",
                primaryValue: activeAlertCount,
                secondaryLabel: "Total alerts",
                secondaryValue: emergencyAlerts.length,
                foot:
                  criticalAlertCount || highAlertCount
                    ? `${criticalAlertCount} critical  ${highAlertCount} high`
                    : "No high-priority alerts",
                latest: latestByDate(
                  emergencyAlerts,
                ),
              },
            ];

  return (
              <div className="grid gap-3 sm:grid-cols-2">
                {cards.map((card) => {
                  const normalizedStatus =
                    String(card.status).toLowerCase();

                  const statusClass =
                    normalizedStatus === "offline"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : normalizedStatus === "running"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700";

                  const latestDate =
                    card.latest?.createdAt ||
                    card.latest?.updatedAt ||
                    card.latest?.completedAt ||
                    card.latest?.startedAt;

  return (
                    <article
                      key={card.id}
                      className={`min-h-[164px] rounded-[20px] border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,.07)] ${card.border}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBox}`}
                        >
                          {card.icon}
                        </div>

                        <span className="rounded-full bg-slate-50 px-2 py-1 text-[6px] font-black uppercase tracking-[.12em] text-slate-400">
                          Agent {card.short}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-black leading-4 text-slate-900">
                              {card.title}
                            </p>
                            <p className="mt-1 text-[7px] font-medium text-slate-400">
                              {card.subtitle}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[6px] font-black uppercase ${statusClass}`}
                          >
                            {card.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div
                          className={`rounded-xl px-2.5 py-2.5 ${card.soft}`}
                        >
                          <p className="text-[6px] font-black uppercase tracking-wider text-slate-400">
                            {card.primaryLabel}
                          </p>
                          <p className="mt-1 text-[18px] font-black leading-none text-slate-900">
                            {card.primaryValue}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-2.5 py-2.5">
                          <p className="text-[6px] font-black uppercase tracking-wider text-slate-400">
                            {card.secondaryLabel}
                          </p>
                          <p className="mt-1 truncate text-[15px] font-black leading-none text-slate-900">
                            {card.secondaryValue}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="truncate text-[7px] font-bold text-slate-600">
                          {card.foot}
                        </p>

                        <p className="mt-1 truncate text-[6px] font-medium text-slate-400">
                          {latestDate
                            ? `Latest ${formatDate(latestDate)}`
                            : "No recent record"}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            );
          })()}
        </DashboardCard>

      </div>

      {/* INCIDENTS + SYSTEM HEALTH */}
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <DashboardCard
          title="Recent Incidents"
          subtitle="Latest disaster reports requiring administrator awareness"
          action={
            <button
              type="button"
              onClick={() => onNavigate("disaster-reports")}
              className="text-[9px] font-black text-blue-600"
            >
              Open Reports
            </button>
          }
        >
          {recentIncidents.length === 0 ? (
            <EmptyState text="No disaster reports are available yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[7px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Severity</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.map((report, index) => {
                    const severity = normalize(report.severity);
                    const severityClass =
                      severity === "critical"
                        ? "bg-red-50 text-red-700"
                        : severity === "high"
                          ? "bg-orange-50 text-orange-700"
                          : severity === "medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700";
                    const normalizedStatus = normalize(report.status);
                    const statusClass = [
                      "resolved",
                      "closed",
                      "completed",
                      "complete",
                    ].includes(normalizedStatus)
                      ? "bg-emerald-50 text-emerald-700"
                      : ["active", "open", "critical"].includes(normalizedStatus)
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700";

  return (
                      <tr key={report.id || `incident-${index}`} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-3">
                          <p className="max-w-[180px] truncate text-[9px] font-black text-slate-700">{report.location || "Unknown location"}</p>
                          <p className="mt-0.5 text-[7px] text-slate-400">{formatDate(report.createdAt)}</p>
                        </td>
                        <td className="px-3 py-3 text-[8px] font-semibold text-slate-500">{report.disasterType || "N/A"}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[7px] font-black capitalize ${severityClass}`}>{report.severity || "Unknown"}</span></td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[7px] font-black capitalize ${statusClass}`}>{report.status || "Unknown"}</span></td>
                        <td className="px-3 py-3 text-[9px] font-black text-slate-700">{report.riskScore != null ? report.riskScore : "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="System Health"
          subtitle="Core platform service readiness"
          action={
            <button
              type="button"
              onClick={() => onNavigate("monitoring")}
              className="text-[9px] font-black text-blue-600"
            >
              View Details
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {healthItems.map((item) => {
              const state = healthState(item.value);
              const circumference = 2 * Math.PI * 26;
              const dash = (state.percent / 100) * circumference;

  return (
                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-500">{item.label}</span>
                    <span className={`h-2 w-2 rounded-full ${state.label === "Healthy" ? "bg-emerald-400" : state.label === "Warning" ? "bg-amber-400" : state.label === "Critical" ? "bg-red-400" : "bg-slate-300"}`} />
                  </div>
                  <div className="relative mx-auto mt-3 h-16 w-16">
                    <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#e5ebf2" strokeWidth="6" />
                      <circle cx="32" cy="32" r="26" fill="none" stroke={state.ring} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">
                      {typeof item.value === "number" ? `${Math.round(item.value)}%` : "N/A"}
                    </div>
                  </div>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[6px] font-black ${state.label === "Healthy" ? "bg-emerald-50 text-emerald-700" : state.label === "Warning" ? "bg-amber-50 text-amber-700" : state.label === "Critical" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                    {state.label}
                  </span>
                </div>
              );
            })}
          </div>
        </DashboardCard>
      </div>

      {/* ONLY THE MOST USEFUL ANALYTICS */}
      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardCard
          title="Risk Score Trend"
          subtitle="Average reported risk score over the last six months"
        >
          {riskTrend.every((item) => item.average === null) ? (
            <EmptyState text="Risk-score history is not available yet." />
          ) : (
            <div className="rounded-2xl bg-slate-50/70 p-3">
              <svg viewBox="0 0 620 250" className="h-[235px] w-full" role="img" aria-label="Average risk score trend">
                {[0, 25, 50, 75, 100].map((tick) => {
                  const y = 205 - (tick / 100) * 165;

  return (
                    <g key={tick}>
                      <line x1="48" x2="590" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />
                      <text x="37" y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#94a3b8">{tick}</text>
                    </g>
                  );
                })}
                {riskTrend.map((item, index) => {
                  const x = 65 + (index / Math.max(riskTrend.length - 1, 1)) * 500;
                  const y = item.average == null ? null : 205 - (item.average / 100) * 165;
                  const previous = riskTrend[index - 1];
                  const previousY = previous?.average == null ? null : 205 - (previous.average / 100) * 165;

  return (
                    <g key={`${item.label}-${index}`}>
                      {previousY !== null && y !== null && (
                        <line
                          x1={65 + ((index - 1) / Math.max(riskTrend.length - 1, 1)) * 500}
                          y1={previousY}
                          x2={x}
                          y2={y}
                          stroke="#2563eb"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      )}
                      {y !== null && (
                        <>
                          <circle cx={x} cy={y} r="8" fill="#dbeafe" />
                          <circle cx={x} cy={y} r="4.5" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                          <text x={x} y={y - 15} textAnchor="middle" fontSize="10" fontWeight="900" fill="#1d4ed8">{item.average}</text>
                        </>
                      )}
                      <text x={x} y="232" textAnchor="middle" fontSize="10" fontWeight="800" fill="#94a3b8">{item.label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Incident Severity"
          subtitle="Current distribution of reported incidents"
        >
          {severityTotal === 0 ? (
            <EmptyState text="No severity data is available yet." />
          ) : (
            <div className="grid min-h-[235px] grid-cols-2 gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
              <div
                className="relative mx-auto h-40 w-40 rounded-full"
                style={{
                  background: (() => {
                    let cursor = 0;
                    const colors: Record<string, string> = {
                      critical: "#ef4444",
                      high: "#f97316",
                      medium: "#facc15",
                      low: "#10b981",
                    };
                    const parts = severityItems.map((item) => {
                      const start = cursor;
                      cursor += (item.count / severityTotal) * 360;
                      return `${colors[item.key]} ${start}deg ${cursor}deg`;
                    });
                    return `conic-gradient(${parts.join(",")})`;
                  })(),
                }}
              >
                <div className="absolute inset-[23px] flex flex-col items-center justify-center rounded-full bg-white shadow-sm">
                  <span className="text-3xl font-black text-slate-950">{severityTotal}</span>
                  <span className="text-[7px] font-black uppercase tracking-[.16em] text-slate-400">Incidents</span>
                </div>
              </div>

              <div className="space-y-3">
                {severityItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-[9px] font-bold text-slate-600">{item.label}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-800">
                      {item.count}
                      <span className="ml-1 font-medium text-slate-400">({Math.round((item.count / severityTotal) * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* PENDING ADMIN WORK  SHOWN ONLY WHEN IT EXISTS */}
      {roleRequests.length > 0 && (
        <DashboardCard
          title="Pending Role Requests"
          subtitle="Administrative approvals currently waiting for action"
          action={
            <button
              type="button"
              onClick={() => onNavigate("role-requests")}
              className="text-[9px] font-black text-blue-600"
            >
              Review All
            </button>
          }
        >
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {roleRequests.slice(0, 4).map((request) => (
              <div key={request.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[9px] font-black text-amber-700">
                  {(request.fullName || request.email || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[8px] font-black text-slate-700">{request.fullName || request.email || "Unknown user"}</p>
                  <p className="mt-0.5 truncate text-[7px] text-slate-400">{roleLabel(request.role)}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[6px] font-black text-amber-700">{request.roleRequestStatus || "Pending"}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  );
};

const PermissionsSection = ({
  selectedRole,
  setSelectedRole,
  permissions,
  onToggle,
  onSave,
  actionLoading,
}: {
  selectedRole: string;
  setSelectedRole: (value: string) => void;
  permissions: string[];
  onToggle: (permission: string) => void;
  onSave: () => void;
  actionLoading: string;
}) => {
  const roleDescriptions: Record<string, string> = {
    AffectedUser: "View information, report incidents, receive alerts",
    FieldVolunteer: "Field operations, reporting, location sharing",
    ReliefCoordinator: "Manage resources, coordinate teams, approve requests",
    SystemAdministrator: "Full system access and configuration",
  };

  const permissionMeta: Record<
    string,
    { description: string; icon: ReactNode; category: string }
  > = {
    "View Risk Information": {
      description: "Access disaster risk maps and risk predictions for assigned areas.",
      icon: <RiskIcon />,
      category: "Disaster Response",
    },
    "Report Disaster": {
      description: "Create and submit disaster reports from the field.",
      icon: <AlertIcon />,
      category: "Disaster Response",
    },
    "View Emergency Alerts": {
      description: "Receive and view real-time emergency alerts and notifications.",
      icon: <AlertIcon />,
      category: "Location & Alerts",
    },
    "Share Location": {
      description: "Share real-time location with coordinators during field operations.",
      icon: <RiskIcon />,
      category: "Location & Alerts",
    },
    "Manage Relief Requests": {
      description: "Create and track relief requests for affected communities.",
      icon: <RequestIcon />,
      category: "Relief Operations",
    },
    "Manage Relief Resources": {
      description: "View and manage available relief resources and supply locations.",
      icon: <ResourceIcon />,
      category: "Relief Operations",
    },
    "Manage Users": {
      description: "Manage registered users and operational accounts.",
      icon: <UsersIcon />,
      category: "Administration & Monitoring",
    },
    "Manage Role Requests": {
      description: "Review and manage requests for operational roles.",
      icon: <RequestIcon />,
      category: "Administration & Monitoring",
    },
    "AI Agent Monitoring": {
      description: "View AI agent status, activity and operational intelligence.",
      icon: <SparkIcon />,
      category: "Administration & Monitoring",
    },
    "Configure Permissions": {
      description: "Configure role-based access and authorization capabilities.",
      icon: <ShieldIcon />,
      category: "Administration & Monitoring",
    },
    "View Audit Logs": {
      description: "Access system audit logs for transparency and accountability.",
      icon: <AuditIcon />,
      category: "Administration & Monitoring",
    },
    "View Reports": {
      description: "Generate and review operational reports and analytics.",
      icon: <ReportIcon />,
      category: "Administration & Monitoring",
    },
  };

  const categoryDefinitions = [
    {
      name: "Disaster Response",
      description: "Core disaster reporting and field response capabilities",
      permissions: ["View Risk Information", "Report Disaster"],
      icon: <RiskIcon />,
    },
    {
      name: "Location & Alerts",
      description: "Location sharing and emergency communication",
      permissions: ["Share Location", "View Emergency Alerts"],
      icon: <AlertIcon />,
    },
    {
      name: "Relief Operations",
      description: "Resource management and operational capabilities",
      permissions: ["Manage Relief Resources", "Manage Relief Requests"],
      icon: <ResourceIcon />,
    },
    {
      name: "Administration & Monitoring",
      description: "System access, monitoring and governance capabilities",
      permissions: [
        "Manage Users",
        "Manage Role Requests",
        "AI Agent Monitoring",
        "Configure Permissions",
        "View Audit Logs",
        "View Reports",
      ],
      icon: <ShieldIcon />,
    },
  ];

  const enabledCount = permissionList.filter((permission) =>
    permissions.includes(permission)
  ).length;
  const availableCount = permissionList.length - enabledCount;
  const selectedRoleLabel = roleLabel(selectedRole);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Authorization"
        title="Permissions & Access Control"
        description="Configure role-based capabilities across the ReliefNexus response network."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,2fr)_minmax(250px,0.72fr)]">
        {/* ROLE SELECTOR */}
        <DashboardCard
          title="Select Role"
          subtitle="Choose a role to configure permissions"
        >
          <div className="space-y-2.5">
            {roles.map((role) => {
              const selected = selectedRole === role;
              const isAdmin = role === "SystemAdministrator";

  return (
                <button
                  type="button"
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition duration-200 ${
                    selected
                      ? "border-blue-300 bg-blue-50/90 shadow-sm ring-1 ring-blue-100"
                      : "border-slate-100 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : isAdmin
                          ? "bg-slate-100 text-slate-600"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {isAdmin ? <ShieldIcon /> : <UsersIcon />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[12px] font-black ${
                        selected ? "text-blue-800" : "text-slate-800"
                      }`}
                    >
                      {roleLabel(role)}
                    </span>
                    <span className="mt-1 block text-[9px] leading-4 text-slate-400">
                      {roleDescriptions[role]}
                    </span>
                  </span>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected && <CheckIcon />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-4">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <ShieldIcon />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                  Backend enforced
                </p>
                <p className="mt-1 text-[9px] leading-4 text-blue-700/80">
                  Permission changes should be enforced by the backend authorization APIs as well as the dashboard UI.
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* PERMISSION CONTROL */}
        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldIcon />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
                  Access configuration
                </p>
                <h2 className="mt-1 text-[18px] font-black tracking-tight text-slate-900">
                  {selectedRoleLabel} Permissions
                </h2>
                <p className="mt-1 text-[9px] text-slate-400">
                  Enable or disable capabilities for this operational role.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:min-w-[270px]">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-wider text-emerald-600">
                  Assigned
                </p>
                <p className="mt-1 text-xl font-black text-emerald-700">{enabledCount}</p>
                <p className="text-[8px] text-emerald-600/70">Active permissions</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-wider text-blue-600">
                  Available
                </p>
                <p className="mt-1 text-xl font-black text-blue-700">{availableCount}</p>
                <p className="text-[8px] text-blue-600/70">Additional permissions</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {categoryDefinitions.map((category) => {
              const categoryEnabled = category.permissions.filter((permission) =>
                permissions.includes(permission)
              ).length;

  return (
                <section
                  key={category.name}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        {category.icon}
                      </span>
                      <div>
                        <h3 className="text-[11px] font-black text-slate-800">
                          {category.name}
                        </h3>
                        <p className="text-[8px] text-slate-400">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[7px] font-black text-slate-500 ring-1 ring-slate-200">
                      {categoryEnabled}/{category.permissions.length} enabled
                    </span>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {category.permissions.map((permission) => {
                      const enabled = permissions.includes(permission);
                      const meta = permissionMeta[permission];

  return (
                        <button
                          type="button"
                          key={permission}
                          onClick={() => onToggle(permission)}
                          className={`group flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-left transition duration-200 ${
                            enabled
                              ? "border-blue-200 bg-white shadow-sm"
                              : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              enabled
                                ? "bg-blue-50 text-blue-600"
                                : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                            }`}
                          >
                            {meta.icon}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-[10px] font-black text-slate-800">
                              {permission}
                            </span>
                            <span className="mt-1 block text-[8px] leading-4 text-slate-400">
                              {meta.description}
                            </span>
                          </span>

                          <span
                            className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition ${
                              enabled ? "bg-blue-600" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                enabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <ShieldIcon />
              </span>
              <div>
                <p className="text-[10px] font-black text-blue-800">
                  Authorization changes are backend controlled
                </p>
                <p className="mt-1 text-[8px] leading-4 text-blue-700/70">
                  Saving these permissions updates the configured role access through the existing API integration.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSave}
              disabled={actionLoading === "permissions"}
              className="inline-flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-[10px] font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === "permissions" ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ACCESS SUMMARY */}
        <DashboardCard
          title="Access Summary"
          subtitle={`What ${selectedRoleLabel} can currently do`}
        >
          <div className="space-y-2">
            {permissionList.map((permission) => {
              const enabled = permissions.includes(permission);
              const meta = permissionMeta[permission];

  return (
                <div
                  key={permission}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                    enabled
                      ? "border-emerald-100 bg-emerald-50/70"
                      : "border-slate-100 bg-slate-50/60"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      enabled
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {enabled ? <CheckIcon /> : meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[9px] font-black ${
                        enabled ? "text-slate-800" : "text-slate-500"
                      }`}
                    >
                      {permission}
                    </p>
                    <p className="truncate text-[7px] text-slate-400">
                      {enabled ? "Access enabled for this role" : "Not enabled for this role"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                <SparkIcon />
              </span>
              <div>
                <p className="text-[9px] font-black text-blue-800">Operational access note</p>
                <p className="mt-1 text-[8px] leading-4 text-blue-700/70">
                  Changes are enforced by backend authorization APIs and take effect for users assigned to this role.
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};
const AIAgentMonitoringSection = ({
  executions,
  agentStatuses,
}: {
  executions: any[];
  agentStatuses: AgentStatus[];
}) => {
  const [range, setRange] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const allExecutions = Array.isArray(executions) ? executions : [];

  const getTimestamp = (item: any) =>
    item?.startedAt ||
    item?.createdAt ||
    item?.created_at ||
    item?.timestamp ||
    null;

  const getEndTimestamp = (item: any) =>
    item?.completedAt ||
    item?.finishedAt ||
    item?.updatedAt ||
    item?.completed_at ||
    null;

  const getTokens = (item: any) => {
    const direct =
      item?.totalTokens ??
      item?.tokens ??
      item?.tokenUsage?.total ??
      item?.usage?.totalTokens;

    if (typeof direct === "number") return direct;

    const input = Number(
      item?.inputTokens ??
        item?.inputTokenCount ??
        item?.tokenUsage?.input ??
        item?.usage?.promptTokens ??
        0
    );

    const output = Number(
      item?.outputTokens ??
        item?.outputTokenCount ??
        item?.tokenUsage?.output ??
        item?.usage?.completionTokens ??
        0
    );

    return input + output;
  };

  const getLatencySeconds = (item: any) => {
    const startValue = getTimestamp(item);
    const endValue = getEndTimestamp(item);

    if (!startValue || !endValue) return null;

    const startTime = new Date(startValue).getTime();
    const endTime = new Date(endValue).getTime();

    if (
      Number.isNaN(startTime) ||
      Number.isNaN(endTime) ||
      endTime < startTime
    ) {
      return null;
    }

  return (endTime - startTime) / 1000;
  };

  const getRetryCount = (item: any) => {
    const value =
      item?.retryCount ??
      item?.retries ??
      item?.retry_count ??
      0;

    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : 0;
  };

  const getCost = (item: any) => {
    const value =
      item?.cost ??
      item?.costUsd ??
      item?.estimatedCost ??
      item?.estimatedCostUsd ??
      item?.tokenCost;

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    return null;
  };

  const formatNumber = (value: number) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });

  const formatPercent = (value: number) =>
    `${value.toFixed(2)}%`;

  const formatSeconds = (value: number | null) => {
    if (value == null || !Number.isFinite(value)) {
      return "Not reported";
    }

    if (value < 1) {
      return `${value.toFixed(2)} s`;
    }

    return `${value.toFixed(1)} s`;
  };

  const median = (values: number[]) => {
    if (!values.length) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {

  return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  };

  const percentile = (values: number[], percentileValue: number) => {
    if (!values.length) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentileValue / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) return sorted[lower];

  return (
      sorted[lower] +
      (sorted[upper] - sorted[lower]) * (index - lower)
    );
  };

  const filteredExecutions = useMemo(() => {
    if (range === "all" && !fromDate && !toDate) {
      return allExecutions;
    }

    const now = new Date();

    let startBoundary: number | null = null;
    let endBoundary: number | null = null;

    if (range === "24h") {
      startBoundary = now.getTime() - 24 * 60 * 60 * 1000;
    }

    if (range === "7d") {
      startBoundary = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    }

    if (range === "30d") {
      startBoundary = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    }

    if (fromDate) {
      const parsed = new Date(`${fromDate}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        startBoundary = parsed.getTime();
      }
    }

    if (toDate) {
      const parsed = new Date(`${toDate}T23:59:59`);
      if (!Number.isNaN(parsed.getTime())) {
        endBoundary = parsed.getTime();
      }
    }

    return allExecutions.filter((item) => {
      const timestamp = getTimestamp(item);
      if (!timestamp) return false;

      const time = new Date(timestamp).getTime();

      if (Number.isNaN(time)) return false;
      if (startBoundary != null && time < startBoundary) return false;
      if (endBoundary != null && time > endBoundary) return false;

      return true;
    });
  }, [allExecutions, range, fromDate, toDate]);

  const totalRuns = filteredExecutions.length;

  const successfulRuns = filteredExecutions.filter(
    (item) =>
      String(item?.status || "").toLowerCase() === "completed"
  ).length;

  const failedRuns = filteredExecutions.filter(
    (item) =>
      String(item?.status || "").toLowerCase() === "failed"
  ).length;

  const runningRuns = filteredExecutions.filter(
    (item) =>
      String(item?.status || "").toLowerCase() === "running"
  ).length;

  const failedRate =
    totalRuns > 0
      ? (failedRuns / totalRuns) * 100
      : 0;

  const latencyValues = filteredExecutions
    .map(getLatencySeconds)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    );

  const medianLatency = median(latencyValues);
  const p95Latency = percentile(latencyValues, 95);

  const totalTokens = filteredExecutions.reduce(
    (total, item) => total + getTokens(item),
    0
  );

  const retriedRuns = filteredExecutions.filter(
    (item) => getRetryCount(item) > 0
  ).length;

  const recordedCosts = filteredExecutions
    .map(getCost)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    );

  const totalRecordedCost = recordedCosts.reduce(
    (total, value) => total + value,
    0
  );

  const agentRows = useMemo(() => {
    const names = [
      ...agentStatuses.map((agent) => agent.name),
      ...filteredExecutions
        .map(
          (item) =>
            item?.agentName ||
            item?.name ||
            item?.type ||
            ""
        )
        .filter(Boolean),
    ];

    const uniqueNames = Array.from(new Set(names));

    return uniqueNames.map((agentName) => {
      const rows = filteredExecutions.filter(
        (item) =>
          String(
            item?.agentName ||
              item?.name ||
              item?.type ||
              ""
          )
            .trim()
            .toLowerCase() ===
          String(agentName).trim().toLowerCase()
      );

      const statusAgent = agentStatuses.find(
        (agent) =>
          agent.name.toLowerCase() ===
          String(agentName).toLowerCase()
      );

      const runs = rows.length;

      const failed = rows.filter(
        (item) =>
          String(item?.status || "").toLowerCase() ===
          "failed"
      ).length;

      const completed = rows.filter(
        (item) =>
          String(item?.status || "").toLowerCase() ===
          "completed"
      ).length;

      const retryCount = rows.reduce(
        (total, item) => total + getRetryCount(item),
        0
      );

      const latencies = rows
        .map(getLatencySeconds)
        .filter(
          (value): value is number =>
            typeof value === "number" &&
            Number.isFinite(value)
        );

      const tokens = rows.reduce(
        (total, item) => total + getTokens(item),
        0
      );

      const costs = rows
        .map(getCost)
        .filter(
          (value): value is number =>
            typeof value === "number" &&
            Number.isFinite(value)
        );

      return {
        name: agentName,
        description:
          statusAgent?.description ||
          "AI agent execution activity",
        icon: statusAgent?.icon,
        status: statusAgent?.status || "Unknown",
        confidence: statusAgent?.confidence ?? null,
        runs,
        failed,
        completed,
        failedRate:
          runs > 0 ? (failed / runs) * 100 : 0,
        retryCount,
        medianLatency: median(latencies),
        p95Latency: percentile(latencies, 95),
        averageTokens:
          runs > 0 ? Math.round(tokens / runs) : 0,
        totalTokens: tokens,
        totalCost:
          costs.length > 0
            ? costs.reduce((a, b) => a + b, 0)
            : null,
      };
    });
  }, [filteredExecutions, agentStatuses]);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[28px] bg-[#081b35] px-7 py-7 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-500/20 to-transparent" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">
              AI Operations
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Agent Monitoring
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Detailed execution monitoring for the ReliefNexus
              multi-agent AI workflow, including failures, retries,
              latency and token usage.
            </p>

            <p className="mt-2 text-[10px] text-slate-400">
              Showing all available execution records using UTC
              timestamps where provided.
            </p>
          </div>

          {/* DATE FILTER */}
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["all", "All time"],
                ["24h", "24 hours"],
                ["7d", "7 days"],
                ["30d", "30 days"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRange(value);
                    setFromDate("");
                    setToDate("");
                  }}
                  className={`rounded-lg px-3 py-2 text-[10px] font-bold ${
                    range === value && !fromDate && !toDate
                      ? "bg-white text-slate-900"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setRange("");
                }}
                className="rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-[10px] text-white outline-none"
              />

              <span className="text-[10px] text-slate-400">
                to
              </span>

              <input
                type="date"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setRange("");
                }}
                className="rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-[10px] text-white outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Agent Runs
            </p>
          </div>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {formatNumber(totalRuns)}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {successfulRuns} succeeded
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Failed
            </p>
          </div>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {formatPercent(failedRate)}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {failedRuns} of {totalRuns} runs
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Median Latency
            </p>
          </div>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {formatSeconds(medianLatency)}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            P95 {formatSeconds(p95Latency)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Tokens Reported
            </p>
          </div>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {formatNumber(totalTokens)}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {recordedCosts.length > 0
              ? `Recorded cost $${totalRecordedCost.toFixed(6)}`
              : "Cost not reported"}
          </p>
        </div>
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Running
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {runningRuns}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Currently active executions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Retried
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {retriedRuns}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Executions with retry information
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Agents Reporting
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {agentRows.filter((agent) => agent.runs > 0).length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Agents with recorded runs
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Latency Samples
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {latencyValues.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Executions with timestamps
          </p>
        </div>
      </div>

      {/* PER AGENT */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
            Per Agent
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            Agent Execution Performance
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Detailed operational metrics calculated from recorded
            execution data.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-xs">

            <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-4">Agent</th>
                <th className="px-4 py-4">Runs</th>
                <th className="px-4 py-4">Failed</th>
                <th className="px-4 py-4">Retried</th>
                <th className="px-4 py-4">Median</th>
                <th className="px-4 py-4">P95</th>
                <th className="px-4 py-4">Avg Tokens</th>
                <th className="px-4 py-4">Total Tokens</th>
                <th className="px-4 py-4">Est. Cost</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {agentRows.map((agent) => (
                <tr
                  key={agent.name}
                  className="hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                        {agent.icon}
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">
                          {agent.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {agent.description}
                        </p>
                      </div>

                    </div>
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900">
                    {agent.runs}
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-900">
                      {agent.failed}
                    </p>

                    <p className="text-[10px] text-red-500">
                      {formatPercent(agent.failedRate)}
                    </p>
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-700">
                    {agent.retryCount}
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {formatSeconds(agent.medianLatency)}
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {formatSeconds(agent.p95Latency)}
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-700">
                    {agent.runs > 0
                      ? formatNumber(agent.averageTokens)
                      : "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÂ¢ÃƒÆ’Â¢ÃƒÂ¢Ã¢â‚¬Å¡Â¬Ãƒâ€¦Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÂ¬ÃƒÆ’Ã†â€™Ãƒâ€šÂ¢ÃƒÆ’Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÂ¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÂ"}
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-700">
                    {formatNumber(agent.totalTokens)}
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-700">
                    {agent.totalCost != null
                      ? `$${agent.totalCost.toFixed(6)}`
                      : "Not reported"}
                  </td>
                </tr>
              ))}

              {agentRows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No agent execution data is available for
                    the selected period.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* EXECUTION STATUS */}
      <div className="grid gap-5 lg:grid-cols-3">

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
            Successful
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-900">
            {successfulRuns}
          </p>

          <p className="mt-1 text-xs text-emerald-700">
            Completed executions
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <p className="text-[9px] font-black uppercase tracking-wider text-red-700">
            Failed
          </p>

          <p className="mt-2 text-3xl font-black text-red-900">
            {failedRuns}
          </p>

          <p className="mt-1 text-xs text-red-700">
            Failed executions requiring attention
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-[9px] font-black uppercase tracking-wider text-blue-700">
            Active
          </p>

          <p className="mt-2 text-3xl font-black text-blue-900">
            {runningRuns}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            Currently running executions
          </p>
        </div>

      </div>

      {/* RECENT EXECUTIONS */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
            Recent Activity
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            Latest Agent Executions
          </h2>
        </div>

        <div className="divide-y divide-slate-100">

          {filteredExecutions
            .slice()
            .sort(
              (a, b) =>
                new Date(getTimestamp(b) || 0).getTime() -
                new Date(getTimestamp(a) || 0).getTime()
            )
            .slice(0, 10)
            .map((execution, index) => {

              const status = String(
                execution?.status || "Unknown"
              );

              const normalizedStatus =
                status.toLowerCase();

              const latency =
                getLatencySeconds(execution);

  return (
                <div
                  key={
                    execution?.id ||
                    execution?.workflowId ||
                    `${getTimestamp(execution)}-${index}`
                  }
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 xl:flex-row xl:items-center xl:justify-between"
                >

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">

                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          normalizedStatus === "completed"
                            ? "bg-emerald-500"
                            : normalizedStatus === "failed"
                              ? "bg-red-500"
                              : "bg-blue-500"
                        }`}
                      />

                      <p className="truncate text-sm font-black text-slate-900">
                        {execution?.agentName ||
                          execution?.name ||
                          execution?.type ||
                          "AI Agent Execution"}
                      </p>

                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-slate-400">

                      <span>
                        Workflow:{" "}
                        {execution?.workflowId ||
                          "Not recorded"}
                      </span>

                      <span>
                        Started:{" "}
                        {formatDate(
                          getTimestamp(execution) ||
                            undefined
                        )}
                      </span>

                      <span>
                        Tokens:{" "}
                        {formatNumber(
                          getTokens(execution)
                        )}
                      </span>

                      <span>
                        Latency:{" "}
                        {formatSeconds(latency)}
                      </span>

                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">

                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                        normalizedStatus === "completed"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : normalizedStatus === "failed"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {status}
                    </span>

                    {execution?.approvalStatus && (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700">
                        Approval:{" "}
                        {execution.approvalStatus}
                      </span>
                    )}

                  </div>

                </div>
              );
            })}

          {filteredExecutions.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-slate-600">
                No execution records found.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try another date range or run an AI agent.
              </p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
const AIAuditTrailSection = ({
  executions,
}: {
  executions: any[];
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const orderedExecutions = useMemo(() => {
    return executions
      .slice()
      .sort(
        (a, b) =>
          new Date(
            b?.startedAt ||
              b?.createdAt ||
              0
          ).getTime() -
          new Date(
            a?.startedAt ||
              a?.createdAt ||
              0
          ).getTime()
      );
  }, [executions]);

  const getSteps = (execution: any) => {
    const completed = String(
      execution?.completedSteps || ""
    );

    const toolResults = String(
      execution?.toolResults || ""
    );

    const combined = [
      ...completed
        .split(/\s*(?:\?|->|;|\n)\s*/)
        .map((value) => value.trim())
        .filter(Boolean),
      ...toolResults
        .split(/\s*(?:;|\n)\s*/)
        .map((value) => value.trim())
        .filter(Boolean),
    ];

    return Array.from(new Set(combined));
  };

  const getStatusStyle = (status: string) => {
    const normalized = status.toLowerCase();

    if (normalized === "completed") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (normalized === "failed") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (
      normalized === "pending" ||
      normalized === "needsapproval" ||
      normalized === "needs approval"
    ) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-blue-200 bg-blue-50 text-blue-700";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* HEADER */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">
              AI Governance
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              AI Execution Audit Trail
            </h2>

            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              Detailed traceability of AI agent executions,
              workflow steps, tool results, approvals and
              final outcomes.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Recorded Executions
            </p>

            <p className="mt-1 text-xl font-black text-slate-900">
              {executions.length}
            </p>
          </div>

        </div>
      </div>

      {/* TIMELINE */}
      <div className="p-6">

        {orderedExecutions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-sm font-bold text-slate-600">
              No AI execution audit records available.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Recorded agent executions will appear here.
            </p>
          </div>
        ) : (
          <div className="relative">

            {/* TIMELINE LINE */}
            <div className="absolute bottom-5 left-[15px] top-5 w-px bg-slate-200" />

            <div className="space-y-5">

              {orderedExecutions.map(
                (execution, index) => {
                  const key =
                    execution?.id ||
                    execution?.workflowId ||
                    `${execution?.startedAt}-${index}`;

                  const isOpen =
                    expanded === key;

                  const status = String(
                    execution?.status ||
                      "Unknown"
                  );

                  const steps =
                    getSteps(execution);

                  const agentName =
                    execution?.agentName ||
                    execution?.name ||
                    execution?.type ||
                    "AI Agent";

  return (
                    <div
                      key={key}
                      className="relative pl-10"
                    >

                      {/* TIMELINE NODE */}
                      <div
                        className={`absolute left-[8px] top-5 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                          status.toLowerCase() ===
                          "failed"
                            ? "bg-red-500"
                            : status.toLowerCase() ===
                                "completed"
                              ? "bg-emerald-500"
                              : "bg-violet-500"
                        }`}
                      />

                      {/* EXECUTION CARD */}
                      <div className="rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm">

                        <div className="p-5">

                          {/* TOP ROW */}
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[9px] font-black text-violet-700">
                                  AGENT RUN
                                </span>

                                <h3 className="text-sm font-black text-slate-950">
                                  {agentName}
                                </h3>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${getStatusStyle(status)}`}
                                >
                                  {status}
                                </span>

                              </div>

                              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-slate-400">

                                <span>
                                  Workflow:{" "}
                                  <strong className="text-slate-600">
                                    {execution?.workflowId ||
                                      "Not recorded"}
                                  </strong>
                                </span>

                                <span>
                                  Started:{" "}
                                  {formatDate(
                                    execution?.startedAt ||
                                      execution?.createdAt
                                  )}
                                </span>

                                {execution?.currentStep && (
                                  <span>
                                    Current step:{" "}
                                    <strong className="text-slate-600">
                                      {execution.currentStep}
                                    </strong>
                                  </span>
                                )}

                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setExpanded(
                                  isOpen
                                    ? null
                                    : key
                                )
                              }
                              className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-600 hover:bg-slate-100"
                            >
                              {isOpen
                                ? "Hide details"
                                : "Show raw"}
                            </button>

                          </div>

                          {/* EXECUTION STEPS */}
                          {steps.length > 0 && (
                            <div className="mt-5 border-t border-slate-100 pt-4">

                              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                                Execution Trace
                              </p>

                              <div className="mt-3 space-y-2">

                                {steps.slice(0, 10).map(
                                  (step, stepIndex) => (
                                    <div
                                      key={`${key}-step-${stepIndex}`}
                                      className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3"
                                    >

                                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-black text-violet-700">
                                        {stepIndex + 1}
                                      </span>

                                      <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                          Step
                                        </p>

                                        <p className="mt-0.5 text-xs leading-5 text-slate-700">
                                          {step}
                                        </p>
                                      </div>

                                    </div>
                                  )
                                )}

                              </div>

                            </div>
                          )}

                          {/* APPROVAL */}
                          <div className="mt-4 flex flex-wrap items-center gap-3">

                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                              Approval
                            </span>

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-700">
                              {execution?.approvalStatus ||
                                "NotRequired"}
                            </span>

                            {execution?.approvalUser && (
                              <span className="text-[10px] text-slate-500">
                                By{" "}
                                {execution.approvalUser}
                              </span>
                            )}

                          </div>

                          {/* EXPANDED RAW DETAILS */}
                          {isOpen && (
                            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">

                              <div className="grid gap-4 md:grid-cols-2">

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">
                                    Input
                                  </p>

                                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-600">
                                    {execution?.inputSummary ||
                                      "No input summary recorded."}
                                  </pre>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                    Output
                                  </p>

                                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-600">
                                    {execution?.outputSummary ||
                                      "No output summary recorded."}
                                  </pre>
                                </div>

                              </div>

                              <div className="grid gap-4 md:grid-cols-2">

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                                    Validation
                                  </p>

                                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-emerald-900">
                                    {execution?.validationResults ||
                                      "No validation results recorded."}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-red-700">
                                    Error
                                  </p>

                                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-red-900">
                                    {execution?.errorMessage ||
                                      "No errors recorded."}
                                  </p>
                                </div>

                              </div>

                              <div className="rounded-xl border border-slate-200 bg-slate-950 p-4">

                                <div className="flex items-center justify-between">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-violet-300">
                                    Raw Execution Record
                                  </p>

                                  <span className="rounded bg-white/10 px-2 py-1 text-[8px] font-bold text-slate-400">
                                    AUDIT DATA
                                  </span>
                                </div>

                                <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-300">
                                  {JSON.stringify(
                                    execution,
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
                }
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
const MonitoringSection = ({ systemHealth }: { systemHealth: SystemHealth | null }) => (
  <SystemMonitoringModule
    data={systemHealth}
    loading={!systemHealth}
  />
);

const AuditLogsSection = ({ logs }: { logs: AuditLog[] }) => (
  <AuditLogsModule logs={logs} loading={false} />
);

const ReportsSection = ({ summary }: { summary: ReportSummary }) => (
  <SystemReportsModule summary={summary} />
);

const SettingsSection = ({
  settings,
  setSettings,
  onSave,
}: {
  settings: {
    maintenanceMode: boolean;
    emailNotifications: boolean;
    aiApprovalRequired: boolean;
    auditLogging: boolean;
  };
  setSettings: Dispatch<
    SetStateAction<{
      maintenanceMode: boolean;
      emailNotifications: boolean;
      aiApprovalRequired: boolean;
      auditLogging: boolean;
    }>
  >;
  onSave: () => void;
}) => (
  <SystemSettingsModule
    initial={{
      ...settings,
      locationSharing: true,
      autoBackup: true,
    } satisfies SystemSettingsValue}
    onSave={async (next: any) => {
      const { maintenanceMode, emailNotifications, aiApprovalRequired, auditLogging } = next;
      setSettings({
        maintenanceMode,
        emailNotifications,
        aiApprovalRequired,
        auditLogging,
      });
      onSave();
    }}
  />
);

const ProfileSection = ({
  onLogout,
  profile,
}: {
  user: UserRecord | null;
  onLogout: () => void;
  profile?: AdminProfile;
}) => (
  <AdminProfileModule
    profile={profile}
    onLogout={onLogout}
  />
);

const PageHeading = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <div>
    <div className="mb-3 flex items-center gap-3">
      <span className="h-px w-8 bg-blue-600" />
      <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-blue-600">
        {eyebrow}
      </span>
    </div>
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#101c35] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-right sm:block">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Administrator
        </p>
        <p className="mt-1 text-xs font-bold text-slate-700">
          Control Center
        </p>
      </div>
    </div>
  </div>
);
const DashboardCard = ({
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onAction?: () => void;
  children: ReactNode;
}) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,39,70,0.045)] sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-extrabold text-[#101c35]">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
      {action && (
  typeof action === "string" ? (
    <button
      type="button"
      onClick={onAction}
      className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700"
    >
      {action}
    </button>
  ) : (
    <div className="shrink-0">
      {action}
    </div>
  )
)}
    </div>
    {children}
  </section>
);
const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">
    {text}
  </div>
);

export default SystemAdministratorDashboard;




















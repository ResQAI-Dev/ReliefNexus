import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

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

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M7 17 17 7M9 7h8v8" />
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
  | "role-requests"
  | "permissions"
  | "ai-agents"
  | "monitoring"
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
  createdAt?: string;
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
};

const agentStatuses: AgentStatus[] = [];

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
  { id: "ai-agents", label: "AI Agent Management", icon: <SparkIcon /> },
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
  "Emergency Alerts",
  "Risk Information",
  "Relief Resources",
  "Location Sharing",
  "User Profiles",
];

const aiAgentManagementItems = [
  "Risk Prediction",
  "Vulnerability & Impact",
  "Resource Optimization",
  "Early Warning & Coordination",
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
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/users")) setSection("users");
    else if (path.includes("/role-requests")) setSection("role-requests");
    else if (path.includes("/permissions")) setSection("permissions");
    else if (path.includes("/ai-agents")) setSection("ai-agents");
    else if (path.includes("/monitoring")) setSection("monitoring");
    else if (path.includes("/audit-logs")) setSection("audit-logs");
    else if (path.includes("/reports")) setSection("reports");
    else if (path.includes("/settings")) setSection("settings");
    else if (path.includes("/profile")) setSection("profile");
    else setSection("dashboard");
  }, [location.pathname]);

  useEffect(() => {
    loadAdminData();
  }, []);

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
      api.get("/ai-agents"),
      api.get("/system-monitoring/health"),
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
        : agentsResult.value.data?.data || agentsResult.value.data?.agents || [];

      const mapped = agentDefinitions.map((definition) => {
        const match = raw.find((item: any) =>
          String(item.name || item.agentName || item.type || "")
            .toLowerCase()
            .includes(definition.name.split(" Agent")[0].toLowerCase())
        );

        return {
          ...definition,
          status:
            match?.status === "Running" ||
            match?.status === "Idle" ||
            match?.status === "Offline"
              ? match.status
              : "Unknown",
          confidence:
            typeof match?.confidence === "number"
              ? match.confidence
              : typeof match?.confidenceScore === "number"
                ? match.confidenceScore
                : null,
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
  };

  const goToSection = (nextSection: Section) => {
    setNotice("");
    setError("");
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

    if (child === "Affected Users") {
      setRoleFilter("AffectedUser");
    } else if (child === "Field Volunteers") {
      setRoleFilter("FieldVolunteer");
    } else if (child === "Relief Coordinators") {
      setRoleFilter("ReliefCoordinator");
    } else {
      setRoleFilter("All");
    }

    goToSection("users");
  };

  const handleAiModuleClick = (child: string) => {
    setAiAgentManagementOpen(true);
    setSelectedAiModule(child);
    setNotice("");
    setError("");
    goToSection("ai-agents");
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
              ? { ...item, isActive: action === "activate" }
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

  const handleRoleChange = async (target: UserRecord, role: string) => {
    const key = `role-${target.id}`;
    setActionLoading(key);
    setError("");

    try {
      await api.put(`/users/${target.id}/role`, { role });
      setUsers((current) =>
        current.map((item) =>
          item.id === target.id ? { ...item, role } : item
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
      await api.put(`/users/${request.id}/${action}`);
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
  const activeAgents = agentStatuses.filter(
    (item) => item.status === "Running"
  ).length;

  const renderContent = () => {
    switch (section) {
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

      case "ai-agents":
        return <AIAgentsSection selectedModule={selectedAiModule} />;

      case "monitoring":
        return <MonitoringSection systemHealth={systemHealth} />;

      case "audit-logs":
        return <AuditLogsSection logs={auditLogs} />;

      case "reports":
        return <ReportsSection />;

      case "settings":
        return (
          <SettingsSection
            settings={systemSettings}
            setSettings={setSystemSettings}
            onSave={() => showMessage("System settings saved locally.")}
          />
        );

      case "profile":
        return (
          <ProfileSection
            user={user}
            onLogout={handleLogout}
          />
        );

      default:
        return (
          <OverviewSection
            totalUsers={totalUsers}
            activeUsers={activeUsers}
            pendingRequests={pendingRequests}
            activeAgents={activeAgents}
            users={users}
            roleRequests={roleRequests}
            auditLogs={auditLogs}
            onNavigate={goToSection}
            loading={loading}
            systemHealth={systemHealth}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-[#101c35]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 bg-[#0b1d38] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
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
                  Safer Communities
                </div>
              </div>
            </button>
          </div>

          <div className="px-4 py-5">
            <p className="px-3 pb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Administration
            </p>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                if (item.id === "users") {
                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => setUserManagementOpen((open) => !open)}
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
                        <span className={`transition-transform ${userManagementOpen ? "rotate-180" : ""}`}>
                          <ChevronDownIcon />
                        </span>
                      </button>

                      {userManagementOpen && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                          {userManagementItems.map((child) => (
                            <button
                              key={child}
                              type="button"
                              onClick={() => handleUserModuleClick(child)}
                              className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition ${
                                selectedUserModule === child
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
                        onClick={() => setAiAgentManagementOpen((open) => !open)}
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
                        <span className={`transition-transform ${aiAgentManagementOpen ? "rotate-180" : ""}`}>
                          <ChevronDownIcon />
                        </span>
                      </button>

                      {aiAgentManagementOpen && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                          {aiAgentManagementItems.map((child) => (
                            <button
                              key={child}
                              type="button"
                              onClick={() => handleAiModuleClick(child)}
                              className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition ${
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

          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <ShieldIcon />
                </div>
                <div>
                  <p className="text-xs font-bold">Secure System</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Stronger Communities
                  </p>
                </div>
              </div>
            </div>

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

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 lg:hidden">
                <LogoIcon />
              </div>

              <div className="hidden min-w-0 w-[390px] md:flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <SearchIcon />
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search users, logs..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="md:hidden">
                <p className="text-sm font-bold">Admin Control Center</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50"
              >
                <BellIcon />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <button
                type="button"
                onClick={() => goToSection("profile")}
                className="flex items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {(user?.fullName || "Admin")
                    .split(" ")
                    .map((part) => part[0])
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

          <div className="px-5 py-7 sm:px-8 lg:px-10">
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

type OverviewProps = {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  activeAgents: number;
  users: UserRecord[];
  roleRequests: RoleRequest[];
  auditLogs: AuditLog[];
  onNavigate: (section: Section) => void;
  loading: boolean;
};

const OverviewSection = ({
  totalUsers,
  activeUsers,
  pendingRequests,
  activeAgents,
  users,
  roleRequests,
  auditLogs,
  onNavigate,
  loading,
  systemHealth,
}: OverviewProps & { systemHealth: SystemHealth | null }) => {
  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="System Administration"
        title="System Overview"
        description="Monitor system health, manage users, and keep ReliefNexus secure."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Users"
          value={loading ? "..." : totalUsers.toString()}
          detail={`${activeUsers} currently active`}
          icon={<UsersIcon />}
          tone="blue"
        />
        <MetricCard
          label="Active Volunteers"
          value={loading ? "..." : users.filter(
            (item) => item.role === "FieldVolunteer" && item.isActive
          ).length.toString()}
          detail="Field response members"
          icon={<VolunteerIcon />}
          tone="green"
        />
        <MetricCard
          label="Pending Requests"
          value={loading ? "..." : pendingRequests.toString()}
          detail="Awaiting administrator review"
          icon={<RequestIcon />}
          tone="amber"
        />
        <MetricCard
          label="AI Agents"
          value={activeAgents.toString()}
          detail={agentStatuses.length > 0 ? "Loaded from API" : "Waiting for API data"}
          icon={<SparkIcon />}
          tone="purple"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <DashboardCard
          title="AI Agent Status"
          subtitle="Real-time operational view of the four AI agents"
          action="View all"
          onAction={() => onNavigate("ai-agents")}
        >
          <div className="space-y-3">
            {agentStatuses.map((agent) => (
              <div
                key={agent.name}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    {agent.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {agent.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {agent.description}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs font-bold text-slate-500 sm:block">
                    {agent.confidence}%
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="System Health"
          subtitle="Current infrastructure indicators"
          action="Monitoring"
          onAction={() => onNavigate("monitoring")}
        >
          <div className="space-y-5">
            <HealthBar label="API Availability" value={systemHealth?.apiAvailability ?? null} />
            <HealthBar label="Database Health" value={systemHealth?.databaseHealth ?? null} />
            <HealthBar label="AI Services" value={systemHealth?.aiServices ?? null} />
            <HealthBar label="Storage" value={systemHealth?.storage ?? null} />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600">
                  <CheckIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {systemHealth ? "Live system health available" : "System health data unavailable"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {systemHealth ? "Loaded from monitoring API" : "Connect the monitoring API to display live status"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardCard
          title="Recent Role Requests"
          subtitle="Latest user access requests"
          action="View all"
          onAction={() => onNavigate("role-requests")}
        >
          {roleRequests.length === 0 ? (
            <EmptyState text="No pending role requests." />
          ) : (
            <div className="space-y-2">
              {roleRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {request.fullName || "Unknown user"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {roleLabel(request.role)} Ã¢â‚¬Â¢ {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Recent Audit Logs"
          subtitle="Latest security and administration events"
          action="View all"
          onAction={() => onNavigate("audit-logs")}
        >
          {auditLogs.length === 0 ? (
            <EmptyState text="No audit logs returned by the API." />
          ) : (
            <div className="space-y-2">
              {auditLogs.slice(0, 5).map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <AuditIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">
                      {log.action || "System activity"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {log.description || log.userEmail || "Administration event"}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
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
}) => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="Access Control"
      title="Role Requests"
      description="Review registration requests and approve the correct operational role."
    />

    <DashboardCard
      title="Pending Requests"
      subtitle={`${requests.length} requests awaiting review`}
    >
      {requests.length === 0 ? (
        <EmptyState text="There are no pending role requests." />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {(request.fullName || "User")
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {request.fullName || "Unknown user"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {request.email || "No email"}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-blue-600">
                    Requested role: {roleLabel(request.role)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actionLoading === `approve-${request.id}`}
                  onClick={() => onAction(request, "approve")}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={actionLoading === `reject-${request.id}`}
                  onClick={() => onAction(request, "reject")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  </div>
);

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
}) => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="Authorization"
      title="Permissions"
      description="Configure which capabilities each operational role can access."
    />

    <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
      <DashboardCard
        title="Select Role"
        subtitle="Permissions are configured per role"
      >
        <div className="space-y-2">
          {roles.filter((role) => role !== "SystemAdministrator").map((role) => (
            <button
              type="button"
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                selectedRole === role
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-sm font-bold">{roleLabel(role)}</span>
              {selectedRole === role && <CheckIcon />}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex gap-3">
            <ShieldIcon />
            <p className="text-xs leading-5 text-blue-700">
              Permission changes should be enforced by the backend API as
              well as the dashboard UI.
            </p>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title={`${roleLabel(selectedRole)} Permissions`}
        subtitle="Enable or disable capabilities"
        action={actionLoading === "permissions" ? "Saving..." : "Save Changes"}
        onAction={onSave}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {permissionList.map((permission) => {
            const enabled = permissions.includes(permission);

            return (
              <button
                type="button"
                key={permission}
                onClick={() => onToggle(permission)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  enabled
                    ? "border-blue-100 bg-blue-50"
                    : "border-slate-100 bg-white hover:bg-slate-50"
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    enabled ? "text-blue-700" : "text-slate-600"
                  }`}
                >
                  {permission}
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    enabled
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300"
                  }`}
                >
                  {enabled && <CheckIcon />}
                </span>
              </button>
            );
          })}
        </div>
      </DashboardCard>
    </div>
  </div>
);

const aiModuleDescription = (module: string) => {
  const descriptions: Record<string, string> = {
    "Risk Prediction": "Monitor AI-generated disaster risk scores, confidence, and risk factors.",
    "Vulnerability & Impact": "Monitor vulnerability and potential disaster impact assessments.",
    "Resource Optimization": "Monitor AI recommendations for relief resource allocation and optimization.",
    "Early Warning & Coordination": "Monitor early-warning decisions and response coordination workflows.",
  };
  return descriptions[module] || "Monitor and manage this AI agent.";
};

const AIAgentsSection = ({ selectedModule }: { selectedModule: string }) => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="AI Agent Management"
      title={selectedModule}
      description={aiModuleDescription(selectedModule)}
    />

    <div className="grid gap-4 md:grid-cols-2">
      {agentStatuses.map((agent) => (
        <DashboardCard key={agent.name} title={agent.name}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {agent.icon}
              </div>
              <div>
                <p className="text-xs text-slate-500">{agent.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">
                    {agent.status}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-xl font-extrabold text-slate-800">
              {agent.confidence}%
            </span>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${agent.confidence}%` }}
            />
          </div>

          <div className="mt-5 flex justify-between text-[10px] text-slate-400">
            <span>Operational confidence</span>
            <span>Human approval supported</span>
          </div>
        </DashboardCard>
      ))}
    </div>
  </div>
);

const healthDisplay = (value?: number) =>
  typeof value === "number" ? `${value}%` : "â€”";

const healthStatus = (value?: number) => {
  if (typeof value !== "number") return "No data";
  if (value >= 90) return "Operational";
  if (value >= 70) return "Degraded";
  return "Critical";
};

const MonitoringSection = ({ systemHealth }: { systemHealth: SystemHealth | null }) => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="Infrastructure"
      title="System Monitoring"
      description="Monitor API, database, AI services and platform availability."
    />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <HealthMetric label="API" value={healthDisplay(systemHealth?.apiAvailability)} status={healthStatus(systemHealth?.apiAvailability)} />
      <HealthMetric label="Database" value={healthDisplay(systemHealth?.databaseHealth)} status={healthStatus(systemHealth?.databaseHealth)} />
      <HealthMetric label="AI Services" value={healthDisplay(systemHealth?.aiServices)} status={healthStatus(systemHealth?.aiServices)} />
      <HealthMetric label="Storage" value={healthDisplay(systemHealth?.storage)} status={healthStatus(systemHealth?.storage)} />
    </div>

    <DashboardCard title="Service Health" subtitle="Current platform health indicators">
      <div className="grid gap-4 md:grid-cols-2">
        <HealthBar label="CPU Utilization" value={systemHealth?.cpuUtilization ?? null} />
        <HealthBar label="Memory Utilization" value={systemHealth?.memoryUtilization ?? null} />
        <HealthBar label="Disk Utilization" value={systemHealth?.diskUtilization ?? null} />
        <HealthBar label="API Response Health" value={systemHealth?.apiResponseHealth ?? null} />
      </div>
    </DashboardCard>
  </div>
);

const AuditLogsSection = ({ logs }: { logs: AuditLog[] }) => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="Security"
      title="Audit Logs"
      description="Review administrator, user, permission and system activities."
    />

    <DashboardCard title="Activity History" subtitle={`${logs.length} records returned`}>
      {logs.length === 0 ? (
        <EmptyState text="No audit logs returned by the API." />
      ) : (
        <div className="space-y-2">
          {logs.map((log, index) => (
            <div
              key={log.id || index}
              className="flex gap-3 rounded-xl border border-slate-100 p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                <AuditIcon />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  {log.action || "System activity"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {log.description || "No description available."}
                </p>
                <p className="mt-2 text-[10px] text-slate-400">
                  {log.userEmail || "System"} Ã¢â‚¬Â¢ {formatDate(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  </div>
);

const ReportsSection = () => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="Analytics"
      title="System Reports"
      description="Administrative reporting area for platform and disaster-response metrics."
    />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="User Activity" value="Ã¢â‚¬â€" detail="API data required" icon={<UsersIcon />} tone="blue" />
      <MetricCard label="Incidents" value="Ã¢â‚¬â€" detail="Incident API required" icon={<AlertIcon />} tone="red" />
      <MetricCard label="AI Decisions" value="Ã¢â‚¬â€" detail="Agent history required" icon={<SparkIcon />} tone="purple" />
      <MetricCard label="Resources" value="Ã¢â‚¬â€" detail="Resource API required" icon={<ResourceIcon />} tone="green" />
    </div>

    <DashboardCard title="Report Center" subtitle="Ready for live reporting APIs">
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <ReportIcon />
        <p className="mt-3 text-sm font-bold text-slate-700">
          Reporting workspace ready
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
          Connect incident, resource, AI and user analytics endpoints here
          without changing the dashboard structure.
        </p>
      </div>
    </DashboardCard>
  </div>
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
  setSettings: React.Dispatch<
    React.SetStateAction<{
      maintenanceMode: boolean;
      emailNotifications: boolean;
      aiApprovalRequired: boolean;
      auditLogging: boolean;
    }>
  >;
  onSave: () => void;
}) => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="Configuration"
      title="System Settings"
      description="Manage important platform-level operational controls."
    />

    <DashboardCard
      title="Platform Controls"
      subtitle="Administrative settings"
      action="Save Settings"
      onAction={onSave}
    >
      <div className="space-y-3">
        <SettingRow
          title="Maintenance Mode"
          description="Temporarily place the platform into maintenance mode."
          checked={settings.maintenanceMode}
          onChange={(value) =>
            setSettings((current) => ({
              ...current,
              maintenanceMode: value,
            }))
          }
        />
        <SettingRow
          title="Email Notifications"
          description="Enable system notification delivery."
          checked={settings.emailNotifications}
          onChange={(value) =>
            setSettings((current) => ({
              ...current,
              emailNotifications: value,
            }))
          }
        />
        <SettingRow
          title="AI Human Approval"
          description="Require human approval for AI-generated operational decisions."
          checked={settings.aiApprovalRequired}
          onChange={(value) =>
            setSettings((current) => ({
              ...current,
              aiApprovalRequired: value,
            }))
          }
        />
        <SettingRow
          title="Audit Logging"
          description="Record important administration and security events."
          checked={settings.auditLogging}
          onChange={(value) =>
            setSettings((current) => ({
              ...current,
              auditLogging: value,
            }))
          }
        />
      </div>
    </DashboardCard>
  </div>
);

const ProfileSection = ({
  user,
  onLogout,
}: {
  user: UserRecord | null;
  onLogout: () => void;
}) => (
  <div className="space-y-6">
    <PageHeading
      eyebrow="Account"
      title="Administrator Profile"
      description="View your ReliefNexus administrator account information."
    />

    <DashboardCard title="Profile Information">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-extrabold text-blue-700">
          {(user?.fullName || "Admin")
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>

        <div className="space-y-2">
          <ProfileItem label="Full Name" value={user?.fullName || "System Administrator"} />
          <ProfileItem label="Email" value={user?.email || "Ã¢â‚¬â€"} />
          <ProfileItem label="Role" value="System Administrator" />
          <ProfileItem label="Account Status" value={user?.isActive ? "Active" : "Inactive"} />
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-7 rounded-xl bg-[#101c35] px-5 py-3 text-xs font-bold text-white hover:bg-[#172a4b]"
      >
        Sign Out
      </button>
    </DashboardCard>
  </div>
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

const MetricCard = ({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: "blue" | "green" | "amber" | "purple" | "red";
}) => {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          {icon}
        </div>
        <span className="text-slate-300">
          <ArrowUpRightIcon />
        </span>
      </div>
      <p className="mt-5 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#101c35]">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
    </div>
  );
};

const DashboardCard = ({
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-extrabold text-[#101c35]">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          {action}
        </button>
      )}
    </div>
    {children}
  </section>
);

const HealthBar = ({ label, value }: { label: string; value: number | null | undefined }) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <span className="text-xs font-bold text-slate-700">
        {typeof value === "number" ? `${value}%` : "â€”"}
      </span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-blue-600"
        style={{ width: `${typeof value === "number" ? value : 0}%` }}
      />
    </div>
  </div>
);

const HealthMetric = ({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
    </div>
    <p className="mt-3 text-3xl font-extrabold text-[#101c35]">{value}</p>
    <p className="mt-1 text-[10px] font-semibold text-emerald-600">{status}</p>
  </div>
);

const SettingRow = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4">
    <div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>

    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-blue-600" : "bg-slate-200"
      }`}
      aria-label={title}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  </div>
);

const ProfileItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-3 text-xs">
    <span className="w-28 font-semibold text-slate-400">{label}</span>
    <span className="font-bold text-slate-700">{value}</span>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">
    {text}
  </div>
);

export default SystemAdministratorDashboard;







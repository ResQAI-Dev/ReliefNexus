import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import img1 from "../../assets/img1.png";

interface DashboardUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface PendingRequest extends DashboardUser {
  roleRequestStatus?: string;
}

const roleLabels: Record<string, string> = {
  AffectedUser: "Affected User",
  FieldVolunteer: "Field Volunteer",
  ReliefCoordinator: "Relief Coordinator",
  SystemAdministrator: "System Administrator",
};

const roleShortLabels: Record<string, string> = {
  AffectedUser: "Affected",
  FieldVolunteer: "Volunteer",
  ReliefCoordinator: "Coordinator",
  SystemAdministrator: "Administrator",
};

const getRoleLabel = (role: string) =>
  roleLabels[role] ?? role;

const getRoleShortLabel = (role: string) =>
  roleShortLabels[role] ?? role;

const formatDate = (date: string) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name: string) => {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const SystemAdministratorDashboard = () => {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(
    []
  );

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError("");

      const response = await api.get<DashboardUser[]>("/Users");

      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Unable to load user data.");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      setRequestError("");

      const response = await api.get<PendingRequest[]>(
        "/Users/pending-role-requests"
      );

      setPendingRequests(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Failed to load pending role requests:", err);
      setRequestError("Pending role requests are currently unavailable.");
      setPendingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadPendingRequests();
  }, []);

  const statistics = useMemo(() => {
    const total = users.length;

    const active = users.filter(
      (user) => user.isActive
    ).length;

    const inactive = users.filter(
      (user) => !user.isActive
    ).length;

    const administrators = users.filter(
      (user) => user.role === "SystemAdministrator"
    ).length;

    const coordinators = users.filter(
      (user) => user.role === "ReliefCoordinator"
    ).length;

    const volunteers = users.filter(
      (user) => user.role === "FieldVolunteer"
    ).length;

    const affectedUsers = users.filter(
      (user) => user.role === "AffectedUser"
    ).length;

    return {
      total,
      active,
      inactive,
      administrators,
      coordinators,
      volunteers,
      affectedUsers,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((user) => {
        if (
          roleFilter !== "All Roles" &&
          user.role !== roleFilter
        ) {
          return false;
        }

        if (!query) return true;

        return (
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          getRoleLabel(user.role)
            .toLowerCase()
            .includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [users, search, roleFilter]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [users]);

  const roleDistribution = useMemo(() => {
    const total = users.length || 1;

    return [
      {
        label: "Affected Users",
        shortLabel: "Affected",
        value: statistics.affectedUsers,
        percentage: Math.round(
          (statistics.affectedUsers / total) * 100
        ),
      },
      {
        label: "Field Volunteers",
        shortLabel: "Volunteers",
        value: statistics.volunteers,
        percentage: Math.round(
          (statistics.volunteers / total) * 100
        ),
      },
      {
        label: "Relief Coordinators",
        shortLabel: "Coordinators",
        value: statistics.coordinators,
        percentage: Math.round(
          (statistics.coordinators / total) * 100
        ),
      },
      {
        label: "System Administrators",
        shortLabel: "Administrators",
        value: statistics.administrators,
        percentage: Math.round(
          (statistics.administrators / total) * 100
        ),
      },
    ];
  }, [statistics, users.length]);

  const approveRequest = async (id: string) => {
    try {
      setProcessingId(id);

      await api.put(`/Users/${id}/approve-role`);

      await Promise.all([
        loadUsers(),
        loadPendingRequests(),
      ]);
    } catch (err) {
      console.error("Failed to approve role request:", err);
      alert("Failed to approve role request.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      setProcessingId(id);

      await api.put(`/Users/${id}/reject-role`);

      await Promise.all([
        loadUsers(),
        loadPendingRequests(),
      ]);
    } catch (err) {
      console.error("Failed to reject role request:", err);
      alert("Failed to reject role request.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteUser = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(id);

      await api.delete(`/Users/${id}`);

      await loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start overflow-hidden bg-[#101c35] text-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
              RN
            </div>

            <div className="ml-3">
              <h1 className="text-lg font-bold">
                ReliefNexus
              </h1>
              <p className="text-xs text-slate-400">
                Disaster Management
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Main Menu
            </p>

            <div className="space-y-1">
              <SidebarItem
                label="Dashboard"
                active
                icon={<DashboardIcon />}
              />

              <SidebarItem
                label="User Directory"
                icon={<UsersIcon />}
              />

              <SidebarItem
                label="Role Requests"
                icon={<ClipboardIcon />}
                badge={pendingRequests.length}
              />

              <SidebarItem
                label="Disaster Management"
                icon={<AlertIcon />}
              />

              <SidebarItem
                label="AI Agents"
                icon={<BrainIcon />}
              />

              <SidebarItem
                label="System Settings"
                icon={<SettingsIcon />}
              />
            </div>

            <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              System
            </p>

            <div className="space-y-1">
              <SidebarItem
                label="Audit Logs"
                icon={<ActivityIcon />}
              />

              <SidebarItem
                label="Reports"
                icon={<ReportIcon />}
              />
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                  SA
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    System Administrator
                  </p>

                  <p className="truncate text-xs text-slate-400">
                    Administrator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1">

          {/* HEADER */}
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
            <div className="lg:hidden">
              <h1 className="text-lg font-bold text-[#101c35]">
                ReliefNexus
              </h1>
            </div>

            <div className="hidden max-w-md flex-1 md:block">
              <div className="relative">
                <SearchIcon />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search users, roles..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100"
              >
                <BellIcon />

                {pendingRequests.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="relative">
  <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">SA</div>
    <div className="hidden text-left sm:block">
      <p className="text-sm font-semibold text-slate-800">System Administrator</p>
      <p className="text-xs text-slate-500">Full system access</p>
    </div>
    <ChevronDownIcon />
  </button>
  {profileOpen && (
    <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">System Administrator</p>
        <p className="mt-1 text-xs text-slate-400">Full system access</p>
      </div>
      <div className="p-2">
        <button type="button" onClick={() => setProfileOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50">
          <UsersIcon />
          <span>Profile</span>
        </button>
        <button type="button" onClick={() => { localStorage.removeItem("accessToken"); localStorage.removeItem("user"); window.location.href = "/login"; }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )}
</div>
            </div>
          </header>

          <div className="p-5 lg:p-8">

            {/* PAGE TITLE */}
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="mb-1 text-sm font-medium text-blue-600">
                  System Overview
                </p>

                <h2 className="text-2xl font-bold tracking-tight text-[#101c35] lg:text-3xl">
                  Administrator Dashboard
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Monitor and manage the ReliefNexus platform.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  loadUsers();
                  loadPendingRequests();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#101c35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <RefreshIcon />
                Refresh Data
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* KPI CARDS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Total Users"
                value={statistics.total}
                subtitle="Registered accounts"
                icon={<UsersIcon />}
                iconClass="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Active Users"
                value={statistics.active}
                subtitle="Currently active"
                icon={<CheckCircleIcon />}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <StatCard
                title="Pending Requests"
                value={pendingRequests.length}
                subtitle="Require administrator review"
                icon={<ClipboardIcon />}
                iconClass="bg-amber-50 text-amber-600"
              />

              <StatCard
                title="Inactive Users"
                value={statistics.inactive}
                subtitle="Inactive accounts"
                icon={<UserOffIcon />}
                iconClass="bg-red-50 text-red-600"
              />

            </section>

            {/* MIDDLE SECTION */}
            <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">

              {/* RISK */}
              <DashboardCard
                title="Disaster Risk Overview"
                subtitle="Current platform risk status"
                action="View details"
              >
                <div className="flex min-h-[260px] flex-col items-center justify-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-[14px] border-slate-200">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-700">
                        N/A
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Risk
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Risk prediction module
                    </p>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                      Live disaster risk data will appear here
                      when the risk prediction module is connected.
                    </p>
                  </div>
                </div>
              </DashboardCard>

              {/* ALERTS */}
              <DashboardCard
                title="Live Disaster Alerts"
                subtitle="Latest system alerts"
                action="View all"
              >
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <AlertIcon />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    No live alerts available
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                    Disaster alerts will be displayed here when
                    connected to the alert service.
                  </p>
                </div>
              </DashboardCard>

              {/* AI */}
              <div id="ai-agents">
              <DashboardCard
                title="AI Agent Operations"
                subtitle="Agent activity overview"
                action="Manage agents"
              >
                <div className="space-y-3 py-2">

                  <AgentStatus
                    name="Risk Prediction Agent"
                    description="Risk assessment"
                    status="Pending"
                  />

                  <AgentStatus
                    name="Vulnerability & Impact Agent"
                    description="Impact analysis"
                    status="Pending"
                  />

                  <AgentStatus
                    name="Preparedness & Resource Agent"
                    description="Resource optimization"
                    status="Pending"
                  />

                  <AgentStatus
                    name="Early Warning & Coordination Agent"
                    description="Warning coordination"
                    status="Pending"
                  />

                </div>
              </DashboardCard>
              </div>

            </section>

            {/* LOWER SECTION */}
            <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">

              {/* ROLE REQUESTS */}
              <div id="role-requests">
              <DashboardCard
                title="Pending Role Requests"
                subtitle={`${pendingRequests.length} request${
                  pendingRequests.length === 1 ? "" : "s"
                } awaiting review`}
                action="View all"
              >
                {loadingRequests ? (
                  <LoadingState />
                ) : requestError ? (
                  <div className="flex min-h-[260px] items-center justify-center text-center">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <ClipboardIcon />
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-600">
                        Requests unavailable
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {requestError}
                      </p>
                    </div>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircleIcon />}
                    title="No pending requests"
                    description="All role requests have been reviewed."
                  />
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 4).map((request) => (
                      <div
                        key={request.id}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {getInitials(request.fullName)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {request.fullName}
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {request.email}
                            </p>

                            <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              {getRoleLabel(request.role)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={processingId === request.id}
                            onClick={() =>
                              approveRequest(request.id)
                            }
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={processingId === request.id}
                            onClick={() =>
                              rejectRequest(request.id)
                            }
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* USER DISTRIBUTION */}
              <DashboardCard
                title="User Distribution by Role"
                subtitle="Current registered users"
              >
                <div className="flex min-h-[260px] flex-col items-center justify-center">

                  <div className="relative h-40 w-40">
                    <svg
                      viewBox="0 0 42 42"
                      className="h-full w-full -rotate-90"
                    >
                      <circle
                        cx="21"
                        cy="21"
                        r="15.9155"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        className="text-slate-100"
                      />

                      {users.length > 0 &&
                        roleDistribution.map(
                          (item, index) => {
                            if (item.value === 0) {
                              return null;
                            }

                            const values = [
                              statistics.affectedUsers,
                              statistics.volunteers,
                              statistics.coordinators,
                              statistics.administrators,
                            ];

                            const total = values.reduce(
                              (sum, value) => sum + value,
                              0
                            );

                            let offset = 0;

                            for (
                              let i = 0;
                              i < index;
                              i++
                            ) {
                              offset +=
                                (values[i] / total) * 100;
                            }

                            const percentage =
                              (item.value / total) * 100;

                            return (
                              <circle
                                key={item.label}
                                cx="21"
                                cy="21"
                                r="15.9155"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="5"
                                strokeDasharray={`${percentage} ${
                                  100 - percentage
                                }`}
                                strokeDashoffset={-offset}
                                className={
                                  index === 0
                                    ? "text-blue-500"
                                    : index === 1
                                    ? "text-emerald-500"
                                    : index === 2
                                    ? "text-amber-500"
                                    : "text-purple-500"
                                }
                              />
                            );
                          }
                        )}
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-800">
                        {statistics.total}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        Users
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid w-full grid-cols-2 gap-3">
                    {roleDistribution.map((item, index) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            index === 0
                              ? "bg-blue-500"
                              : index === 1
                              ? "bg-emerald-500"
                              : index === 2
                              ? "bg-amber-500"
                              : "bg-purple-500"
                          }`}
                        />

                        <span className="text-xs text-slate-500">
                          {item.shortLabel}
                        </span>

                        <span className="ml-auto text-xs font-semibold text-slate-700">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </DashboardCard>

              {/* RECENT ACTIVITY */}
              <DashboardCard
                title="Recent Activity"
                subtitle="Latest user registrations"
                action="View logs"
              >
                {loadingUsers ? (
                  <LoadingState />
                ) : recentUsers.length === 0 ? (
                  <EmptyState
                    icon={<ActivityIcon />}
                    title="No recent activity"
                    description="User activity will appear here."
                  />
                ) : (
                  <div className="space-y-1">
                    {recentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-lg p-2.5 transition hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {getInitials(user.fullName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {user.fullName}
                          </p>

                          <p className="truncate text-xs text-slate-400">
                            Registered as{" "}
                            {getRoleShortLabel(user.role)}
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardCard>

            </section>

            {/* QUICK ACTIONS */}
            <section className="mt-6">
              <div id="user-directory">
              <DashboardCard
                title="Quick Actions"
                subtitle="Common administration tasks"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  <QuickAction
                    icon={<UsersIcon />}
                    title="User Directory"
                    description="Manage platform users"
                  />

                  <QuickAction
                    icon={<ClipboardIcon />}
                    title="Role Requests"
                    description="Review pending requests"
                    badge={pendingRequests.length}
                  />

                  <QuickAction
                    icon={<BrainIcon />}
                    title="AI Agents"
                    description="Monitor AI operations"
                  />

                  <QuickAction
                    icon={<ReportIcon />}
                    title="Reports"
                    description="View system reports"
                  />

                </div>
              </DashboardCard>
              </div>
            </section>

            {/* USER DIRECTORY */}
            <section className="mt-6">
              <DashboardCard
                title="User Directory"
                subtitle={`${filteredUsers.length} user${
                  filteredUsers.length === 1 ? "" : "s"
                } found`}
              >

                <div className="mb-5 flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <SearchIcon />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search by name, email or role..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(event) =>
                      setRoleFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500"
                  >
                    <option>All Roles</option>
                    <option value="AffectedUser">
                      Affected User
                    </option>
                    <option value="FieldVolunteer">
                      Field Volunteer
                    </option>
                    <option value="ReliefCoordinator">
                      Relief Coordinator
                    </option>
                    <option value="SystemAdministrator">
                      System Administrator
                    </option>
                  </select>
                </div>

                {loadingUsers ? (
                  <LoadingState />
                ) : filteredUsers.length === 0 ? (
                  <EmptyState
                    icon={<UsersIcon />}
                    title="No users found"
                    description="No users match the current search or filter."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            User
                          </th>

                          <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Role
                          </th>

                          <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Status
                          </th>

                          <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Created
                          </th>

                          <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredUsers.slice(0, 10).map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-slate-50 last:border-0"
                          >
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                  {getInitials(user.fullName)}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-700">
                                    {user.fullName}
                                  </p>

                                  <p className="truncate text-xs text-slate-400">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-3.5">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {getRoleLabel(user.role)}
                              </span>
                            </td>

                            <td className="px-3 py-3.5">
                              {user.isActive ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            <td className="px-3 py-3.5 text-xs text-slate-500">
                              {formatDate(user.createdAt)}
                            </td>

                            <td className="px-3 py-3.5 text-right">
                              <button
                                type="button"
                                disabled={
                                  processingId === user.id
                                }
                                onClick={() =>
                                  deleteUser(user.id)
                                }
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DashboardCard>
            </section>

            {/* BANNER */}
            <section className="mt-6 overflow-hidden rounded-2xl bg-[#101c35]">
              <div className="grid min-h-[220px] md:grid-cols-2">

                <div className="flex flex-col justify-center p-7 lg:p-10">
                  <span className="mb-3 inline-flex w-fit rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                    ReliefNexus Platform
                  </span>

                  <h3 className="max-w-lg text-2xl font-bold text-white lg:text-3xl">
                    Coordinating technology for safer communities.
                  </h3>

                  <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                    Manage users, monitor AI operations and maintain
                    the disaster management platform from one place.
                  </p>
                </div>

                <div className="relative hidden min-h-[220px] overflow-hidden md:block">
                  <img
                    src={img1}
                    alt="ReliefNexus"
                    className="h-full w-full object-cover opacity-80"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-[#101c35] via-[#101c35]/30 to-transparent" />
                </div>

              </div>
            </section>

            <footer className="py-6 text-center text-xs text-slate-400">
              ReliefNexus Disaster Management Platform
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENTS
========================================================= */

interface SidebarItemProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
}

const SidebarItem = ({
  label,
  icon,
  active = false,
  badge,
}: SidebarItemProps) => {
  return (
    <button
      type="button"
      onClick={() => {
        const targets: Record<string, string> = {
          "Dashboard": "top",
          "User Directory": "user-directory",
          "Role Requests": "role-requests",
          "AI Agents": "ai-agents",
        };
        const target = targets[label];
        if (target === "top") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (target) {
          document.getElementById(target)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="shrink-0">{icon}</span>

      <span className="flex-1">{label}</span>

      {badge !== undefined && badge > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            active
              ? "bg-white/20 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-[#101c35]">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  action?: string;
  children: React.ReactNode;
}

const DashboardCard = ({
  title,
  subtitle,
  action,
  children,
}: DashboardCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#101c35]">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <button
            type="button"
            className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {action}
          </button>
        )}
      </div>

      {children}
    </div>
  );
};

interface AgentStatusProps {
  name: string;
  description: string;
  status: string;
}

const AgentStatus = ({
  name,
  description,
  status,
}: AgentStatusProps) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
        <BrainIcon />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-700">
          {name}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {description}
        </p>
      </div>

      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
        {status}
      </span>
    </div>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: number;
}

const QuickAction = ({
  icon,
  title,
  description,
  badge,
}: QuickActionProps) => {
  return (
    <button
      type="button"
      className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-100 hover:bg-blue-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm transition group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-700">
            {title}
          </p>

          {badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-slate-400">
          {description}
        </p>
      </div>

      <ChevronRightIcon />
    </button>
  );
};

const LoadingState = () => {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

        <p className="mt-3 text-xs text-slate-400">
          Loading data...
        </p>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const EmptyState = ({
  icon,
  title,
  description,
}: EmptyStateProps) => {
  return (
    <div className="flex min-h-[220px] items-center justify-center text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-600">
          {title}
        </p>

        <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   ICONS
========================================================= */

const DashboardIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ClipboardIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V2h6v2" />
    <path d="M9 10h6" />
    <path d="M9 14h6" />
    <path d="M9 18h3" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M10.3 3.3 2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const BrainIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M9.5 3a3.5 3.5 0 0 0-3.4 4.3A3.5 3.5 0 0 0 5 14a3.5 3.5 0 0 0 4.5 5.3V3Z" />
    <path d="M14.5 3a3.5 3.5 0 0 1 3.4 4.3A3.5 3.5 0 0 1 19 14a3.5 3.5 0 0 1-4.5 5.3V3Z" />
    <path d="M9.5 7h2v4h3" />
    <path d="M14.5 17h-2v-4h-3" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.4 1.4-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.4-1.4.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 11a1.7 1.7 0 0 0-.34-1.88L9 9.06l1.4-1.4.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 13.37 6.5V6h2v.5a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.4 1.4-.06.06A1.7 1.7 0 0 0 19.4 11a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z" />
  </svg>
);

const ActivityIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M3 12h4l2-7 4 14 2-7h6" />
  </svg>
);

const ReportIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M6 2h9l4 4v16H6z" />
    <path d="M14 2v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
    <path d="M9 9h2" />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const BellIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
    <path d="M4 4v5h5" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
    <path d="M20 20v-5h-5" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 2.5 2.5L16 9" />
  </svg>
);

const UserOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m18 8 4 4" />
    <path d="m22 8-4 4" />
  </svg>
);

export default SystemAdministratorDashboard;

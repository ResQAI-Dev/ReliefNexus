import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

type Role =
  | "AffectedUser"
  | "FieldVolunteer"
  | "ReliefCoordinator";

type SectionId =
  | "dashboard"
  | "reports"
  | "requests"
  | "alerts"
  | "risk"
  | "resources"
  | "location"
  | "profile";

interface RiskPrediction {
  id?: string;
  location?: string;
  disasterType?: string;
  riskScore?: number;
  riskLevel?: string;
  confidence?: number;
  rainfall?: number;
  rainfallLevel?: string;
  riverLevel?: string;
  temperature?: number;
  historicalRisk?: string;
  mainFactors?: string[] | string;
  recommendation?: string;
  createdAt?: string;
}

interface AssistanceRequest {
  id?: string;
  requestId?: string;
  title?: string;
  type?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmergencyAlert {
  id?: string;
  title?: string;
  message?: string;
  location?: string;
  severity?: string;
  createdAt?: string;
}

interface ReliefResource {
  id?: string;
  name?: string;
  title?: string;
  location?: string;
  distanceKm?: number;
  distance?: number;
  status?: string;
}

interface MenuItem {
  id: SectionId;
  label: string;
  icon: ReactNode;
}

const ROLE_CONFIG: Record<
  Role,
  {
    title: string;
    badge: string;
    description: string;
    menu: SectionId[];
    quickActions: SectionId[];
  }
> = {
  AffectedUser: {
    title: "Community Safety Dashboard",
    badge: "Affected User",
    description:
      "Stay informed, report emergencies, request assistance, and monitor the latest safety information.",
    menu: [
      "dashboard",
      "reports",
      "requests",
      "alerts",
      "risk",
      "resources",
      "location",
      "profile",
    ],
    quickActions: ["reports", "requests", "location", "alerts"],
  },
  FieldVolunteer: {
    title: "Field Operations Dashboard",
    badge: "Field Volunteer",
    description:
      "Monitor disaster information, support affected communities, and coordinate field response activities.",
    menu: [
      "dashboard",
      "reports",
      "requests",
      "alerts",
      "risk",
      "location",
      "profile",
    ],
    quickActions: ["reports", "requests", "risk", "alerts"],
  },
  ReliefCoordinator: {
    title: "Relief Coordination Dashboard",
    badge: "Relief Coordinator",
    description:
      "Coordinate relief operations, monitor risk intelligence, and manage response resources.",
    menu: [
      "dashboard",
      "reports",
      "requests",
      "alerts",
      "risk",
      "resources",
      "profile",
    ],
    quickActions: ["requests", "risk", "resources", "alerts"],
  },
};

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = normalizeRole(user?.role);
  const config = ROLE_CONFIG[role];

  const [latestRisk, setLatestRisk] = useState<RiskPrediction | null>(null);
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [resources, setResources] = useState<ReliefResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  const currentSection = getCurrentSection(location.pathname);

  const goToPage = (section: SectionId) => {
    if (section === "dashboard") {
      navigate("/dashboard/user");
      return;
    }

    navigate(`/dashboard/user/${sectionRoute(section)}`);
  };

  const sidebarItems = useMemo<MenuItem[]>(() => {
    const labels: Record<SectionId, string> = {
      dashboard: "Dashboard",
      reports:
        role === "AffectedUser"
          ? "Report Disaster"
          : role === "FieldVolunteer"
            ? "Disaster Reports"
            : "Disaster Reports",
      requests:
        role === "AffectedUser"
          ? "My Requests"
          : role === "FieldVolunteer"
            ? "Assigned Requests"
            : "Assistance Requests",
      alerts: "Emergency Alerts",
      risk: "Risk Information",
      resources: "Relief Resources",
      location: "Location Sharing",
      profile: "Profile",
    };

    const icons: Record<SectionId, ReactNode> = {
      dashboard: <HomeIcon />,
      reports: <AlertTriangleIcon />,
      requests: <ClipboardIcon />,
      alerts: <BellIcon />,
      risk: <ChartIcon />,
      resources: <LayersIcon />,
      location: <LocationIcon />,
      profile: <UserIcon />,
    };

    return config.menu.map((id) => ({
      id,
      label: labels[id],
      icon: icons[id],
    }));
  }, [config.menu, role]);

  useEffect(() => {
    let alive = true;

    const loadLiveData = async () => {
      setLoading(true);
      setApiErrors([]);

      const results = await Promise.allSettled([
        api.get<RiskPrediction[] | RiskPrediction>("/risk-predictions"),
        api.get<AssistanceRequest[]>("/requests"),
        api.get<EmergencyAlert[]>("/alerts"),
        api.get<ReliefResource[]>("/relief-resources"),
      ]);

      if (!alive) return;

      const errors: string[] = [];

      const [riskResult, requestResult, alertResult, resourceResult] =
        results;

      if (riskResult.status === "fulfilled") {
        const raw = riskResult.value.data;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

        list.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );

        setLatestRisk(list[0] ?? null);
      } else {
        errors.push("Risk prediction service is unavailable.");
      }

      if (requestResult.status === "fulfilled") {
        setRequests(
          Array.isArray(requestResult.value.data)
            ? requestResult.value.data
            : []
        );
      } else {
        errors.push("Assistance request service is unavailable.");
      }

      if (alertResult.status === "fulfilled") {
        setAlerts(
          Array.isArray(alertResult.value.data)
            ? alertResult.value.data
            : []
        );
      } else {
        errors.push("Emergency alert service is unavailable.");
      }

      if (resourceResult.status === "fulfilled") {
        setResources(
          Array.isArray(resourceResult.value.data)
            ? resourceResult.value.data
            : []
        );
      } else {
        errors.push("Relief resource service is unavailable.");
      }

      setApiErrors(errors);
      setLoading(false);
    };

    void loadLiveData();

    return () => {
      alive = false;
    };
  }, []);

  const displayName = user?.fullName?.split(" ")[0] || "there";
  const score = numberValue(latestRisk?.riskScore);
  const riskLevel = latestRisk?.riskLevel || "No assessment";
  const factors = normalizeFactors(latestRisk?.mainFactors);

  return (
    <DashboardLayout
      sidebarItems={sidebarItems.map((item) => ({
        label: item.label,
        icon: item.icon,
        active: currentSection === item.id,
        onClick: () => goToPage(item.id),
      }))}
    >
      <div className="min-h-screen bg-[#f5f8fc]">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          {apiErrors.length > 0 && currentSection === "dashboard" && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">Some live services are unavailable.</p>
              <p className="mt-1">
                The dashboard is showing live data only. No mock data is being
                used.
              </p>
            </div>
          )}

          {currentSection === "dashboard" && (
            <>
              <section
                className="relative mb-6 overflow-hidden rounded-[28px] bg-[#0f2347] px-6 py-7 text-white shadow-xl sm:px-8 lg:px-10 lg:py-9"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg,rgba(15,35,71,.97),rgba(15,35,71,.82) 45%,rgba(15,35,71,.4)),url('/images/disaster-hero.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                  <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {config.badge}
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      Good morning, {displayName}!
                    </h1>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">
                      {config.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {config.quickActions.slice(0, 2).map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => goToPage(action)}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0f2347] shadow-lg transition hover:-translate-y-0.5"
                        >
                          {actionIcon(action)}
                          {actionLabel(action, role)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
                          Current safety status
                        </p>
                        <p className="mt-2 text-2xl font-bold">{riskLevel}</p>
                        <p className="mt-1 text-sm text-blue-100/70">
                          {latestRisk?.disasterType || "No current assessment"}
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                        <ShieldCheckIcon />
                      </div>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all"
                        style={{
                          width: `${Math.min(
                            Math.max(score ?? 0, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[11px] text-blue-100/60">
                      <span>Risk score</span>
                      <span>{score !== null ? `${score}%` : "N/A"}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {config.menu.includes("requests") && (
                  <StatCard
                    icon={<ClipboardIcon />}
                    title={role === "AffectedUser" ? "My Requests" : "Requests"}
                    value={loading ? "..." : String(requests.length)}
                    subtitle={
                      loading
                        ? "Loading live data"
                        : requests.length
                          ? "Requests available"
                          : "No requests available"
                    }
                    onClick={() => goToPage("requests")}
                  />
                )}

                {config.menu.includes("alerts") && (
                  <StatCard
                    icon={<BellIcon />}
                    title="Emergency Alerts"
                    value={loading ? "..." : String(alerts.length)}
                    subtitle={
                      loading
                        ? "Loading live data"
                        : alerts.length
                          ? "Alerts available"
                          : "No alerts available"
                    }
                    onClick={() => goToPage("alerts")}
                  />
                )}

                {config.menu.includes("risk") && (
                  <StatCard
                    icon={<ShieldCheckIcon />}
                    title="Current Risk"
                    value={loading ? "..." : riskLevel}
                    subtitle={
                      score !== null
                        ? `${score}% risk score`
                        : "No score available"
                    }
                    onClick={() => goToPage("risk")}
                  />
                )}

                {config.menu.includes("resources") && (
                  <StatCard
                    icon={<LayersIcon />}
                    title="Relief Resources"
                    value={loading ? "..." : String(resources.length)}
                    subtitle={
                      loading
                        ? "Loading live data"
                        : resources.length
                          ? "Resources available"
                          : "No resources available"
                    }
                    onClick={() => goToPage("resources")}
                  />
                )}

                {!config.menu.includes("resources") &&
                  config.menu.includes("location") && (
                    <StatCard
                      icon={<LocationIcon />}
                      title="Location Sharing"
                      value="Available"
                      subtitle="Manage response location"
                      onClick={() => goToPage("location")}
                    />
                  )}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                {config.menu.includes("risk") && (
                  <DashboardCard
                    title="AI Risk Prediction"
                    subtitle="Latest assessment from the Risk Prediction API"
                    action={
                      <button
                        type="button"
                        onClick={() => goToPage("risk")}
                        className="text-sm font-semibold text-blue-600"
                      >
                        View details
                      </button>
                    }
                  >
                    <RiskPredictionContent
                      risk={latestRisk}
                      loading={loading}
                      factors={factors}
                    />
                  </DashboardCard>
                )}

                <DashboardCard
                  title="Emergency Alerts"
                  subtitle="Live alerts returned by the system"
                  action={
                    <button
                      type="button"
                      onClick={() => goToPage("alerts")}
                      className="text-sm font-semibold text-blue-600"
                    >
                      View all
                    </button>
                  }
                >
                  <AlertsContent alerts={alerts} loading={loading} />
                </DashboardCard>
              </section>

              <section className="my-6">
                <DashboardCard
                  title="Quick Actions"
                  subtitle="Access services available for your role"
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {config.quickActions.map((action) => (
                      <QuickAction
                        key={action}
                        icon={actionIcon(action)}
                        title={actionLabel(action, role)}
                        description={actionDescription(action, role)}
                        onClick={() => goToPage(action)}
                      />
                    ))}
                  </div>
                </DashboardCard>
              </section>

              <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {config.menu.includes("requests") && (
                  <DashboardCard
                    title={
                      role === "AffectedUser"
                        ? "My Recent Requests"
                        : "Recent Requests"
                    }
                    subtitle="Live data from the requests API"
                    action={
                      <button
                        type="button"
                        onClick={() => goToPage("requests")}
                        className="text-sm font-semibold text-blue-600"
                      >
                        View all
                      </button>
                    }
                  >
                    <RequestsContent
                      requests={requests}
                      loading={loading}
                      limit={3}
                    />
                  </DashboardCard>
                )}

                {config.menu.includes("resources") && (
                  <DashboardCard
                    title="Relief Resources"
                    subtitle="Live data from the resources API"
                    action={
                      <button
                        type="button"
                        onClick={() => goToPage("resources")}
                        className="text-sm font-semibold text-blue-600"
                      >
                        View all
                      </button>
                    }
                  >
                    <ResourcesContent
                      resources={resources}
                      loading={loading}
                      limit={3}
                    />
                  </DashboardCard>
                )}

                {config.menu.includes("risk") && (
                  <DashboardCard
                    title="Safety Status"
                    subtitle="Based on the latest risk prediction"
                  >
                    <SafetyContent
                      risk={latestRisk}
                      factors={factors}
                      loading={loading}
                    />
                  </DashboardCard>
                )}
              </section>
            </>
          )}

          {currentSection === "reports" && (
            <PageShell
              icon={<AlertTriangleIcon />}
              title={
                role === "AffectedUser"
                  ? "Report a Disaster"
                  : "Disaster Reports"
              }
              subtitle={
                role === "AffectedUser"
                  ? "Submit a real emergency report through the disaster reporting workflow."
                  : "Monitor disaster reports available to your role."
              }
            >
              <DashboardCard title="Disaster Reports">
                <EmptyState text="Connect the disaster-report API to load and manage real disaster reports." />
              </DashboardCard>
            </PageShell>
          )}

          {currentSection === "requests" && (
            <PageShell
              icon={<ClipboardIcon />}
              title={
                role === "AffectedUser"
                  ? "My Requests"
                  : role === "FieldVolunteer"
                    ? "Assigned Requests"
                    : "Assistance Requests"
              }
              subtitle="Assistance request information returned by the system."
            >
              <DashboardCard title="Requests">
                <RequestsContent
                  requests={requests}
                  loading={loading}
                />
              </DashboardCard>
            </PageShell>
          )}

          {currentSection === "alerts" && (
            <PageShell
              icon={<BellIcon />}
              title="Emergency Alerts"
              subtitle="Current safety alerts returned by the system."
            >
              <DashboardCard title="Active Alerts">
                <AlertsContent alerts={alerts} loading={loading} />
              </DashboardCard>
            </PageShell>
          )}

          {currentSection === "risk" && (
            <PageShell
              icon={<ChartIcon />}
              title="Risk Information"
              subtitle="Risk intelligence returned by the Risk Prediction Agent."
            >
              <DashboardCard title="Latest AI Risk Prediction">
                <RiskPredictionContent
                  risk={latestRisk}
                  loading={loading}
                  factors={factors}
                />
              </DashboardCard>
            </PageShell>
          )}

          {currentSection === "resources" && (
            <PageShell
              icon={<LayersIcon />}
              title="Relief Resources"
              subtitle="Relief resources returned by the system."
            >
              <DashboardCard title="Available Resources">
                <ResourcesContent
                  resources={resources}
                  loading={loading}
                />
              </DashboardCard>
            </PageShell>
          )}

          {currentSection === "location" && (
            <PageShell
              icon={<LocationIcon />}
              title="Location Sharing"
              subtitle="Manage location sharing for authorized response workflows."
            >
              <DashboardCard title="Location Sharing">
                <EmptyState text="Connect the location-sharing API to show and manage the user's real sharing status." />
              </DashboardCard>
            </PageShell>
          )}

          {currentSection === "profile" && (
            <PageShell
              icon={<UserIcon />}
              title="Profile"
              subtitle="Your authenticated ReliefNexus account information."
            >
              <DashboardCard title="Account Information">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ProfileItem
                    label="Full Name"
                    value={user?.fullName || "Not available"}
                  />
                  <ProfileItem
                    label="Email"
                    value={user?.email || "Not available"}
                  />
                  <ProfileItem
                    label="Role"
                    value={user?.role || "Not available"}
                  />
                </div>
              </DashboardCard>
            </PageShell>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const PageShell = ({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <section className="mt-2">
    <div className="mb-6 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

const RiskPredictionContent = ({
  risk,
  loading,
  factors,
}: {
  risk: RiskPrediction | null;
  loading: boolean;
  factors: string[];
}) => {
  if (loading) return <LoadingState />;
  if (!risk) {
    return (
      <EmptyState text="No risk prediction has been returned by the Risk Prediction API." />
    );
  }

  const score = numberValue(risk.riskScore);
  const level = risk.riskLevel || "Unknown";
  const degrees = (score ?? 0) * 3.6;

  return (
    <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
      <div className="flex flex-col items-center justify-center">
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-slate-100">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#10b981 0deg ${degrees}deg,#e2e8f0 ${degrees}deg 360deg)`,
            }}
          />
          <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-bold text-slate-900">
              {score !== null ? `${score}%` : "N/A"}
            </span>
            <span className="mt-1 text-xs text-slate-500">Risk Score</span>
          </div>
        </div>

        <div
          className={`mt-3 rounded-full px-3 py-1.5 text-xs font-semibold ${getRiskColor(
            level
          )}`}
        >
          {level} Risk
        </div>
      </div>

      <div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ShieldCheckIcon />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                {risk.disasterType || "Risk assessment"}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {risk.recommendation ||
                  "No recommendation was returned by the Risk Prediction Agent."}
              </p>

              {risk.confidence != null && (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Confidence: {numberValue(risk.confidence)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RiskMetric
            icon={<CloudIcon />}
            label="Rainfall"
            value={
              risk.rainfall != null
                ? String(risk.rainfall)
                : risk.rainfallLevel || "N/A"
            }
          />
          <RiskMetric
            icon={<WaterIcon />}
            label="River Level"
            value={risk.riverLevel || "N/A"}
          />
          <RiskMetric
            icon={<DropIcon />}
            label="Temperature"
            value={
              risk.temperature != null
                ? `${risk.temperature}C`
                : "N/A"
            }
          />
          <RiskMetric
            icon={<ChartIcon />}
            label="History"
            value={risk.historicalRisk || "N/A"}
          />
        </div>

        {factors.length > 0 && (
          <div className="mt-4 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-bold text-slate-900">
              Main risk factors
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {factors.map((factor, index) => (
                <li key={`${factor}-${index}`}>• {factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const RequestsContent = ({
  requests,
  loading,
  limit,
}: {
  requests: AssistanceRequest[];
  loading: boolean;
  limit?: number;
}) => {
  if (loading) return <LoadingState />;

  if (!requests.length) {
    return (
      <EmptyState text="No assistance requests have been returned by the API." />
    );
  }

  return (
    <div className="space-y-1">
      {requests.slice(0, limit).map((request, index) => (
        <RequestRow
          key={request.id ?? request.requestId ?? index}
          icon={<ClipboardIcon />}
          title={request.title || request.type || "Assistance request"}
          id={request.requestId || request.id || "No ID"}
          status={request.status || "Unknown"}
          statusClass={getStatusClass(request.status)}
          time={formatDate(request.updatedAt || request.createdAt)}
        />
      ))}
    </div>
  );
};

const AlertsContent = ({
  alerts,
  loading,
}: {
  alerts: EmergencyAlert[];
  loading: boolean;
}) => {
  if (loading) return <LoadingState />;

  if (!alerts.length) {
    return (
      <EmptyState text="No emergency alerts have been returned by the API." />
    );
  }

  return (
    <div className="space-y-3">
      {alerts.slice(0, 3).map((alert, index) => (
        <AlertRow
          key={alert.id ?? index}
          type={getAlertType(alert.severity)}
          title={alert.title || "Emergency alert"}
          location={
            alert.location || alert.message || "Location unavailable"
          }
          time={formatDate(alert.createdAt)}
        />
      ))}
    </div>
  );
};

const ResourcesContent = ({
  resources,
  loading,
  limit,
}: {
  resources: ReliefResource[];
  loading: boolean;
  limit?: number;
}) => {
  if (loading) return <LoadingState />;

  if (!resources.length) {
    return (
      <EmptyState text="No relief resources have been returned by the API." />
    );
  }

  return (
    <div className="space-y-3">
      {resources.slice(0, limit).map((resource, index) => (
        <ResourceRow
          key={resource.id ?? index}
          icon={<LayersIcon />}
          title={resource.name || resource.title || "Relief resource"}
          meta={
            resource.distanceKm != null
              ? `${resource.distanceKm} km away`
              : resource.distance != null
                ? `${resource.distance} km away`
                : resource.location || "Location unavailable"
          }
          status={resource.status || "Status unavailable"}
        />
      ))}
    </div>
  );
};

const SafetyContent = ({
  risk,
  factors,
  loading,
}: {
  risk: RiskPrediction | null;
  factors: string[];
  loading: boolean;
}) => {
  if (loading) return <LoadingState />;
  if (!risk) return <EmptyState text="No risk assessment is currently available." />;

  return (
    <>
      <div
        className={`rounded-2xl border p-4 ${getSafetyBoxClass(
          risk.riskLevel || ""
        )}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70">
            <ShieldCheckIcon />
          </div>

          <div>
            <p className="font-bold">
              Current risk: {risk.riskLevel || "Unknown"}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {risk.recommendation || "No recommendation available."}
            </p>
          </div>
        </div>
      </div>

      {factors.length > 0 && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="font-semibold text-slate-900">Risk factors</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {factors.slice(0, 4).map((factor, index) => (
              <li key={`${factor}-${index}`}>• {factor}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
  >
    <div className="flex items-start justify-between">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>
      <span className="text-lg text-slate-300 transition group-hover:text-blue-500">
        →
      </span>
    </div>

    <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
      {value}
    </p>
    <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
  </button>
);

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
  >
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>

    {children}
  </div>
);

const RiskMetric = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <div className="text-blue-600">{icon}</div>
    <p className="mt-2 text-[11px] font-medium text-slate-400">{label}</p>
    <p className="mt-0.5 text-xs font-bold text-slate-700">{value}</p>
  </div>
);

const AlertRow = ({
  type,
  title,
  location,
  time,
}: {
  type: "danger" | "warning" | "info";
  title: string;
  location: string;
  time: string;
}) => {
  const styles = {
    danger: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles[type]}`}
      >
        {type === "info" ? <InfoIcon /> : <AlertTriangleIcon />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {location} {time}
        </p>
      </div>
    </div>
  );
};

const QuickAction = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-md"
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
      {icon}
    </div>

    <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
    <p className="mt-1 text-xs text-slate-500">{description}</p>
  </button>
);

const RequestRow = ({
  icon,
  title,
  id,
  status,
  statusClass,
  time,
}: {
  icon: ReactNode;
  title: string;
  id: string;
  status: string;
  statusClass: string;
  time: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      {icon}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-0.5 text-xs text-slate-400">{id}</p>
    </div>

    <div className="hidden text-right sm:block">
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass}`}
      >
        {status}
      </span>
      <p className="mt-1 text-[10px] text-slate-400">{time}</p>
    </div>
  </div>
);

const ResourceRow = ({
  icon,
  title,
  meta,
  status,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  status: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      {icon}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-400">
        {meta} • {status}
      </p>
    </div>
  </div>
);

const ProfileItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-medium text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
  </div>
);

const LoadingState = () => (
  <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
    Loading live data...
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
    {text}
  </div>
);

const numberValue = (value?: number | null) =>
  value == null || Number.isNaN(Number(value)) ? null : Number(value);

const normalizeFactors = (value?: string[] | string) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === "string"
      ? value
          .split(/[,;\n]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
};

const normalizeRole = (role?: string): Role => {
  const value = (role || "").toLowerCase().replace(/[\s_-]/g, "");

  if (value === "fieldvolunteer" || value === "volunteer") {
    return "FieldVolunteer";
  }

  if (
    value === "reliefcoordinator" ||
    value === "coordinator"
  ) {
    return "ReliefCoordinator";
  }

  return "AffectedUser";
};

const getCurrentSection = (pathname: string): SectionId => {
  if (pathname.endsWith("/report-disaster") || pathname.endsWith("/disaster-reports")) {
    return "reports";
  }

  if (pathname.endsWith("/my-requests") || pathname.endsWith("/assigned-requests") || pathname.endsWith("/assistance-requests")) {
    return "requests";
  }

  if (pathname.endsWith("/emergency-alerts")) return "alerts";
  if (pathname.endsWith("/risk-information")) return "risk";
  if (pathname.endsWith("/relief-resources")) return "resources";
  if (pathname.endsWith("/location-sharing")) return "location";
  if (pathname.endsWith("/profile")) return "profile";

  return "dashboard";
};

const sectionRoute = (section: SectionId) => {
  const routes: Record<Exclude<SectionId, "dashboard">, string> = {
    reports: "reports",
    requests: "requests",
    alerts: "emergency-alerts",
    risk: "risk-information",
    resources: "relief-resources",
    location: "location-sharing",
    profile: "profile",
  };

  return routes[section as Exclude<SectionId, "dashboard">];
};

const actionLabel = (section: SectionId, role: Role) => {
  if (section === "reports") {
    return role === "AffectedUser" ? "Report Disaster" : "Disaster Reports";
  }

  if (section === "requests") {
    return role === "AffectedUser"
      ? "My Requests"
      : role === "FieldVolunteer"
        ? "Assigned Requests"
        : "Assistance Requests";
  }

  if (section === "risk") return "Risk Information";
  if (section === "resources") return "Relief Resources";
  if (section === "location") return "Share Location";
  if (section === "alerts") return "View Alerts";

  return "Open Dashboard";
};

const actionDescription = (section: SectionId, role: Role) => {
  if (section === "reports") {
    return role === "AffectedUser"
      ? "Submit a disaster report"
      : "Review disaster reports";
  }

  if (section === "requests") {
    return role === "AffectedUser"
      ? "Track your assistance requests"
      : "Review response requests";
  }

  if (section === "risk") return "Review current AI risk intelligence";
  if (section === "resources") return "Find available relief resources";
  if (section === "location") return "Manage location sharing";
  if (section === "alerts") return "Check current safety alerts";

  return "Open your dashboard";
};

const actionIcon = (section: SectionId) => {
  if (section === "reports") return <AlertTriangleIcon />;
  if (section === "requests") return <ClipboardIcon />;
  if (section === "alerts") return <BellIcon />;
  if (section === "risk") return <ChartIcon />;
  if (section === "resources") return <LayersIcon />;
  if (section === "location") return <LocationIcon />;
  return <HomeIcon />;
};

const getRiskColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "low":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getSafetyBoxClass = (level: string) => {
  switch (level.toLowerCase()) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-800";
    case "high":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
};

const getStatusClass = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "in progress":
    case "processing":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getAlertType = (
  severity?: string
): "danger" | "warning" | "info" => {
  switch ((severity || "").toLowerCase()) {
    case "critical":
    case "high":
    case "danger":
      return "danger";
    case "medium":
    case "warning":
      return "warning";
    default:
      return "info";
  }
};

const Icon = ({
  children,
  size = 20,
}: {
  children: ReactNode;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const HomeIcon = () => (
  <Icon>
    <path d="m3 10 9-7 9 7" />
    <path d="M5 9v11h14V9" />
    <path d="M9 20v-6h6v6" />
  </Icon>
);

const AlertTriangleIcon = () => (
  <Icon>
    <path d="m10.3 3.7-8 14A2 2 0 0 0 4 20.7h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
);

const ClipboardIcon = () => (
  <Icon>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1" />
    <path d="M9 10h6" />
    <path d="M9 14h6" />
    <path d="M9 18h4" />
  </Icon>
);

const BellIcon = () => (
  <Icon>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </Icon>
);

const ChartIcon = () => (
  <Icon>
    <path d="M4 19V5" />
    <path d="M4 19h17" />
    <path d="m7 15 3-4 3 2 5-7" />
  </Icon>
);

const LayersIcon = () => (
  <Icon>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 16 9 5 9-5" />
  </Icon>
);

const LocationIcon = () => (
  <Icon>
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

const ShieldCheckIcon = () => (
  <Icon>
    <path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

const CloudIcon = () => (
  <Icon size={18}>
    <path d="M17.5 19H8a5 5 0 1 1 1.7-9.7A6 6 0 0 1 21 11.5 3.5 3.5 0 0 1 17.5 19Z" />
    <path d="M8 22h.01M12 22h.01M16 22h.01" />
  </Icon>
);

const WaterIcon = () => (
  <Icon size={18}>
    <path d="M3 8c3 0 3-2 6-2s3 2 6 2 3-2 6-2" />
    <path d="M3 13c3 0 3-2 6-2s3 2 6 2 3-2 6-2" />
    <path d="M3 18c3 0 3-2 6-2s3 2 6 2 3-2 6-2" />
  </Icon>
);

const DropIcon = () => (
  <Icon size={18}>
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
  </Icon>
);

const InfoIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </Icon>
);

export default UserDashboard;

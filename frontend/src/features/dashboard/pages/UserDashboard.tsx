import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import DisasterReportForm from "../components/DisasterReportForm";
import DisasterReportsPage from "../../disaster-reports/pages/DisasterReportsPage";
import api from "../../../lib/api/apiClient";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import ReliefRequestsPanel from "../components/ReliefRequestsPanel";
import { DashboardCard } from "../components/DashboardCard";
import { DisasterRiskMap } from "../components/DisasterRiskMap";
import { getUserProfile, updateUserProfile, getDisasterReports } from "../services/userDashboardApi";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import RiskPredictionPage from "../../risk-prediction/pages/RiskPredictionPage";
import ResourceOptimizationPage from "../../resource-optimization/pages/ResourceOptimizationPage";
import FieldVolunteerDisasterReports from "../components/FieldVolunteerDisasterReports";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
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
  | "profile"
  | "field";

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
  riskPredictionId?: string;
  vulnerabilityAssessmentId?: string;
  title?: string;
  message?: string;
  location?: string;
  disasterType?: string;
  severity?: string;
  status?: string;
  recommendedActions?: string;
  resourceSummary?: string;
  createdAt?: string;
  isActive?: boolean;
}

type DisasterReportRecord = {
  id?: string;
  disasterType?: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  severity?: string;
  status?: string;
  createdAt?: string;
  riskScore?: number;
  updatedAt?: string;
};
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
      "field",
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
  const [disasterReports, setDisasterReports] = useState<DisasterReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const currentSection = getCurrentSection(location.pathname);

  const hasPermission = (permission: string) =>
    (user?.permissions ?? []).includes(permission);

  const sectionPermission: Record<SectionId, string | null> = {
    dashboard: null,
    reports: "Report Disaster",
    requests: "Manage Relief Requests",
    alerts: "View Emergency Alerts",
    risk: "View Risk Information",
    resources: "Manage Relief Resources",
    location: "Share Location",
    profile: null,
    field: null,
  };

  const canAccessSection = (section: SectionId) => {
    const permission = sectionPermission[section];
    return permission === null || hasPermission(permission);
  };

  const goToPage = (section: SectionId) => {
    if (section === "dashboard") {
      navigate("/dashboard/user");
      return;
    }

    if (section === "requests" && role === "AffectedUser") {
      navigate("/dashboard/user/my-requests");
      return;
    }

    if (section === "reports" && role === "AffectedUser") {
      navigate("/dashboard/user/report-disaster");
      return;
    }

    if (!canAccessSection(section)) return;

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
      risk: "Risk Prediction",
      resources: "Relief Resources",
      location: "Location Sharing",
      field: "Field Operations",
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
      field: <AlertTriangleIcon />,
      profile: <UserIcon />,
    };

    return config.menu.filter(canAccessSection).map((id) => ({
      id,
      label: labels[id],
      icon: icons[id],
    }));
  }, [config.menu, role, user?.permissions]);

  useEffect(() => {
    let alive = true;

    const loadLiveData = async () => {
      setLoading(true);

      const results = await Promise.allSettled([
        api.get("/risk-predictions/history"),
        api.get("/relief-requests"),
        api.get("/emergency-alerts"),
        api.get("/resource-optimization/resources"),
      ]);

      if (!alive) return;

      const errors: string[] = [];

      const [riskResult, requestResult, alertResult, resourceResult] =
        results;

      if (riskResult.status === "fulfilled") {
        const raw = riskResult.value.data;

        const list =
          Array.isArray(raw)
            ? raw
            : raw &&
                typeof raw === "object" &&
                "items" in raw &&
                Array.isArray(
                  (raw as { items: unknown }).items
                )
              ? (raw as {
                  items: RiskPrediction[];
                }).items
              : raw
                ? [raw]
                : [];

        list.sort(
          (a, b) =>
            new Date(
              b.createdAt ?? 0
            ).getTime() -
            new Date(
              a.createdAt ?? 0
            ).getTime()
        );

        setLatestRisk(
          list[0] ?? null
        );
      } else {
        errors.push("Risk prediction service is unavailable.");
      }

      if (requestResult.status === "fulfilled") {
        const raw = requestResult.value.data;
        const list =
          Array.isArray(raw)
            ? raw
            : raw &&
                typeof raw === "object" &&
                "items" in raw &&
                Array.isArray((raw as { items: unknown }).items)
              ? (raw as { items: AssistanceRequest[] }).items
              : raw
                ? [raw]
                : [];

        setRequests(list as AssistanceRequest[]);
      } else {
        errors.push("Assistance request service is unavailable.");
      }

      if (alertResult.status === "fulfilled") {
        const raw = alertResult.value.data;
        const list =
          Array.isArray(raw)
            ? raw
            : raw &&
                typeof raw === "object" &&
                "items" in raw &&
                Array.isArray((raw as { items: unknown }).items)
              ? (raw as { items: EmergencyAlert[] }).items
              : raw
                ? [raw]
                : [];

        setAlerts(list as EmergencyAlert[]);
      } else {
        errors.push("Emergency alert service is unavailable.");
      }

      if (resourceResult.status === "fulfilled") {
        const raw = resourceResult.value.data;
        const list =
          Array.isArray(raw)
            ? raw
            : raw &&
                typeof raw === "object" &&
                "items" in raw &&
                Array.isArray((raw as { items: unknown }).items)
              ? (raw as { items: ReliefResource[] }).items
              : raw
                ? [raw]
                : [];

        setResources(list as ReliefResource[]);
      } else {
        errors.push("Relief resource service is unavailable.");
      }

      setLoading(false);
    };

    void loadLiveData();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (currentSection !== "alerts") return;

    let alive = true;

    const refreshAlerts = async () => {
      try {
        const response = await api.get("/emergency-alerts");
        if (!alive) return;

        const raw = response.data;
        const list =
          Array.isArray(raw)
            ? raw
            : raw &&
                typeof raw === "object" &&
                "items" in raw &&
                Array.isArray((raw as { items: unknown }).items)
              ? (raw as { items: EmergencyAlert[] }).items
              : raw
                ? [raw]
                : [];

        setAlerts(list as EmergencyAlert[]);
      } catch {
        // Keep the currently displayed alerts when a background refresh fails.
      }
    };

    const timer = window.setInterval(() => {
      void refreshAlerts();
    }, 10000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [currentSection]);

  useEffect(() => {
    let alive = true;

    const loadDisasterReports = async () => {
      try {
        const response = await getDisasterReports();

        if (!alive) return;

        const raw = response.data;

        const list = Array.isArray(raw)
          ? raw
          : raw &&
              typeof raw === "object" &&
              "items" in raw &&
              Array.isArray((raw as { items: unknown }).items)
            ? (raw as { items: DisasterReportRecord[] }).items
            : [];

        setDisasterReports(list);
      } catch {
        if (alive) {
          setDisasterReports([]);
        }
      }
    };

    void loadDisasterReports();

    return () => {
      alive = false;
    };
  }, []);
  const displayName = user?.fullName?.split(" ")[0] || "there";
  const score = numberValue(latestRisk?.riskScore);
  const riskLevel = latestRisk?.riskLevel || "No assessment";

  const latestRequests = requests
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )
    .slice(0, 3);

  const latestAlerts = alerts
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )
    .slice(0, 3);

  const activeRequestCount = requests.filter((item) =>
    ["pending", "open", "active", "inprogress", "assigned"].includes(
      String(item.status ?? "").toLowerCase(),
    ),
  ).length;

  const activeAlertCount = alerts.filter((item) =>
    ["critical", "high", "medium", "warning"].includes(
      String(item.severity ?? "").toLowerCase(),
    ),
  ).length;

  const userRiskImage =
    {
      flood: "/assets/disasters/flood.jpg",
      landslide: "/assets/disasters/landslide.jpg",
      drought: "/assets/disasters/drought.jpg",
      storm: "/assets/disasters/cyclone.jpg",
      cyclone: "/assets/disasters/cyclone.jpg",
      tsunami: "/assets/disasters/tsunami.jpg",
      wildfire: "/assets/disasters/wildfire.jpg",
      "forest fire": "/assets/disasters/wildfire.jpg",
      earthquake: "/assets/disasters/earthquake.jpg",
      "extreme cold": "/assets/disasters/cold-wave.jpg",
      lightning: "/assets/disasters/lightning.jpg",
    }[String(latestRisk?.disasterType ?? "").toLowerCase()] ??
    "/assets/disasters/flood.jpg";

  const latestRiskScore =
    score === null ? null : Math.max(0, Math.min(100, score));

  const latestRiskTone =
    latestRiskScore === null
      ? "blue"
      : latestRiskScore >= 75
        ? "red"
        : latestRiskScore >= 50
          ? "amber"
          : "green";

  return (
    <DashboardLayout
      sidebarItems={sidebarItems.map((item) => ({
        label: item.label,
        icon: item.icon,
        active: currentSection === item.id,
        onClick: () => goToPage(item.id),
      }))}
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0,#f1f5fa_42%,#eaf0f8_100%)]">
        <div className="mx-auto w-full max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          {currentSection === "dashboard" && (
            <>
              {/* ==========================================================
                  REFERENCE-STYLE HERO
                 ========================================================== */}
              <section
                className="relative mb-5 overflow-hidden rounded-[24px] bg-[#0f2347] px-6 py-6 text-white shadow-[0_18px_45px_rgba(15,35,71,0.14)] sm:px-8 lg:px-9"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg,rgba(7,27,61,.94),rgba(10,38,78,.72) 45%,rgba(10,38,78,.24)),url('/assets/disasters/flood.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="relative z-10 flex min-h-[165px] flex-col justify-between gap-7 lg:flex-row lg:items-end">
                  <div className="max-w-[650px]">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-100 backdrop-blur">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                      {config.badge}
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-[34px]">
                      Good morning, {displayName}!
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                      Stay informed, report emergencies, request assistance,
                      and monitor the latest safety information.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      {config.quickActions
                        .filter(canAccessSection)
                        .slice(0, 2)
                        .map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => goToPage(action)}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#10264b] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                          >
                            {actionIcon(action)}
                            {actionLabel(action, role)}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Live risk / weather summary */}
                  <div className="flex w-full max-w-[430px] gap-3">
                    <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200">
                        Current conditions
                      </p>

                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-3xl font-extrabold">
                            {latestRisk?.temperature != null
                              ? `${latestRisk.temperature} C`
                              : "N/A"}
                          </p>

                          <p className="mt-1 text-[11px] text-blue-100/70">
                            {latestRisk?.location || "Current location"}
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-100">
                          <LayersIcon />
                        </div>
                      </div>

                      <p className="mt-3 text-[10px] text-blue-100/55">
                        Latest available risk assessment data
                      </p>
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200">
                            Current risk level
                          </p>

                          <p className="mt-2 text-2xl font-extrabold">
                            {riskLevel}
                          </p>

                          <p className="mt-1 text-[11px] text-blue-100/70">
                            {latestRisk?.disasterType || "No current assessment"}
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                          <ShieldCheckIcon />
                        </div>
                      </div>

                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{
                            width: `${Math.min(
                              Math.max(score ?? 0, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="mt-1.5 flex justify-between text-[9px] text-blue-100/55">
                        <span>Risk score</span>
                        <span>
                          {score !== null ? `${score}%` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
{/* ==========================================================
                  REFERENCE KPI CARDS
                 ========================================================== */}
              <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => goToPage("alerts")}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                      <BellIcon />
                    </div>

                    <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600">
                      LIVE
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    Active Alerts
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {loading ? "..." : alerts.length}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {alerts.length
                      ? "Live alerts available"
                      : "No alerts available"}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => goToPage("requests")}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <ClipboardIcon />
                    </div>

                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-600">
                      REQUESTS
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    My Requests
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {loading ? "..." : requests.length}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {requests.length
                      ? "Requests available"
                      : "No requests available"}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => goToPage("resources")}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <LayersIcon />
                    </div>

                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                      NEARBY
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    Nearby Resources
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {loading ? "..." : resources.length}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {resources.length
                      ? "Resources available"
                      : "No resources available"}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => goToPage("risk")}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <ShieldCheckIcon />
                    </div>

                    <span className="rounded-full bg-purple-50 px-2 py-1 text-[9px] font-bold text-purple-600">
                      AI
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    Current Risk
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {loading ? "..." : riskLevel}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {score !== null
                      ? `${score}% risk score`
                      : "No score available"}
                  </p>
                </button>
              </section>

              {/* PREMIUM RESPONSE PULSE */}
              <section className="mb-5 overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_12px_35px_rgba(15,35,71,.07)]">
                <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => goToPage("alerts")}
                    className="group p-5 text-left transition hover:bg-red-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Response pulse
                      </span>
                      <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_9px_rgba(239,68,68,.65)]" />
                    </div>
                    <p className="mt-3 text-xl font-black text-slate-900">
                      {activeAlertCount}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      active alert{activeAlertCount === 1 ? "" : "s"}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToPage("requests")}
                    className="group p-5 text-left transition hover:bg-blue-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Assistance
                      </span>
                      <ClipboardIcon />
                    </div>
                    <p className="mt-3 text-xl font-black text-slate-900">
                      {activeRequestCount}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      active request{activeRequestCount === 1 ? "" : "s"}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToPage("risk")}
                    className="group p-5 text-left transition hover:bg-purple-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        AI intelligence
                      </span>
                      <span className="rounded-full bg-purple-50 px-2 py-1 text-[8px] font-black text-purple-600">
                        LIVE
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-black text-slate-900">
                      {latestRiskScore !== null ? `${latestRiskScore}%` : "N/A"}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {riskLevel}
                    </p>
                  </button>

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Network status
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-600">
                        REAL DATA
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-black text-slate-900">
                      {resources.length}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      nearby resource{resources.length === 1 ? "" : "s"} available
                    </p>
                  </div>
                </div>
              </section>

              {/* ==========================================================
                  MAP + RECENT ALERTS
                 ========================================================== */}
              <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
                <DashboardCard
                  title="Live Disaster Risk Map"
                  subtitle="Real disaster reports and risk locations"
                  action={
                    <button
                      type="button"
                      onClick={() => goToPage("risk")}
                      className="text-xs font-bold text-blue-600 transition hover:text-blue-700"
                    >
                      View Full Map {"->"}
                    </button>
                  }
                >
                  <DisasterRiskMap reports={disasterReports} />
                </DashboardCard>

                <DashboardCard
                  title="Recent Alerts"
                  subtitle="Latest emergency alerts returned by the system"
                  action={
                    <button
                      type="button"
                      onClick={() => goToPage("alerts")}
                      className="text-xs font-bold text-blue-600 transition hover:text-blue-700"
                    >
                      View All {"->"}
                    </button>
                  }
                >
                  {loading ? (
                    <div className="flex min-h-[230px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-sm text-slate-400">
                      Loading live alerts...
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="flex min-h-[230px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                      <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                          <BellIcon />
                        </div>

                        <p className="mt-3 text-sm font-bold text-slate-700">
                          No recent alerts
                        </p>

                        <p className="mt-1 max-w-[230px] text-xs leading-5 text-slate-400">
                          No emergency alerts have been returned by the API.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.slice(0, 4).map((alert, index) => {
                        const severity =
                          String(alert.severity || "Info").toLowerCase();

                        const tone =
                          severity.includes("critical") ||
                          severity.includes("high")
                            ? {
                                icon: "bg-red-50 text-red-500",
                                badge: "bg-red-50 text-red-600",
                              }
                            : severity.includes("medium")
                              ? {
                                  icon: "bg-orange-50 text-orange-500",
                                  badge: "bg-orange-50 text-orange-600",
                                }
                              : {
                                  icon: "bg-blue-50 text-blue-500",
                                  badge: "bg-blue-50 text-blue-600",
                                };

                        return (
                          <div
                            key={alert.id ?? index}
                            className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                          >
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
                            >
                              <BellIcon />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate text-sm font-bold text-slate-800">
                                  {alert.title || "Emergency Alert"}
                                </p>

                                <span
                                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${tone.badge}`}
                                >
                                  {alert.severity || "Info"}
                                </span>
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {alert.message || "No alert message available."}
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-slate-400">
                                <span>
                                  {alert.location || "Location unavailable"}
                                </span>

                                <span>
                                  {alert.createdAt
                                    ? new Date(
                                        alert.createdAt
                                      ).toLocaleString()
                                    : "Time unavailable"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DashboardCard>
              </section>

              {/* ==========================================================
                  LATEST RISK INTELLIGENCE
                 ========================================================== */}
              <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                <article className="group relative min-h-[250px] overflow-hidden rounded-[28px] bg-slate-950 shadow-[0_18px_50px_rgba(15,35,71,.12)]">
                  <img
                    src={userRiskImage}
                    alt={`${latestRisk?.disasterType || "Disaster"} risk intelligence`}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = "/assets/disasters/flood.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/58 to-slate-950/18" />
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/40 to-transparent" />

                  <div className="relative flex min-h-[250px] flex-col justify-between p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[.22em] text-blue-200">
                          Latest AI intelligence
                        </p>
                        <p className="mt-2 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[8px] font-black text-white backdrop-blur">
                          {latestRisk?.disasterType || "No current assessment"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1.5 text-[8px] font-black uppercase ${
                          latestRiskTone === "red"
                            ? "bg-red-500/15 text-red-200 ring-1 ring-red-300/20"
                            : latestRiskTone === "amber"
                              ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/20"
                              : latestRiskTone === "green"
                                ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/20"
                                : "bg-blue-400/15 text-blue-100 ring-1 ring-blue-300/20"
                        }`}
                      >
                        {riskLevel}
                      </span>
                    </div>

                    <div className="max-w-xl">
                      <p className="text-[8px] font-black uppercase tracking-[.18em] text-slate-300">
                        Current risk location
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                        {latestRisk?.location || "Location not available"}
                      </h2>
                      <p className="mt-2 max-w-lg text-[10px] leading-5 text-slate-200/85">
                        {latestRisk?.recommendation ||
                          "Your latest risk intelligence and operational recommendation will appear here when an assessment is available."}
                      </p>

                      <div className="mt-5 grid max-w-lg grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                          <p className="text-[7px] font-black uppercase tracking-wider text-slate-400">
                            Risk score
                          </p>
                          <p className="mt-1 text-xl font-black text-white">
                            {latestRiskScore === null
                              ? "N/A"
                              : latestRiskScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                          <p className="text-[7px] font-black uppercase tracking-wider text-slate-400">
                            Confidence
                          </p>
                          <p className="mt-1 text-xl font-black text-white">
                            {latestRisk?.confidence != null
                              ? `${Math.round(latestRisk.confidence)}%`
                              : "N/A"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                          <p className="text-[7px] font-black uppercase tracking-wider text-slate-400">
                            Updated
                          </p>
                          <p className="mt-1 text-[10px] font-black text-white">
                            {latestRisk?.createdAt
                              ? new Date(latestRisk.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <DashboardCard
                  title="My Activity Snapshot"
                  subtitle="Live requests, alerts and resource availability"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Active Requests",
                        value: activeRequestCount,
                        note: `${requests.length} total requests`,
                        icon: <ClipboardIcon />,
                        tone: "bg-blue-50 text-blue-600",
                      },
                      {
                        label: "Active Alerts",
                        value: activeAlertCount,
                        note: `${alerts.length} alerts returned`,
                        icon: <BellIcon />,
                        tone: "bg-red-50 text-red-600",
                      },
                      {
                        label: "Relief Resources",
                        value: resources.length,
                        note: resources.length ? "Live API results" : "No results returned",
                        icon: <LayersIcon />,
                        tone: "bg-emerald-50 text-emerald-600",
                      },
                      {
                        label: "Mapped Reports",
                        value: disasterReports.filter(
                          (item) =>
                            Number.isFinite(Number(item.latitude)) &&
                            Number.isFinite(Number(item.longitude)),
                        ).length,
                        note: `${disasterReports.length} reports loaded`,
                        icon: <LocationIcon />,
                        tone: "bg-violet-50 text-violet-600",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}
                          >
                            {item.icon}
                          </span>
                          <span className="text-xl font-black text-slate-900">
                            {item.value}
                          </span>
                        </div>
                        <p className="mt-4 text-[8px] font-black uppercase tracking-[.14em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[9px] font-medium text-slate-500">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">
                          Latest request activity
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {latestRequests[0]?.title || latestRequests[0]?.type || "No recent request"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToPage("requests")}
                        className="rounded-xl bg-blue-50 px-3 py-2 text-[8px] font-black text-blue-700"
                      >
                        Open
                      </button>
                    </div>
                    <p className="mt-1 text-[9px] text-slate-400">
                      {latestRequests[0]?.status || "No request status available"}
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">
                          Latest safety alert
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {latestAlerts[0]?.title || "No active alert"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToPage("alerts")}
                        className="rounded-xl bg-red-50 px-3 py-2 text-[8px] font-black text-red-700"
                      >
                        View
                      </button>
                    </div>
                    <p className="mt-1 truncate text-[9px] text-slate-400">
                      {latestAlerts[0]?.location ||
                        latestAlerts[0]?.message ||
                        "No alert location available"}
                    </p>
                  </div>
                </DashboardCard>
              </section>

            </>
          )}
                    {currentSection === "reports" && (
            role === "AffectedUser" ? (
              <DisasterReportForm />
            ) : (
              <DisasterReportsPage />
            )
          )}

          {currentSection === "field" && role === "FieldVolunteer" && (
            <FieldVolunteerDisasterReports />
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
                <ReliefRequestsPanel
                  initialRequests={requests}
                  loading={loading}
                  canCreate={role === "AffectedUser"}
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
              <RiskPredictionPage />
            )}

            {currentSection === "resources" && (
              <ResourceOptimizationPage />
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
            <ProfilePage user={user} />
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
  <section className="mt-1">
    <div className="mb-5 flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
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

const AlertsContent = ({
  alerts,
  loading,
}: {
  alerts: EmergencyAlert[];
  loading: boolean;
}) => {
  const [selectedAlert, setSelectedAlert] =
    useState<EmergencyAlert | null>(null);

  if (loading) return <LoadingState />;

  if (!alerts.length) {
    return (
      <EmptyState text="No active emergency alerts are currently available for your account." />
    );
  }

  const severityTone =
    selectedAlert?.severity?.toLowerCase() === "critical"
      ? "border-red-200 bg-red-50 text-red-700"
      : selectedAlert?.severity?.toLowerCase() === "high"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : selectedAlert?.severity?.toLowerCase() === "medium"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <>
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const severity = alert.severity || "Info";

          return (
            <article
              key={alert.id ?? index}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    severity.toLowerCase() === "critical"
                      ? "bg-red-100 text-red-700"
                      : severity.toLowerCase() === "high"
                        ? "bg-orange-100 text-orange-700"
                        : severity.toLowerCase() === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <BellIcon />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900">
                        {alert.title || "Emergency alert"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {alert.message || "No alert message available."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${getSeverityBadgeClass(
                          severity,
                        )}`}
                      >
                        {severity}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600">
                        {alert.status || (alert.isActive ? "Active" : "Inactive")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-slate-400">
                    <span>{alert.location || "Location unavailable"}</span>
                    <span>{alert.disasterType || "Disaster type unavailable"}</span>
                    <span>{formatDate(alert.createdAt)}</span>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAlert(alert)}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                    >
                      View Full Alert
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Emergency warning
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                  {selectedAlert.title || "Emergency alert"}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase ${severityTone}`}
                  >
                    {selectedAlert.severity || "Info"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black uppercase text-slate-600">
                    {selectedAlert.status ||
                      (selectedAlert.isActive ? "Active" : "Inactive")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close alert details"
              >
                
              </button>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <AlertDetail label="Location" value={selectedAlert.location} />
                <AlertDetail
                  label="Disaster Type"
                  value={selectedAlert.disasterType}
                />
                <AlertDetail
                  label="Issued"
                  value={
                    selectedAlert.createdAt
                      ? formatDate(selectedAlert.createdAt)
                      : undefined
                  }
                />
                <AlertDetail
                  label="Alert Status"
                  value={
                    selectedAlert.status ||
                    (selectedAlert.isActive ? "Active" : "Inactive")
                  }
                />
              </div>

              <section className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-red-600">
                  Alert message
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">
                  {selectedAlert.message || "No alert message available."}
                </p>
              </section>

              <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">
                  Recommended actions
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">
                  {selectedAlert.recommendedActions ||
                    "No response actions were provided with this alert."}
                </p>
              </section>

              <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600">
                  Resource coordination
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">
                  {selectedAlert.resourceSummary ||
                    "No resource coordination summary was provided with this alert."}
                </p>
              </section>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Alert reference
                </p>
                <p className="mt-1 break-all text-[10px] text-slate-600">
                  {selectedAlert.id || "Reference unavailable"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const AlertDetail = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-slate-900">
      {value || "Not available"}
    </p>
  </div>
);

const getSeverityBadgeClass = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
};


const ProfilePage = ({
  user,
}: {
  user: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    createdAt?: string;
  } | null;
}) => {
  const [profile, setProfile] = useState({
    id: user?.id || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    role: user?.role || "AffectedUser",
    isActive: user?.isActive !== false,
    createdAt: user?.createdAt || "",
  });

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  const [mapPosition, setMapPosition] =
    useState<[number, number]>([7.8731, 80.7718]);

  const [locationLabel, setLocationLabel] = useState("Sri Lanka");
  const [locationStatus, setLocationStatus] =
    useState("Click the map to select a location.");

  const roleLabel =
    profile.role === "FieldVolunteer"
      ? "Field Volunteer"
      : profile.role === "ReliefCoordinator"
        ? "Relief Coordinator"
        : profile.role === "SystemAdministrator"
          ? "System Administrator"
          : "Affected User";

  const memberSince =
    profile.createdAt &&
    !Number.isNaN(new Date(profile.createdAt).getTime())
      ? new Date(profile.createdAt).toLocaleDateString()
      : "Not available";

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "AU";

  useEffect(() => {
    if (!profile.id) return;

    try {
      const stored = localStorage.getItem(
        `reliefnexus.profile.photo.${profile.id}`,
      );
      setProfilePhoto(stored || "");
    } catch {
      setProfilePhoto("");
    }
  }, [profile.id]);

  useEffect(() => {
    let alive = true;

    const loadProfile = async () => {
      setLoadingProfile(true);
      setError("");

      try {
        const token = localStorage.getItem("token");

        let tokenUser: {
          id?: string;
          fullName?: string;
          email?: string;
          role?: string;
        } | null = null;

        if (token) {
          try {
            const parts = token.split(".");

            if (parts.length >= 2) {
              const base64 = parts[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");

              const json = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map(
                    (char) =>
                      "%" +
                      ("00" + char.charCodeAt(0).toString(16)).slice(-2)
                  )
                  .join("")
              );

              const payload = JSON.parse(json);

              tokenUser = {
                id: payload.sub || "",
                fullName: payload.name || "",
                email:
                  payload.email ||
                  payload[
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                  ] ||
                  "",
                role:
                  payload.role ||
                  payload[
                    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                  ] ||
                  "",
              };
            }
          } catch {
            tokenUser = null;
          }
        }

        const userId = user?.id || tokenUser?.id || "";

        const fallback = {
          id: userId,
          fullName: user?.fullName || tokenUser?.fullName || "",
          email: user?.email || tokenUser?.email || "",
          role: user?.role || tokenUser?.role || "AffectedUser",
          isActive: user?.isActive !== false,
          createdAt: user?.createdAt || "",
        };

        if (alive) {
          setProfile(fallback);
          setForm({
            fullName: fallback.fullName,
            email: fallback.email,
          });
        }

        if (userId) {
          try {
            const response = await getUserProfile(userId);
            const data = response.data;

            if (!alive) return;

            const latest = {
              id: data?.id || userId,
              fullName: data?.fullName || fallback.fullName || "Affected User",
              email: data?.email || fallback.email || "No email available",
              role: data?.role || fallback.role || "AffectedUser",
              isActive: data?.isActive !== false,
              createdAt: data?.createdAt || fallback.createdAt || "",
            };

            setProfile(latest);
            setForm({
              fullName: latest.fullName,
              email: latest.email,
            });
          } catch {
            // Keep authenticated fallback data.
          }
        }
      } finally {
        if (alive) setLoadingProfile(false);
      }
    };

    void loadProfile();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const handleProfilePhotoUpload = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photos must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      if (!result) {
        setError("The selected image could not be loaded.");
        return;
      }

      setProfilePhoto(result);

      if (profile.id) {
        try {
          localStorage.setItem(
            `reliefnexus.profile.photo.${profile.id}`,
            result,
          );
        } catch {
          setError(
            "The image could not be stored on this device. Please try a smaller image.",
          );
          return;
        }
      }

      setError("");
      setSuccess("Profile photo updated on this device.");
      event.target.value = "";
    };

    reader.onerror = () => {
      setError("The selected image could not be loaded.");
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const removeProfilePhoto = () => {
    setProfilePhoto("");

    if (profile.id) {
      try {
        localStorage.removeItem(`reliefnexus.profile.photo.${profile.id}`);
      } catch {
        // Ignore local storage cleanup errors.
      }
    }

    setSuccess("Profile photo removed.");
  };

  const openEditProfile = () => {
    setForm({
      fullName: profile.fullName,
      email: profile.email,
    });
    setSuccess("");
    setError("");
    setEditOpen(true);
  };

  const closeEditProfile = () => {
    if (saving) return;
    setForm({
      fullName: profile.fullName,
      email: profile.email,
    });
    setError("");
    setEditOpen(false);
  };

  const handleSave = async () => {
    if (!profile.id) {
      setError("User account ID is unavailable.");
      return;
    }

    const fullName = form.fullName.trim();
    const email = form.email.trim();

    if (!fullName) {
      setError("Full name is required.");
      return;
    }

    if (!email) {
      setError("Email address is required.");
      return;
    }

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const response = await updateUserProfile(profile.id, {
        fullName,
        email,
        role: profile.role,
        isActive: profile.isActive,
      });

      const data = response.data;

      const updated = {
        ...profile,
        fullName: data?.fullName || fullName,
        email: data?.email || email,
      };

      setProfile(updated);
      setForm({
        fullName: updated.fullName,
        email: updated.email,
      });
      setEditOpen(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      console.error("Profile update failed:", err);

      const message =
        (err as { response?: { data?: { message?: string; title?: string } } })
          ?.response?.data?.message ||
        (err as { response?: { data?: { title?: string } } })?.response?.data
          ?.title ||
        "Profile could not be updated.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleMapSelect = (latitude: number, longitude: number) => {
    setMapPosition([latitude, longitude]);
    setLocationLabel("Selected map location");
    setLocationStatus("Location selected successfully.");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by this browser.");
      return;
    }

    setLocationStatus("Requesting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapPosition([position.coords.latitude, position.coords.longitude]);
        setLocationLabel("Current browser location");
        setLocationStatus("Your current location is shown on the map.");
      },
      () => {
        setLocationStatus("Location permission was not granted.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <section className="relative mt-1">
      <div className="mx-auto w-full max-w-[1540px] px-4 pb-10 sm:px-6 lg:px-8">

        {/* Premium page header */}
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-blue-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.7)]" />
              Account
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Profile
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage your ReliefNexus identity, account security and operational profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                Member since
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">{memberSince}</p>
            </div>
            <div className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 sm:block">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-emerald-600">
                Account state
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-black text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {profile.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </div>

        {loadingProfile && (
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Loading profile...
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <ProfileCheckIcon />
            {success}
          </div>
        )}

        {error && !editOpen && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <ProfileInfoIcon />
            {error}
          </div>
        )}

        {/* Premium identity hero */}
        <section className="relative mb-5 overflow-hidden rounded-[30px] border border-slate-200 bg-[#071c3a] shadow-[0_20px_55px_rgba(15,35,71,.16)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(34,211,238,.28),transparent_28%),radial-gradient(circle_at_10%_100%,rgba(37,99,235,.35),transparent_35%)]" />
          <div className="absolute right-[-90px] top-[-120px] h-[340px] w-[340px] rounded-full border border-white/10" />
          <div className="absolute right-[-20px] top-[-50px] h-[250px] w-[250px] rounded-full border border-cyan-300/10" />

          <div className="relative grid min-h-[280px] gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:p-10">
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
                  <ShieldCheckIcon />
                  Verified community account
                </div>

                <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[30px] border border-white/20 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-400 text-3xl font-black text-white shadow-2xl ring-8 ring-white/5">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt={`${profile.fullName || "User"} profile`}
                          className="h-full w-full object-cover"
                          onError={() => setProfilePhoto("")}
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <span
                      className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-[#102c54] ${
                        profile.isActive ? "bg-emerald-400" : "bg-slate-400"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                      {roleLabel}
                    </p>
                    <h2 className="mt-1 truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {profile.fullName || "Affected User"}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-blue-100/70">
                      <ProfileEmailIcon />
                      <span className="truncate">{profile.email || "No email available"}</span>
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black text-white ring-1 ring-white/10">
                        {profile.isActive ? "ACTIVE ACCOUNT" : "INACTIVE ACCOUNT"}
                      </span>
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-[9px] font-black text-cyan-200 ring-1 ring-cyan-300/15">
                        RELIEFNEXUS MEMBER
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-8 max-w-2xl text-xs leading-5 text-blue-100/60">
                Your authenticated identity connects your account to ReliefNexus safety,
                risk intelligence and community response services.
              </p>
            </div>

            <div className="flex min-w-[260px] flex-col justify-between rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-cyan-200">
                  Account overview
                </p>

                <div className="mt-5 space-y-3">
                  <ProfileHeroMetric label="Access role" value={roleLabel} />
                  <ProfileHeroMetric label="Member since" value={memberSince} />
                  <ProfileHeroMetric
                    label="Account status"
                    value={profile.isActive ? "Active" : "Inactive"}
                    tone={profile.isActive ? "green" : "slate"}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <label
                  htmlFor="profile-photo-upload"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#0b2850] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <ProfileCameraIcon />
                  {profilePhoto ? "Change Photo" : "Add Photo"}
                </label>

                <input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleProfilePhotoUpload}
                />

                {profilePhoto ? (
                  <button
                    type="button"
                    onClick={removeProfilePhoto}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Remove Photo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openEditProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    <ProfileEditIcon />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* KPI strip */}
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <ProfileKpi
            label="Account role"
            value={roleLabel}
            note="Authorized ReliefNexus access"
            icon={<UserIcon />}
            tone="blue"
          />
          <ProfileKpi
            label="Account status"
            value={profile.isActive ? "Active" : "Inactive"}
            note="Current account availability"
            icon={<ShieldCheckIcon />}
            tone="green"
          />
          <ProfileKpi
            label="Membership"
            value={memberSince}
            note="Profile registration date"
            icon={<ProfileCheckIcon />}
            tone="violet"
          />
        </section>

        {/* Profile identity workspace */}
        <section className="mb-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-blue-100 to-cyan-50 text-2xl font-black text-blue-600 ring-1 ring-blue-100">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={() => setProfilePhoto("")}
                    />
                  ) : (
                    initials
                  )}
                  <span
                    className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white ${
                      profile.isActive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                </div>

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Profile identity
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Personalize your account
                  </h3>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                    Add a profile photo to make your ReliefNexus identity easier to recognize.
                  </p>
                </div>
              </div>

              <label
                htmlFor="profile-photo-upload-secondary"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <ProfileCameraIcon />
                {profilePhoto ? "Change Photo" : "Upload Photo"}
              </label>

              <input
                id="profile-photo-upload-secondary"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleProfilePhotoUpload}
              />
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-gradient-to-br from-[#09264c] to-[#125fc9] p-5 text-white shadow-[0_14px_35px_rgba(15,65,140,.16)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-cyan-200">
                  Profile readiness
                </p>
                <h3 className="mt-1 text-lg font-black">Keep your identity complete</h3>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black">
                {Math.round(
                  ([profile.fullName, profile.email, profile.role, profilePhoto].filter(Boolean).length / 4) * 100,
                )}%
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-white transition-all"
                style={{
                  width: `${Math.round(
                    ([profile.fullName, profile.email, profile.role, profilePhoto].filter(Boolean).length / 4) * 100,
                  )}%`,
                }}
              />
            </div>

            <p className="mt-3 text-[10px] leading-5 text-blue-100/75">
              Your name, email, role and profile photo make up the visible account identity.
            </p>
          </div>
        </section>

        {/* Main content */}
        <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr_1fr]">

          <section className="rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,35,71,.07)]">
            <ProfileSectionHeader
              icon={<UserIcon />}
              title="Personal Information"
              subtitle="Verified account details"
              tone="blue"
            />
            <div className="px-6 py-2">
              <ProfileDetailRow label="Full Name" value={profile.fullName || "Not available"} />
              <ProfileDetailRow label="Email Address" value={profile.email || "Not available"} />
              <ProfileDetailRow label="Role" value={roleLabel} />
              <ProfileDetailRow label="Member Since" value={memberSince} />
              <ProfileDetailRow
                label="Account Status"
                value={profile.isActive ? "Active" : "Inactive"}
                valueClassName={profile.isActive ? "text-emerald-600" : "text-slate-500"}
                last
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,35,71,.07)]">
            <ProfileSectionHeader
              icon={<LocationIcon />}
              title="Operational Location"
              subtitle="Select the location used for response workflows"
              tone="cyan"
              action={
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[10px] font-black text-cyan-700 transition hover:bg-cyan-100"
                >
                  Use My Location
                </button>
              }
            />

            <div className="p-4">
              <div className="h-[360px] overflow-hidden rounded-2xl border border-slate-200">
                <MapContainer
                  center={mapPosition}
                  zoom={13}
                  scrollWheelZoom
                  className="!h-full !w-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ProfileMapClick onSelect={handleMapSelect} />
                  <CircleMarker
                    center={mapPosition}
                    radius={9}
                    pathOptions={{
                      color: "#2563eb",
                      fillColor: "#2563eb",
                      fillOpacity: 0.85,
                    }}
                  >
                    <Popup>
                      {locationLabel}
                      <br />
                      {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
                    </Popup>
                  </CircleMarker>
                </MapContainer>
              </div>

              <div className="mt-3 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm">
                    <LocationIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-cyan-600">
                      Selected location
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-800">{locationLabel}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">{locationStatus}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,35,71,.07)]">
            <ProfileSectionHeader
              icon={<ShieldCheckIcon />}
              title="Account & Access"
              subtitle="Identity and security status"
              tone="green"
            />

            <div className="space-y-3 p-5">
              <ProfileAccessCard
                label="Account type"
                value={roleLabel}
                icon={<UserIcon />}
              />
              <ProfileAccessCard
                label="Account status"
                value={profile.isActive ? "Active" : "Inactive"}
                icon={<ShieldCheckIcon />}
                green={profile.isActive}
              />

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <ProfileInfoIcon />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">ReliefNexus Account</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Your authenticated account is connected to the ReliefNexus user record.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <ProfileLockIcon />
                  </span>
                  <div>
                    <p className="text-xs font-black text-emerald-800">Protected access</p>
                    <p className="mt-0.5 text-[10px] text-emerald-700/70">
                      Authenticated account protection is enabled.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Quick actions */}
        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
                Account workspace
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Quick Actions</h3>
              <p className="mt-1 text-xs text-slate-500">
                Common actions for managing your ReliefNexus account.
              </p>
            </div>
            <span className="hidden rounded-full bg-slate-50 px-3 py-1.5 text-[9px] font-black text-slate-500 sm:inline-flex">
              {roleLabel}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ProfileQuickAction
              title="Edit Profile"
              description="Update your name and email address."
              icon={<ProfileEditIcon />}
              tone="blue"
              onClick={openEditProfile}
            />
            <ProfileQuickAction
              title="Account Security"
              description="Review your authenticated account state."
              icon={<ProfileLockIcon />}
              tone="indigo"
            />
            <ProfileQuickAction
              title="Account Status"
              description={`Your account is currently ${profile.isActive ? "active." : "inactive."}`}
              icon={<ProfileCheckIcon />}
              tone="green"
            />
            <ProfileQuickAction
              title="Location"
              description="Use the operational map to select a location."
              icon={<LocationIcon />}
              tone="cyan"
              onClick={useCurrentLocation}
            />
          </div>
        </section>

        {/* Security footer */}
        <section className="mt-5 overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-sm">
          <div className="relative p-6 sm:p-7">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-100/60 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldCheckIcon />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-emerald-600">
                    Security status
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Your account is protected
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Authentication and account protection are enabled.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Protected
              </span>
            </div>
          </div>
        </section>

        <div className="py-7 text-center">
          <p className="text-xs font-black text-slate-700">ReliefNexus</p>
          <p className="mt-1 text-[10px] text-slate-400">
            Safer Communities. Stronger Tomorrow.
          </p>
        </div>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditProfile();
          }}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/50 bg-white shadow-[0_30px_90px_rgba(2,12,31,.28)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <div className="bg-gradient-to-r from-[#09254b] via-blue-700 to-cyan-500 px-6 py-6 text-white sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-100">
                    Account settings
                  </p>
                  <h2 id="edit-profile-title" className="mt-1 text-2xl font-black">
                    Edit Profile
                  </h2>
                  <p className="mt-1 text-xs text-blue-100/80">
                    Update your personal account information.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditProfile}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 disabled:opacity-50"
                  aria-label="Close edit profile"
                >
                  
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-7">
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <ProfileInfoIcon />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="profile-full-name"
                  className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon />
                  </div>
                  <input
                    id="profile-full-name"
                    type="text"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Enter your full name"
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <ProfileEmailIcon />
                  </div>
                  <input
                    id="profile-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 text-lg font-black text-blue-600">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800">Profile Photo</p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      JPG, PNG, WEBP or GIF  maximum 5 MB  stored on this device.
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label
                    htmlFor="profile-photo-upload-modal"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-blue-700"
                  >
                    <ProfileCameraIcon />
                    Choose Photo
                  </label>
                  <input
                    id="profile-photo-upload-modal"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleProfilePhotoUpload}
                  />
                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={removeProfilePhoto}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">
                      Account Role
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-800">{roleLabel}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black text-blue-700 shadow-sm">
                    Read only
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={closeEditProfile}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ProfileCheckIcon />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const ProfileHeroMetric = ({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "green" | "slate";
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
    <p className="text-[8px] font-black uppercase tracking-wider text-blue-100/50">{label}</p>
    <p
      className={`mt-1 text-xs font-black ${
        tone === "green"
          ? "text-emerald-300"
          : tone === "slate"
            ? "text-slate-300"
            : "text-white"
      }`}
    >
      {value}
    </p>
  </div>
);

const ProfileKpi = ({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone: "blue" | "green" | "violet";
}) => {
  const styles = {
    blue: "border-blue-100 bg-gradient-to-br from-blue-50 to-white text-blue-600",
    green: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-600",
    violet: "border-violet-100 bg-gradient-to-br from-violet-50 to-white text-violet-600",
  }[tone];

  return (
    <div className={`rounded-[22px] border p-5 shadow-sm ${styles}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
          {icon}
        </div>
        <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      </div>
      <p className="mt-4 text-[8px] font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-base font-black text-slate-900">{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{note}</p>
    </div>
  );
};

const ProfileSectionHeader = ({
  icon,
  title,
  subtitle,
  tone,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone: "blue" | "cyan" | "green";
  action?: ReactNode;
}) => {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    cyan: "bg-cyan-50 text-cyan-600",
    green: "bg-emerald-50 text-emerald-600",
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-black text-slate-900">{title}</h3>
          <p className="text-[10px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
};

const ProfileAccessCard = ({
  label,
  value,
  icon,
  green = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  green?: boolean;
}) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-1 text-sm font-black ${green ? "text-emerald-600" : "text-slate-900"}`}>
          {value}
        </p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        {icon}
      </div>
    </div>
  </div>
);

const ProfileQuickAction = ({
  title,
  description,
  icon,
  tone,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  tone: "blue" | "indigo" | "green" | "cyan";
  onClick?: () => void;
}) => {
  const styles = {
    blue: "border-blue-100 bg-blue-50/60 text-blue-600",
    indigo: "border-indigo-100 bg-indigo-50/60 text-indigo-600",
    green: "border-emerald-100 bg-emerald-50/60 text-emerald-600",
    cyan: "border-cyan-100 bg-cyan-50/60 text-cyan-600",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group rounded-[20px] border p-5 text-left transition ${
        styles
      } ${
        onClick
          ? "cursor-pointer hover:-translate-y-1 hover:bg-white hover:shadow-lg"
          : "cursor-default"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
          {icon}
        </div>
        {onClick && <ProfileArrowIcon />}
      </div>
      <h4 className="mt-4 text-sm font-black text-slate-900">{title}</h4>
      <p className="mt-1 text-[10px] leading-5 text-slate-500">{description}</p>
    </button>
  );
};

const ProfileMapClick = ({
  onSelect,
}: {
  onSelect: (
    latitude: number,
    longitude: number
  ) => void;
}) => {
  useMapEvents({
    click(event) {
      onSelect(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
};
const ProfileDetailRow = ({
  label,
  value,
  valueClassName = "text-slate-900",
  last = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  last?: boolean;
}) => (
  <div
    className={`flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between ${
      !last ? "border-b border-slate-100" : ""
    }`}
  >
    <span className="text-sm font-medium text-slate-500">{label}</span>
    <span className={`text-sm font-semibold sm:text-right ${valueClassName}`}>
      {value}
    </span>
  </div>
);

const ProfileEmailIcon = () => (
  <Icon size={17}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

const ProfileEditIcon = () => (
  <Icon size={18}>
    <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
    <path d="m14.5 6.5 3 3" />
  </Icon>
);

const ProfileInfoIcon = () => (
  <Icon size={19}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </Icon>
);



const ProfileLockIcon = () => (
  <Icon size={19}>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
);

const ProfileCheckIcon = () => (
  <Icon size={19}>
    <path d="m5 12 4 4L19 6" />
  </Icon>
);

const ProfileCameraIcon = () => (
  <Icon size={17}>
    <path d="M4 7h3l1.5-2h7L17 7h3v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <circle cx="12" cy="13" r="3" />
  </Icon>
);

const ProfileArrowIcon = () => (
  <Icon size={18}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
);

const numberValue = (value?: number | null) =>
  value == null || Number.isNaN(Number(value)) ? null : Number(value);



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
  if (
    pathname.endsWith("/reports") ||
    pathname.endsWith("/report-disaster") ||
    pathname.endsWith("/disaster-reports")
  ) {
    return "reports";
  }

  if (pathname.endsWith("/my-requests") || pathname.endsWith("/assigned-requests") || pathname.endsWith("/assistance-requests")) {
    return "requests";
  }

  if (pathname.endsWith("/emergency-alerts")) return "alerts";
  if (pathname.endsWith("/risk-prediction")) return "risk";
    if (pathname.endsWith("/risk-information")) return "risk";
  if (pathname.endsWith("/relief-resources")) return "resources";
  if (pathname.endsWith("/location-sharing")) return "location";
  if (pathname.endsWith("/field-operations")) return "field";
  if (pathname.endsWith("/profile")) return "profile";

  return "dashboard";
};

const sectionRoute = (section: SectionId) => {
  const routes: Record<Exclude<SectionId, "dashboard">, string> = {
    reports: "reports",
    requests: "my-requests",
    alerts: "emergency-alerts",
    risk: "risk-prediction",
    resources: "relief-resources",
    location: "location-sharing",
    field: "field-operations",
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

const actionIcon = (section: SectionId) => {
  if (section === "reports") return <AlertTriangleIcon />;
  if (section === "requests") return <ClipboardIcon />;
  if (section === "alerts") return <BellIcon />;
  if (section === "risk") return <ChartIcon />;
  if (section === "resources") return <LayersIcon />;
  if (section === "location") return <LocationIcon />;
  return <HomeIcon />;
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





export default UserDashboard;






































































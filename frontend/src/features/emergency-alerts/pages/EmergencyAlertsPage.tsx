import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  Clock3,
  Database,
  Download,
  Eye,
  FileEdit,
  Globe2,
  Gauge,
  Layers,
  Loader2,
  Map,
  MapPin,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  Users,
  X,
  SearchCheck,
} from "lucide-react";

import api, {
  getVulnerabilityImpactShared,
} from "../../../lib/api/apiClient";
import { useEmergencyAlerts } from "../hooks/useEmergencyAlerts";
import type { EmergencyAlert } from "../types/emergencyAlert";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1800&q=85";
const FLOOD_IMAGE =
  "https://images.unsplash.com/photo-1561470508-fd4df1ed90b2?auto=format&fit=crop&w=1000&q=85";
const RESPONSE_IMAGE =
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=900&q=85";
const DROUGHT_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85";

interface VulnerabilityAssessment {
  id: string;
  riskPredictionId: string;
  location?: string;
  disasterType?: string;
  riskScore?: number;
  riskLevel?: string;
  vulnerabilityScore?: number;
  vulnerabilityLevel?: string;
  impactScore?: number;
  impactLevel?: string;
  affectedPopulation?: number;
  mainVulnerabilities?: string;
  recommendedActions?: string;
  createdAt?: string;
}

interface ResourceAllocation {
  id: string;
  vulnerabilityAssessmentId: string;
  resourceId?: string;
  resourceType?: string;
  resourceName?: string;
  recommendedQuantity?: number;
  priority?: string;
  location?: string;
  createdAt?: string;
}

type AgentStep = "ready" | "resource" | "alert" | "done";

const severityStyle: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};


const SRI_LANKA_LOCATION_COORDS: Record<string, { lat: number; lon: number }> = {
  Colombo: { lat: 6.9271, lon: 79.8612 },
  Kandy: { lat: 7.2906, lon: 80.6337 },
  Galle: { lat: 6.0329, lon: 80.2168 },
  Jaffna: { lat: 9.6615, lon: 80.0255 },
  Trincomalee: { lat: 8.5874, lon: 81.2152 },
  Batticaloa: { lat: 7.731, lon: 81.6747 },
  Anuradhapura: { lat: 8.3114, lon: 80.4037 },
  Kurunegala: { lat: 7.4863, lon: 80.3623 },
  Dambulla: { lat: 7.8731, lon: 80.7718 },
  Matale: { lat: 7.4675, lon: 80.6234 },
  Ampara: { lat: 7.2917, lon: 81.6721 },
  Monaragala: { lat: 6.8728, lon: 81.3507 },
  Hambantota: { lat: 6.1429, lon: 81.1212 },
  Matara: { lat: 5.9549, lon: 80.555 },
  Ratnapura: { lat: 6.6828, lon: 80.3992 },
  Badulla: { lat: 6.9934, lon: 81.055 },
  NuwaraEliya: { lat: 6.9497, lon: 80.7891 },
  Moratuwa: { lat: 6.773, lon: 79.8816 },
  Negombo: { lat: 7.2083, lon: 79.8358 },
  Homagama: { lat: 6.844, lon: 80.0024 },
  Athurugiriya: { lat: 6.8731, lon: 80.0085 },
  Kaduwela: { lat: 6.9305, lon: 80.0037 },
  Maharagama: { lat: 6.8495, lon: 79.9269 },
  Dehiwala: { lat: 6.829, lon: 79.8758 },
  MountLavinia: { lat: 6.8344, lon: 79.8637 },
  Panadura: { lat: 6.7133, lon: 79.904 },
  Kalutara: { lat: 6.5854, lon: 79.9607 },
  Beruwala: { lat: 6.4788, lon: 79.9828 },
  Chilaw: { lat: 7.5758, lon: 79.7953 },
  Puttalam: { lat: 8.0362, lon: 79.8283 },
  Vavuniya: { lat: 8.7514, lon: 80.4971 },
  Mannar: { lat: 8.981, lon: 79.9044 },
  Kilinochchi: { lat: 9.3803, lon: 80.377 },
  Mullaitivu: { lat: 9.2671, lon: 80.8128 },
  Polonnaruwa: { lat: 7.9403, lon: 81.0188 },
  Kekirawa: { lat: 8.036, lon: 80.594 },
  Dambadeniya: { lat: 7.301, lon: 80.152 },
  Bibile: { lat: 7.1647, lon: 81.2207 },
  Wellawaya: { lat: 6.736, lon: 81.105 },
  Tissamaharama: { lat: 6.2785, lon: 81.286 },
  Kataragama: { lat: 6.4135, lon: 81.334 },
  Tangalle: { lat: 6.024, lon: 80.795 },
};

const normalizeLocation = (value: string) =>
  value.replace(/\s+/g, "").replace(/[.,-]/g, "").toLowerCase();

function getLocationCoords(location: string): [number, number] | null {
  const normalized = normalizeLocation(location);

  const match = Object.entries(SRI_LANKA_LOCATION_COORDS).find(
    ([name]) => normalizeLocation(name) === normalized,
  );

  if (!match) return null;

  const [, coords] = match;
  return [coords.lat, coords.lon];
}

function isSriLankanLocation(location?: string) {
  return Boolean(location && getLocationCoords(location));
}

function MapFocus({
  coords,
  zoom = 11,
}: {
  coords: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!coords) return;

    map.flyTo(coords, zoom, {
      animate: true,
      duration: 1.2,
    });
  }, [coords, map, zoom]);

  return null;
}


interface GlobalMapSearchResult {
  lat: number;
  lon: number;
  displayName: string;
}

async function searchGlobalMap(query: string): Promise<GlobalMapSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(trimmed)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Worldwide map search is temporarily unavailable.");
  }

  const data = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  return data
    .map((item) => ({
      lat: Number(item.lat),
      lon: Number(item.lon),
      displayName: item.display_name,
    }))
    .filter(
      (item) =>
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lon) &&
        item.displayName,
    );
}

function numberValue(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getOperationalPressure(assessment: VulnerabilityAssessment) {
  const risk = clampScore(numberValue(assessment.riskScore));
  const vulnerability = clampScore(numberValue(assessment.vulnerabilityScore));
  const impact = clampScore(numberValue(assessment.impactScore));
  return Math.round(risk * 0.4 + vulnerability * 0.3 + impact * 0.3);
}

function getWarningPosture(assessment: VulnerabilityAssessment, alert?: EmergencyAlert | null) {
  const pressure = getOperationalPressure(assessment);
  const severity = String(alert?.severity || assessment.riskLevel || "Low").toLowerCase();
  if (severity === "critical" || pressure >= 75) return "Immediate coordination";
  if (severity === "high" || pressure >= 55) return "Priority coordination";
  if (severity === "medium" || pressure >= 30) return "Targeted coordination";
  return "Routine monitoring";
}

function getMonitoringCadence(assessment: VulnerabilityAssessment, alert?: EmergencyAlert | null) {
  const pressure = getOperationalPressure(assessment);
  const severity = String(alert?.severity || assessment.riskLevel || "Low").toLowerCase();
  if (severity === "critical" || pressure >= 75) return "Continuous / high-frequency review";
  if (severity === "high" || pressure >= 55) return "Frequent reassessment";
  if (severity === "medium" || pressure >= 30) return "Scheduled reassessment";
  return "Routine review";
}

function unwrap<T>(response: any): T {
  const data = response?.data ?? response;
  if (data?.data !== undefined) return data.data as T;
  if (data?.result !== undefined) return data.result as T;
  return data as T;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function arrayFrom<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["items", "results", "assessments", "data"] as const) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

function getDisasterImage(disasterType?: string) {
  const value = String(disasterType ?? "").toLowerCase();
  if (value.includes("flood") || value.includes("storm") || value.includes("tsunami")) return FLOOD_IMAGE;
  if (value.includes("drought") || value.includes("heat")) return DROUGHT_IMAGE;
  if (value.includes("fire") || value.includes("wildfire")) return RESPONSE_IMAGE;
  return HERO_IMAGE;
}

async function loadAssessments() {
  return arrayFrom<VulnerabilityAssessment>(
    unwrap(await getVulnerabilityImpactShared()),
  );
}

async function optimizeResources(assessmentId: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await api.post(
      `/resource-optimization/${assessmentId}/optimize`,
      undefined,
      { signal: controller.signal },
    );
    return arrayFrom<ResourceAllocation>(unwrap(response));
  } catch (error: any) {
    if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
      throw new Error(
        "Agent 03 timed out after 30 seconds. Check the Resource Optimization backend.",
      );
    }

    const status = error?.response?.status;
    if (status === 404) return [];
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function loadExistingAllocations(assessmentId: string) {
  try {
    const response = await api.get(`/resource-optimization/${assessmentId}`);
    return arrayFrom<ResourceAllocation>(unwrap(response));
  } catch (error: any) {
    if (error?.response?.status === 404) return [];
    throw error;
  }
}

async function createAgent04Alert(assessmentId: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await api.post(
      `/emergency-alerts/assessment/${assessmentId}`,
      undefined,
      { signal: controller.signal },
    );

    return unwrap<EmergencyAlert>(response);
  } catch (error: any) {
    if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
      throw new Error(
        "Agent 04 timed out after 30 seconds. Check the ASP.NET Early Warning backend.",
      );
    }

    if (error?.response?.status === 404) {
      throw new Error(
        "Agent 04 endpoint was not found. Expected POST /api/emergency-alerts/assessment/{assessmentId}.",
      );
    }

    if (error?.response?.status === 405) {
      throw new Error(
        "Agent 04 returned 405 Method Not Allowed. Restart the ASP.NET backend.",
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}


const EmergencyAlertsPage: React.FC = () => {
  const {
    alerts,
    loading,
    error,
    fetchAlerts,
    updateStatus,
  } = useEmergencyAlerts();

  const [assessments, setAssessments] = useState<VulnerabilityAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] =
    useState<VulnerabilityAssessment | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [runError, setRunError] = useState("");
  const [runSuccess, setRunSuccess] = useState("");
  const [showRun, setShowRun] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("Active");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [agentStep, setAgentStep] = useState<AgentStep>("ready");
  const [mapFocusCoords, setMapFocusCoords] = useState<[number, number] | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<GlobalMapSearchResult[]>([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");

  const loadAll = useCallback(async () => {
    const data = await loadAssessments();
    await fetchAlerts();
    setAssessments(data);
  }, [fetchAlerts]);

  useEffect(() => {
    loadAll().catch((e) => setRunError(e?.message || "Unable to load live data."));
  }, [loadAll]);

  const alertByAssessment = useMemo(() => {
    const map = new globalThis.Map<string, EmergencyAlert>();
    alerts.forEach((a) => {
      if (a.vulnerabilityAssessmentId) {
        map.set(a.vulnerabilityAssessmentId, a);
      }
    });
    return map;
  }, [alerts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assessments.filter((a) => {
      if (!q) return true;
      return (
        String(a.location ?? "").toLowerCase().includes(q) ||
        String(a.disasterType ?? "").toLowerCase().includes(q)
      );
    });
  }, [assessments, search]);

  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(
    (a) => String(a.status).toLowerCase() === "active",
  ).length;
  const criticalAlerts = alerts.filter(
    (a) => String(a.severity).toLowerCase() === "critical",
  ).length;
  const population = assessments.reduce(
    (sum, a) => sum + numberValue(a.affectedPopulation),
    0,
  );

  const heroImage = selectedAssessment
    ? getDisasterImage(selectedAssessment.disasterType)
    : HERO_IMAGE;

  const handleGlobalMapSearch = async () => {
    if (!mapSearchQuery.trim()) return;

    setMapSearchLoading(true);
    setMapSearchError("");

    try {
      const results = await searchGlobalMap(mapSearchQuery);
      setMapSearchResults(results);

      if (!results.length) {
        setMapSearchError("No locations found. Try a city, district, landmark, country, or address.");
        return;
      }

      const first = results[0];
      setMapFocusCoords([first.lat, first.lon]);
    } catch (e: any) {
      setMapSearchResults([]);
      setMapSearchError(
        e?.message || "Unable to search the worldwide map right now.",
      );
    } finally {
      setMapSearchLoading(false);
    }
  };

  const selectGlobalMapResult = (result: GlobalMapSearchResult) => {
    setMapSearchQuery(result.displayName.split(",").slice(0, 2).join(","));
    setMapSearchResults([]);
    setMapSearchError("");
    setMapFocusCoords([result.lat, result.lon]);
  };

  const selectAssessment = async (assessment: VulnerabilityAssessment) => {
    setSelectedAssessment(assessment);
    setSelectedAlert(alertByAssessment.get(assessment.id) ?? null);
    setRunError("");
    setRunSuccess("");

    try {
      setAllocations(await loadExistingAllocations(assessment.id));
    } catch {
      setAllocations([]);
    }
  };

  const focusAssessmentOnMap = async (assessment: VulnerabilityAssessment) => {
    const coords = getLocationCoords(assessment.location || "");

    if (!coords) {
      setRunError(
        `No verified Sri Lankan coordinates are available for ${assessment.location || "this assessment"}.`,
      );
      return;
    }

    await selectAssessment(assessment);

    setShowView(false);
    setShowStatus(false);
    setShowRun(false);
    setMapFocusCoords(coords);

    window.setTimeout(() => {
      document
        .getElementById("risk-intelligence-map")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  const openRunModal = async () => {
    if (!selectedAssessment || running) return;

    // A new run must ALWAYS start from Process 01.
    // This is especially important after deleting an old Agent 04 alert:
    // stale step state must never reopen the modal on Process 03.
    setRunError("");
    setRunSuccess("");
    setAgentStep("ready");
    setRunning(false);
    setShowView(false);
    setShowStatus(false);
    setShowRun(true);

    try {
      const latestAllocations = await loadExistingAllocations(
        selectedAssessment.id,
      );
      setAllocations(latestAllocations);
    } catch {
      setAllocations([]);
    }
  };

  const runAgents = async () => {
    if (!selectedAssessment || running) return;

    setRunning(true);
    setRunError("");
    setRunSuccess("");
    setAgentStep("ready");

    try {
      // Phase 01 is intentionally visible before the workflow advances.
      // This prevents the modal from jumping directly from Analysis to Warning.
      await wait(1200);

      // Step 02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Agent 03 resource optimization.
      setAgentStep("resource");

      // Keep the Agent 03 stage visible even when the API responds very quickly.
      await wait(700);

      const resourceData = await optimizeResources(selectedAssessment.id);
      setAllocations(resourceData);

      // Step 03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Agent 04 early-warning coordination.
      setAgentStep("alert");

      // Give the UI a short transition so the user can clearly see
      // that Agent 03 completed and Agent 04 has started.
      await wait(500);

      const alert = await createAgent04Alert(selectedAssessment.id);
      setSelectedAlert(alert ?? null);

      setAgentStep("done");
      await loadAll();

      setRunSuccess(
        "Agent workflow completed successfully: Risk Prediction ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Vulnerability & Impact ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Resource Optimization ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Early Warning.",
      );
      // Keep the modal open so the user can see the completed Agent 03
      // prediction/allocation result and the real Agent 04 warning.
      setShowRun(true);
    } catch (e: any) {
      setRunError(
        e?.response?.data?.message ||
          e?.response?.data ||
          e?.message ||
          "Agent execution failed.",
      );
    } finally {
      setRunning(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setRunError("");
    try {
      await loadAll();
      if (selectedAssessment) {
        await selectAssessment(selectedAssessment);
      }
    } catch (e: any) {
      setRunError(e?.message || "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const deleteAlert = async (alert: EmergencyAlert) => {
    if (
      !window.confirm(
        `Delete the emergency alert for ${alert.location || "this assessment"}?`,
      )
    ) {
      return;
    }

    setDeletingId(alert.id);
    try {
      await api.delete(`/emergency-alerts/${alert.id}`);

      // Clear the deleted alert from every UI state.
      setSelectedAlert(null);
      setShowView(false);
      setShowStatus(false);
      setShowRun(false);

      // Reset the execution pipeline so the next Run Assessment starts
      // from Process 01 instead of reopening on Process 03.
      setAgentStep("ready");
      setRunning(false);
      setRunError("");
      setRunSuccess("Emergency alert deleted successfully.");

      await fetchAlerts();
    } catch (e: any) {
      setRunError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to delete the alert.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const saveStatus = async () => {
    if (!selectedAlert) return;

    try {
      await updateStatus(selectedAlert.id, newStatus);
      setSelectedAlert({ ...selectedAlert, status: newStatus });
      setShowStatus(false);
      await fetchAlerts();
      setRunSuccess("Alert status updated successfully.");
    } catch (e: any) {
      setRunError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to update alert status.",
      );
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((a) => {
      const alert = alertByAssessment.get(a.id);
      return [
        a.location,
        a.disasterType,
        a.riskScore,
        a.vulnerabilityScore,
        a.impactScore,
        a.affectedPopulation,
        alert?.severity ?? "Not generated",
        alert?.status ?? "Pending",
      ];
    });

    const csv = [
      [
        "Location",
        "Disaster",
        "Risk",
        "Vulnerability",
        "Impact",
        "Population",
        "Alert Severity",
        "Status",
      ],
      ...rows,
    ]
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "reliefnexus-agent04.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <section className="mx-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl shadow-slate-900/10">
        <div className="relative min-h-[230px] overflow-hidden lg:min-h-[245px]">
          <img
            src={heroImage}
            alt="Current disaster intelligence focus"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

          <div className="relative z-10 flex min-h-[230px] items-center px-6 py-6 text-white lg:min-h-[245px] lg:px-8 lg:py-7">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur-md">
                <Globe2 className="h-3.5 w-3.5" />
                Early Warning & Coordination Ãƒâ€šÃ‚Â· Agent 04
              </div>
              <h2 className="text-3xl font-black leading-[1.02] tracking-tight sm:text-4xl lg:text-5xl">
                From risk signal to coordinated{" "}
                <span className="text-blue-400">early warning</span>
              </h2>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-200 sm:text-sm sm:leading-6">
                Connect validated risk, vulnerability, impact, population
                exposure and Agent 03 resources into one operational warning view.
              </p>


            </div>
          </div>

          <div className="absolute right-4 top-4 z-30 flex flex-wrap justify-end gap-1.5 lg:right-6 lg:top-5">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-slate-950/60 px-3 text-[10px] font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-slate-900/80"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedAssessment) {
                  void openRunModal();
                } else {
                  document
                    .getElementById("assessment-register")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[10px] font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
            >
              <span className="text-sm"></span>
              Run Coordination
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-slate-950/70 px-3.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-slate-900/85"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </section>

      <main className="w-full space-y-5 px-4 py-5">
        {(error || runError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {runError || error}
          </div>
        )}

        {runSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {runSuccess}
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Total Alerts" value={totalAlerts} icon={<Bell />} />
          <KpiCard title="Active Alerts" value={activeAlerts} icon={<AlertTriangle />} />
          <KpiCard title="Critical Alerts" value={criticalAlerts} icon={<ShieldCheck />} />
          <KpiCard
            title="Affected Population"
            value={population.toLocaleString()}
            icon={<Users />}
          />
        </div>

        {/* Operational intelligence KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="High-Pressure Assessments" value={assessments.filter((a) => getOperationalPressure(a) >= 55).length} icon={<Gauge />} tone="amber" />
          <KpiCard title="Verified Map Locations" value={assessments.filter((a) => isSriLankanLocation(a.location)).length} icon={<Map />} tone="blue" />
          <KpiCard title="Alert-Linked Assessments" value={assessments.filter((a) => alertByAssessment.has(a.id)).length} icon={<Database />} tone="indigo" />
          <KpiCard title="Average Risk Score" value={assessments.length ? (assessments.reduce((sum, a) => sum + numberValue(a.riskScore), 0) / assessments.length).toFixed(1) : "0.0"} icon={<Activity />} tone="emerald" />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)] items-stretch gap-4">
          {/* Assessments */}
          <section
            id="assessment-register"
            className="flex h-[440px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="shrink-0 border-b border-slate-100 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black">Assessment Register</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a real Agent 02 assessment to run Agent 03 and Agent 04.
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search location or disaster..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 md:w-72"
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-3.5 py-2">Location</th>
                    <th className="px-3.5 py-2">Disaster</th>
                    <th className="px-3.5 py-2">Risk</th>
                    <th className="px-3.5 py-2">Vulnerability</th>
                    <th className="px-3.5 py-2">Impact</th>
                    <th className="px-3.5 py-2">Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Loading live assessments...
                        </p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        No assessments found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((assessment) => {
                      const alert = alertByAssessment.get(assessment.id);
                      const selected = selectedAssessment?.id === assessment.id;

                      return (
                        <tr
                          key={assessment.id}
                          onClick={() => selectAssessment(assessment)}
                          className={`cursor-pointer transition ${
                            selected ? "bg-blue-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={getDisasterImage(assessment.disasterType)}
                                alt=""
                                className="h-8 w-11 rounded-md object-cover"
                              />
                              <div>
                                <p className="text-xs font-black">
                                  {assessment.location || "Unknown"}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {assessment.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm font-semibold">
                            {assessment.disasterType || ""}
                          </td>
                          <td className="px-4 py-2.5">
                            <Score
                              value={assessment.riskScore}
                              level={assessment.riskLevel}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <Score
                              value={assessment.vulnerabilityScore}
                              level={assessment.vulnerabilityLevel}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <Score
                              value={assessment.impactScore}
                              level={assessment.impactLevel}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            {alert ? (
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                                  severityStyle[alert.severity] || severityStyle.Low
                                }`}
                              >
                                {alert.severity}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                                Not generated
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Selected assessment */}
          <section className="flex h-[440px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {!selectedAssessment ? (
              <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-black">Select an assessment</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Select a row from the register to view the assessment and run
                    the Agent 03 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 04 workflow.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative h-36">
                  <img
                    src={getDisasterImage(selectedAssessment.disasterType)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="absolute bottom-4 left-5 text-white">
                    <p className="text-xs font-semibold text-slate-200">
                      Selected Assessment
                    </p>
                    <h2 className="text-xl font-black">
                      {selectedAssessment.location || "Unknown"}
                    </h2>
                    <p className="text-sm font-semibold text-slate-200">
                      {selectedAssessment.disasterType || "Disaster"}
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoBox
                      label="Risk"
                      value={`${numberValue(selectedAssessment.riskScore).toFixed(1)}  ${selectedAssessment.riskLevel || ""}`}
                    />
                    <InfoBox
                      label="Vulnerability"
                      value={`${numberValue(selectedAssessment.vulnerabilityScore).toFixed(1)}  ${selectedAssessment.vulnerabilityLevel || ""}`}
                    />
                    <InfoBox
                      label="Impact"
                      value={`${numberValue(selectedAssessment.impactScore).toFixed(1)}  ${selectedAssessment.impactLevel || ""}`}
                    />
                    <InfoBox
                      label="Population"
                      value={numberValue(
                        selectedAssessment.affectedPopulation,
                      ).toLocaleString()}
                    />
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                      Agent 03 Resources
                    </p>
                    <p className="mt-1 text-sm font-bold text-blue-950">
                      {allocations.length
                        ? `${allocations.length} allocation(s) loaded`
                        : "No allocations loaded"}
                    </p>
                  </div>

                  {selectedAlert ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase text-emerald-700">
                            Agent 04 Alert
                          </p>
                          <p className="mt-1 font-black text-emerald-950">
                            {selectedAlert.title}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                            severityStyle[selectedAlert.severity] ||
                            severityStyle.Low
                          }`}
                        >
                          {selectedAlert.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-emerald-900/80">
                        {selectedAlert.message}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      <p className="text-xs font-black">
                        Agent 04 alert not generated
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Run the workflow to create the real emergency alert.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {selectedAlert && (
                      <button
                        onClick={() => setShowView(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Alert Details
                      </button>
                    )}

                    <button
                      onClick={openRunModal}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M7.2 4.4a1 1 0 0 1 1.55-.83l6.2 4.1a1 1 0 0 1 0 1.66l-6.2 4.1A1 1 0 0 1 7.2 12.6V4.4Z" />
                      </svg>
                      {selectedAlert
                        ? "Run Again (Agent 03 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 04)"
                        : "Run Assessment (Agent 03 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 04)"}
                    </button>
                  </div>

                  {selectedAlert && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setNewStatus(selectedAlert.status || "Active");
                          setShowStatus(true);
                        }}
                        className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                      >
                        Update Status
                      </button>
                      <button
                        disabled={deletingId === selectedAlert.id}
                        onClick={() => deleteAlert(selectedAlert)}
                        className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === selectedAlert.id
                          ? "Deleting..."
                          : "Delete Alert"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>



        {/* Global Risk Intelligence Map */}
        <section
          id="risk-intelligence-map"
          className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5"
        >
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black">Global Risk Intelligence Map</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Search any city, country, landmark or address worldwide, then inspect live assessment severity.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                  {filtered.filter((a) => isSriLankanLocation(a.location)).length} verified local markers
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700">
                  {alerts.length} active alert records
                </span>
              </div>
            </div>
          </div>

          <div
            className="relative isolate z-0 h-[350px] overflow-hidden bg-slate-100"
            style={{ contain: "paint" }}
          >
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              maxZoom={18}
              scrollWheelZoom={true}
              dragging={true}
              doubleClickZoom={true}
              touchZoom={true}
              keyboard={true}
              worldCopyJump={true}
              className="relative z-0 h-full w-full"
              style={{ zIndex: 0 }}
            >
              <TileLayer
                attribution=" OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFocus coords={mapFocusCoords} zoom={12} />

              {mapFocusCoords && (
                <CircleMarker
                  center={mapFocusCoords}
                  radius={9}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 3,
                    fillColor: "#2563eb",
                    fillOpacity: 0.95,
                  }}
                >
                  <Popup>
                    <div className="min-w-[170px]">
                      <p className="text-xs font-black text-slate-900">
                        Map search focus
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                        The map is focused on the selected worldwide location.
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              )}

              {filtered
                .filter((assessment) => isSriLankanLocation(assessment.location))
                .slice(0, 50)
                .map((assessment) => {
                  const coords = getLocationCoords(assessment.location || "");
                  if (!coords) return null;

                  const alert = alertByAssessment.get(assessment.id);
                  const level = alert?.severity || assessment.riskLevel || "Low";

                  const color =
                    level === "Critical"
                      ? "#ef4444"
                      : level === "High"
                        ? "#f97316"
                        : level === "Medium"
                          ? "#f59e0b"
                          : "#10b981";

                  return (
                    <CircleMarker
                      key={assessment.id}
                      center={coords}
                      radius={
                        assessment.id === selectedAssessment?.id
                          ? 13
                          : alert
                            ? 10
                            : 7
                      }
                      pathOptions={{
                        color:
                          assessment.id === selectedAssessment?.id
                            ? "#2563eb"
                            : "#ffffff",
                        weight:
                          assessment.id === selectedAssessment?.id ? 4 : 3,
                        fillColor: color,
                        fillOpacity: 0.94,
                      }}
                      eventHandlers={{
                        click: () => selectAssessment(assessment),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[190px]">
                          <p className="text-xs font-black text-slate-900">
                            {assessment.location}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                            {assessment.disasterType || "Disaster assessment"}
                          </p>

                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            <div className="rounded-md bg-slate-50 p-1.5">
                              <p className="text-[8px] font-bold uppercase text-slate-400">Risk</p>
                              <p className="text-[10px] font-black text-slate-900">
                                {numberValue(assessment.riskScore).toFixed(1)}
                              </p>
                            </div>
                            <div className="rounded-md bg-slate-50 p-1.5">
                              <p className="text-[8px] font-bold uppercase text-slate-400">Alert</p>
                              <p className="text-[10px] font-black" style={{ color }}>
                                {alert?.severity || assessment.riskLevel || "Low"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => selectAssessment(assessment)}
                            className="mt-2 w-full rounded-md bg-blue-600 px-2 py-1.5 text-[10px] font-black text-white"
                          >
                            Inspect assessment
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </MapContainer>

            <div className="absolute left-4 top-4 z-[1000] w-[min(430px,calc(100%-2rem))]">
              <div className="rounded-2xl border border-white/80 bg-white/95 p-2 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-blue-600 p-2 text-white">
                    <SearchCheck className="h-4 w-4" />
                  </div>
                  <input
                    value={mapSearchQuery}
                    onChange={(e) => {
                      setMapSearchQuery(e.target.value);
                      setMapSearchError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleGlobalMapSearch();
                    }}
                    placeholder="Search any city, country, landmark or address..."
                    className="min-w-0 flex-1 bg-transparent px-1 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => void handleGlobalMapSearch()}
                    disabled={mapSearchLoading || !mapSearchQuery.trim()}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {mapSearchLoading ? "SearchingÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦" : "Search"}
                  </button>
                </div>

                {mapSearchError && (
                  <p className="px-2 pb-1 pt-2 text-[10px] font-semibold text-red-600">
                    {mapSearchError}
                  </p>
                )}

                {mapSearchResults.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                    {mapSearchResults.map((result, index) => (
                      <button
                        key={`${result.lat}-${result.lon}-${index}`}
                        type="button"
                        onClick={() => selectGlobalMapResult(result)}
                        className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-blue-50"
                      >
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span className="line-clamp-2 text-[10px] font-semibold text-slate-700">
                          {result.displayName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-[400] max-w-[360px] rounded-xl border border-white/80 bg-white/95 p-3 shadow-lg backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Live map intelligence
              </p>
              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                Drag, zoom and search freely. Verified Agent 02 locations are
                shown as live incident markers; worldwide search can focus on
                any location.
              </p>
            </div>

            <div className="absolute right-4 top-4 z-[400] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Severity
                </p>
              </div>

              <div className="mt-2 space-y-1.5">
                {[
                  ["Critical", "#ef4444"],
                  ["High", "#f97316"],
                  ["Medium", "#f59e0b"],
                  ["Low", "#10b981"],
                ].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[9px] font-bold text-slate-600">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x border-t border-slate-100 bg-slate-50 sm:grid-cols-4">
            {[
              ["Critical", "Critical"],
              ["High", "High"],
              ["Medium", "Medium"],
              ["Low", "Low"],
            ].map(([label, level]) => {
              const count = alerts.filter(
                (a) =>
                  String(a.severity).toLowerCase() ===
                  String(level).toLowerCase(),
              ).length;

              return (
                <div key={label} className="px-4 py-3">
                  <p className="text-[9px] font-black uppercase text-slate-400">
                    {label} alerts
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900">{count}</p>
                </div>
              );
            })}
          </div>
        </section>




        {/* Advanced Alert Register */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-red-50 p-2 text-red-600">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Emergency Alert Register</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Real Agent 04 alerts persisted in the backend with full
                      incident traceability.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
                  {alerts.length} total
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                  {alerts.filter((a) => a.isActive).length} active
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-slate-100 sm:grid-cols-4">
            {[
              ["Critical", "bg-red-50 text-red-700", "Critical"],
              ["High", "bg-orange-50 text-orange-700", "High"],
              ["Medium", "bg-amber-50 text-amber-700", "Medium"],
              ["Low", "bg-emerald-50 text-emerald-700", "Low"],
            ].map(([label, cls, level]) => (
              <div key={label} className="border-r border-slate-100 p-4">
                <span className={`rounded-full px-2 py-1 text-[9px] font-black ${cls}`}>
                  {label}
                </span>
                <p className="mt-2 text-xl font-black text-slate-900">
                  {alerts.filter(
                    (a) =>
                      String(a.severity).toLowerCase() ===
                      String(level).toLowerCase(),
                  ).length}
                </p>
                <p className="text-[9px] font-bold uppercase text-slate-400">
                  alerts
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[9px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Incident</th>
                  <th className="px-4 py-3">Disaster</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Population</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {alerts.map((alert) => {
                  const assessment = assessments.find(
                    (a) => a.id === alert.vulnerabilityAssessmentId,
                  );

                  return (
                    <tr
                      key={alert.id}
                      className="group transition-colors hover:bg-blue-50/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getDisasterImage(
                              alert.disasterType || assessment?.disasterType,
                            )}
                            alt=""
                            className="h-10 w-14 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">
                              {alert.location ||
                                assessment?.location ||
                                "Unknown location"}
                            </p>
                            <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-slate-500">
                              {alert.title || "Agent 04 emergency warning"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                        {alert.disasterType || assessment?.disasterType || ""}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${
                            severityStyle[alert.severity] || severityStyle.Low
                          }`}
                        >
                          {alert.severity || "Low"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              alert.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span className="text-xs font-black text-slate-700">
                            {alert.status || "Active"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs font-black text-slate-700">
                        {numberValue(
                          assessment?.affectedPopulation,
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500">
                        {alert.createdAt
                          ? new Date(alert.createdAt).toLocaleString()
                          : ""}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (assessment) selectAssessment(assessment);
                              setSelectedAlert(alert);
                              setShowView(true);
                            }}
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                            title="Open full incident details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAlert(alert);
                              setNewStatus(alert.status || "Active");
                              setShowStatus(true);
                            }}
                            className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                            title="Update alert status"
                          >
                            <FileEdit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            disabled={deletingId === alert.id}
                            onClick={() => deleteAlert(alert)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                            title="Delete alert"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!alerts.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Bell className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-black text-slate-600">
                        No emergency alerts generated yet.
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Run Agent 03 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 04 from a real Agent 02 assessment.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>



        {/* Four-stage workflow */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">Agent Execution Workflow</h2>
              <p className="mt-1 text-xs text-slate-500">
                Four connected AI stages from prediction to emergency coordination.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <WorkflowStepCard
              number="01"
              title="Risk Prediction"
              subtitle="Agent 01"
              state="done"
            />
            <WorkflowStepCard
              number="02"
              title="Vulnerability & Impact"
              subtitle="Agent 02"
              state={agentStep === "ready" ? "active" : "done"}
            />
            <WorkflowStepCard
              number="03"
              title="Resource Optimization"
              subtitle="Agent 03"
              state={
                agentStep === "resource"
                  ? "running"
                  : agentStep === "alert" || agentStep === "done"
                    ? "done"
                    : "waiting"
              }
            />
            <WorkflowStepCard
              number="04"
              title="Early Warning"
              subtitle="Agent 04"
              state={agentStep === "alert" ? "running" : agentStep === "done" ? "done" : "waiting"}
            />
          </div>

          {running && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {agentStep === "resource"
                ? "Agent 03 is optimizing resources..."
                : "Agent 04 is creating the emergency warning..."}
            </div>
          )}
        </section>

        {/* Analytics */}
        <div className="grid grid-cols-3 gap-3">
          <SimpleCard title="Alert Distribution">
            <div className="space-y-3">
              {["Critical", "High", "Medium", "Low"].map((level) => {
                const count = alerts.filter(
                  (a) =>
                    String(a.severity).toLowerCase() === level.toLowerCase(),
                ).length;
                const percent = totalAlerts
                  ? Math.round((count / totalAlerts) * 100)
                  : 0;

                return (
                  <div key={level}>
                    <div className="mb-1 flex justify-between text-xs font-bold">
                      <span>{level}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          level === "Critical"
                            ? "bg-red-500"
                            : level === "High"
                              ? "bg-orange-500"
                              : level === "Medium"
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SimpleCard>

          <SimpleCard title="Assessments by Location">
            <div className="space-y-3">
              {[...new Set(assessments.map((a) => a.location || "Unknown"))]
                .slice(0, 6)
                .map((location) => {
                  const count = assessments.filter(
                    (a) => (a.location || "Unknown") === location,
                  ).length;
                  return (
                    <div key={location} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">
                        {location}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </SimpleCard>

          <SimpleCard title="Recent Agent Activity">
            <div className="space-y-2">
              {assessments.slice(0, 5).map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAssessment(a)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-2 text-left hover:bg-slate-50"
                >
                  <img
                    src={getDisasterImage(a.disasterType)}
                    alt=""
                    className="h-8 w-10 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black">
                      {a.location}  {a.disasterType}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {alertByAssessment.has(a.id)
                        ? "Agent 04 alert generated"
                        : "Agent 02 assessment ready"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-slate-300" />
                </button>
              ))}
            </div>
          </SimpleCard>
        </div>

      </main>

      {showRun && selectedAssessment && (
        <RunModal
          assessment={selectedAssessment}
          allocations={allocations}
          alert={selectedAlert}
          running={running}
          step={agentStep}
          error={runError}
          onClose={() => !running && setShowRun(false)}
          onRun={runAgents}
        />
      )}

      {showView && selectedAssessment && (
        <ViewModal
          assessment={selectedAssessment}
          alert={selectedAlert}
          allocations={allocations}
          onClose={() => setShowView(false)}
          onRun={() => {
            setShowView(false);
            openRunModal();
          }}
          onMap={() => focusAssessmentOnMap(selectedAssessment)}
          onDelete={() => selectedAlert && deleteAlert(selectedAlert)}
        />
      )}

      {showStatus && selectedAlert && (
        <StatusModal
          alert={selectedAlert}
          status={newStatus}
          setStatus={setNewStatus}
          onClose={() => setShowStatus(false)}
          onSave={saveStatus}
        />
      )}
    </div>
  );
};

export function HeroStat({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "red";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-black ${
          tone === "red" ? "text-red-300" : "text-blue-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  tone = "blue",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "blue" | "amber" | "indigo" | "emerald";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-slate-50" />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function WorkflowStepCard({
  number,
  title,
  subtitle,
  state,
}: {
  number: string;
  title: string;
  subtitle: string;
  state: "done" | "active" | "running" | "waiting";
}) {
  const styles = {
    done: "border-emerald-200 bg-emerald-50",
    active: "border-blue-200 bg-blue-50",
    running: "border-blue-300 bg-blue-50",
    waiting: "border-slate-200 bg-slate-50",
  };

  const badge = {
    done: "bg-emerald-600 text-white",
    active: "bg-blue-600 text-white",
    running: "bg-blue-600 text-white",
    waiting: "bg-slate-200 text-slate-500",
  };

  return (
    <div className={`rounded-xl border p-3 ${styles[state]}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${badge[state]}`}>
          {state === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : number}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-black">{title}</p>
          <p className="text-[10px] text-slate-500">{subtitle}</p>
        </div>
        <span className="ml-auto text-[9px] font-black uppercase text-slate-400">
          {state === "done" ? "Done" : state === "running" ? "Running" : state === "active" ? "Ready" : "Waiting"}
        </span>
      </div>
    </div>
  );
}

function SimpleCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="border-b border-slate-100 pb-3 text-sm font-black">
        {title}
      </h3>
      <div className="pt-3">{children}</div>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function Score({ value, level }: { value?: number; level?: string }) {
  return (
    <div>
      <p className="text-xs font-black">{numberValue(value).toFixed(1)}</p>
      <span
        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${
          severityStyle[level || "Low"] ||
          "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        {level || ""}
      </span>
    </div>
  );
}

function RunModal({
  assessment,
  allocations,
  alert,
  running,
  step,
  error,
  onClose,
  onRun,
}: {
  assessment: VulnerabilityAssessment;
  allocations: ResourceAllocation[];
  alert: EmergencyAlert | null;
  running: boolean;
  step: AgentStep;
  error: string;
  onClose: () => void;
  onRun: () => void;
}) {
  const risk = numberValue(assessment.riskScore);
  const vulnerability = numberValue(assessment.vulnerabilityScore);
  const impact = numberValue(assessment.impactScore);
  const population = numberValue(assessment.affectedPopulation);
  const affectedPeople = population;

  const populationFactor =
    population <= 0
      ? 10
      : population >= 10000
        ? 100
        : population >= 5000
          ? 80
          : population >= 1000
            ? 60
            : population >= 500
              ? 40
              : 20;

  const coordinationScore =
    Math.round(
      (risk * 0.4 +
        vulnerability * 0.25 +
        impact * 0.25 +
        populationFactor * 0.1) *
        10,
    ) / 10;

  const coordinationLevel =
    coordinationScore >= 75 ||
    [assessment.riskLevel, assessment.vulnerabilityLevel, assessment.impactLevel].some(
      (level) => String(level ?? "").toLowerCase() === "critical",
    )
      ? "Critical"
      : coordinationScore >= 55 ||
          [assessment.riskLevel, assessment.vulnerabilityLevel, assessment.impactLevel].some(
            (level) => String(level ?? "").toLowerCase() === "high",
          )
        ? "High"
        : coordinationScore >= 30 ||
            [assessment.riskLevel, assessment.vulnerabilityLevel, assessment.impactLevel].some(
              (level) => String(level ?? "").toLowerCase() === "medium",
            )
          ? "Medium"
          : "Low";

  const currentProcess =
    step === "ready"
      ? 1
      : step === "resource"
        ? 2
        : 3;

  const processData = [
    {
      no: "01",
      title: "Assessment Analysis",
      owner: "Agent 01 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 02",
      description:
        "Validate the selected risk, vulnerability, impact and exposure indicators before operational execution.",
    },
    {
      no: "02",
      title: "Resource Prediction",
      owner: "Agent 03",
      description:
        "Run the live Resource Optimization API and connect the returned allocations to this assessment.",
    },
    {
      no: "03",
      title: "Early Warning",
      owner: "Agent 04",
      description:
        "Generate the final warning, response posture, coordination actions and reassessment guidance.",
    },
  ];

  const currentProcessData = processData[currentProcess - 1];

  const actionItems = String(
    alert?.recommendedActions || assessment.recommendedActions || "",
  )
     .split(/\r?\n|\u2022|;|\|/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  const warningLevel = String(
    alert?.severity || coordinationLevel || "Low",
  );

  const exposureBand =
    population >= 10000
      ? "Very high exposure"
      : population >= 5000
        ? "High exposure"
        : population >= 1000
          ? "Moderate exposure"
          : population > 0
            ? "Localized exposure"
            : "Exposure unavailable";

  const dominantFactor =
    risk >= vulnerability && risk >= impact
      ? `Risk  ${risk.toFixed(1)}`
      : vulnerability >= impact
        ? `Vulnerability  ${vulnerability.toFixed(1)}`
        : `Impact  ${impact.toFixed(1)}`;

  const pressureCount = [risk, vulnerability, impact].filter(
    (value) => value >= 60,
  ).length;

  const escalationRequired =
    warningLevel.toLowerCase() === "critical" ||
    risk >= 75 ||
    vulnerability >= 75 ||
    impact >= 75;

  const monitoringCadence =
    warningLevel.toLowerCase() === "critical" || coordinationScore >= 75
      ? "Continuous / high-frequency"
      : warningLevel.toLowerCase() === "high" || coordinationScore >= 55
        ? "Frequent reassessment"
        : warningLevel.toLowerCase() === "medium" || coordinationScore >= 30
          ? "Scheduled reassessment"
          : "Routine review";

  const operationalPosture =
    warningLevel.toLowerCase() === "critical" || coordinationScore >= 75
      ? "Immediate coordination"
      : warningLevel.toLowerCase() === "high" || coordinationScore >= 55
        ? "Enhanced coordination"
        : warningLevel.toLowerCase() === "medium" || coordinationScore >= 30
          ? "Targeted coordination"
          : "Routine monitoring";

  const escalationRows = [
    {
      label: "Risk",
      value: risk,
      threshold: 75,
      level: assessment.riskLevel || "",
    },
    {
      label: "Vulnerability",
      value: vulnerability,
      threshold: 75,
      level: assessment.vulnerabilityLevel || "",
    },
    {
      label: "Impact",
      value: impact,
      threshold: 75,
      level: assessment.impactLevel || "",
    },
  ];

  const [approvalState, setApprovalState] = useState<"pending" | "approved" | "rejected">(
    alert ? "pending" : "pending",
  );
  const [acknowledgedTasks, setAcknowledgedTasks] = useState<Record<string, boolean>>({});
  const [sendingReport, setSendingReport] = useState(false);
  const [sendReportMessage, setSendReportMessage] = useState("");

  const sendMessageAndReport = async () => {
    if (!alert?.id || sendingReport) return;

    setSendingReport(true);
    setSendReportMessage("");

    try {
      const response = await api.post(
        `/emergency-alerts/${alert.id}/send-report`,
      );

      const data = response.data;

      if (data?.success) {
        const emailText = data.emailSent
          ? `Email sent to ${data.recipientEmail || "the affected user"}.`
          : "Notification saved, but email was not sent.";

        setSendReportMessage(
          `Report sent successfully. ${emailText}`,
        );
      } else {
        setSendReportMessage(
          "The report could not be sent.",
        );
      }
    } catch (error: any) {
      setSendReportMessage(
        error?.response?.data?.message ||
          "Failed to send the emergency report.",
      );
    } finally {
      setSendingReport(false);
    }
  };
  useEffect(() => {
    setApprovalState(alert ? "pending" : "pending");
    setAcknowledgedTasks({});
  }, [alert?.id]);

  const resourceTotalUnits = allocations.reduce(
    (sum, resource) => sum + numberValue(resource.recommendedQuantity),
    0,
  );
  const resourceLocations = Array.from(
    new Set(allocations.map((resource) => resource.location).filter(Boolean)),
  );
  const highPriorityResources = allocations.filter(
    (resource) => String(resource.priority || "").toLowerCase() === "high",
  ).length;

  const escalationReasons = [
    risk >= 75 ? `Risk score is ${risk.toFixed(1)}.` : "",
    vulnerability >= 75 ? `Vulnerability score is ${vulnerability.toFixed(1)}.` : "",
    impact >= 75 ? `Impact score is ${impact.toFixed(1)}.` : "",
    warningLevel.toLowerCase() === "critical" ? "The generated warning is Critical." : "",
    pressureCount >= 2 ? `${pressureCount}/3 indicators are at or above 60.` : "",
  ].filter(Boolean);

  const coordinationTasks = [
    ...(actionItems.length
      ? actionItems.slice(0, 5).map((item, index) => ({
          id: `action-${index}`,
          title: item,
          priority: warningLevel,
        }))
      : [
          {
            id: "verify-warning",
            title: `Verify the ${warningLevel.toLowerCase()} early warning with the responsible emergency coordination authority.`,
            priority: warningLevel,
          },
        ]),
    ...(allocations.length
      ? [
          {
            id: "resource-coordination",
            title: `Coordinate ${allocations.length} Agent 03 resource allocation record(s) at the selected response locations.`,
            priority: highPriorityResources > 0 ? "High" : "Medium",
          },
        ]
      : []),
  ];

  const notificationPlan =
    warningLevel.toLowerCase() === "critical"
      ? ["Emergency coordination authority", "Response teams", "Affected-area notification channel"]
      : warningLevel.toLowerCase() === "high"
        ? ["Emergency coordination authority", "Response teams", "Affected-area information channel"]
        : ["Responsible coordination team", "Monitoring team"];

  const planningWindows = [
    {
      label: "NOW",
      title: "Activate coordination",
      text: escalationRequired
        ? "Maintain the current response posture and verify the generated warning with the responsible emergency coordination authority."
        : "Review the generated warning and confirm the operational response posture.",
    },
    {
      label: "0ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“1 H",
      title: "Coordinate resources",
      text: allocations.length
        ? `Coordinate ${allocations.length} Agent 03 allocation record${allocations.length === 1 ? "" : "s"} and confirm availability at the selected location.`
        : "Confirm resource availability and identify any response gaps.",
    },
    {
      label: "1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“6 H",
      title: "Reassess conditions",
      text: `${monitoringCadence} based on the current risk, vulnerability and impact indicators.`,
    },
    {
      label: "6ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“24 H",
      title: "Update response posture",
      text: "Use the next validated assessment to confirm whether the response posture should be maintained, escalated or reduced.",
    },
  ];

  return (
    <Modal title="Run Agent 04 Ãƒâ€šÃ‚Â· Emergency Coordination" onClose={onClose}>
      <div className="space-y-4">
        {/* HERO / INCIDENT IDENTITY */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-lg">
          <div className="relative h-44 sm:h-52">
            <img
              src={getDisasterImage(assessment.disasterType)}
              alt={`${assessment.disasterType || "Disaster"} reference`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">
                    Live incident intelligence
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">
                    {assessment.location || "Unknown location"}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-200">
                    {assessment.disasterType || "Disaster assessment"}  Agent 01 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 02  Agent 03 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 04
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-black ${
                    severityStyle[coordinationLevel] || severityStyle.Low
                  }`}
                >
                  {coordinationLevel} priority
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
            <CommandKpi label="Risk" value={`${risk.toFixed(1)}  ${assessment.riskLevel || ""}`} />
            <CommandKpi label="Vulnerability" value={`${vulnerability.toFixed(1)}  ${assessment.vulnerabilityLevel || ""}`} />
            <CommandKpi label="Impact" value={`${impact.toFixed(1)}  ${assessment.impactLevel || ""}`} />
            <CommandKpi label="Population" value={population.toLocaleString()} />
          </div>
        </section>

        {/* TOP DECISION KPIs */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <DecisionKpi
            label="Coordination score"
            value={coordinationScore.toFixed(1)}
            detail="/ 100"
            tone="blue"
          />
          <DecisionKpi
            label="Operational posture"
            value={operationalPosture}
            detail={warningLevel}
            tone={coordinationLevel.toLowerCase() === "critical" ? "red" : "amber"}
          />
          <DecisionKpi
            label="Pressure indicators"
            value={`${pressureCount}/3`}
            detail=" 60"
            tone={pressureCount >= 2 ? "red" : "blue"}
          />
          <DecisionKpi
            label="Resource coverage"
            value={`${allocations.length}`}
            detail="Agent 03 allocations"
            tone="indigo"
          />
        </section>

        {/* INCIDENT / DECISION BRIEF */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                Decision intelligence
              </p>
              <h3 className="mt-1 text-base font-black text-slate-900">
                Why this assessment needs this response posture
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black text-slate-600">
              {exposureBand}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InfoBox label="Dominant factor" value={dominantFactor} />
            <InfoBox label="Exposure class" value={exposureBand} />
            <InfoBox label="Monitoring cadence" value={monitoringCadence} />
            <InfoBox label="Escalation" value={escalationRequired ? "Required" : "Not triggered"} />
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Analytical interpretation
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-700">
              The operational posture combines risk ({risk.toFixed(1)}),
              vulnerability ({vulnerability.toFixed(1)}), impact ({impact.toFixed(1)})
              and population exposure into a single coordination signal.
              {pressureCount >= 2
                ? " Multiple indicators are elevated, increasing the need for coordinated monitoring and response."
                : pressureCount === 1
                  ? " One primary indicator is elevated, so targeted coordination and continued monitoring are appropriate."
                  : " No major multi-factor pressure pattern is detected from the available assessment values."}
            </p>
          </div>
        </section>

        {/* 3 PROCESS PIPELINE */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                Execution pipeline
              </p>
              <h3 className="mt-1 text-sm font-black text-slate-900">
                Controlled 3-process Agent 04 run
              </h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-slate-600 shadow-sm">
              Process {currentProcess} / 3
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            {processData.map((process, index) => {
              const complete = currentProcess > index + 1;
              const active = currentProcess === index + 1;

              return (
                <div
                  key={process.no}
                  className={`rounded-2xl border p-3 transition ${
                    complete
                      ? "border-emerald-200 bg-emerald-50"
                      : active
                        ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
                        complete
                          ? "bg-emerald-500 text-white"
                          : active
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {complete ? "" : process.no}
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900">
                        {process.title}
                      </p>
                      <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-slate-400">
                        {process.owner}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-[9px] leading-4 text-slate-500">
                    {process.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                      {complete
                        ? "Completed"
                        : active
                          ? running
                            ? "Running now"
                            : "Ready"
                          : "Queued"}
                    </span>

                    {active && running && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CURRENT PROCESS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                Process {currentProcess} of 3
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950">
                {currentProcessData.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {currentProcessData.description}
              </p>
            </div>
            {running && (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" />
            )}
          </div>
        </section>

        {/* PROCESS 01 */}
        {currentProcess === 1 && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <AnalysisMetric label="Risk" value={risk.toFixed(1)} level={assessment.riskLevel} />
              <AnalysisMetric label="Vulnerability" value={vulnerability.toFixed(1)} level={assessment.vulnerabilityLevel} />
              <AnalysisMetric label="Impact" value={impact.toFixed(1)} level={assessment.impactLevel} />
              <AnalysisMetric label="Population" value={population.toLocaleString()} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-white p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">
                  Validation result
                </p>
                <p className="mt-1 text-xs font-black text-slate-900">
                  Agent 01 + Agent 02 outputs ready
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  The selected assessment is ready to pass into resource optimization.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">
                  Coordination gate
                </p>
                <p className="mt-1 text-xs font-black text-slate-900">
                  {coordinationLevel}  {coordinationScore.toFixed(1)}/100
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Dominant pressure: {dominantFactor}. Exposure: {exposureBand}.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* PROCESS 02 */}
        {currentProcess === 2 && (
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600">
                  Agent 03  Resource Intelligence
                </p>
                <h3 className="mt-1 text-sm font-black text-slate-900">
                  Resource prediction and deployment planning
                </h3>
              </div>

              <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-indigo-700">
                {allocations.length} allocation{allocations.length === 1 ? "" : "s"}
              </span>
            </div>

            {allocations.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {allocations.map((allocation, index) => (
                  <div
                    key={allocation.id || `${allocation.resourceName}-${index}`}
                    className="rounded-xl border border-indigo-100 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-slate-900">
                          {allocation.resourceName ||
                            allocation.resourceType ||
                            "Response resource"}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {allocation.priority || "Normal priority"}
                          {allocation.location
                            ? `  ${allocation.location}`
                            : ""}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-xl bg-indigo-50 px-3 py-2 text-right">
                        <p className="text-[8px] font-black uppercase text-indigo-500">
                          Recommended
                        </p>
                        <p className="text-base font-black text-indigo-950">
                          {numberValue(
                            allocation.recommendedQuantity,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-indigo-200 bg-white p-5 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-600" />
                <p className="mt-2 text-xs font-black text-slate-700">
                  Agent 03 is calculating the resource plan...
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  The next process starts only after the Agent 03 response is received.
                </p>
              </div>
            )}
          </section>
        )}

        {/* PROCESS 03 */}
        {currentProcess === 3 && (
          <div className="space-y-3">
            {alert ? (
              <>
                {/* FINAL WARNING */}
                <section
                  className={`overflow-hidden rounded-3xl border ${
                    warningLevel.toLowerCase() === "critical"
                      ? "border-red-300 bg-red-50"
                      : warningLevel.toLowerCase() === "high"
                        ? "border-orange-300 bg-orange-50"
                        : warningLevel.toLowerCase() === "medium"
                          ? "border-amber-300 bg-amber-50"
                          : "border-emerald-300 bg-emerald-50"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                          <Bell className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Agent 04  Final early-warning output
                          </p>
                          <h3 className="mt-1 text-xl font-black leading-tight text-slate-950">
                            {alert.title}
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            {alert.location || assessment.location} {" "}
                            {alert.disasterType || assessment.disasterType}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-black ${
                          severityStyle[warningLevel] || severityStyle.Low
                        }`}
                      >
                        {warningLevel}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <WarningMetric label="Posture" value={operationalPosture} />
                      <WarningMetric label="Coordination score" value={coordinationScore.toFixed(1)} />
                      <WarningMetric label="Affected population" value={affectedPeople.toLocaleString()} />
                      <WarningMetric label="Agent 03 resources" value={`${allocations.length}`} />
                    </div>
                  </div>

                  <div className="border-t border-black/5 bg-white/85 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Generated warning
                      </p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black uppercase text-slate-500">
                        AI-assisted operational output
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                      {alert.message}
                    </p>

                    <p className="mt-2 text-[10px] leading-4 text-slate-500">
                      This output supports operational decision-making. It should
                      be validated by the responsible emergency authority before
                      any public dissemination.
                    </p>
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>

                {/* THREAT MATRIX */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                      Threat matrix
                    </p>
                    <h3 className="mt-1 text-sm font-black text-slate-900">
                      Multi-factor warning basis
                    </h3>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                    {escalationRows.map((row) => {
                      const reached = row.value >= row.threshold;

                      return (
                        <div
                          key={row.label}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-slate-800">
                              {row.label}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[8px] font-black ${
                                reached
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {reached ? "ESCALATION TRIGGER" : "BELOW GATE"}
                            </span>
                          </div>

                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-xl font-black text-slate-950">
                                {row.value.toFixed(1)}
                              </p>
                              <p className="text-[9px] text-slate-400">
                                Current level: {row.level}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[8px] font-black uppercase text-slate-400">
                                Reference
                              </p>
                              <p className="text-xs font-black text-slate-700">
                                {row.threshold}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                reached
                                  ? "bg-red-500"
                                  : row.value >= 55
                                    ? "bg-orange-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.max(
                                  2,
                                  Math.min(100, row.value),
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>

                {/* RESPONSE DECISION */}
                <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                        Response decision
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Recommended operational posture
                      </h3>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-blue-700 shadow-sm">
                      {operationalPosture}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <InfoBox label="Priority" value={warningLevel} />
                    <InfoBox label="Population" value={affectedPeople.toLocaleString()} />
                    <InfoBox label="Exposure" value={exposureBand} />
                    <InfoBox label="Next review" value={monitoringCadence} />
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>

                {/* RESPONSE TIMELINE */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                        Operational timeline
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Response planning windows
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {planningWindows.map((window) => (
                      <div
                        key={window.label}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="rounded-lg bg-slate-950 px-2 py-1 text-[8px] font-black text-white">
                            {window.label}
                          </span>
                          <div>
                            <p className="text-xs font-black text-slate-900">
                              {window.title}
                            </p>
                            <p className="mt-1 text-[10px] leading-4 text-slate-600">
                              {window.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-[9px] leading-4 text-slate-400">
                    Planning windows are operational guidance derived from this
                    assessment, not a live forecast or official emergency schedule.
                  </p>
                </section>

                {/* RESPONSE ACTIONS */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Immediate response priorities
                  </p>
                  <h3 className="mt-1 text-sm font-black text-slate-900">
                    Recommended coordination actions
                  </h3>

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {(actionItems.length
                      ? actionItems
                      : [
                          "Follow the generated warning and verify the response posture with the responsible authority.",
                        ]
                    ).map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[9px] font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="text-xs leading-5 text-slate-700">
                          {item}
                        </p>
                      </div>
                    ))}
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>

                {/* RESOURCE COORDINATION */}
                <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600">
                        Agent 03 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 04
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Resource deployment plan
                      </h3>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-indigo-700">
                      {allocations.length} linked
                    </span>
                  </div>

                  {allocations.length ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {allocations.map((resource, index) => (
                        <div
                          key={resource.id || `${resource.resourceName}-${index}`}
                          className="rounded-xl border border-indigo-100 bg-white p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-slate-900">
                                {resource.resourceName ||
                                  resource.resourceType ||
                                  "Response resource"}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-500">
                                {resource.priority || "Normal priority"}
                                {resource.location
                                  ? `  ${resource.location}`
                                  : ""}
                              </p>
                            </div>

                            <div className="shrink-0 rounded-xl bg-indigo-50 px-3 py-2 text-right">
                              <p className="text-[8px] font-black uppercase text-indigo-500">
                                Quantity
                              </p>
                              <p className="text-sm font-black text-indigo-950">
                                {numberValue(
                                  resource.recommendedQuantity,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-indigo-200 bg-white p-3">
                      <p className="text-xs text-slate-500">
                        No Agent 03 allocation record is linked to this warning.
                      </p>
                    </div>
                  )}

                  <p className="mt-3 text-[10px] leading-4 text-slate-500">
                    {alert.resourceSummary ||
                      "Resource coordination is linked to the Agent 03 output returned for this assessment."}
                  </p>
                </section>

                {/* MONITOR + ESCALATION */}
                <section className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">
                        Monitoring & reassessment
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Next decision checkpoint
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-[9px] font-black ${
                        escalationRequired
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {escalationRequired ? "Escalation required" : "Monitor"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <InfoBox label="Monitoring priority" value={monitoringCadence} />
                    <InfoBox label="Multi-factor pressure" value={`${pressureCount}/3 indicators  60`} />
                  </div>

                  <div className="mt-3 space-y-2">
                    {(escalationRequired
                      ? [
                          "Maintain the current escalation posture while the triggering condition remains elevated.",
                          "Reassess vulnerable-population exposure when updated validated data becomes available.",
                          "Reassess operational impact before reducing or expanding the response posture.",
                        ]
                      : [
                          "Continue monitoring the current risk indicators.",
                          "Reassess when validated risk, vulnerability, impact or population exposure changes materially.",
                          "Update the response posture using the next validated assessment.",
                        ]
                    ).map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-orange-100 bg-white p-3 text-[10px] leading-4 text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>

                {/* AI DECISION EXPLANATION */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                        AI decision explanation
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Why Agent 04 selected this response posture
                      </h3>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700">
                      {coordinationLevel} response stage
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <DecisionKpi label="Risk signal" value={risk.toFixed(1)} detail={assessment.riskLevel || "Unknown"} tone="red" />
                    <DecisionKpi label="Vulnerability" value={vulnerability.toFixed(1)} detail={assessment.vulnerabilityLevel || "Unknown"} tone="amber" />
                    <DecisionKpi label="Impact" value={impact.toFixed(1)} detail={assessment.impactLevel || "Unknown"} tone="amber" />
                    <DecisionKpi label="Coordination" value={coordinationScore.toFixed(1)} detail={operationalPosture} tone="blue" />
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Decision basis
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-700">
                      Agent 04 combines the validated risk, vulnerability, impact and population-exposure signals with the linked Agent 03 resource state.
                      {pressureCount >= 2
                        ? ` ${pressureCount} of 3 core indicators are at or above 60, so coordinated monitoring is required.`
                        : " The available indicators do not show a broad multi-factor pressure pattern."}
                    </p>
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>

                {/* ESCALATION GATE */}
                <section className={`rounded-2xl border p-4 ${escalationRequired ? "border-red-200 bg-red-50/70" : "border-emerald-200 bg-emerald-50/70"}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${escalationRequired ? "text-red-700" : "text-emerald-700"}`}>
                        Escalation decision
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        {escalationRequired ? "Escalation conditions detected" : "No escalation condition triggered"}
                      </h3>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-[9px] font-black ${escalationRequired ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {escalationRequired ? "Escalation required" : "Monitor"}
                    </span>
                  </div>

                  {escalationReasons.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {escalationReasons.map((reason, index) => (
                        <div key={reason} className="flex items-start gap-2 rounded-xl border border-red-100 bg-white p-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-[9px] font-black text-red-700">
                            {index + 1}
                          </span>
                          <p className="text-[10px] leading-4 text-slate-700">{reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl border border-emerald-100 bg-white p-3 text-[10px] leading-4 text-slate-600">
                      Continue routine or targeted monitoring and reassess when validated indicators change materially.
                    </p>
                  )}
                </section>

                {/* COORDINATION TASKS */}
                <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">
                        Coordination task plan
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Agent 04 operational task recommendations
                      </h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-violet-700">
                      {coordinationTasks.length} tasks
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {coordinationTasks.map((task, index) => {
                      const acknowledged = Boolean(acknowledgedTasks[task.id]);
                      return (
                        <div key={task.id} className="flex items-center gap-3 rounded-xl border border-violet-100 bg-white p-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[9px] font-black text-white">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-5 text-slate-800">{task.title}</p>
                            <p className="mt-0.5 text-[9px] font-black uppercase text-slate-400">Priority: {task.priority}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAcknowledgedTasks((current) => ({ ...current, [task.id]: !current[task.id] }))}
                            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-black ${acknowledged ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700 hover:bg-violet-200"}`}
                          >
                            {acknowledged ? "Acknowledged" : "Acknowledge"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[9px] leading-4 text-slate-500">
                    These tasks are derived from the validated assessment and Agent 03 allocation records. They are coordination recommendations; task persistence requires the dedicated coordination-task API.
                  </p>
                </section>

                {/* RESOURCE COVERAGE */}
                <section className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600">
                        Resource coverage intelligence
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Agent 03 allocation coverage for Agent 04
                      </h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-indigo-700">
                      {allocations.length} linked
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <InfoBox label="Allocation records" value={String(allocations.length)} />
                    <InfoBox label="Total recommended units" value={resourceTotalUnits.toLocaleString()} />
                    <InfoBox label="High-priority records" value={String(highPriorityResources)} />
                    <InfoBox label="Deployment locations" value={String(resourceLocations.length)} />
                  </div>

                  <div className="mt-3 rounded-xl border border-indigo-100 bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-indigo-500">
                      Coverage interpretation
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-600">
                      {allocations.length
                        ? `Agent 03 returned ${allocations.length} live allocation record(s) covering ${resourceTotalUnits.toLocaleString()} recommended units across ${resourceLocations.length || 1} recorded location(s). A demand-baseline gap cannot be claimed from the available API data alone.`
                        : "No Agent 03 allocation records are available, so resource coverage cannot be confirmed."}
                    </p>
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>

                {/* HUMAN APPROVAL GATE */}
                <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-700">
                        Human approval gate
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Review before operational dissemination
                      </h3>
                      <p className="mt-1 text-[10px] leading-4 text-slate-600">
                        Agent 04 output should be reviewed by the responsible emergency authority before public dissemination or high-impact action.
                      </p>
                    </div>

                    <span className={`rounded-full px-3 py-1.5 text-[9px] font-black ${approvalState === "approved" ? "bg-emerald-100 text-emerald-700" : approvalState === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {approvalState === "approved" ? "Approved" : approvalState === "rejected" ? "Rejected" : "Pending approval"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setApprovalState("approved")}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700"
                    >
                      Approve warning
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalState("rejected")}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                                        <button
                      type="button"
                      disabled={approvalState !== "approved" || sendingReport}
                      onClick={sendMessageAndReport}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sendingReport ? "Sending..." : "Send Message & Report"}
                    </button>
                    <button
                      type="button"
                      disabled={approvalState !== "approved" || !alert}
                      onClick={() => {
                        if (!alert) return;
                        const report = [
                          "RELIEFNEXUS EMERGENCY REPORT",
                          "",
                          `Title: ${alert.title || "Emergency Alert"}`,
                          `Location: ${alert.location || assessment.location || "Unknown"}`,
                          `Disaster Type: ${alert.disasterType || assessment.disasterType || "Unknown"}`,
                          `Severity: ${alert.severity || "Unknown"}`,
                          `Status: ${alert.status || "Active"}`,
                          "",
                          "MESSAGE",
                          alert.message || "",
                          "",
                          "RECOMMENDED ACTIONS",
                          String(alert.recommendedActions || assessment.recommendedActions || ""),
                          "",
                          "RESOURCE INFORMATION",
                          String(alert.resourceSummary || "No resource summary available."),
                        ].join("\n");
                        const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `ReliefNexus-Emergency-Report-${alert.id}.txt`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Save Report
                    </button><span className="inline-flex items-center rounded-xl bg-white px-3 py-2.5 text-[9px] font-bold text-slate-500">
                      Approval controls are active. Send Message & Report is available after approval.
                    </span>
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>

                {/* NOTIFICATION & REASSESSMENT PLAN */}
                <section className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-cyan-700" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-700">
                        Notification & reassessment plan
                      </p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        Who should be coordinated and when to reassess
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-cyan-100 bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-wider text-cyan-600">Recommended recipients</p>
                      <div className="mt-2 space-y-1.5">
                        {notificationPlan.map((recipient) => (
                          <div key={recipient} className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-700">
                            {recipient}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-cyan-100 bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-wider text-cyan-600">Reassessment trigger</p>
                      <p className="mt-2 text-xs font-black text-slate-900">{monitoringCadence}</p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-600">
                        Re-run the validated assessment when risk, vulnerability, impact or population exposure changes materially.
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[9px] leading-4 text-slate-500">
                    Notification recipients and reassessment guidance are operational recommendations; this screen does not claim that external SMS, email or push notifications have been sent.
                  </p>
                </section>

                {/* FINAL COMMAND SUMMARY */}
                <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Agent 04 command summary
                      </p>
                      <h3 className="mt-1 text-sm font-black">
                        Early-warning output persisted
                      </h3>
                    </div>

                    <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[9px] font-black text-emerald-300">
                      {alert.status || "Active"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <CommandMetric label="Alert" value="Generated" />
                    <CommandMetric label="Status" value={alert.status || "Active"} />
                    <CommandMetric label="Active" value={alert.isActive ? "Yes" : "No"} />
                    <CommandMetric label="Resources" value={`${allocations.length}`} />
                    <CommandMetric label="Posture" value={operationalPosture} />
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Data lineage
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      Agent 01 Risk Prediction  Agent 02 Vulnerability & Impact
                       Agent 03 Resource Optimization  Agent 04 Early Warning
                      & Coordination.
                    </p>
                  {sendReportMessage && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      {sendReportMessage}
                    </p>
                  )}
                  </div>
                </section>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
                <p className="mt-3 text-sm font-black text-slate-800">
                  Agent 04 is generating the early warning...
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  The final operational warning will appear when the Agent 04 API responds.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-red-600">
              Execution error
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-red-700">
              {error}
            </p>
          </section>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={running}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>

          {currentProcess === 1 && !running && (
            <button
              type="button"
              onClick={onRun}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <span className="text-sm"></span>
              Start Agent 03 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Agent 04
            </button>
          )}

          {running && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentProcess === 1
                ? "Validating Agent 01 / Agent 02 outputs..."
                : currentProcess === 2
                  ? "Agent 03 is predicting resource requirements..."
                  : "Agent 04 is generating the early warning..."}
            </div>
          )}

          {currentProcess === 3 && !running && alert && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              Finish & Close
            </button>
          )}

          {currentProcess === 3 && !running && !alert && error && (
            <button
              type="button"
              onClick={onRun}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              Retry Agent 04
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CommandKpi({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-3">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-slate-900">{value}</p>
    </div>
  );
}

function DecisionKpi({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "red" | "amber" | "indigo";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
      <span
        className={`mt-2 inline-flex rounded-full px-2 py-1 text-[8px] font-black ${tones[tone]}`}
      >
        {detail}
      </span>
    </div>
  );
}

function WarningMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-slate-900">{value}</p>
    </div>
  );
}

function CommandMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-white">{value}</p>
    </div>
  );
}

function AnalysisMetric({
  label,
  value,
  level,
}: {
  label: string;
  value: string;
  level?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-2.5">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-black text-slate-900">
        {value}
      </p>
      {level && (
        <p className="mt-0.5 text-[9px] font-bold text-slate-500">
          {level}
        </p>
      )}
    </div>
  );
}

function ViewModal({
  assessment,
  alert,
  allocations,
  onClose,
  onRun,
  onMap,
  onDelete,
}: {
  assessment: VulnerabilityAssessment;
  alert: EmergencyAlert | null;
  allocations: ResourceAllocation[];
  onClose: () => void;
  onRun: () => void;
  onMap: () => void;
  onDelete: () => void;
}) {
  const risk = numberValue(assessment.riskScore);
  const vulnerability = numberValue(assessment.vulnerabilityScore);
  const impact = numberValue(assessment.impactScore);
  const population = numberValue(assessment.affectedPopulation);

  const dominant =
    risk >= vulnerability && risk >= impact
      ? "Risk pressure"
      : vulnerability >= impact
        ? "Vulnerability pressure"
        : "Impact pressure";

  const operationalPressure = getOperationalPressure(assessment);
  const posture = getWarningPosture(assessment, alert);
  const cadence = getMonitoringCadence(assessment, alert);
  const exposureBand = population >= 10000 ? "Very high population exposure" : population >= 1000 ? "High population exposure" : population >= 500 ? "Moderate population exposure" : "Limited population exposure";

  return (
    <Modal title="Incident & Early Warning Details" onClose={onClose}>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="relative">
          <img
            src={getDisasterImage(assessment.disasterType)}
            alt=""
            className="h-44 w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 pt-12 text-white">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/70">
              Agent 04 incident record
            </p>
            <h3 className="mt-1 text-xl font-black">
              {alert?.title || `${assessment.disasterType || "Disaster"} warning`}
            </h3>
            <p className="mt-1 text-xs font-semibold text-white/80">
              {assessment.location || "Unknown location"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 sm:grid-cols-4">
          <InfoBox label="Risk" value={`${risk.toFixed(1)}  ${assessment.riskLevel || ""}`} />
          <InfoBox label="Vulnerability" value={`${vulnerability.toFixed(1)}  ${assessment.vulnerabilityLevel || ""}`} />
          <InfoBox label="Impact" value={`${impact.toFixed(1)}  ${assessment.impactLevel || ""}`} />
          <InfoBox label="Population" value={population.toLocaleString()} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <WarningMetric label="Operational pressure" value={`${operationalPressure}/100`} />
        <WarningMetric label="Warning posture" value={posture} />
        <WarningMetric label="Exposure" value={exposureBand} />
        <WarningMetric label="Monitoring" value={cadence} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><Target className="h-4 w-4 text-blue-600" /><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Decision rationale</p></div>
          <p className="mt-2 text-xs leading-5 text-slate-700">{dominant} is the largest assessment component. The operational posture combines risk, vulnerability and impact rather than relying on a single score.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><Route className="h-4 w-4 text-indigo-600" /><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Response readiness</p></div>
          <p className="mt-2 text-xs leading-5 text-slate-700">{allocations.length ? `${allocations.length} Agent 03 allocation record(s) are linked to this assessment.` : "No Agent 03 allocation record is available for this assessment yet."}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-orange-600" /><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Reassessment gate</p></div>
          <p className="mt-2 text-xs leading-5 text-slate-700">Reassess when validated risk, vulnerability, impact or population exposure changes materially. {cadence}.</p>
        </div>
      </div>

      {alert ? (
        <>
          <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-600">
                  Warning classification
                </p>
                <p className="mt-1 text-sm font-black text-slate-900">
                  {alert.severity}  {alert.status}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-red-700">
                {alert.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            <div className="mt-3 rounded-xl bg-white p-3">
              <p className="text-[9px] font-black uppercase text-slate-400">Generated warning</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{alert.message}</p>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-red-100 bg-red-50/70 p-3"><p className="text-[9px] font-black uppercase text-red-500">Trigger</p><p className="mt-1 text-xs font-black text-slate-900">{dominant}</p></div>
              <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-3"><p className="text-[9px] font-black uppercase text-orange-500">Escalation</p><p className="mt-1 text-xs font-black text-slate-900">{posture}</p></div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3"><p className="text-[9px] font-black uppercase text-blue-500">Next review</p><p className="mt-1 text-xs font-black text-slate-900">{cadence}</p></div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Response actions
              </p>
              <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-700">
                {alert.recommendedActions || "No actions available."}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-indigo-500">
                Resource coordination
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-700">
                {alert.resourceSummary || "No Agent 03 resource summary available."}
              </p>

              <div className="mt-3 space-y-2">
                {allocations.slice(0, 4).map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between rounded-lg bg-white p-2.5"
                  >
                    <div>
                      <p className="text-[10px] font-black text-slate-900">
                        {resource.resourceName || resource.resourceType || "Resource"}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {resource.priority || "Normal"}  {resource.location || assessment.location}
                      </p>
                    </div>
                    <span className="rounded-md bg-indigo-50 px-2 py-1 text-[9px] font-black text-indigo-700">
                      {numberValue(resource.recommendedQuantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-orange-700">
              Decision analysis
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <InfoBox label="Dominant pressure" value={dominant} />
              <InfoBox label="Agent 03 allocations" value={String(allocations.length)} />
              <InfoBox label="Alert created" value={alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ""} />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          No Agent 04 alert has been generated for this assessment yet.
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                Map navigation
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {assessment.location || "Selected assessment"}
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                Jump to the verified assessment coordinate on the global risk intelligence map.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onMap}
            disabled={!getLocationCoords(assessment.location || "")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <MapPin className="h-3.5 w-3.5" />
            Locate on Risk Map
          </button>
        </div>

        <div className="border-t border-blue-100 bg-white/60 px-4 py-2 text-[9px] font-semibold text-slate-500">
          Incident Details
          <span className="mx-1.5 text-blue-400"></span>
          Global Risk Map
          <span className="mx-1.5 text-blue-400"></span>
          {assessment.location || "Verified location"}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><Map className="h-4 w-4 text-blue-600" /><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Verified map location</p><p className="text-xs font-black text-slate-900">{assessment.location || "Unknown location"}</p></div></div>
          <button type="button" onClick={onMap} disabled={!getLocationCoords(assessment.location || "")} className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black text-white disabled:bg-slate-300">View on Risk Map</button>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
          <InfoBox label="Coordinate" value={getLocationCoords(assessment.location || "") ? "Verified" : "Unavailable"} />
          <InfoBox label="Map scope" value="Worldwide" />
          <InfoBox label="Marker" value={alert?.severity || assessment.riskLevel || "Low"} />
          <InfoBox label="Action" value="Fly to location" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
        >
          Close
        </button>

        <button
          onClick={onRun}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"
        >
          {alert ? "Run Again" : "Run Agent 04"}
        </button>

        {alert && (
          <button
            onClick={onDelete}
            className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-700"
          >
            Delete Alert
          </button>
        )}
      </div>
    </Modal>
  );
}

function StatusModal({
  alert,
  status,
  setStatus,
  onClose,
  onSave,
}: {
  alert: EmergencyAlert;
  status: string;
  setStatus: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal title="Update Alert Status" onClose={onClose}>
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="font-black">{alert.title}</p>
        <p className="mt-1 text-sm text-slate-500">{alert.location}</p>
      </div>

      <label className="mt-5 mb-2 block text-sm font-bold">Status</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
      >
        <option>Active</option>
        <option>Monitoring</option>
        <option>Resolved</option>
        <option>Closed</option>
      </select>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white"
        >
          Update Status
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="relative z-[2001] max-h-[94vh] w-full max-w-6xl overflow-y-auto overscroll-contain rounded-3xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <h3 className="text-lg font-black">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

export default EmergencyAlertsPage;




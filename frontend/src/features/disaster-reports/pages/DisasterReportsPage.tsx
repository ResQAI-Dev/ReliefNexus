import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "../../../lib/api/apiClient";

type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  roleRequestStatus?: string;
};

type DisasterReport = {
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
  assignedAt?: string;
  fieldUpdateNotes?: string | null;
  fieldSituation?: string | null;
  fieldUpdateLatitude?: number | null;
  fieldUpdateLongitude?: number | null;
  fieldUpdatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};


type RiskPredictionRecord = {
  id?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  disasterType?: string;
  riskScore?: number | null;
  riskLevel?: string;
  confidence?: number | null;
  disasterRisks?: Array<{
    disasterType?: string;
    riskScore?: number | null;
    riskLevel?: string;
    dataAvailable?: boolean;
    dataSource?: string;
  }>;
  predictionSource?: string;
  modelVersion?: string;
  createdAt?: string;
  isApproved?: boolean;
  approvalStatus?: string;
};

type VulnerabilityAssessmentRef = {
  id?: string;
  riskPredictionId?: string;
  location?: string;
  disasterType?: string;
  createdAt?: string;
};

type EmergencyAlertRef = {
  id?: string;
  vulnerabilityAssessmentId?: string;
  riskPredictionId?: string;
  location?: string;
  disasterType?: string;
  severity?: string;
  status?: string;
  createdAt?: string;
};

type MapFocus = {
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  kind: "report" | "prediction";
};

type VolunteerRecommendation = {
  volunteerUserId: string;
  volunteerName: string;
  email: string;
  district: string;
  isActive: boolean;
  matchScore: number;
  currentWorkload: number;
  availability: string;
  matchReason: string;
};

type VolunteerRecommendationResponse = {
  disasterReportId: string;
  disasterType: string;
  location: string;
  severity: string;
  recommendedVolunteer: VolunteerRecommendation | null;
  alternatives: VolunteerRecommendation[];
  agentName: string;
};

const HeroStat = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "red" | "amber" | "green";
}) => (
  <div
    className={`rounded-2xl border px-4 py-4 ${
      tone === "red"
        ? "border-red-400/20 bg-red-500/10"
        : tone === "amber"
          ? "border-amber-400/20 bg-amber-500/10"
          : tone === "green"
            ? "border-emerald-400/20 bg-emerald-500/10"
            : "border-white/10 bg-white/5"
    }`}
  >
    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-2xl font-black text-white">{value}</p>
  </div>
);

const InfoBox = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-[11px] font-semibold text-slate-700">{value}</p>
  </div>
);

type ResourceAllocationRef = {
  id?: string;
  vulnerabilityAssessmentId?: string;
  resourceName?: string;
  resourceType?: string;
  quantity?: number | null;
  recommendedQuantity?: number | null;
  location?: string;
  priority?: string;
};

function validMappedCount(reports: DisasterReport[]) {
  return reports.filter(
    (report) =>
      Number.isFinite(Number(report.latitude)) &&
      Number.isFinite(Number(report.longitude)),
  ).length;
}

function getReportLocation(report: DisasterReport) {
  return (
    report.location?.trim() ||
    `${report.disasterType || "Disaster"} incident`
  );
}

type Props = {
  users?: UserRecord[];
};

const normalize = (value?: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type PersistedWorkflowState = {
  activeType: "report" | "prediction" | null;
  activeId: string | null;
  reportSteps: Record<string, WorkflowStep>;
  predictionSteps: Record<string, WorkflowStep>;
};

const WORKFLOW_PERSISTENCE_KEY = "reliefnexus:unified-workflow-state:v1";

const emptyPersistedWorkflowState = (): PersistedWorkflowState => ({
  activeType: null,
  activeId: null,
  reportSteps: {},
  predictionSteps: {},
});

const isWorkflowStep = (value: unknown): value is WorkflowStep =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 8;

const WorkflowStepCard = ({
  number,
  title,
  owner,
  status,
  selected,
  onClick,
}: {
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  title: string;
  owner: string;
  status: string;
  selected?: boolean;
  onClick?: () => void;
}) => {
  const tone =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Ready" || status === "In Progress"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : status === "Waiting"
          ? "bg-slate-100 text-slate-500 border-slate-200"
          : "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-2xl border p-3 text-left transition ${
        selected
          ? "border-violet-300 bg-violet-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-violet-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-black ${
            selected
              ? "bg-violet-600 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {number}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[7px] font-black ${tone}`}
        >
          {status}
        </span>
      </div>
      <p className="mt-3 text-[10px] font-black text-slate-900">{title}</p>
      <p className="mt-1 text-[8px] uppercase tracking-wide text-slate-400">
        {owner}
      </p>
    </button>
  );
};

const readPersistedWorkflowState = (): PersistedWorkflowState => {
  if (typeof window === "undefined") {
    return emptyPersistedWorkflowState();
  }

  try {
    const raw = window.localStorage.getItem(WORKFLOW_PERSISTENCE_KEY);
    if (!raw) return emptyPersistedWorkflowState();

    const parsed = JSON.parse(raw) as Partial<PersistedWorkflowState>;
    const reportSteps: Record<string, WorkflowStep> = {};
    const predictionSteps: Record<string, WorkflowStep> = {};

    Object.entries(parsed.reportSteps || {}).forEach(([id, value]) => {
      if (isWorkflowStep(value)) reportSteps[id] = value;
    });

    Object.entries(parsed.predictionSteps || {}).forEach(([id, value]) => {
      if (isWorkflowStep(value)) predictionSteps[id] = value;
    });

    return {
      activeType:
        parsed.activeType === "report" || parsed.activeType === "prediction"
          ? parsed.activeType
          : null,
      activeId: parsed.activeId ? String(parsed.activeId) : null,
      reportSteps,
      predictionSteps,
    };
  } catch (error) {
    console.warn("Unable to restore ReliefNexus workflow state:", error);
    return emptyPersistedWorkflowState();
  }
};

const writePersistedWorkflowState = (state: PersistedWorkflowState) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      WORKFLOW_PERSISTENCE_KEY,
      JSON.stringify(state),
    );
  } catch (error) {
    console.warn("Unable to persist ReliefNexus workflow state:", error);
  }
};

const formatStatus = (value?: string) =>
  String(value || "Submitted")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");

const formatDate = (value?: string | null) => {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No date" : date.toLocaleString();
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
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const statusClass = (value?: string) => {
  switch (normalize(value)) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "assigned":
      return "bg-violet-50 text-violet-700";
    case "verified":
      return "bg-indigo-50 text-indigo-700";
    case "underreview":
      return "bg-amber-50 text-amber-700";
    case "inprogress":
    case "fieldupdatesubmitted":
    case "fieldcompleted":
      return "bg-cyan-50 text-cyan-700";
    default:
      return "bg-blue-50 text-blue-700";
  }
};

const incidentImage = (type?: string) => {
  const value = String(type || "").toLowerCase();

  if (value.includes("landslide")) return "/assets/disasters/landslide.jpg";
  if (value.includes("earthquake")) return "/assets/disasters/earthquake.jpg";
  if (value.includes("tsunami")) return "/assets/disasters/tsunami.jpg";
  if (value.includes("wildfire") || value.includes("fire")) {
    return "/assets/disasters/wildfire.jpg";
  }
  if (value.includes("cyclone") || value.includes("hurricane")) {
    return "/assets/disasters/cyclone.jpg";
  }
  if (value.includes("tornado")) return "/assets/disasters/tornado.jpg";
  if (value.includes("drought")) return "/assets/disasters/drought.jpg";
  return "/assets/disasters/flood.jpg";
};

const icon = (name: "search" | "map" | "user" | "check" | "alert") => {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    map: (
      <>
        <path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20V6.5Z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 21c.8-4.3 3.1-6.5 7-6.5s6.2 2.2 7 6.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="M10.3 3.3 2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
};

function DisasterReportsMap({
  reports,
  predictions,
  focus,
}: {
  reports: DisasterReport[];
  predictions: RiskPredictionRecord[];
  focus: MapFocus | null;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const searchMarkerRef = useRef<L.CircleMarker | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);

  const validReportCount = reports.filter((report) => {
    const lat = Number(report.latitude);
    const lng = Number(report.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  }).length;
  const validPredictionCount = predictions.filter((prediction) => {
    const lat = Number(prediction.latitude);
    const lng = Number(prediction.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  }).length;

  const primaryRisk = (prediction: RiskPredictionRecord) => {
    const available = (prediction.disasterRisks || [])
      .filter(
        (risk) =>
          risk.dataAvailable !== false &&
          Number.isFinite(Number(risk.riskScore)),
      )
      .sort((a, b) => Number(b.riskScore) - Number(a.riskScore));

    if (available[0]) {
      return {
        disasterType: available[0].disasterType || prediction.disasterType || "Disaster",
        riskScore: Number(available[0].riskScore),
        riskLevel: available[0].riskLevel || prediction.riskLevel || "Unknown",
      };
    }

    return {
      disasterType: prediction.disasterType || "Disaster",
      riskScore: Number.isFinite(Number(prediction.riskScore))
        ? Number(prediction.riskScore)
        : 0,
      riskLevel: prediction.riskLevel || "Unknown",
    };
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const reportPoints = reports.filter((report) => {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });

    const predictionPoints = predictions.filter((prediction) => {
      const lat = Number(prediction.latitude);
      const lng = Number(prediction.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });

    const map = L.map(mapRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
      keyboard: true,
      worldCopyJump: true,
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const severityColors: Record<string, string> = {
      critical: "#ef4444",
      high: "#f97316",
      medium: "#facc15",
      low: "#22c55e",
      dataunavailable: "#64748b",
    };

    const layers: L.Layer[] = [];

    reportPoints.forEach((report) => {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      const severity = normalize(report.severity);
      const color = severityColors[severity] || "#3b82f6";

      const marker = L.circleMarker([lat, lng], {
        radius: severity === "critical" ? 10 : 8,
        color: "#ffffff",
        weight: 3,
        fillColor: color,
        fillOpacity: 1,
      }).addTo(map);

      const popup = `
        <div style="min-width:245px;font-family:Inter,Arial,sans-serif">
          <div style="font-size:9px;font-weight:900;color:#2563eb;text-transform:uppercase;letter-spacing:.12em">
            Submitted Incident
          </div>
          <div style="font-size:16px;font-weight:900;color:#0f172a;margin-top:5px">
            ${String(report.location || "Unknown location")}
          </div>
          <div style="margin-top:7px;font-size:12px;color:#475569;line-height:1.75">
            <strong>Disaster:</strong> ${String(report.disasterType || "Unknown")}<br/>
            <strong>Severity:</strong> ${String(report.severity || "Unknown")}<br/>
            <strong>Status:</strong> ${String(formatStatus(report.status))}<br/>
            <strong>Reporter:</strong> ${String(report.reporterName || "Unknown")}<br/>
            <strong>Coordinates:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
        </div>
      `;

      marker.bindPopup(popup);
      layers.push(marker);
    });

    predictionPoints.forEach((prediction) => {
      const lat = Number(prediction.latitude);
      const lng = Number(prediction.longitude);
      const risk = primaryRisk(prediction);
      const level = normalize(risk.riskLevel);
      const color = severityColors[level] || "#7c3aed";

      const marker = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#ffffff",
        weight: 3,
        fillColor: color,
        fillOpacity: 0.92,
        dashArray: "3 2",
      }).addTo(map);

      const popup = `
        <div style="min-width:255px;font-family:Inter,Arial,sans-serif">
          <div style="font-size:9px;font-weight:900;color:#7c3aed;text-transform:uppercase;letter-spacing:.12em">
            AI Risk Prediction
          </div>
          <div style="font-size:16px;font-weight:900;color:#0f172a;margin-top:5px">
            ${String(prediction.location || "Unknown location")}
          </div>
          <div style="margin-top:7px;font-size:12px;color:#475569;line-height:1.75">
            <strong>Disaster:</strong> ${String(risk.disasterType)}<br/>
            <strong>Risk:</strong> ${risk.riskScore.toFixed(1)} · ${String(risk.riskLevel)}<br/>
            <strong>Confidence:</strong> ${
              Number.isFinite(Number(prediction.confidence))
                ? `${Number(prediction.confidence).toFixed(1)}%`
                : "—"
            }<br/>
            <strong>Model:</strong> ${String(prediction.modelVersion || "—")}<br/>
            <strong>Coordinates:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
        </div>
      `;

      marker.bindPopup(popup);
      layers.push(marker);
    });

    const allCoordinates = [
      ...reportPoints.map(
        (report) =>
          [Number(report.latitude), Number(report.longitude)] as [number, number],
      ),
      ...predictionPoints.map(
        (prediction) =>
          [Number(prediction.latitude), Number(prediction.longitude)] as [
            number,
            number,
          ],
      ),
    ];

    if (allCoordinates.length > 1) {
      map.fitBounds(L.latLngBounds(allCoordinates), {
        padding: [45, 45],
        maxZoom: 11,
      });
    } else if (allCoordinates.length === 1) {
      map.setView(allCoordinates[0], 11);
    }

    const form = formRef.current;

    const onSearch = async (event: Event) => {
      event.preventDefault();

      const input = form?.querySelector("input");
      const query =
        input instanceof HTMLInputElement ? input.value.trim() : "";

      if (!query) {
        setSearchMessage("Enter a city, country, address or landmark.");
        return;
      }

      setSearching(true);
      setSearchMessage("");

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Map search failed.");
        }

        const results = (await response.json()) as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;

        if (!results.length) {
          setSearchMessage("Location not found.");
          return;
        }

        const lat = Number(results[0].lat);
        const lng = Number(results[0].lon);

        map.flyTo([lat, lng], 12, {
          duration: 1.1,
        });

        searchMarkerRef.current?.remove();

        searchMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 10,
          color: "#ffffff",
          weight: 4,
          fillColor: "#2563eb",
          fillOpacity: 1,
        }).addTo(map);

        searchMarkerRef.current
          .bindPopup(
            `<div style="font-family:Inter,Arial,sans-serif;min-width:210px">
              <strong style="font-size:12px;color:#2563eb">Map Search Result</strong>
              <div style="margin-top:5px;font-size:11px;color:#475569">
                ${String(results[0].display_name)}
              </div>
            </div>`,
          )
          .openPopup();
      } catch (searchError) {
        console.error("Global disaster map search failed:", searchError);
        setSearchMessage("Unable to search the map right now.");
      } finally {
        setSearching(false);
      }
    };

    form?.addEventListener("submit", onSearch);

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      form?.removeEventListener("submit", onSearch);
      window.clearTimeout(timer);
      searchMarkerRef.current?.remove();
      searchMarkerRef.current = null;
      layers.forEach((layer) => layer.remove());
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [reports, predictions]);

  useEffect(() => {
    if (!mapInstanceRef.current || !focus) return;

    const map = mapInstanceRef.current;

    map.flyTo([focus.latitude, focus.longitude], 13, {
      duration: 0.9,
    });

    searchMarkerRef.current?.remove();

    searchMarkerRef.current = L.circleMarker(
      [focus.latitude, focus.longitude],
      {
        radius: 12,
        color: "#ffffff",
        weight: 4,
        fillColor: focus.kind === "report" ? "#2563eb" : "#7c3aed",
        fillOpacity: 1,
      },
    ).addTo(map);

    searchMarkerRef.current
      .bindPopup(
        `<div style="font-family:Inter,Arial,sans-serif;min-width:205px">
          <strong style="font-size:12px;color:${
            focus.kind === "report" ? "#2563eb" : "#7c3aed"
          }">
            ${focus.kind === "report" ? "Submitted Incident" : "AI Risk Prediction"}
          </strong>
          <div style="margin-top:5px;font-size:14px;font-weight:800;color:#0f172a">
            ${String(focus.title)}
          </div>
          ${
            focus.subtitle
              ? `<div style="margin-top:3px;font-size:11px;color:#64748b">${String(
                  focus.subtitle,
                )}</div>`
              : ""
          }
        </div>`,
      )
      .openPopup();
  }, [focus]);

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-slate-950">
      <div ref={mapRef} className="h-[390px] w-full" />

      <form
        ref={formRef}
        className="absolute left-4 top-4 z-[600] flex w-[min(560px,calc(100%-32px))] items-center gap-2 rounded-2xl border border-white/30 bg-white/95 p-2 shadow-xl backdrop-blur"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          {icon("search")}
        </div>

        <input
          placeholder="Search worldwide: city, country, address or landmark..."
          className="min-w-0 flex-1 bg-transparent px-1 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
        />

        <button
          type="submit"
          disabled={searching}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {searchMessage && (
        <div className="absolute left-4 top-[76px] z-[600] rounded-xl bg-white px-3 py-2 text-[10px] font-bold text-slate-600 shadow-lg">
          {searchMessage}
        </div>
      )}

      <div className="absolute left-4 bottom-4 z-[550] rounded-2xl border border-white/20 bg-slate-950/90 px-4 py-3 text-white shadow-xl backdrop-blur">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-300">
          Global Disaster Intelligence Map
        </p>
        <p className="mt-1 text-xs font-black">
          {validReportCount} submitted + {validPredictionCount} AI locations
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-[9px] text-slate-300">
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Incident reports
          </span>
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-violet-600" />
            AI predictions
          </span>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-[550] rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur">
        <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-slate-500">
          Severity / risk
        </p>
        <div className="space-y-1.5 text-[9px] font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Critical
          </span>
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            High
          </span>
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            Medium
          </span>
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Low
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DisasterReportsPage({ users: suppliedUsers }: Props) {
  const [reports, setReports] = useState<DisasterReport[]>([]);
  const [predictions, setPredictions] = useState<RiskPredictionRecord[]>([]);
  const [vulnerabilityAssessments, setVulnerabilityAssessments] = useState<
    VulnerabilityAssessmentRef[]
  >([]);
  const [alerts, setAlerts] = useState<EmergencyAlertRef[]>([]);
  const [users] = useState<UserRecord[]>(suppliedUsers || []);

  const [loading, setLoading] = useState(true);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [error, setError] = useState("");
  const [intelligenceError, setIntelligenceError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  const [actionLoading, setActionLoading] = useState("");
  const [stageActionLoading, setStageActionLoading] = useState("");
  const persistedInitialState = readPersistedWorkflowState();

  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [reportStep, setReportStep] = useState<Record<string, WorkflowStep>>({});

  const [openPredictionId, setOpenPredictionId] = useState<string | null>(null);
  const [predictionStep, setPredictionStep] = useState<Record<string, WorkflowStep>>({});

  // Persisted operational incident links. A standalone Agent 01 prediction
  // becomes a real Disaster Report operational case before the response stages.
  const [selectedPredictionByReport, setSelectedPredictionByReport] =
    useState<Record<string, string>>({});
  const [predictionIncidentByPrediction, setPredictionIncidentByPrediction] =
    useState<Record<string, DisasterReport | null>>({});
  const [predictionIncidentLoading, setPredictionIncidentLoading] =
    useState<Record<string, boolean>>({});
  const [predictionIncidentError, setPredictionIncidentError] =
    useState<Record<string, string>>({});

  const [selectedVolunteerByReport, setSelectedVolunteerByReport] =
    useState<Record<string, string>>({});

  const [recommendation, setRecommendation] =
    useState<VolunteerRecommendationResponse | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");

  const [resourceByAssessment, setResourceByAssessment] = useState<
    Record<string, ResourceAllocationRef[] | null>
  >({});
  const [resourceLoading, setResourceLoading] = useState<Record<string, boolean>>(
    {},
  );

  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [reportActionMenuId, setReportActionMenuId] = useState<string | null>(null);

  const unwrapArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    if (payload && typeof payload === "object") return [payload as T];
    return [];
  };

  const loadAll = async () => {
    setLoading(true);
    setIntelligenceLoading(true);
    setError("");
    setIntelligenceError("");

    const [reportsResult, predictionsResult, assessmentsResult, alertsResult] =
      await Promise.allSettled([
        api.get("/disaster-reports"),
        api.get("/risk-predictions/history"),
        api.get("/vulnerability-impact"),
        api.get("/emergency-alerts"),
      ]);

    if (reportsResult.status === "fulfilled") {
      setReports(
        unwrapArray<DisasterReport>(reportsResult.value.data),
      );
    } else {
      console.error("Disaster reports load failed:", reportsResult.reason);
      setError("Disaster reports could not be loaded from the API.");
    }

    if (predictionsResult.status === "fulfilled") {
      setPredictions(
        unwrapArray<RiskPredictionRecord>(
          predictionsResult.value.data,
        ),
      );
    } else {
      console.error(
        "Risk prediction history load failed:",
        predictionsResult.reason,
      );
      setIntelligenceError(
        "Risk prediction history could not be loaded.",
      );
    }

    if (assessmentsResult.status === "fulfilled") {
      setVulnerabilityAssessments(
        unwrapArray<VulnerabilityAssessmentRef>(
          assessmentsResult.value.data,
        ),
      );
    }

    if (alertsResult.status === "fulfilled") {
      setAlerts(
        unwrapArray<EmergencyAlertRef>(alertsResult.value.data),
      );
    }

    setLoading(false);
    setIntelligenceLoading(false);
  };
useEffect(() => {
    void loadAll();
}, [suppliedUsers]);

  const volunteers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "FieldVolunteer" &&
          user.isActive &&
          normalize(user.roleRequestStatus) === "approved",
      ),
    [users],
  );

  const primaryRisk = (prediction: RiskPredictionRecord) => {
    const available = (prediction.disasterRisks || [])
      .filter(
        (risk) =>
          risk.dataAvailable !== false &&
          Number.isFinite(Number(risk.riskScore)),
      )
      .sort((a, b) => Number(b.riskScore) - Number(a.riskScore));

    if (available[0]) {
      return {
        disasterType:
          available[0].disasterType ||
          prediction.disasterType ||
          "Disaster",
        riskScore: Number(available[0].riskScore),
        riskLevel:
          available[0].riskLevel ||
          prediction.riskLevel ||
          "Unknown",
      };
    }

    return {
      disasterType: prediction.disasterType || "Disaster",
      riskScore: Number.isFinite(Number(prediction.riskScore))
        ? Number(prediction.riskScore)
        : 0,
      riskLevel: prediction.riskLevel || "Unknown",
    };
  };

  const findPredictionForReport = (report: DisasterReport) => {
    const reportId = String(report.id || "");

    const explicitlySelectedId = selectedPredictionByReport[reportId];
    if (explicitlySelectedId) {
      const explicitlySelected = predictions.find(
        (prediction) =>
          String(prediction.id || "") === String(explicitlySelectedId),
      );
      if (explicitlySelected) return explicitlySelected;
    }

    return (
      predictions.find(
        (prediction) =>
          String(prediction.id || "") ===
          String(report.riskPredictionId || ""),
      ) ||
      predictions.find(
        (prediction) =>
          normalize(prediction.location) === normalize(report.location) &&
          normalize(primaryRisk(prediction).disasterType) ===
            normalize(report.disasterType),
      )
    );
  };

  const getLinkedReportForPrediction = (prediction: RiskPredictionRecord) => {
    const predictionId = String(prediction.id || "");

    const localIncident = predictionIncidentByPrediction[predictionId];
    if (localIncident) return localIncident;

    // For Agent 01 predictions, only the persisted RiskPredictionId link
    // counts as the operational incident relationship. We intentionally do not
    // match by location/disaster type because multiple predictions can exist
    // for the same place.
    return reports.find(
      (report) =>
        String(report.riskPredictionId || "") === predictionId,
    );
  };

  const findAssessmentForReport = (report: DisasterReport) => {
    const prediction = findPredictionForReport(report);

    return vulnerabilityAssessments.find(
      (assessment) =>
        String(assessment.riskPredictionId || "") ===
        String(prediction?.id || ""),
    );
  };

  const findAlertForReport = (report: DisasterReport) => {
    const prediction = findPredictionForReport(report);
    const assessment = findAssessmentForReport(report);

    return alerts.find(
      (alert) =>
        String(alert.riskPredictionId || "") ===
          String(prediction?.id || "") ||
        String(alert.vulnerabilityAssessmentId || "") ===
          String(assessment?.id || ""),
    );
  };

  const ensureResources = async (
    assessmentId?: string,
  ) => {
    if (!assessmentId) return;

    if (resourceByAssessment[assessmentId] !== undefined) return;

    setResourceLoading((current) => ({
      ...current,
      [assessmentId]: true,
    }));

    try {
      const response = await api.get(
        `/resource-optimization/${assessmentId}`,
      );

      setResourceByAssessment((current) => ({
        ...current,
        [assessmentId]: unwrapArray<ResourceAllocationRef>(
          response.data,
        ),
      }));
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setResourceByAssessment((current) => ({
          ...current,
          [assessmentId]: [],
        }));
      } else {
        console.error(
          "Resource optimization lookup failed:",
          err,
        );
        setResourceByAssessment((current) => ({
          ...current,
          [assessmentId]: [],
        }));
      }
    } finally {
      setResourceLoading((current) => ({
        ...current,
        [assessmentId]: false,
      }));
    }
  };

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        [
          report.disasterType,
          report.location,
          report.description,
          report.reporterName,
          report.assignedVolunteerName,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus =
        statusFilter === "All" ||
        normalize(report.status) === normalize(statusFilter);

      const matchesSeverity =
        severityFilter === "All" ||
        normalize(report.severity) === normalize(severityFilter);

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [reports, search, statusFilter, severityFilter]);

  const totalReports = reports.length;
  const criticalReports = reports.filter(
    (report) => normalize(report.severity) === "critical",
  ).length;
  const activeReports = reports.filter((report) =>
    [
      "submitted",
      "underreview",
      "verified",
      "assigned",
      "volunteerqueue",
      "inprogress",
      "fieldupdatesubmitted",
      "fieldcompleted",
    ].includes(normalize(report.status)),
  ).length;
  const resolvedReports = reports.filter(
    (report) => normalize(report.status) === "resolved",
  ).length;

  const mappedPredictionCount = predictions.filter(
    (prediction) =>
      Number.isFinite(Number(prediction.latitude)) &&
      Number.isFinite(Number(prediction.longitude)),
  ).length;

  const focusMap = (focus: MapFocus) => {
    setMapFocus(focus);
    setMapModalOpen(true);
  };

  const escapeReportHtml = (value: unknown) =>
    String(value ?? "—")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const csvEscape = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const loadResourcesForExport = async (assessmentId?: string) => {
    if (!assessmentId) return [] as any[];
    const cached = resourceByAssessment[assessmentId];
    if (cached !== undefined) return cached || [];

    try {
      const response = await api.get(`/resource-optimization/${assessmentId}`);
      const items = unwrapArray<any>(response.data);
      setResourceByAssessment((current) => ({
        ...current,
        [assessmentId]: items,
      }));
      return items;
    } catch (err) {
      console.error("Unable to load resources for incident report export:", err);
      return [] as any[];
    }
  };

  const buildIncidentReportData = async (report: DisasterReport) => {
    const prediction = findPredictionForReport(report);
    const assessment = findAssessmentForReport(report);
    const alert = findAlertForReport(report);
    const resources = await loadResourcesForExport(
      assessment?.id ? String(assessment.id) : undefined,
    );
    const risk = prediction ? primaryRisk(prediction) : null;
    const steps = getStepsForReport(report);

    return {
      report,
      prediction,
      assessment,
      alert,
      resources,
      risk,
      steps,
      generatedAt: new Date().toISOString(),
    };
  };

  const generateIncidentPdf = async (report: DisasterReport) => {
    if (normalize(report.status) !== "resolved") {
      window.alert("Complete Step 8 and mark the incident as Resolved before generating the final report.");
      return;
    }

    const popup = window.open("", "_blank", "width=1200,height=900");
    if (!popup) {
      window.alert("Please allow pop-ups for ReliefNexus to generate the report.");
      return;
    }

    popup.document.write(`<html><head><title>ReliefNexus Final Incident Report</title></head><body style="font-family:Arial,sans-serif;padding:40px">Preparing report...</body></html>`);
    popup.document.close();

    const data = await buildIncidentReportData(report);
    const { prediction, assessment, alert, resources, risk, steps, generatedAt } = data;
    const completedCount = steps.filter((stage) => stage.status === "Completed").length;
    const resourceRows = resources.length
      ? resources.map((item: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeReportHtml(item.resourceType || item.type || item.name || "Resource")}</td>
            <td>${escapeReportHtml(item.quantity ?? item.amount ?? "—")}</td>
            <td>${escapeReportHtml(item.location || item.allocatedLocation || report.location || "—")}</td>
            <td>${escapeReportHtml(item.status || item.allocationStatus || "—")}</td>
          </tr>`).join("")
      : `<tr><td colspan="5">No resource allocation records were returned by Agent 03.</td></tr>`;

    const stageRows = steps.map((stage) => `
      <tr>
        <td class="stage-no">${stage.no}</td>
        <td><strong>${escapeReportHtml(stage.title)}</strong><br><span class="muted">${escapeReportHtml(stage.owner)}</span></td>
        <td><span class="status ${stage.status === "Completed" ? "done" : stage.status === "In Progress" ? "progress" : "pending"}">${escapeReportHtml(stage.status)}</span></td>
      </tr>`).join("");

    const timelineRows = [
      ["Report Submitted", report.createdAt],
      ["Risk Prediction", prediction?.createdAt],
      ["Vulnerability & Impact", assessment?.createdAt],
      ["Early Warning", alert?.createdAt],
      ["Volunteer Assignment", report.assignedAt],
      ["Field Response Update", report.fieldUpdatedAt],
      ["Final Resolution", report.updatedAt],
    ].filter(([, value]) => value).map(([label, value]) => `
      <div class="timeline-item"><span class="dot"></span><div><strong>${escapeReportHtml(label)}</strong><span>${escapeReportHtml(formatDate(value as string))}</span></div></div>`).join("");

    const riskFactors = prediction?.disasterRisks?.length
      ? prediction.disasterRisks.map((item) => `
          <tr><td>${escapeReportHtml(item.disasterType)}</td><td>${escapeReportHtml(item.riskScore ?? "—")}</td><td>${escapeReportHtml(item.riskLevel)}</td><td>${escapeReportHtml(item.dataAvailable === false ? "Unavailable" : item.dataSource || "Available")}</td></tr>`).join("")
      : `<tr><td colspan="4">No additional hazard records are available.</td></tr>`;

    const html = `<!doctype html><html><head><meta charset="utf-8" />
      <title>ReliefNexus — Final Incident Report</title>
      <style>
        *{box-sizing:border-box}body{margin:0;background:#eef3f9;color:#10213b;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5}.page{max-width:1100px;margin:24px auto;background:#fff;padding:34px 38px;box-shadow:0 10px 35px rgba(15,23,42,.12)}
        .brand{background:linear-gradient(135deg,#071b38,#123f73);color:#fff;padding:28px;border-radius:18px}.brand h1{margin:4px 0 0;font-size:28px}.eyebrow{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:800;color:#7dd3fc}.meta{display:flex;flex-wrap:wrap;gap:16px;margin-top:18px}.meta span{opacity:.85}.section{margin-top:26px}.section h2{font-size:15px;margin:0 0 10px;color:#10213b}.section h2:before{content:"";display:inline-block;width:4px;height:18px;background:#2563eb;border-radius:4px;margin-right:8px;vertical-align:-4px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.card{border:1px solid #dce5f0;border-radius:12px;padding:12px;background:#f8fbff}.label{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:800}.value{margin-top:4px;font-size:15px;font-weight:800}.muted{color:#64748b;font-size:10px}table{width:100%;border-collapse:collapse}th{background:#0f2d52;color:#fff;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.6px;padding:9px}td{border:1px solid #e2e8f0;padding:8px;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.stage-no{font-weight:900;width:45px}.status{display:inline-block;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:800}.done{background:#dcfce7;color:#166534}.progress{background:#dbeafe;color:#1d4ed8}.pending{background:#f1f5f9;color:#64748b}.timeline{border-left:2px solid #dbeafe;margin:8px 0 0 8px;padding-left:18px}.timeline-item{display:flex;gap:9px;position:relative;margin:0 0 13px}.timeline-item .dot{position:absolute;left:-24px;top:4px;width:10px;height:10px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 2px #bfdbfe}.timeline-item div{display:flex;justify-content:space-between;gap:20px;width:100%}.timeline-item span{color:#64748b}.footer{margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;color:#64748b;font-size:9px;display:flex;justify-content:space-between}.pill{font-weight:900;color:#166534}.note{padding:12px;border-radius:10px;background:#f0f9ff;border:1px solid #bae6fd}.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media print{body{background:#fff}.page{margin:0;box-shadow:none;max-width:none;padding:18px}.section{break-inside:avoid}.brand{print-color-adjust:exact;-webkit-print-color-adjust:exact}table{break-inside:auto}tr{break-inside:avoid;break-after:auto}}@media(max-width:800px){.grid{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}}
      </style></head><body><main class="page">
      <header class="brand"><div class="eyebrow">ReliefNexus · Final Incident Report</div><h1>${escapeReportHtml(report.location || "Disaster Incident")}</h1><div class="meta"><span><strong>Incident:</strong> ${escapeReportHtml(report.id)}</span><span><strong>Disaster:</strong> ${escapeReportHtml(report.disasterType)}</span><span><strong>Status:</strong> <b>${escapeReportHtml(formatStatus(report.status))}</b></span><span><strong>Generated:</strong> ${escapeReportHtml(formatDate(generatedAt))}</span></div></header>
      <section class="section"><h2>Executive Summary</h2><div class="grid"><div class="card"><div class="label">Risk Score</div><div class="value">${escapeReportHtml(risk?.riskScore ?? "—")}</div></div><div class="card"><div class="label">Risk Level</div><div class="value">${escapeReportHtml(risk?.riskLevel || "—")}</div></div><div class="card"><div class="label">Confidence</div><div class="value">${escapeReportHtml(prediction?.confidence != null ? `${Number(prediction.confidence).toFixed(1)}%` : "—")}</div></div><div class="card"><div class="label">Workflow</div><div class="value">${completedCount}/8 Complete</div></div></div></section>
      <section class="section"><h2>Incident Overview</h2><div class="two"><div class="card"><div class="label">Reporter</div><div class="value">${escapeReportHtml(report.reporterName || report.reporterEmail || "—")}</div><div class="muted">${escapeReportHtml(report.reporterEmail || "")}</div></div><div class="card"><div class="label">Coordinates</div><div class="value">${escapeReportHtml(report.latitude != null && report.longitude != null ? `${report.latitude}, ${report.longitude}` : "Not available")}</div></div><div class="card"><div class="label">Severity</div><div class="value">${escapeReportHtml(report.severity)}</div></div><div class="card"><div class="label">Description</div><div class="value">${escapeReportHtml(report.description || "No description supplied.")}</div></div></div></section>
      <section class="section"><h2>8-Step Operational Workflow</h2><table><thead><tr><th>#</th><th>Stage / Owner</th><th>Status</th></tr></thead><tbody>${stageRows}</tbody></table></section>
      <section class="section"><h2>Agent 01 — Risk Prediction</h2><div class="grid"><div class="card"><div class="label">Primary Hazard</div><div class="value">${escapeReportHtml(risk?.disasterType || prediction?.disasterType)}</div></div><div class="card"><div class="label">Risk Score</div><div class="value">${escapeReportHtml(risk?.riskScore)}</div></div><div class="card"><div class="label">Model</div><div class="value">${escapeReportHtml(prediction?.modelVersion || "Default")}</div></div><div class="card"><div class="label">Source</div><div class="value">${escapeReportHtml(prediction?.predictionSource || "Risk Prediction Service")}</div></div></div><table style="margin-top:12px"><thead><tr><th>Hazard</th><th>Score</th><th>Level</th><th>Evidence</th></tr></thead><tbody>${riskFactors}</tbody></table></section>
      <section class="section"><h2>Agent 02 — Vulnerability & Impact</h2><div class="grid"><div class="card"><div class="label">Assessment</div><div class="value">${assessment ? "Completed" : "Not available"}</div></div><div class="card"><div class="label">Assessment ID</div><div class="value">${escapeReportHtml(assessment?.id || "—")}</div></div><div class="card"><div class="label">Location</div><div class="value">${escapeReportHtml(assessment?.location || report.location)}</div></div><div class="card"><div class="label">Disaster</div><div class="value">${escapeReportHtml(assessment?.disasterType || report.disasterType)}</div></div></div></section>
      <section class="section"><h2>Agent 03 — Resource Optimization</h2><table><thead><tr><th>#</th><th>Resource</th><th>Quantity</th><th>Location</th><th>Status</th></tr></thead><tbody>${resourceRows}</tbody></table></section>
      <section class="section"><h2>Agent 04 — Early Warning</h2><div class="grid"><div class="card"><div class="label">Warning</div><div class="value">${alert ? "Generated" : "Not available"}</div></div><div class="card"><div class="label">Severity</div><div class="value">${escapeReportHtml(alert?.severity || "—")}</div></div><div class="card"><div class="label">Status</div><div class="value">${escapeReportHtml(alert?.status || "—")}</div></div><div class="card"><div class="label">Created</div><div class="value">${escapeReportHtml(alert?.createdAt ? formatDate(alert.createdAt) : "—")}</div></div></div></section>
      <section class="section"><h2>Volunteer & Field Response</h2><div class="two"><div class="card"><div class="label">Assigned Volunteer</div><div class="value">${escapeReportHtml(report.assignedVolunteerName || "Not assigned")}</div><div class="muted">Assigned: ${escapeReportHtml(report.assignedAt ? formatDate(report.assignedAt) : "—")}</div></div><div class="card"><div class="label">Field Status</div><div class="value">${escapeReportHtml(formatStatus(report.status))}</div><div class="muted">Updated: ${escapeReportHtml(report.fieldUpdatedAt ? formatDate(report.fieldUpdatedAt) : "—")}</div></div><div class="card"><div class="label">Latest Situation</div><div class="value">${escapeReportHtml(report.fieldSituation || "No field situation submitted.")}</div></div><div class="card"><div class="label">Field Notes</div><div class="value">${escapeReportHtml(report.fieldUpdateNotes || "No field notes submitted.")}</div></div></div></section>
      <section class="section"><h2>Resolution</h2><div class="note"><strong class="pill">✓ Incident Resolved</strong><br/>The incident completed the ReliefNexus operational lifecycle after the field response stage. Final lifecycle status: <strong>${escapeReportHtml(formatStatus(report.status))}</strong>.</div></section>
      <section class="section"><h2>Operational Timeline</h2><div class="timeline">${timelineRows || "<p class='muted'>No timestamped events are available.</p>"}</div></section>
      <footer class="footer"><span>ReliefNexus · AI-Powered Disaster Management Platform</span><span>Generated from live operational records · ${escapeReportHtml(formatDate(generatedAt))}</span></footer>
      </main><script>window.onload=function(){setTimeout(function(){window.print()},450)};</script></body></html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  };

  const exportIncidentData = async (report: DisasterReport) => {
    if (normalize(report.status) !== "resolved") {
      window.alert("Complete Step 8 and mark the incident as Resolved before exporting the final data.");
      return;
    }

    const data = await buildIncidentReportData(report);
    const rows: string[][] = [["Section", "Field", "Value"]];
    const add = (section: string, field: string, value: unknown) => {
      rows.push([section, field, String(value ?? "")]);
    };
    add("Incident", "ID", report.id);
    add("Incident", "Disaster Type", report.disasterType);
    add("Incident", "Location", report.location);
    add("Incident", "Severity", report.severity);
    add("Incident", "Status", formatStatus(report.status));
    add("Incident", "Description", report.description);
    add("Incident", "Reporter", report.reporterName);
    add("Incident", "Reporter Email", report.reporterEmail);
    add("Incident", "Latitude", report.latitude);
    add("Incident", "Longitude", report.longitude);
    add("Risk Prediction", "Primary Hazard", data.risk?.disasterType);
    add("Risk Prediction", "Risk Score", data.risk?.riskScore);
    add("Risk Prediction", "Risk Level", data.risk?.riskLevel);
    add("Risk Prediction", "Confidence", data.prediction?.confidence);
    add("Risk Prediction", "Model Version", data.prediction?.modelVersion);
    add("Risk Prediction", "Prediction Source", data.prediction?.predictionSource);
    data.prediction?.disasterRisks?.forEach((item, index) => {
      add(`Risk Hazard ${index + 1}`, "Disaster Type", item.disasterType);
      add(`Risk Hazard ${index + 1}`, "Risk Score", item.riskScore);
      add(`Risk Hazard ${index + 1}`, "Risk Level", item.riskLevel);
      add(`Risk Hazard ${index + 1}`, "Data Source", item.dataSource);
    });
    add("Vulnerability & Impact", "Assessment ID", data.assessment?.id);
    add("Vulnerability & Impact", "Location", data.assessment?.location);
    add("Vulnerability & Impact", "Disaster Type", data.assessment?.disasterType);
    add("Early Warning", "Alert ID", data.alert?.id);
    add("Early Warning", "Severity", data.alert?.severity);
    add("Early Warning", "Status", data.alert?.status);
    add("Early Warning", "Created At", data.alert?.createdAt);
    add("Volunteer Assignment", "Volunteer", report.assignedVolunteerName);
    add("Volunteer Assignment", "Volunteer User ID", report.assignedVolunteerUserId);
    add("Volunteer Assignment", "Assigned At", report.assignedAt);
    add("Field Response", "Status", formatStatus(report.status));
    add("Field Response", "Situation", report.fieldSituation);
    add("Field Response", "Notes", report.fieldUpdateNotes);
    add("Field Response", "Latitude", report.fieldUpdateLatitude);
    add("Field Response", "Longitude", report.fieldUpdateLongitude);
    add("Field Response", "Updated At", report.fieldUpdatedAt);
    add("Resolution", "Final Status", formatStatus(report.status));
    add("Resolution", "Updated At", report.updatedAt);
    data.steps.forEach((stage) => add("Workflow", `${stage.no}. ${stage.title}`, stage.status));
    data.resources.forEach((item: any, index: number) => {
      add(`Resource ${index + 1}`, "Type", item.resourceType || item.type || item.name);
      add(`Resource ${index + 1}`, "Quantity", item.quantity ?? item.amount);
      add(`Resource ${index + 1}`, "Location", item.location || item.allocatedLocation);
      add(`Resource ${index + 1}`, "Status", item.status || item.allocationStatus);
    });

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ReliefNexus_Incident_Report_${String(report.id || report.location || "incident").replace(/[^a-z0-9_-]+/gi, "_")}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const runWorkflowAction = async (
    report: DisasterReport,
    action:
      | "review"
      | "verify"
      | "assign"
      | "resolve"
      | "reject",
    volunteerId?: string,
  ) => {
    if (!report.id) {
      setError("This report does not have a valid ID.");
      return;
    }

    const key = `${action}-${report.id}`;
    setActionLoading(key);
    setError("");

    try {
      if (action === "review") {
        await api.patch(`/disaster-reports/${report.id}/review`);
      }

      if (action === "verify") {
        await api.patch(`/disaster-reports/${report.id}/verify`);
      }

      if (action === "assign") {
        if (!volunteerId) {
          throw new Error(
            "Please select an approved active field volunteer.",
          );
        }

        await api.patch(`/disaster-reports/${report.id}/assign`, {
          volunteerUserId: volunteerId,
        });
      }

      if (action === "resolve") {
        await api.patch(`/disaster-reports/${report.id}/resolve`);
      }

      if (action === "reject") {
        await api.patch(`/disaster-reports/${report.id}/reject`);
      }

      await loadAll();
    } catch (err: any) {
      console.error(`Disaster report ${action} failed:`, err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `The disaster report could not be ${action}d.`,
      );
    } finally {
      setActionLoading("");
    }
  };

  const loadVolunteerRecommendation = async (report: DisasterReport) => {
    if (!report.id) {
      throw new Error("This report does not have a valid ID.");
    }

    setRecommendation(null);
    setRecommendationError("");
    setSelectedVolunteerId(
      selectedVolunteerByReport[report.id] ||
        report.assignedVolunteerUserId ||
        "",
    );
    setRecommendationLoading(true);

    try {
      const response = await api.post(
        "/volunteer-assignment/recommend",
        { disasterReportId: report.id },
      );

      const result =
        response.data as VolunteerRecommendationResponse;

      setRecommendation(result);

      if (
        !selectedVolunteerByReport[report.id] &&
        !report.assignedVolunteerUserId &&
        result?.recommendedVolunteer
      ) {
        setSelectedVolunteerId(
          result.recommendedVolunteer.volunteerUserId,
        );
      }

      return result;
    } catch (err: any) {
      console.error("Volunteer Assignment Agent failed:", err);
      const message =
        err?.response?.data?.message ||
        "The Volunteer Assignment Agent could not generate a recommendation.";
      setRecommendationError(message);
      throw new Error(message);
    } finally {
      setRecommendationLoading(false);
    }
  };

  const runAgent02ForPrediction = async (
    prediction: RiskPredictionRecord,
  ) => {
    if (!prediction.id) {
      throw new Error("This Agent 01 prediction does not have a valid ID.");
    }

    const key = `agent02-${prediction.id}`;
    setStageActionLoading(key);
    setError("");

    try {
      await api.post(
        `/vulnerability-impact/${prediction.id}/assess`,
      );
      await loadAll();
    } catch (err: any) {
      console.error("Agent 02 assessment failed:", err);
      throw new Error(
        err?.response?.data?.message ||
          "Agent 02 vulnerability and impact assessment could not be completed.",
      );
    } finally {
      setStageActionLoading("");
    }
  };

  const runAgent02ForReport = async (
    report: DisasterReport,
    prediction?: RiskPredictionRecord,
  ) => {
    if (!prediction?.id) {
      throw new Error(
        "Select or link an Agent 01 prediction before running Agent 02.",
      );
    }

    await runAgent02ForPrediction(prediction);
    setSelectedPredictionByReport((current) => ({
      ...current,
      [String(report.id || "")]: String(prediction.id),
    }));
  };

  const runAgent03ForReport = async (
    report: DisasterReport,
    assessment?: VulnerabilityAssessmentRef,
  ) => {
    if (!assessment?.id) {
      throw new Error(
        "Agent 02 assessment is required before Agent 03 can run.",
      );
    }

    const key = `agent03-${report.id || assessment.id}`;
    setStageActionLoading(key);
    setError("");

    try {
      await api.post(
        `/resource-optimization/${assessment.id}/optimize`,
      );

      setResourceByAssessment((current) => {
        const next = { ...current };
        delete next[String(assessment.id)];
        return next;
      });

      await ensureResources(String(assessment.id));
      await loadAll();
    } catch (err: any) {
      console.error("Agent 03 optimization failed:", err);
      throw new Error(
        err?.response?.data?.message ||
          "Agent 03 resource optimization could not be completed.",
      );
    } finally {
      setStageActionLoading("");
    }
  };

  const runAgent04ForReport = async (
    report: DisasterReport,
    assessment?: VulnerabilityAssessmentRef,
  ) => {
    if (!assessment?.id) {
      throw new Error(
        "Agent 02 assessment is required before Agent 04 can run.",
      );
    }

    const key = `agent04-${report.id || assessment.id}`;
    setStageActionLoading(key);
    setError("");

    try {
      await api.post(
        `/emergency-alerts/assessment/${assessment.id}`,
      );

      await loadAll();
    } catch (err: any) {
      console.error("Agent 04 warning generation failed:", err);
      throw new Error(
        err?.response?.data?.message ||
          "Agent 04 early warning could not be generated.",
      );
    } finally {
      setStageActionLoading("");
    }
  };

  const ensurePredictionOperationalIncident = async (
    prediction: RiskPredictionRecord,
    predictionKey: string,
  ): Promise<DisasterReport | null> => {
    const predictionId = String(prediction.id || "");

    if (!predictionId) {
      setPredictionIncidentError((current) => ({
        ...current,
        [predictionKey]: "This Agent 01 prediction does not have a valid ID.",
      }));
      return null;
    }

    const existing = getLinkedReportForPrediction(prediction);

    if (existing) {
      setPredictionIncidentByPrediction((current) => ({
        ...current,
        [predictionId]: existing,
      }));
      return existing;
    }

    setPredictionIncidentLoading((current) => ({
      ...current,
      [predictionKey]: true,
    }));

    setPredictionIncidentError((current) => ({
      ...current,
      [predictionKey]: "",
    }));

    const risk = primaryRisk(prediction);

    try {
      const response = await api.post(
        `/disaster-reports/from-prediction/${predictionId}`,
        {
          disasterType: risk.disasterType,
          description:
            `Operational incident created from Agent 01 risk prediction for ${prediction.location || "the predicted location"}.`,
          location: prediction.location || "Unknown",
          latitude:
            prediction.latitude != null
              ? Number(prediction.latitude)
              : null,
          longitude:
            prediction.longitude != null
              ? Number(prediction.longitude)
              : null,
          severity: risk.riskLevel || "Medium",
          riskPredictionId: predictionId,
        },
      );

      const created = (
        response?.data?.data ??
        response?.data?.result ??
        response?.data
      ) as DisasterReport;

      if (!created?.id) {
        throw new Error(
          "The operational incident was not returned by the API.",
        );
      }

      setPredictionIncidentByPrediction((current) => ({
        ...current,
        [predictionId]: created,
      }));

      await loadAll();
      return created;
    } catch (err: any) {
      console.error(
        "Creating operational incident from Agent 01 failed:",
        err,
      );

      setPredictionIncidentError((current) => ({
        ...current,
        [predictionKey]:
          err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : "") ||
          err?.message ||
          "The operational incident could not be created from this prediction.",
      }));

      return null;
    } finally {
      setPredictionIncidentLoading((current) => ({
        ...current,
        [predictionKey]: false,
      }));
    }
  };

  const confirmPredictionAssignment = async (
    report: DisasterReport,
    volunteerId: string,
  ) => {
    if (!report.id || !volunteerId) return;

    const key = `assign-${report.id}`;
    setActionLoading(key);
    setError("");

    try {
      await api.patch(`/disaster-reports/${report.id}/assign`, {
        volunteerUserId: volunteerId,
      });
      setSelectedVolunteerByReport((current) => ({
        ...current,
        [report.id!]: volunteerId,
      }));
      setRecommendation(null);
      setRecommendationError("");
      await loadAll();
    } catch (err: any) {
      console.error("Prediction workflow volunteer assignment failed:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "The volunteer could not be assigned to the linked incident.",
      );
    } finally {
      setActionLoading("");
    }
  };

  const getStepsForReport = (
    report: DisasterReport,
  ) => {
    const prediction = findPredictionForReport(report);
    const assessment = findAssessmentForReport(report);
    const alert = findAlertForReport(report);
    const resources = assessment?.id
      ? resourceByAssessment[String(assessment.id)]
      : undefined;

    const status = normalize(report.status);

    return [
      {
        no: 1 as const,
        title: "Report Submitted",
        owner: "Incident Intake",
        status: "Completed",
      },
      {
        no: 2 as const,
        title: "Risk Prediction",
        owner: "Agent 01",
        status: prediction ? "Completed" : "Waiting",
      },
      {
        no: 3 as const,
        title: "Vulnerability & Impact",
        owner: "Agent 02",
        status: assessment ? "Completed" : "Waiting",
      },
      {
        no: 4 as const,
        title: "Resource Optimization",
        owner: "Agent 03",
        status:
          resources && resources.length > 0
            ? "Completed"
            : assessment
              ? "Ready"
              : "Waiting",
      },
      {
        no: 5 as const,
        title: "Early Warning",
        owner: "Agent 04",
        status: alert
          ? "Completed"
          : assessment
            ? "Ready"
            : "Waiting",
      },
      {
        no: 6 as const,
        title: "Volunteer Assignment",
        owner: "Volunteer Agent",
        status:
          report.assignedVolunteerUserId ||
          status === "assigned"
            ? "Completed"
            : ["verified", "volunteerqueue"].includes(status)
              ? "Ready"
              : "Waiting",
      },
      {
        no: 7 as const,
        title: "Field Response",
        owner: "Assigned Volunteer",
        status:
          ["fieldcompleted", "resolved"].includes(status)
            ? "Completed"
            : ["inprogress", "fieldupdatesubmitted"].includes(status)
              ? "In Progress"
              : report.assignedVolunteerUserId
                ? "Ready"
                : "Waiting",
      },
      {
        no: 8 as const,
        title: "Resolution",
        owner: "Relief Coordinator",
        status:
          status === "resolved"
            ? "Completed"
            : status === "fieldcompleted"
              ? "Ready"
              : "Waiting",
      },
    ];
  };

  const getInitialStep = (report: DisasterReport): WorkflowStep => {
    const status = normalize(report.status);

    if (status === "submitted") return 1;
    if (status === "underreview") return 2;
    if (status === "verified") return 3;
    if (status === "volunteerqueue") return 6;
    if (status === "assigned") return 6;
    if (["inprogress", "fieldupdatesubmitted"].includes(status)) {
      return 7;
    }
    if (status === "fieldcompleted") return 8;
    if (status === "resolved") return 8;
    return 1;
  };

  const persistActiveWorkflow = (
    type: "report" | "prediction",
    id: string,
    step?: WorkflowStep,
  ) => {
    const state = readPersistedWorkflowState();
    state.activeType = type;
    state.activeId = id;

    if (step) {
      if (type === "report") {
        state.reportSteps[id] = step;
      } else {
        state.predictionSteps[id] = step;
      }
    }

    writePersistedWorkflowState(state);
  };

  const clearActiveWorkflow = () => {
    const state = readPersistedWorkflowState();
    state.activeType = null;
    state.activeId = null;
    writePersistedWorkflowState(state);
  };

  const getInitialPredictionStep = (
    _prediction: RiskPredictionRecord,
    linkedReport?: DisasterReport | null,
  ): WorkflowStep => {
    if (linkedReport) {
      return getInitialStep(linkedReport);
    }

    return 1;
  };

  const openReport = (report: DisasterReport) => {
    const id = String(report.id || "");
    const storedStep = reportStep[id] || getInitialStep(report);

    setOpenReportId(id);
    setReportActionMenuId(id);

    setReportStep((current) => ({
      ...current,
      [id]: storedStep,
    }));

    persistActiveWorkflow("report", id, storedStep);

    const assessment = findAssessmentForReport(report);

    if (storedStep === 4 && assessment?.id) {
      void ensureResources(String(assessment.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-[30px] bg-[#081b35] px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">
              Unified Disaster Response Operations
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Disaster Reports
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Review community-submitted incidents and Agent 01 risk
              predictions together, while keeping the operational workflow
              stages visible and traceable.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat label="Reports" value={totalReports} />
            <HeroStat label="Critical" value={criticalReports} tone="red" />
            <HeroStat label="Active" value={activeReports} tone="amber" />
            <HeroStat label="Resolved" value={resolvedReports} tone="green" />
          </div>
        </div>
      </section>

      {(error || intelligenceError) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {intelligenceError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
              {intelligenceError}
            </div>
          )}
        </div>
      )}

      {/* SEARCH / FILTERS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_190px_190px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            {icon("search")}
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search location, disaster, reporter or volunteer..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="All">All report statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="UnderReview">Under Review</option>
            <option value="Verified">Verified</option>
            <option value="VolunteerQueue">Volunteer Queue</option>
            <option value="Assigned">Assigned</option>
            <option value="InProgress">In Progress</option>
            <option value="FieldUpdateSubmitted">
              Field Update Submitted
            </option>
            <option value="FieldCompleted">Field Completed</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="All">All severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <InfoBox label="Submitted reports" value={String(totalReports)} />
          <InfoBox label="Mapped AI locations" value={String(mappedPredictionCount)} />
          <InfoBox
            label="Approved volunteers"
            value={String(volunteers.length)}
          />
          <InfoBox
            label="AI intelligence"
            value={intelligenceLoading ? "Loading..." : "Live"}
          />
        </div>
      </section>

      {/* GLOBAL MAP LAUNCHER */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
              Geographic Intelligence
            </p>
            <h2 className="mt-1 text-lg font-black text-[#101c35]">
              Global Disaster Risk & Incident Map
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
              Open the interactive map in a dedicated workspace. Submitted incidents and Agent 01 AI prediction coordinates are shown together with severity and risk intelligence.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700">
                {validMappedCount(filteredReports)} reports mapped
              </span>
              <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[9px] font-black text-violet-700">
                {mappedPredictionCount} AI locations
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMapFocus(null);
              setMapModalOpen(true);
            }}
            className="shrink-0 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white shadow-lg transition hover:bg-blue-700"
          >
            Open Global Map →
          </button>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-2">
      {/* ONE UNIFIED INCIDENT REGISTER */}
      <section className="min-w-0 overflow-hidden rounded-[30px] border border-violet-200 bg-white shadow-sm">
        <div className="border-b border-violet-100 bg-gradient-to-r from-violet-950 via-violet-900 to-slate-950 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg">
                <img
                  src="/images/disasters/disaster-default (1).svg"
                  alt="Disaster reports"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0 max-w-4xl">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">
                  Community Submitted · Unified Operational Workflow
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Disaster Reports
                </h2>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-violet-100/80">
                  Reports submitted by users and field teams. Every incident follows the same eight-stage operational lifecycle from intake through resolution.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <HeroStat label="Reports" value={filteredReports.length} />
              <HeroStat
                label="Assigned"
                value={filteredReports.filter((report) => report.assignedVolunteerUserId).length}
                tone="green"
              />
              <HeroStat
                label="Resolved"
                value={filteredReports.filter((report) => normalize(report.status) === "resolved").length}
                tone="green"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-14 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Loading disaster response records...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-14 text-center text-sm text-slate-400">
            No disaster reports match the current filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report, index) => {
              const reportId = String(report.id || index);
              const prediction = findPredictionForReport(report);
              const assessment = findAssessmentForReport(report);
              const alert = findAlertForReport(report);

              const resources = assessment?.id
                ? resourceByAssessment[String(assessment.id)]
                : undefined;

              const steps = getStepsForReport(report);
              const step = reportStep[reportId] || getInitialStep(report);
              const active = steps[step - 1];

              const status = normalize(report.status);
              const canReview = status === "submitted";

              const canAssign =
                status === "verified" || status === "volunteerqueue";

              const isOpen = openReportId === reportId || reportActionMenuId === reportId;

              const setThisStep = (value: WorkflowStep) => {
                setReportStep((current) => ({
                  ...current,
                  [reportId]: value,
                }));

                persistActiveWorkflow("report", reportId, value);

                if (value === 4 && assessment?.id) {
                  void ensureResources(String(assessment.id));
                }

                if (value === 6 && report.id) {
                  void loadVolunteerRecommendation(report);
                }
              };

              return (
                <article key={reportId} className="p-4 sm:p-5">
                  <div
                    className={`overflow-hidden rounded-[24px] border transition ${
                      isOpen
                        ? "border-blue-200 bg-blue-50/20 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    {/* COMPACT REPORT HEADER */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        openReport(report);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openReport(report);
                        }
                      }}
                      className="flex w-full cursor-pointer flex-col gap-4 p-4 text-left sm:p-5 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-950">
                          <img
                            src={incidentImage(report.disasterType)}
                            alt={`${report.disasterType || "Disaster"} incident`}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />

                          <span className="absolute bottom-1.5 left-2 text-[8px] font-black text-white">
                            #{String(index + 1).padStart(2, "0")}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">
                              Disaster Report
                            </p>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[8px] font-black ${severityClass(
                                report.severity,
                              )}`}
                            >
                              {report.severity || "Unknown"}
                            </span>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[8px] font-black ${statusClass(
                                report.status,
                              )}`}
                            >
                              {formatStatus(report.status)}
                            </span>
                          </div>

                          <h3 className="mt-1 truncate text-base font-black text-slate-950">
                            {report.location || "Unknown location"}
                          </h3>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {report.disasterType || "Disaster"} ·{" "}
                            {report.reporterName || "Unknown reporter"} ·{" "}
                            {report.assignedVolunteerName
                              ? `Assigned to ${report.assignedVolunteerName}`
                              : "Volunteer not assigned"}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-emerald-50 px-3 py-2">
                            <p className="text-[8px] font-black uppercase text-emerald-600">
                              AI
                            </p>
                            <p className="mt-0.5 text-xs font-black text-emerald-800">
                              {prediction ? "Ready" : "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-violet-50 px-3 py-2">
                            <p className="text-[8px] font-black uppercase text-violet-600">
                              Volunteer
                            </p>
                            <p className="mt-0.5 text-xs font-black text-violet-800">
                              {report.assignedVolunteerUserId ? "Yes" : "No"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-blue-50 px-3 py-2">
                            <p className="text-[8px] font-black uppercase text-blue-600">
                              Stage
                            </p>
                            <p className="mt-0.5 text-xs font-black text-blue-800">
                              {step}/8
                            </p>
                          </div>
                        </div>

                        <span className="hidden rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-blue-700 sm:inline-flex">
                          Open workflow →
                        </span>
                      </div>
                    </div>

                    {isOpen && (
                      <div
                        className={
                          reportActionMenuId === reportId
                            ? "fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:p-6"
                            : "border-t border-slate-100 p-4 sm:p-5"
                        }
                      >
                        <div
                          className={
                            reportActionMenuId === reportId
                              ? "relative flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl"
                              : "w-full"
                          }
                        >
                          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
                                  ReliefNexus · Separate Incident Workflow
                                </p>
                                <h3 className="mt-1 text-lg font-black text-slate-950">
                                  {report.location || "Incident Workflow"}
                                </h3>
                                <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                                  Complete the operational process here without expanding the report card.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => { clearActiveWorkflow(); setReportActionMenuId(null); setOpenReportId(null); }}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                              >
                                Close
                              </button>
                            </div>
                          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                        {/* 8-STAGE PIPELINE */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                                Incident Execution Pipeline
                              </p>
                              <h4 className="mt-1 text-sm font-black text-slate-950">
                                01 Report Submitted → 02 Risk Prediction → 03 Vulnerability & Impact → 04 Resource Optimization → 05 Early Warning → 06 Volunteer Assignment → 07 Field Response → 08 Resolution
                              </h4>
                            </div>

                            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700">
                              Step {step} of 8
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                            {steps.map((stage) => (
                              <WorkflowStepCard
                                key={stage.no}
                                number={stage.no}
                                title={stage.title}
                                owner={stage.owner}
                                status={stage.status}
                                selected={stage.no === step}
                                onClick={() => setThisStep(stage.no)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* ACTIVE STEP */}
                        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                          <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                                <span className="text-xs font-black">
                                  {step}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                                  Process {step} · {active.owner}
                                </p>

                                <h4 className="mt-1 text-lg font-black text-slate-950">
                                  {active.title}
                                </h4>

                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                  {step === 1 &&
                                    "01 Report Submitted — The incident has been received from the disaster-reporting flow. The report, location, reporter, severity and coordinates are now the master incident record."}

                                  {step === 2 &&
                                    (prediction
                                      ? `02 Risk Prediction — Agent 01 risk prediction is linked to this report. Primary result: ${primaryRisk(
                                          prediction,
                                        ).riskScore.toFixed(1)} ${
                                          primaryRisk(prediction).riskLevel
                                        } for ${
                                          primaryRisk(prediction).disasterType
                                        }.`
                                      : "No linked Agent 01 prediction is currently available for this report.")}

                                  {step === 3 &&
                                    (assessment
                                      ? "03 Vulnerability & Impact — Agent 02 has completed the vulnerability and impact assessment that becomes the operational input for the downstream response stages."
                                      : "Agent 02 vulnerability and impact assessment is not yet linked to this report.")}

                                  {step === 4 &&
                                    (resourceLoading[String(assessment?.id || "")]
                                      ? "04 Resource Optimization — Agent 03 resource allocation is being loaded from the live Resource Optimization API."
                                      : resources && resources.length > 0
                                        ? `Agent 03 returned ${resources.length} allocation record(s) for this incident.`
                                        : assessment
                                          ? "Agent 03 is ready for this linked assessment, but no allocation records are currently available."
                                          : "Agent 03 is waiting because Agent 02 has not produced the required assessment.")}

                                  {step === 5 &&
                                    (alert
                                      ? `05 Early Warning — Agent 04 has generated a ${alert.severity || "warning"} warning for this incident.`
                                      : assessment
                                        ? "The incident has the Agent 02 prerequisite, but no Agent 04 warning record is currently linked."
                                        : "Early Warning stays waiting until the upstream analysis stages are available.")}

                                  {step === 6 &&
                                    (report.assignedVolunteerName
                                      ? `Volunteer assignment is confirmed. ${report.assignedVolunteerName} is the current field volunteer for this incident.`
                                      : "06 Volunteer Assignment — The next operational decision is to match an approved, active Field Volunteer and confirm the assignment.")}

                                  {step === 7 &&
                                    (report.fieldSituation ||
                                    report.fieldUpdateNotes
                                      ? "07 Field Response — The assigned volunteer has submitted field information. Review the latest situation and notes before changing the response posture."
                                      : report.assignedVolunteerName
                                        ? `The assigned volunteer ${report.assignedVolunteerName} is responsible for the field-response stage.`
                                        : "Field response cannot start until a volunteer is assigned.")}

                                  {step === 8 &&
                                    (normalize(report.status) === "resolved"
                                      ? "08 Resolution — This incident has completed the operational response lifecycle and is marked Resolved."
                                      : "Resolution is the final administrative stage after the field response has been completed and the incident is ready to close.")}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-3 py-1.5 text-[8px] font-black ${
                                  active.status === "Completed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : active.status === "Ready" ||
                                        active.status === "In Progress"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {active.status}
                              </span>
                            </div>

                            {/* STEP-SPECIFIC DATA */}
                            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {step === 1 && (
                                <>
                                  <InfoBox
                                    label="Reporter"
                                    value={report.reporterName || "Unknown"}
                                  />
                                  <InfoBox
                                    label="Incident"
                                    value={report.disasterType || "Unknown"}
                                  />
                                  <InfoBox
                                    label="Location"
                                    value={report.location || "Unknown"}
                                  />
                                  <InfoBox
                                    label="Severity"
                                    value={report.severity || "Unknown"}
                                  />
                                  <InfoBox
                                    label="Created"
                                    value={formatDate(report.createdAt)}
                                  />
                                  <InfoBox
                                    label="Coordinates"
                                    value={
                                      report.latitude != null &&
                                      report.longitude != null
                                        ? `${Number(report.latitude).toFixed(
                                            4,
                                          )}, ${Number(
                                            report.longitude,
                                          ).toFixed(4)}`
                                        : "Not provided"
                                    }
                                  />
                                </>
                              )}

                              {step === 2 && (
                                <>
                                  <InfoBox
                                    label="Risk score"
                                    value={
                                      prediction
                                        ? primaryRisk(
                                            prediction,
                                          ).riskScore.toFixed(1)
                                        : "Unavailable"
                                    }
                                  />
                                  <InfoBox
                                    label="Risk level"
                                    value={
                                      prediction
                                        ? primaryRisk(prediction)
                                            .riskLevel
                                        : "Unavailable"
                                    }
                                  />
                                  <InfoBox
                                    label="Confidence"
                                    value={
                                      prediction &&
                                      Number.isFinite(
                                        Number(prediction.confidence),
                                      )
                                        ? `${Number(
                                            prediction.confidence,
                                          ).toFixed(1)}%`
                                        : "Unavailable"
                                    }
                                  />
                                  <InfoBox
                                    label="Prediction ID"
                                    value={
                                      prediction?.id
                                        ? String(
                                            prediction.id,
                                          ).slice(0, 14)
                                        : "—"
                                    }
                                  />
                                  <InfoBox
                                    label="Source"
                                    value={
                                      prediction?.predictionSource ||
                                      "Risk Prediction Service"
                                    }
                                  />
                                  <InfoBox
                                    label="Location"
                                    value={
                                      prediction?.location ||
                                      report.location ||
                                      "Unknown"
                                    }
                                  />
                                </>
                              )}

                              {step === 3 && (
                                <>
                                  <InfoBox
                                    label="Assessment"
                                    value={
                                      assessment
                                        ? "Completed"
                                        : "Not available"
                                    }
                                  />
                                  <InfoBox
                                    label="Assessment ID"
                                    value={
                                      assessment?.id
                                        ? String(
                                            assessment.id,
                                          ).slice(0, 14)
                                        : "—"
                                    }
                                  />
                                  <InfoBox
                                    label="Location"
                                    value={
                                      assessment?.location ||
                                      report.location ||
                                      "Unknown"
                                    }
                                  />
                                  <InfoBox
                                    label="Disaster"
                                    value={
                                      assessment?.disasterType ||
                                      report.disasterType ||
                                      "Unknown"
                                    }
                                  />
                                  <InfoBox
                                    label="Linked Agent 01"
                                    value={
                                      prediction
                                        ? "Risk prediction linked"
                                        : "Not linked"
                                    }
                                  />
                                  <InfoBox
                                    label="Created"
                                    value={formatDate(
                                      assessment?.createdAt,
                                    )}
                                  />
                                </>
                              )}

                              {step === 4 && (
                                <>
                                  <InfoBox
                                    label="Resource records"
                                    value={
                                      resources
                                        ? String(resources.length)
                                        : resourceLoading[
                                              String(
                                                assessment?.id || "",
                                              )
                                            ]
                                          ? "Loading..."
                                          : "Not loaded"
                                    }
                                  />
                                  <InfoBox
                                    label="Assessment input"
                                    value={
                                      assessment
                                        ? "Available"
                                        : "Missing"
                                    }
                                  />
                                  <InfoBox
                                    label="Allocation status"
                                    value={
                                      resources &&
                                      resources.length > 0
                                        ? "Allocated"
                                        : assessment
                                          ? "No records"
                                          : "Waiting"
                                    }
                                  />
                                </>
                              )}

                              {step === 5 && (
                                <>
                                  <InfoBox
                                    label="Warning"
                                    value={
                                      alert?.severity ||
                                      "Not generated"
                                    }
                                  />
                                  <InfoBox
                                    label="Alert status"
                                    value={
                                      alert?.status ||
                                      "Not available"
                                    }
                                  />
                                  <InfoBox
                                    label="Alert ID"
                                    value={
                                      alert?.id
                                        ? String(
                                            alert.id,
                                          ).slice(0, 14)
                                        : "—"
                                    }
                                  />
                                  <InfoBox
                                    label="Created"
                                    value={formatDate(
                                      alert?.createdAt,
                                    )}
                                  />
                                  <InfoBox
                                    label="Location"
                                    value={
                                      alert?.location ||
                                      report.location ||
                                      "Unknown"
                                    }
                                  />
                                  <InfoBox
                                    label="Disaster"
                                    value={
                                      alert?.disasterType ||
                                      report.disasterType ||
                                      "Unknown"
                                    }
                                  />
                                </>
                              )}

                              {step === 6 && (
                                <>
                                  <InfoBox
                                    label="Volunteer"
                                    value={
                                      report.assignedVolunteerName ||
                                      "Not assigned"
                                    }
                                  />
                                  <InfoBox
                                    label="Assignment status"
                                    value={
                                      report.assignedVolunteerUserId
                                        ? "Assigned"
                                        : status ===
                                            "volunteerqueue"
                                          ? "Volunteer Queue"
                                          : "Waiting"
                                    }
                                  />
                                  <InfoBox
                                    label="Assigned at"
                                    value={formatDate(
                                      report.assignedAt,
                                    )}
                                  />
                                  <InfoBox
                                    label="Approved volunteers"
                                    value={String(
                                      volunteers.length,
                                    )}
                                  />
                                  <InfoBox
                                    label="Assignment model"
                                    value="AI recommendation + administrator confirmation"
                                  />
                                  <InfoBox
                                    label="Incident priority"
                                    value={
                                      report.severity ||
                                      "Not provided"
                                    }
                                  />
                                </>
                              )}

                              {step === 7 && (
                                <>
                                  <InfoBox
                                    label="Field status"
                                    value={formatStatus(
                                      report.status,
                                    )}
                                  />
                                  <InfoBox
                                    label="Volunteer"
                                    value={
                                      report.assignedVolunteerName ||
                                      "Not assigned"
                                    }
                                  />
                                  <InfoBox
                                    label="Last field update"
                                    value={formatDate(
                                      report.fieldUpdatedAt,
                                    )}
                                  />
                                  <InfoBox
                                    label="Field situation"
                                    value={
                                      report.fieldSituation ||
                                      "No field update yet"
                                    }
                                  />
                                  <InfoBox
                                    label="Field notes"
                                    value={
                                      report.fieldUpdateNotes ||
                                      "No field notes yet"
                                    }
                                  />
                                  <InfoBox
                                    label="Field coordinates"
                                    value={
                                      report.fieldUpdateLatitude !=
                                        null &&
                                      report.fieldUpdateLongitude !=
                                        null
                                        ? `${Number(
                                            report.fieldUpdateLatitude,
                                          ).toFixed(4)}, ${Number(
                                            report.fieldUpdateLongitude,
                                          ).toFixed(4)}`
                                        : "Not updated"
                                    }
                                  />
                                </>
                              )}

                              {step === 8 && (
                                <>
                                  <InfoBox
                                    label="Final status"
                                    value={formatStatus(
                                      report.status,
                                    )}
                                  />
                                  <InfoBox
                                    label="Volunteer"
                                    value={
                                      report.assignedVolunteerName ||
                                      "Not assigned"
                                    }
                                  />
                                  <InfoBox
                                    label="Field completion"
                                    value={
                                      status === "fieldcompleted" ||
                                      status === "resolved"
                                        ? "Completed"
                                        : "Pending"
                                    }
                                  />
                                  <InfoBox
                                    label="Resolution"
                                    value={
                                      status === "resolved"
                                        ? "Incident resolved"
                                        : "Awaiting resolution"
                                    }
                                  />
                                  <InfoBox
                                    label="Updated"
                                    value={formatDate(
                                      report.updatedAt,
                                    )}
                                  />
                                  <InfoBox
                                    label="Response lifecycle"
                                    value={
                                      status === "resolved"
                                        ? "Complete"
                                        : "In progress"
                                    }
                                  />
                                </>
                              )}
                            </div>

                            {/* STEP 4 RESOURCE LIST */}
                            {step === 4 &&
                              resources &&
                              resources.length > 0 && (
                                <div className="mt-4 rounded-xl border border-violet-100 bg-white p-3">
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">
                                    Agent 03 Resource Allocation
                                  </p>

                                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {resources
                                      .slice(0, 8)
                                      .map(
                                        (
                                          resource,
                                          resourceIndex,
                                        ) => (
                                          <div
                                            key={
                                              resource.id ||
                                              `${resource.resourceName}-${resourceIndex}`
                                            }
                                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                                          >
                                            <div className="min-w-0">
                                              <p className="truncate text-xs font-black text-slate-800">
                                                {resource.resourceName ||
                                                  resource.resourceType ||
                                                  "Resource"}
                                              </p>
                                              <p className="mt-0.5 text-[9px] text-slate-500">
                                                {resource.location ||
                                                  report.location ||
                                                  "Incident location"}{" "}
                                                ·{" "}
                                                {resource.priority ||
                                                  "Recommended"}
                                              </p>
                                            </div>

                                            <span className="rounded-lg bg-violet-100 px-2.5 py-1.5 text-[9px] font-black text-violet-700">
                                              {(
                                                resource.recommendedQuantity ??
                                                resource.quantity ??
                                                0
                                              ).toLocaleString()}
                                            </span>
                                          </div>
                                        ),
                                      )}
                                  </div>
                                </div>
                              )}

                            {/* STEP 6 VOLUNTEER ASSIGNMENT */}
                            {step === 6 && (
                              <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                  <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">
                                      Volunteer Assignment
                                    </p>
                                    <h5 className="mt-1 text-sm font-black text-slate-900">
                                      {report.assignedVolunteerName
                                        ? "Volunteer assignment confirmed"
                                        : "Match and assign a Field Volunteer"}
                                    </h5>
                                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                      The Volunteer Assignment Agent recommends
                                      an approved active volunteer; the final
                                      assignment is confirmed by an authorized
                                      administrator.
                                    </p>
                                  </div>

                                  {(canAssign ||
                                    status === "assigned") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setThisStep(6);
                                        if (report.id) {
                                          void loadVolunteerRecommendation(report);
                                        }
                                      }}
                                      className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white hover:bg-violet-700"
                                    >
                                      {report.assignedVolunteerName
                                        ? "Review Assignment"
                                        : "AI Volunteer Match"}
                                    </button>
                                  )}
                                </div>

                                {report.assignedVolunteerName && (
                                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                      Current field volunteer
                                    </p>

                                    <div className="mt-1 flex items-center justify-between gap-3">
                                      <p className="text-xs font-black text-emerald-800">
                                        {report.assignedVolunteerName}
                                      </p>
                                      <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-emerald-700">
                                        Assigned
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ACTIONS */}
                            <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                                    Stage Action
                                  </p>
                                  <h5 className="mt-1 text-sm font-black text-slate-950">
                                    Step {step} · {active.title}
                                  </h5>
                                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                    Complete the current operational stage before
                                    continuing to the next stage.
                                  </p>
                                </div>

                                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[8px] font-black text-blue-700">
                                  {active.status}
                                </span>
                              </div>

                              <div className="mt-4">
                                {step === 1 && (
                                  <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-black text-slate-900">
                                        Review the submitted incident
                                      </p>
                                      <p className="mt-1 text-[10px] text-slate-500">
                                        Confirm the report details before moving
                                        into AI risk analysis.
                                      </p>
                                    </div>
                                    {canReview ? (
                                      <button
                                        type="button"
                                        disabled={
                                          actionLoading ===
                                          `review-${reportId}`
                                        }
                                        onClick={() =>
                                          void runWorkflowAction(
                                            report,
                                            "review",
                                          )
                                        }
                                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                      >
                                        {actionLoading ===
                                        `review-${reportId}`
                                          ? "Starting..."
                                          : "Start Review"}
                                      </button>
                                    ) : (
                                      <span className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700">
                                        ✓ Review started
                                      </span>
                                    )}
                                  </div>
                                )}

                                {step === 2 && (
                                  <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                                    <div className="flex flex-col gap-4">
                                      <div>
                                        <p className="text-xs font-black text-slate-900">
                                          Agent 01 · Risk Prediction
                                        </p>
                                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                          Use the exact Agent 01 prediction for this incident. A matching prediction is selected automatically; you can explicitly choose another live prediction when there is no automatic link.
                                        </p>
                                      </div>

                                      {prediction ? (
                                        <div className="grid gap-2 sm:grid-cols-3">
                                          <InfoBox
                                            label="Risk"
                                            value={`${primaryRisk(prediction).riskScore.toFixed(1)} · ${primaryRisk(prediction).riskLevel}`}
                                          />
                                          <InfoBox
                                            label="Disaster"
                                            value={primaryRisk(prediction).disasterType}
                                          />
                                          <InfoBox
                                            label="Confidence"
                                            value={
                                              Number.isFinite(
                                                Number(prediction.confidence),
                                              )
                                                ? `${Number(prediction.confidence).toFixed(1)}%`
                                                : "Unavailable"
                                            }
                                          />
                                        </div>
                                      ) : (
                                        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                                          <select
                                            value={
                                              selectedPredictionByReport[reportId] || ""
                                            }
                                            onChange={(event) => {
                                              const value = event.target.value;
                                              setSelectedPredictionByReport((current) => ({
                                                ...current,
                                                [reportId]: value,
                                              }));
                                            }}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 outline-none"
                                          >
                                            <option value="">
                                              Select an Agent 01 prediction
                                            </option>
                                            {predictions.map((item, predictionIndex) => {
                                              const risk = primaryRisk(item);
                                              return (
                                                <option
                                                  key={
                                                    String(item.id || "") ||
                                                    `${item.location}-${predictionIndex}`
                                                  }
                                                  value={String(item.id || "")}
                                                >
                                                  {item.location || "Unknown"} · {risk.disasterType} · {risk.riskScore.toFixed(1)} · {risk.riskLevel}
                                                </option>
                                              );
                                            })}
                                          </select>

                                          <span className="rounded-xl bg-slate-100 px-4 py-3 text-center text-[10px] font-black text-slate-500">
                                            Prediction link required
                                          </span>
                                        </div>
                                      )}

                                      {prediction && (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const selectedId = String(prediction.id || "");
                                              setSelectedPredictionByReport((current) => ({
                                                ...current,
                                                [reportId]: selectedId,
                                              }));
                                              if (
                                                prediction.latitude != null &&
                                                prediction.longitude != null
                                              ) {
                                                focusMap({
                                                  latitude: Number(prediction.latitude),
                                                  longitude: Number(prediction.longitude),
                                                  title:
                                                    prediction.location ||
                                                    report.location ||
                                                    "AI prediction",
                                                  subtitle: `${primaryRisk(prediction).disasterType} · ${primaryRisk(prediction).riskScore.toFixed(1)} · ${primaryRisk(prediction).riskLevel}`,
                                                  kind: "prediction",
                                                });
                                              }
                                            }}
                                            className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-black text-violet-700"
                                          >
                                            Use this prediction
                                          </button>

                                          <span className="rounded-full bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-700">
                                            Agent 01 linked
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {step === 3 && (
                                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-xs font-black text-slate-900">
                                          Agent 02 · Vulnerability & Impact
                                        </p>
                                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                          Run Agent 02 against the selected Agent 01 prediction. The saved assessment becomes the input for Agent 03 and Agent 04.
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        disabled={
                                          !prediction ||
                                          stageActionLoading ===
                                            `agent02-${prediction?.id || ""}`
                                        }
                                        onClick={async () => {
                                          try {
                                            await runAgent02ForReport(
                                              report,
                                              prediction,
                                            );
                                          } catch (err: any) {
                                            setError(
                                              err?.message ||
                                                "Agent 02 could not run.",
                                            );
                                          }
                                        }}
                                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                      >
                                        {stageActionLoading ===
                                        `agent02-${prediction?.id || ""}`
                                          ? "Assessing..."
                                          : assessment
                                            ? "Run Again"
                                            : "Run Agent 02"}
                                      </button>
                                    </div>

                                    {assessment ? (
                                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                        <InfoBox
                                          label="Assessment"
                                          value="Completed"
                                        />
                                        <InfoBox
                                          label="Assessment ID"
                                          value={
                                            assessment.id
                                              ? String(assessment.id).slice(0, 14)
                                              : "—"
                                          }
                                        />
                                        <InfoBox
                                          label="Location"
                                          value={
                                            assessment.location ||
                                            report.location ||
                                            "Unknown"
                                          }
                                        />
                                      </div>
                                    ) : (
                                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[10px] font-semibold text-amber-800">
                                        {prediction
                                          ? "Agent 02 is ready to run."
                                          : "Select an Agent 01 prediction first."}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {step === 4 && (
                                  <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-xs font-black text-slate-900">
                                          Agent 03 · Resource Optimization
                                        </p>
                                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                          Generate the live resource allocation
                                          records for the linked Agent 02 assessment.
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        disabled={
                                          !assessment ||
                                          stageActionLoading ===
                                            `agent03-${report.id || assessment.id}`
                                        }
                                        onClick={async () => {
                                          try {
                                            await runAgent03ForReport(
                                              report,
                                              assessment,
                                            );
                                          } catch (err: any) {
                                            setError(
                                              err?.message ||
                                                "Agent 03 could not run.",
                                            );
                                          }
                                        }}
                                        className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                      >
                                        {stageActionLoading ===
                                        `agent03-${report.id || assessment?.id}`
                                          ? "Optimizing..."
                                          : resources &&
                                              resources.length > 0
                                            ? "Run Again"
                                            : "Run Agent 03"}
                                      </button>
                                    </div>

                                    {resources &&
                                      resources.length > 0 && (
                                        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[10px] font-semibold text-emerald-800">
                                          {resources.length} live resource
                                          allocation record(s) loaded.
                                        </div>
                                      )}
                                  </div>
                                )}

                                {step === 5 && (
                                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-xs font-black text-slate-900">
                                          Agent 04 · Early Warning
                                        </p>
                                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                          Create the real emergency warning
                                          record from the linked Agent 02
                                          assessment.
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        disabled={
                                          !assessment ||
                                          Boolean(alert) ||
                                          stageActionLoading ===
                                            `agent04-${report.id || assessment.id}`
                                        }
                                        onClick={async () => {
                                          try {
                                            await runAgent04ForReport(
                                              report,
                                              assessment,
                                            );
                                          } catch (err: any) {
                                            setError(
                                              err?.message ||
                                                "Agent 04 could not run.",
                                            );
                                          }
                                        }}
                                        className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                      >
                                        {stageActionLoading ===
                                        `agent04-${report.id || assessment?.id}`
                                          ? "Generating..."
                                          : alert
                                            ? "✓ Warning Generated"
                                            : "Generate Warning"}
                                      </button>
                                    </div>

                                    {alert && (
                                      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                          Live Agent 04 output
                                        </p>
                                        <p className="mt-1 text-xs font-black text-emerald-800">
                                          {alert.severity || "Warning"} ·{" "}
                                          {alert.status || "Active"}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {step === 6 && (
                                  <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">
                                          Process 6 · Volunteer Assignment
                                        </p>
                                        <h5 className="mt-1 text-sm font-black text-slate-900">
                                          Assign an approved Field Volunteer
                                        </h5>
                                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                          The Volunteer Assignment Agent recommends an approved active
                                          volunteer using incident priority, district fit, availability
                                          and current workload. The assignment is completed here in the
                                          same incident workflow.
                                        </p>
                                      </div>

                                      {!recommendation && !recommendationLoading && (
                                        <button
                                          type="button"
                                          onClick={() => void loadVolunteerRecommendation(report)}
                                          className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white hover:bg-violet-700"
                                        >
                                          Run AI Volunteer Match
                                        </button>
                                      )}
                                    </div>

                                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                      <InfoBox
                                        label="Current volunteer"
                                        value={report.assignedVolunteerName || "Not assigned"}
                                      />
                                      <InfoBox
                                        label="Assignment status"
                                        value={report.assignedVolunteerUserId ? "Assigned" : "Pending"}
                                      />
                                      <InfoBox
                                        label="Available volunteers"
                                        value={String(volunteers.length)}
                                      />
                                    </div>

                                    {recommendationError && (
                                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] font-semibold text-red-700">
                                        {recommendationError}
                                      </div>
                                    )}

                                    {recommendationLoading && (
                                      <div className="mt-3 rounded-xl border border-dashed border-violet-200 bg-white p-4 text-center">
                                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                                        <p className="mt-2 text-[10px] font-black text-violet-800">
                                          Volunteer Assignment Agent is evaluating available volunteers...
                                        </p>
                                      </div>
                                    )}

                                    {recommendation && !recommendationLoading && (
                                      <div className="mt-3 space-y-3">
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                                AI Recommended Volunteer
                                              </p>
                                              <p className="mt-1 text-sm font-black text-slate-950">
                                                {recommendation.recommendedVolunteer
                                                  ? recommendation.recommendedVolunteer.volunteerName
                                                  : "No recommendation available"}
                                              </p>
                                              {recommendation.recommendedVolunteer && (
                                                <p className="mt-1 text-[10px] text-slate-600">
                                                  {recommendation.recommendedVolunteer.district || "District unavailable"} ·{" "}
                                                  {recommendation.recommendedVolunteer.availability || "Availability unavailable"} ·{" "}
                                                  Workload {recommendation.recommendedVolunteer.currentWorkload}
                                                </p>
                                              )}
                                            </div>
                                            {recommendation.recommendedVolunteer && (
                                              <span className="self-start rounded-lg bg-white px-3 py-2 text-[9px] font-black text-emerald-700">
                                                Match {recommendation.recommendedVolunteer.matchScore}
                                              </span>
                                            )}
                                          </div>
                                          {recommendation.recommendedVolunteer && (
                                            <p className="mt-3 rounded-xl bg-white p-3 text-[10px] leading-4 text-slate-600">
                                              {recommendation.recommendedVolunteer.matchReason}
                                            </p>
                                          )}
                                        </div>

                                        <div>
                                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                            Select volunteer
                                          </p>
                                          <div className="mt-2 space-y-2">
                                            {[
                                              ...(recommendation.recommendedVolunteer
                                                ? [recommendation.recommendedVolunteer]
                                                : []),
                                              ...(recommendation.alternatives || []),
                                            ].map((candidate) => (
                                              <button
                                                key={candidate.volunteerUserId}
                                                type="button"
                                                onClick={() => setSelectedVolunteerId(candidate.volunteerUserId)}
                                                className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
                                                  selectedVolunteerId === candidate.volunteerUserId
                                                    ? "border-violet-300 bg-violet-50 ring-2 ring-violet-100"
                                                    : "border-slate-200 bg-white hover:border-violet-200"
                                                }`}
                                              >
                                                <div className="min-w-0 flex-1">
                                                  <p className="truncate text-xs font-black text-slate-900">
                                                    {candidate.volunteerName}
                                                  </p>
                                                  <p className="mt-1 text-[10px] text-slate-500">
                                                    {candidate.district || "District unavailable"} ·{" "}
                                                    {candidate.availability || "Availability unavailable"} ·{" "}
                                                    Workload {candidate.currentWorkload}
                                                  </p>
                                                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                                    {candidate.matchReason}
                                                  </p>
                                                </div>
                                                <span
                                                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-black ${
                                                    selectedVolunteerId === candidate.volunteerUserId
                                                      ? "bg-violet-600 text-white"
                                                      : "bg-slate-100 text-slate-600"
                                                  }`}
                                                >
                                                  {selectedVolunteerId === candidate.volunteerUserId
                                                    ? "Selected"
                                                    : `Match ${candidate.matchScore}`}
                                                </span>
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-2 border-t border-violet-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                          <div>
                                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                              Selected volunteer
                                            </p>
                                            <p className="mt-1 text-xs font-black text-slate-900">
                                              {selectedVolunteerId
                                                ? (
                                                    recommendation.recommendedVolunteer?.volunteerUserId === selectedVolunteerId
                                                      ? recommendation.recommendedVolunteer.volunteerName
                                                      : (recommendation.alternatives || []).find(
                                                          (candidate) => candidate.volunteerUserId === selectedVolunteerId,
                                                        )?.volunteerName
                                                  ) || "Selected volunteer"
                                                : "No volunteer selected"}
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            disabled={!selectedVolunteerId || actionLoading === `assign-${reportId}`}
                                            onClick={() => {
                                              if (!selectedVolunteerId) return;
                                              setSelectedVolunteerByReport((current) => ({
                                                ...current,
                                                [reportId]: selectedVolunteerId,
                                              }));
                                              void runWorkflowAction(report, "assign", selectedVolunteerId);
                                            }}
                                            className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                                          >
                                            {actionLoading === `assign-${reportId}`
                                              ? "Assigning..."
                                              : report.assignedVolunteerName
                                                ? "Update Assignment"
                                                : "Assign Volunteer"}
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {!report.assignedVolunteerUserId && !recommendation && !recommendationLoading && (
                                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] font-semibold text-amber-800">
                                        Assignment is required before the Field Response stage can start.
                                      </div>
                                    )}
                                  </div>
                                )}

                                {step === 7 && (
                                  <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <p className="text-xs font-black text-slate-900">
                                          Field Response Handoff
                                        </p>
                                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                          The assigned Field Volunteer performs the
                                          actual field response from their own
                                          authenticated account. This administrative
                                          view tracks the handoff and latest update.
                                        </p>
                                      </div>
                                      <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-cyan-700">
                                        {formatStatus(status)}
                                      </span>
                                    </div>

                                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                      <InfoBox
                                        label="Assigned volunteer"
                                        value={
                                          report.assignedVolunteerName ||
                                          "Not assigned"
                                        }
                                      />
                                      <InfoBox
                                        label="Latest update"
                                        value={formatDate(report.fieldUpdatedAt)}
                                      />
                                      <InfoBox
                                        label="Response status"
                                        value={formatStatus(report.status)}
                                      />

                                      <div className="sm:col-span-3 rounded-xl border border-white bg-white p-3">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                          Latest situation
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-700">
                                          {report.fieldSituation ||
                                            "No field situation has been submitted yet."}
                                        </p>
                                      </div>

                                      <div className="sm:col-span-3 rounded-xl border border-white bg-white p-3">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                          Field notes
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-700">
                                          {report.fieldUpdateNotes ||
                                            "No field notes have been submitted yet."}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {step === 8 && (
                                  <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-black text-slate-900">
                                        Resolution Form
                                      </p>
                                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        Close the report after the field
                                        response has been completed.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        status === "resolved" ||
                                        ![
                                          "fieldcompleted",
                                          "resolved",
                                        ].includes(status) ||
                                        actionLoading ===
                                          `resolve-${reportId}`
                                      }
                                      onClick={() =>
                                        void runWorkflowAction(
                                          report,
                                          "resolve",
                                        )
                                      }
                                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                    >
                                      {status === "resolved"
                                        ? "✓ Resolved"
                                        : actionLoading ===
                                            `resolve-${reportId}`
                                          ? "Resolving..."
                                          : "Mark Resolved"}
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                                {step > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setThisStep(
                                        (step - 1) as
                                          | 1
                                          | 2
                                          | 3
                                          | 4
                                          | 5
                                          | 6
                                          | 7
                                          | 8,
                                      )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700"
                                  >
                                    ← Previous Step
                                  </button>
                                )}

                                {step < 8 && (
                                  <button
                                    type="button"
                                    disabled={
                                      (step === 1 &&
                                        status === "submitted") ||
                                      (step === 2 && !prediction) ||
                                      (step === 3 && !assessment) ||
                                      (step === 4 &&
                                        (!assessment ||
                                          !resources ||
                                          resources.length === 0)) ||
                                      (step === 5 &&
                                        (!assessment || !alert)) ||
                                      (step === 6 &&
                                        !report.assignedVolunteerUserId) ||
                                      (step === 7 &&
                                        status !== "fieldcompleted")
                                    }
                                    onClick={() =>
                                      setThisStep(
                                        (step + 1) as
                                          | 1
                                          | 2
                                          | 3
                                          | 4
                                          | 5
                                          | 6
                                          | 7
                                          | 8,
                                      )
                                    }
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Next Step →
                                  </button>
                                )}

                                {report.latitude != null &&
                                  report.longitude != null && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        focusMap({
                                          latitude: Number(report.latitude),
                                          longitude: Number(report.longitude),
                                          title: getReportLocation(report),
                                          subtitle: `${report.disasterType || "Disaster"} · ${report.severity || "Unknown"}`,
                                          kind: "report",
                                        })
                                      }
                                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700"
                                    >
                                      View on Global Map
                                    </button>
                                  )}

                                {!["resolved", "rejected"].includes(
                                  status,
                                ) &&
                                  step !== 8 && (
                                    <button
                                      type="button"
                                      disabled={
                                        actionLoading ===
                                        `reject-${reportId}`
                                      }
                                      onClick={() =>
                                        void runWorkflowAction(
                                          report,
                                          "reject",
                                        )
                                      }
                                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-600 disabled:opacity-50"
                                    >
                                      {actionLoading ===
                                      `reject-${reportId}`
                                        ? "Rejecting..."
                                        : "Reject"}
                                    </button>
                                  )}
                              </div>
                            </div>
                          </section>

                          {/* RIGHT SUMMARY */}
                          <aside className="w-full min-w-0 space-y-4">
                            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Incident Intelligence
                              </p>

                              <h5 className="mt-1 text-sm font-black text-slate-900">
                                Operational Snapshot
                              </h5>

                              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                                <InfoBox
                                  label="Risk"
                                  value={
                                    prediction
                                      ? `${primaryRisk(prediction).riskScore.toFixed(1)} · ${primaryRisk(prediction).riskLevel}`
                                      : "Not linked"
                                  }
                                />

                                <InfoBox
                                  label="Agent 02"
                                  value={
                                    assessment
                                      ? "Assessment completed"
                                      : "Waiting"
                                  }
                                />

                                <InfoBox
                                  label="Agent 04"
                                  value={
                                    alert
                                      ? `${alert.severity || "Warning"} · ${alert.status || "Active"}`
                                      : "Not generated"
                                  }
                                />

                                <InfoBox
                                  label="Volunteer"
                                  value={
                                    report.assignedVolunteerName ||
                                    "Not assigned"
                                  }
                                />

                                <InfoBox
                                  label="Field response"
                                  value={formatStatus(
                                    report.status,
                                  )}
                                />
                              </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                                Report Context
                              </p>

                              <p className="mt-2 text-xs leading-5 text-slate-600">
                                {report.description ||
                                  "No additional incident description was provided."}
                              </p>

                              <div className="mt-4 rounded-xl border border-white bg-white p-3">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                  Timeline
                                </p>
                                <div className="mt-2 space-y-2 text-[10px]">
                                  <div className="flex justify-between gap-3">
                                    <span className="text-slate-400">
                                      Submitted
                                    </span>
                                    <strong className="text-slate-700">
                                      {formatDate(report.createdAt)}
                                    </strong>
                                  </div>

                                  <div className="flex justify-between gap-3">
                                    <span className="text-slate-400">
                                      Assigned
                                    </span>
                                    <strong className="text-slate-700">
                                      {formatDate(report.assignedAt)}
                                    </strong>
                                  </div>

                                  <div className="flex justify-between gap-3">
                                    <span className="text-slate-400">
                                      Field update
                                    </span>
                                    <strong className="text-slate-700">
                                      {formatDate(
                                        report.fieldUpdatedAt,
                                      )}
                                    </strong>
                                  </div>

                                  <div className="flex justify-between gap-3">
                                    <span className="text-slate-400">
                                      Last updated
                                    </span>
                                    <strong className="text-slate-700">
                                      {formatDate(report.updatedAt)}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            </section>
                          </aside>
                        </div>
                          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
                              <button
                                type="button"
                                onClick={() => { clearActiveWorkflow(); setReportActionMenuId(null); setOpenReportId(null); }}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
                              >
                                Close Workflow
                              </button>
                              <button
                                type="button"
                                disabled={normalize(report.status) !== "resolved"}
                                onClick={() => void exportIncidentData(report)}
                                className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Export Data
                              </button>
                              <button
                                type="button"
                                disabled={normalize(report.status) !== "resolved"}
                                onClick={() => void generateIncidentPdf(report)}
                                className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Generate Final Report
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>



      {/* AGENT 01 RISK PREDICTIONS */}
      <section className="overflow-hidden rounded-[30px] border border-violet-200 bg-white shadow-sm">
        <div className="border-b border-violet-100 bg-gradient-to-r from-violet-950 via-violet-900 to-slate-950 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg">
                <img
                  src="/images/disasters/disaster-default (1).svg"
                  alt="Risk prediction"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0 max-w-4xl">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">
                  Agent 01 · Unified Operational Workflow
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Risk Prediction Results
                </h2>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-violet-100/80">
                  Every prediction now follows the same eight-stage incident process used by submitted disaster reports. The prediction is already complete at Stage 2, then continues through Agent 02, Agent 03, Agent 04, volunteer assignment, field response and final resolution.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <HeroStat label="Predictions" value={predictions.length} />
              <HeroStat label="Mapped" value={mappedPredictionCount} tone="green" />
              <HeroStat
                label="High / Critical"
                value={predictions.filter((prediction) =>
                  ["high", "critical"].includes(
                    normalize(primaryRisk(prediction).riskLevel),
                  ),
                ).length}
                tone="red"
              />
            </div>
          </div>
        </div>

        {intelligenceLoading ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Loading Agent 01 predictions...
            </p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No Agent 01 risk predictions are currently available.
          </div>
        ) : (
          <div className="divide-y divide-violet-100">
            {predictions.map((prediction, index) => {
              const key = String(
                prediction.id || `${prediction.location}-${index}`,
              );
              const risk = primaryRisk(prediction);
              const assessment = vulnerabilityAssessments.find(
                (item) =>
                  String(item.riskPredictionId || "") ===
                  String(prediction.id || ""),
              );
              const alert = alerts.find(
                (item) =>
                  String(item.riskPredictionId || "") ===
                    String(prediction.id || "") ||
                  (assessment &&
                    String(item.vulnerabilityAssessmentId || "") ===
                      String(assessment.id || "")),
              );
              const resources = assessment?.id
                ? resourceByAssessment[String(assessment.id)]
                : undefined;
              const linkedReport = getLinkedReportForPrediction(prediction);
              const linkedStatus = normalize(linkedReport?.status);
              const open = openPredictionId === key;
              const step =
                predictionStep[key] ||
                persistedInitialState.predictionSteps[key] ||
                getInitialPredictionStep(prediction, linkedReport);

              const steps = [
                {
                  no: 1 as const,
                  title: "Report Submitted",
                  owner: "Incident Intake",
                  status: linkedReport ? "Completed" : "Ready",
                },
                {
                  no: 2 as const,
                  title: "Risk Prediction",
                  owner: "Agent 01",
                  status: "Completed",
                },
                {
                  no: 3 as const,
                  title: "Vulnerability & Impact",
                  owner: "Agent 02",
                  status: assessment ? "Completed" : "Ready",
                },
                {
                  no: 4 as const,
                  title: "Resource Optimization",
                  owner: "Agent 03",
                  status:
                    resources && resources.length > 0
                      ? "Completed"
                      : assessment
                        ? "Ready"
                        : "Waiting",
                },
                {
                  no: 5 as const,
                  title: "Early Warning",
                  owner: "Agent 04",
                  status: alert
                    ? "Completed"
                    : resources && resources.length > 0
                      ? "Ready"
                      : "Waiting",
                },
                {
                  no: 6 as const,
                  title: "Volunteer Assignment",
                  owner: "Volunteer Agent",
                  status: linkedReport?.assignedVolunteerUserId
                    ? "Completed"
                    : linkedReport && alert
                      ? "Ready"
                      : "Waiting",
                },
                {
                  no: 7 as const,
                  title: "Field Response",
                  owner: "Assigned Volunteer",
                  status: ["fieldcompleted", "resolved"].includes(linkedStatus)
                    ? "Completed"
                    : ["inprogress", "fieldupdatesubmitted"].includes(
                          linkedStatus,
                        )
                      ? "In Progress"
                      : linkedReport?.assignedVolunteerUserId
                        ? "Ready"
                        : "Waiting",
                },
                {
                  no: 8 as const,
                  title: "Resolution",
                  owner: "Relief Coordinator",
                  status:
                    linkedStatus === "resolved"
                      ? "Completed"
                      : linkedStatus === "fieldcompleted"
                        ? "Ready"
                        : "Waiting",
                },
              ];

              const active = steps[step - 1];

              const predictionProxy: DisasterReport = {
                id: String(prediction.id || ""),
                disasterType: risk.disasterType,
                location: prediction.location,
                latitude:
                  prediction.latitude != null
                    ? Number(prediction.latitude)
                    : undefined,
                longitude:
                  prediction.longitude != null
                    ? Number(prediction.longitude)
                    : undefined,
                severity: risk.riskLevel,
                status: linkedReport?.status,
                reporterName: "Agent 01 Prediction",
              };

              const resourcesReady =
                Boolean(resources && resources.length > 0) && Boolean(assessment);

              const nextBlocked =
                (step === 1 && false) ||
                (step === 2 && !assessment) ||
                (step === 3 && !assessment) ||
                (step === 4 && !resourcesReady) ||
                (step === 5 && !alert) ||
                (step === 6 &&
                  (!linkedReport || !linkedReport.assignedVolunteerUserId)) ||
                (step === 7 &&
                  (!linkedReport || linkedStatus !== "fieldcompleted"));

              const setPredictionStage = async (
                value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
              ) => {
                let activeIncident: DisasterReport | null = linkedReport ?? null;

                if (value >= 2 && !activeIncident) {
                  activeIncident = await ensurePredictionOperationalIncident(
                    prediction,
                    key,
                  );

                  if (!activeIncident) return;
                }

                setPredictionStep((current) => ({
                  ...current,
                  [key]: value,
                }));
                persistActiveWorkflow("prediction", key, value);

                if (value === 4 && assessment?.id) {
                  void ensureResources(String(assessment.id));
                }

                if (
                  value === 6 &&
                  activeIncident &&
                  !activeIncident.assignedVolunteerUserId
                ) {
                  void loadVolunteerRecommendation(activeIncident).catch(
                    () => undefined,
                  );
                }
              };

              return (
                <article key={key} className="w-full min-w-0 max-w-full p-4 sm:p-6 overflow-hidden">
                  <div
                    className={`overflow-hidden rounded-[26px] border ${
                      open
                        ? "border-violet-300 bg-violet-50/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (open) {
                          setOpenPredictionId(null);
                          return;
                        }

                        setOpenPredictionId(key);
                        const restoredStep =
                          predictionStep[key] ||
                          persistedInitialState.predictionSteps[key] ||
                          getInitialPredictionStep(prediction, linkedReport);

                        setPredictionStep((current) => ({
                          ...current,
                          [key]: restoredStep,
                        }));
                        persistActiveWorkflow("prediction", key, restoredStep);

                        if (assessment?.id) {
                          void ensureResources(String(assessment.id));
                        }
                      }}
                      className="flex w-full flex-col gap-4 p-4 text-left sm:flex-row sm:items-center"
                    >
                      <div className="h-16 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-950 sm:h-16 sm:w-24">
                        <img
                          src={incidentImage(risk.disasterType)}
                          alt={`${risk.disasterType} risk`}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-[0.16em] text-violet-600">
                            Agent 01 Prediction
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[8px] font-black ${severityClass(
                              risk.riskLevel,
                            )}`}
                          >
                            {risk.riskLevel}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black text-slate-500">
                            Stage {step}/8
                          </span>
                        </div>

                        <h3 className="mt-1 truncate text-base font-black text-slate-950">
                          {prediction.location || "Unknown location"}
                        </h3>

                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {risk.disasterType} · Risk {risk.riskScore.toFixed(1)}
                          {linkedReport
                            ? ` · Linked incident: ${
                                linkedReport.location || "Incident"
                              }`
                            : " · No incident linked yet"}
                        </p>
                      </div>

                      <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
                        <div className="rounded-xl bg-violet-50 px-3 py-2 text-center">
                          <p className="text-[7px] font-black uppercase text-violet-500">
                            Risk
                          </p>
                          <p className="text-sm font-black text-violet-900">
                            {risk.riskScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                          <p className="text-[7px] font-black uppercase text-blue-500">
                            Confidence
                          </p>
                          <p className="text-sm font-black text-blue-900">
                            {Number.isFinite(Number(prediction.confidence))
                              ? `${Number(prediction.confidence).toFixed(0)}%`
                              : "—"}
                          </p>
                        </div>
                        <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                          {open ? "Open" : "Workflow"}
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-md sm:p-6">
                        <div className="relative flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl">
                          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-600">
                                ReliefNexus · Agent 01 Unified Workflow
                              </p>
                              <h3 className="mt-1 truncate text-lg font-black text-slate-950">
                                {prediction.location || "Risk Prediction Workflow"}
                              </h3>
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                                Complete the operational process here without expanding the prediction card.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { clearActiveWorkflow(); setOpenPredictionId(null); }}
                              className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                            >
                              Close
                            </button>
                          </div>
                          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                            <div className="grid w-full min-w-0 gap-4">
                          <section className="w-full min-w-0 max-w-full rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">
                                  Same 8-Step Incident Workflow
                                </p>
                                <h4 className="mt-1 text-xl font-black text-slate-950">
                                  {active.title}
                                </h4>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Step {step} of 8 · {active.owner}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1.5 text-[8px] font-black ${
                                  active.status === "Completed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : active.status === "Ready" ||
                                        active.status === "In Progress"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {active.status}
                              </span>
                            </div>

                            <div className="mt-5 overflow-x-auto pb-1">
                              <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                                {steps.map((item) => (
                                  <WorkflowStepCard
                                    key={item.no}
                                    number={item.no}
                                    title={item.title}
                                    owner={item.owner}
                                    status={item.status}
                                    selected={item.no === step}
                                    onClick={() => setPredictionStage(item.no)}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                                Process {step} · Operational Details
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                {step === 1 &&
                                  (linkedReport
                                    ? `01 Report Submitted — this Agent 01 prediction is linked to the ${linkedReport.disasterType || "disaster"} incident at ${linkedReport.location || prediction.location || "the selected location"}.`
                                    : `01 Report Submitted — the prediction is registered as an operational case for ${prediction.location || "the selected location"}. Link an existing incident to enable the same downstream response lifecycle.`)}

                                {step === 2 &&
                                  `02 Risk Prediction — Agent 01 generated a ${risk.riskLevel} ${risk.disasterType} risk result with score ${risk.riskScore.toFixed(1)} and confidence ${
                                    Number.isFinite(Number(prediction.confidence))
                                      ? `${Number(prediction.confidence).toFixed(1)}%`
                                      : "not available"
                                  }.`}

                                {step === 3 &&
                                  (assessment
                                    ? "03 Vulnerability & Impact — Agent 02 has completed the assessment linked to this Agent 01 prediction."
                                    : "03 Vulnerability & Impact — Agent 02 has not yet produced the linked assessment.")}

                                {step === 4 &&
                                  (resourcesReady
                                    ? `04 Resource Optimization — Agent 03 has produced ${resources?.length || 0} live resource allocation record(s) from the Agent 02 assessment.`
                                    : assessment
                                      ? "04 Resource Optimization — Agent 03 is ready to generate the live resource allocation records."
                                      : "04 Resource Optimization — waiting for Agent 02.")}

                                {step === 5 &&
                                  (alert
                                    ? `05 Early Warning — Agent 04 has generated a ${alert.severity || "warning"} warning with status ${alert.status || "active"}.`
                                    : resourcesReady
                                      ? "05 Early Warning — Agent 04 is ready to generate the warning record."
                                      : "05 Early Warning — waiting for the upstream assessment and resource stages.")}

                                {step === 6 &&
                                  (linkedReport?.assignedVolunteerName
                                    ? `06 Volunteer Assignment — ${linkedReport.assignedVolunteerName} is the confirmed field volunteer for the linked incident.`
                                    : "06 Volunteer Assignment — link this prediction to an incident report, then the Volunteer Assignment Agent can recommend and assign an approved active field volunteer.")}

                                {step === 7 &&
                                  (linkedReport
                                    ? linkedReport.fieldSituation ||
                                      linkedReport.fieldUpdateNotes ||
                                      linkedStatus === "inprogress" ||
                                      linkedStatus === "fieldupdatesubmitted"
                                      ? "07 Field Response — the assigned volunteer can start the field response, submit situation updates and complete the field stage from this workflow."
                                      : "07 Field Response — an assigned volunteer is ready to start the field response."
                                    : "07 Field Response — waiting for a linked incident and an assigned volunteer.")}

                                {step === 8 &&
                                  (linkedStatus === "resolved"
                                    ? "08 Resolution — the linked incident has been marked Resolved."
                                    : "08 Resolution — complete the field response first, then mark the linked incident as Resolved.")}
                              </p>

                              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                {step === 1 && (
                                  <>
                                    <InfoBox
                                      label="Incident"
                                      value={
                                        linkedReport?.location ||
                                        "Not linked"
                                      }
                                    />
                                    <InfoBox
                                      label="Disaster"
                                      value={
                                        linkedReport?.disasterType ||
                                        risk.disasterType
                                      }
                                    />
                                    <InfoBox
                                      label="Incident link"
                                      value={
                                        linkedReport
                                          ? "Linked"
                                          : "Required for stages 6–8"
                                      }
                                    />
                                  </>
                                )}

                                {step === 2 && (
                                  <>
                                    <InfoBox
                                      label="Risk score"
                                      value={risk.riskScore.toFixed(1)}
                                    />
                                    <InfoBox
                                      label="Risk level"
                                      value={risk.riskLevel}
                                    />
                                    <InfoBox
                                      label="Model"
                                      value={
                                        prediction.modelVersion || "Default"
                                      }
                                    />
                                    <InfoBox
                                      label="Confidence"
                                      value={
                                        Number.isFinite(
                                          Number(prediction.confidence),
                                        )
                                          ? `${Number(
                                              prediction.confidence,
                                            ).toFixed(1)}%`
                                          : "Unavailable"
                                      }
                                    />
                                    <InfoBox
                                      label="Source"
                                      value={
                                        prediction.predictionSource ||
                                        "Risk Prediction Service"
                                      }
                                    />
                                    <InfoBox
                                      label="Coordinates"
                                      value={
                                        prediction.latitude != null &&
                                        prediction.longitude != null
                                          ? `${Number(
                                              prediction.latitude,
                                            ).toFixed(5)}, ${Number(
                                              prediction.longitude,
                                            ).toFixed(5)}`
                                          : "Not provided"
                                      }
                                    />
                                  </>
                                )}

                                {step === 3 && (
                                  <>
                                    <InfoBox
                                      label="Assessment"
                                      value={
                                        assessment
                                          ? "Completed"
                                          : "Not generated"
                                      }
                                    />
                                    <InfoBox
                                      label="Assessment ID"
                                      value={
                                        assessment?.id
                                          ? String(assessment.id).slice(0, 14)
                                          : "—"
                                      }
                                    />
                                    <InfoBox
                                      label="Location"
                                      value={
                                        assessment?.location ||
                                        prediction.location ||
                                        "Unknown"
                                      }
                                    />
                                    <InfoBox
                                      label="Linked prediction"
                                      value={
                                        assessment?.riskPredictionId
                                          ? String(
                                              assessment.riskPredictionId,
                                            ).slice(0, 14)
                                          : "—"
                                      }
                                    />
                                  </>
                                )}

                                {step === 4 && (
                                  <>
                                    <InfoBox
                                      label="Resource records"
                                      value={
                                        resources
                                          ? String(resources.length)
                                          : resourceLoading[
                                                String(
                                                  assessment?.id || "",
                                                )
                                              ]
                                            ? "Loading..."
                                            : "Not loaded"
                                      }
                                    />
                                    <InfoBox
                                      label="Assessment input"
                                      value={
                                        assessment ? "Available" : "Missing"
                                      }
                                    />
                                    <InfoBox
                                      label="Allocation status"
                                      value={
                                        resourcesReady
                                          ? "Allocated"
                                          : assessment
                                            ? "Optimization pending"
                                            : "Waiting"
                                      }
                                    />
                                  </>
                                )}

                                {step === 5 && (
                                  <>
                                    <InfoBox
                                      label="Warning"
                                      value={
                                        alert?.severity || "Not generated"
                                      }
                                    />
                                    <InfoBox
                                      label="Alert status"
                                      value={alert?.status || "Waiting"}
                                    />
                                    <InfoBox
                                      label="Alert ID"
                                      value={
                                        alert?.id
                                          ? String(alert.id).slice(0, 14)
                                          : "—"
                                      }
                                    />
                                    <InfoBox
                                      label="Created"
                                      value={formatDate(alert?.createdAt)}
                                    />
                                  </>
                                )}

                                {step === 6 && (
                                  <>
                                    <InfoBox
                                      label="Volunteer"
                                      value={
                                        linkedReport?.assignedVolunteerName ||
                                        "Not assigned"
                                      }
                                    />
                                    <InfoBox
                                      label="Assignment status"
                                      value={
                                        linkedReport?.assignedVolunteerUserId
                                          ? "Assigned"
                                          : linkedReport
                                            ? "Ready to assign"
                                            : "Incident link required"
                                      }
                                    />
                                    <InfoBox
                                      label="Assigned at"
                                      value={formatDate(
                                        linkedReport?.assignedAt,
                                      )}
                                    />
                                    <InfoBox
                                      label="Approved volunteers"
                                      value={String(volunteers.length)}
                                    />
                                    <InfoBox
                                      label="Incident priority"
                                      value={
                                        linkedReport?.severity ||
                                        risk.riskLevel
                                      }
                                    />
                                    <InfoBox
                                      label="Assignment engine"
                                      value="AI recommendation + administrator confirmation"
                                    />
                                  </>
                                )}

                                {step === 7 && (
                                  <>
                                    <InfoBox
                                      label="Field status"
                                      value={
                                        linkedReport
                                          ? formatStatus(linkedReport.status)
                                          : "Waiting"
                                      }
                                    />
                                    <InfoBox
                                      label="Volunteer"
                                      value={
                                        linkedReport?.assignedVolunteerName ||
                                        "Not assigned"
                                      }
                                    />
                                    <InfoBox
                                      label="Last update"
                                      value={formatDate(
                                        linkedReport?.fieldUpdatedAt,
                                      )}
                                    />
                                    <InfoBox
                                      label="Situation"
                                      value={
                                        linkedReport?.fieldSituation ||
                                        "No update yet"
                                      }
                                    />
                                    <InfoBox
                                      label="Field notes"
                                      value={
                                        linkedReport?.fieldUpdateNotes ||
                                        "No notes yet"
                                      }
                                    />
                                    <InfoBox
                                      label="Field coordinates"
                                      value={
                                        linkedReport?.fieldUpdateLatitude !=
                                          null &&
                                        linkedReport?.fieldUpdateLongitude !=
                                          null
                                          ? `${Number(
                                              linkedReport.fieldUpdateLatitude,
                                            ).toFixed(5)}, ${Number(
                                              linkedReport.fieldUpdateLongitude,
                                            ).toFixed(5)}`
                                          : "Not updated"
                                      }
                                    />
                                  </>
                                )}

                                {step === 8 && (
                                  <>
                                    <InfoBox
                                      label="Final status"
                                      value={
                                        linkedReport
                                          ? formatStatus(linkedReport.status)
                                          : "Waiting"
                                      }
                                    />
                                    <InfoBox
                                      label="Volunteer"
                                      value={
                                        linkedReport?.assignedVolunteerName ||
                                        "Not assigned"
                                      }
                                    />
                                    <InfoBox
                                      label="Field completion"
                                      value={
                                        ["fieldcompleted", "resolved"].includes(
                                          linkedStatus,
                                        )
                                          ? "Completed"
                                          : "Pending"
                                      }
                                    />
                                    <InfoBox
                                      label="Resolution"
                                      value={
                                        linkedStatus === "resolved"
                                          ? "Incident resolved"
                                          : "Awaiting resolution"
                                      }
                                    />
                                    <InfoBox
                                      label="Updated"
                                      value={formatDate(
                                        linkedReport?.updatedAt,
                                      )}
                                    />
                                    <InfoBox
                                      label="Lifecycle"
                                      value={
                                        linkedStatus === "resolved"
                                          ? "Complete"
                                          : "In progress"
                                      }
                                    />
                                  </>
                                )}
                              </div>

                              {/* STEP 1 — OPERATIONAL INCIDENT */}
                              {step === 1 && (
                                <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                                        Operational Incident
                                      </p>
                                      <p className="mt-1 text-xs font-black text-slate-900">
                                        {linkedReport
                                          ? "Operational incident linked"
                                          : "Automatic operational incident creation"}
                                      </p>
                                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        No incident selection is required. This Agent
                                        01 prediction is converted into one real
                                        Disaster Report used by the downstream
                                        operational workflow.
                                      </p>
                                    </div>

                                    <span
                                      className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black ${
                                        linkedReport
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-blue-50 text-blue-700"
                                      }`}
                                    >
                                      {linkedReport ? "Linked" : "Automatic"}
                                    </span>
                                  </div>

                                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    <InfoBox
                                      label="Incident"
                                      value={
                                        linkedReport?.location ||
                                        prediction.location ||
                                        "Unknown"
                                      }
                                    />
                                    <InfoBox
                                      label="Disaster"
                                      value={risk.disasterType}
                                    />
                                    <InfoBox
                                      label="Operational status"
                                      value={
                                        linkedReport
                                          ? formatStatus(linkedReport.status)
                                          : "Created on continue"
                                      }
                                    />
                                  </div>

                                  {predictionIncidentLoading[key] && (
                                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10px] font-semibold text-blue-800">
                                      Creating the operational incident from Agent
                                      01...
                                    </div>
                                  )}

                                  {predictionIncidentError[key] && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[10px] font-semibold text-red-700">
                                      {predictionIncidentError[key]}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* STEP 3 — AGENT 02 */}
                              {step === 3 && (
                                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-black text-slate-900">
                                        Agent 02 · Vulnerability & Impact
                                      </p>
                                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        Run the real Agent 02 assessment for this
                                        Agent 01 prediction.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        !prediction.id ||
                                        stageActionLoading ===
                                          `agent02-${prediction.id}`
                                      }
                                      onClick={async () => {
                                        try {
                                          await runAgent02ForPrediction(
                                            prediction,
                                          );
                                        } catch (err: any) {
                                          setError(
                                            err?.message ||
                                              "Agent 02 could not run.",
                                          );
                                        }
                                      }}
                                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                    >
                                      {stageActionLoading ===
                                      `agent02-${prediction.id}`
                                        ? "Assessing..."
                                        : assessment
                                          ? "Run Again"
                                          : "Run Agent 02"}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* STEP 4 — AGENT 03 */}
                              {step === 4 && (
                                <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-black text-slate-900">
                                        Agent 03 · Resource Optimization
                                      </p>
                                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        Generate the live allocation records from the
                                        selected Agent 02 assessment.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        !assessment ||
                                        stageActionLoading ===
                                          `agent03-${predictionProxy.id || assessment.id}`
                                      }
                                      onClick={async () => {
                                        try {
                                          await runAgent03ForReport(
                                            predictionProxy,
                                            assessment,
                                          );
                                        } catch (err: any) {
                                          setError(
                                            err?.message ||
                                              "Agent 03 could not run.",
                                          );
                                        }
                                      }}
                                      className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                    >
                                      {stageActionLoading ===
                                      `agent03-${predictionProxy.id || assessment?.id}`
                                        ? "Optimizing..."
                                        : resourcesReady
                                          ? "Run Again"
                                          : "Run Agent 03"}
                                    </button>
                                  </div>

                                  {resourcesReady && (
                                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                      <InfoBox
                                        label="Allocations"
                                        value={String(resources?.length || 0)}
                                      />
                                      <InfoBox
                                        label="Assessment"
                                        value="Agent 02"
                                      />
                                      <InfoBox
                                        label="Status"
                                        value="Completed"
                                      />
                                    </div>
                                  )}

                                  {resources && resources.length > 0 && (
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                      {resources.slice(0, 8).map(
                                        (resource, resourceIndex) => (
                                          <div
                                            key={
                                              resource.id ||
                                              `${resource.resourceName}-${resourceIndex}`
                                            }
                                            className="flex items-center justify-between rounded-xl border border-white bg-white px-3 py-3"
                                          >
                                            <div className="min-w-0">
                                              <p className="truncate text-xs font-black text-slate-800">
                                                {resource.resourceName ||
                                                  resource.resourceType ||
                                                  "Resource"}
                                              </p>
                                              <p className="mt-0.5 text-[9px] text-slate-500">
                                                {resource.location ||
                                                  prediction.location ||
                                                  "Incident location"}{" "}
                                                ·{" "}
                                                {resource.priority ||
                                                  "Recommended"}
                                              </p>
                                            </div>
                                            <span className="rounded-lg bg-violet-100 px-2.5 py-1.5 text-[9px] font-black text-violet-700">
                                              {(
                                                resource.recommendedQuantity ??
                                                resource.quantity ??
                                                0
                                              ).toLocaleString()}
                                            </span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* STEP 5 — AGENT 04 */}
                              {step === 5 && (
                                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-black text-slate-900">
                                        Agent 04 · Early Warning
                                      </p>
                                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        Generate the real emergency warning from
                                        the linked Agent 02 assessment.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        !assessment ||
                                        !resourcesReady ||
                                        Boolean(alert) ||
                                        stageActionLoading ===
                                          `agent04-${predictionProxy.id || assessment.id}`
                                      }
                                      onClick={async () => {
                                        try {
                                          await runAgent04ForReport(
                                            predictionProxy,
                                            assessment,
                                          );
                                        } catch (err: any) {
                                          setError(
                                            err?.message ||
                                              "Agent 04 could not run.",
                                          );
                                        }
                                      }}
                                      className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                    >
                                      {stageActionLoading ===
                                      `agent04-${predictionProxy.id || assessment?.id}`
                                        ? "Generating..."
                                        : alert
                                          ? "Generated"
                                          : "Generate Warning"}
                                    </button>
                                  </div>

                                  {alert && (
                                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                      <InfoBox
                                        label="Severity"
                                        value={alert.severity || "Warning"}
                                      />
                                      <InfoBox
                                        label="Status"
                                        value={alert.status || "Active"}
                                      />
                                      <InfoBox
                                        label="Location"
                                        value={
                                          alert.location ||
                                          prediction.location ||
                                          "Unknown"
                                        }
                                      />
                                      <InfoBox
                                        label="Created"
                                        value={formatDate(alert.createdAt)}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* STEP 6 — VOLUNTEER */}
                              {step === 6 && (
                                <div className="mt-3 w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-violet-100 bg-violet-50/70 p-2.5 sm:p-3">
                                  {!linkedReport ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[10px] font-semibold text-amber-800">
                                      No operational incident is linked yet. Return
                                      to Step 1 and continue through the workflow.
                                    </div>
                                  ) : (
                                    <div className="min-w-0 space-y-2.5">
                                      <div>
                                        <p className="text-xs font-black text-slate-900">
                                          Volunteer Assignment Form
                                        </p>
                                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                          Assign an approved active Field Volunteer
                                          to this operational incident. After
                                          assignment, the selected volunteer will
                                          see this incident in their own account.
                                        </p>
                                      </div>

                                      <div className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-4">
                                        <InfoBox
                                          label="Incident"
                                          value={
                                            linkedReport.location ||
                                            prediction.location ||
                                            "Unknown"
                                          }
                                        />
                                        <InfoBox
                                          label="Disaster"
                                          value={
                                            linkedReport.disasterType ||
                                            risk.disasterType
                                          }
                                        />
                                        <InfoBox
                                          label="Priority"
                                          value={
                                            linkedReport.severity ||
                                            risk.riskLevel
                                          }
                                        />
                                        <InfoBox
                                          label="Status"
                                          value={formatStatus(linkedReport.status)}
                                        />
                                      </div>

                                      {linkedReport.assignedVolunteerUserId ? (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                            Assignment confirmed
                                          </p>
                                          <p className="mt-1 text-sm font-black text-emerald-900">
                                            {linkedReport.assignedVolunteerName ||
                                              "Volunteer assigned"}
                                          </p>
                                          <p className="mt-1 text-[10px] leading-4 text-emerald-700">
                                            The incident is now available in the
                                            Field Volunteer account. Step 7 must be
                                            completed by that volunteer.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="min-w-0 rounded-xl border border-violet-100 bg-white p-3">
                                          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                            <div>
                                              <p className="text-xs font-black text-slate-900">
                                                AI Volunteer Matching
                                              </p>
                                              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                                The agent evaluates approved active
                                                volunteers using priority, location
                                                fit, workload and availability.
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              disabled={recommendationLoading}
                                              onClick={() =>
                                                void loadVolunteerRecommendation(
                                                  linkedReport,
                                                ).catch(() => undefined)
                                              }
                                              className="w-full max-w-full shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-[10px] font-black text-white disabled:opacity-40 lg:w-auto"
                                            >
                                              {recommendationLoading
                                                ? "Matching..."
                                                : "Refresh AI Match"}
                                            </button>
                                          </div>

                                          {recommendationError && (
                                            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[10px] font-semibold text-red-700">
                                              {recommendationError}
                                            </div>
                                          )}

                                          {recommendationLoading && (
                                            <div className="mt-3 rounded-xl border border-dashed border-violet-200 bg-violet-50 p-4 text-center">
                                              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                                              <p className="mt-2 text-[10px] font-black text-violet-800">
                                                Volunteer Assignment Agent is
                                                evaluating available volunteers...
                                              </p>
                                            </div>
                                          )}

                                          {recommendation &&
                                            !recommendationLoading && (
                                              <div className="mt-3 space-y-2">
                                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                                    Recommended Volunteer
                                                  </p>
                                                  <div className="mt-2 flex items-center justify-between gap-3">
                                                    <div>
                                                      <p className="text-sm font-black text-slate-950">
                                                        {recommendation.recommendedVolunteer
                                                          ? recommendation.recommendedVolunteer.volunteerName
                                                          : "No recommendation"}
                                                      </p>
                                                      {recommendation.recommendedVolunteer && (
                                                        <p className="mt-1 text-[10px] text-slate-600">
                                                          {recommendation.recommendedVolunteer.district} ·{" "}
                                                          {recommendation.recommendedVolunteer.availability} ·{" "}
                                                          Workload {recommendation.recommendedVolunteer.currentWorkload}
                                                        </p>
                                                      )}
                                                    </div>
                                                    {recommendation.recommendedVolunteer && (
                                                      <span className="rounded-lg bg-white px-3 py-2 text-[9px] font-black text-emerald-700">
                                                        Match {recommendation.recommendedVolunteer.matchScore}
                                                      </span>
                                                    )}
                                                  </div>

                                                  {recommendation.recommendedVolunteer && (
                                                    <p className="mt-3 rounded-xl bg-white p-3 text-[10px] leading-4 text-slate-600">
                                                      {recommendation.recommendedVolunteer.matchReason}
                                                    </p>
                                                  )}
                                                </div>

                                                <div>
                                                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                                    Select volunteer
                                                  </p>
                                                  <div className="mt-2 space-y-2">
                                                    {[
                                                      ...(recommendation.recommendedVolunteer
                                                        ? [recommendation.recommendedVolunteer]
                                                        : []),
                                                      ...(recommendation.alternatives || []),
                                                    ].map((candidate) => (
                                                      <button
                                                        key={candidate.volunteerUserId}
                                                        type="button"
                                                        onClick={() =>
                                                          setSelectedVolunteerId(
                                                            candidate.volunteerUserId,
                                                          )
                                                        }
                                                        className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border p-2.5 text-left ${
                                                          selectedVolunteerId ===
                                                          candidate.volunteerUserId
                                                            ? "border-violet-300 bg-violet-50 ring-2 ring-violet-100"
                                                            : "border-slate-200 bg-slate-50"
                                                        }`}
                                                      >
                                                        <div className="min-w-0 flex-1">
                                                          <p className="truncate text-xs font-black text-slate-900">
                                                            {candidate.volunteerName}
                                                          </p>
                                                          <p className="mt-1 text-[10px] text-slate-500">
                                                            {candidate.district || "District unavailable"} ·{" "}
                                                            {candidate.availability}
                                                          </p>
                                                        </div>
                                                        <span className="text-[9px] font-black text-violet-700">
                                                          {candidate.matchScore}
                                                        </span>
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>

                                                <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                                                  <div>
                                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                      Selected volunteer
                                                    </p>
                                                    <p className="mt-1 truncate text-xs font-black text-slate-800">
                                                      {selectedVolunteerId ||
                                                        "No volunteer selected"}
                                                    </p>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    disabled={
                                                      !selectedVolunteerId ||
                                                      actionLoading ===
                                                        `assign-${linkedReport.id}`
                                                    }
                                                    onClick={() => {
                                                      if (selectedVolunteerId) {
                                                        void confirmPredictionAssignment(
                                                          linkedReport,
                                                          selectedVolunteerId,
                                                        );
                                                      }
                                                    }}
                                                    className="w-full max-w-full shrink-0 rounded-lg bg-violet-600 px-3 py-2.5 text-[10px] font-black text-white disabled:opacity-40 sm:w-auto"
                                                  >
                                                    {actionLoading ===
                                                    `assign-${linkedReport.id}`
                                                      ? "Assigning..."
                                                      : "Assign Volunteer"}
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                               {/* STEP 7 — FIELD RESPONSE */}
                              {step === 7 && (
                                <div className="mt-4 min-w-0 max-w-full overflow-hidden rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 sm:p-4">
                                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="text-xs font-black text-slate-900">
                                        Field Response Form
                                      </p>
                                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        The assigned Field Volunteer completes this form from the authenticated volunteer account.
                                        The System Administrator can review the live handoff and submitted field information here.
                                      </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-cyan-700">
                                      {linkedStatus === "fieldcompleted"
                                        ? "Completed"
                                        : linkedReport?.assignedVolunteerUserId
                                          ? formatStatus(linkedStatus || "Assigned")
                                          : "Waiting for assignment"}
                                    </span>
                                  </div>

                                  {linkedReport ? (
                                    <>
                                      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
                                        <InfoBox
                                          label="Assigned volunteer"
                                          value={
                                            linkedReport.assignedVolunteerName ||
                                            "Not assigned"
                                          }
                                        />
                                        <InfoBox
                                          label="Response status"
                                          value={formatStatus(linkedReport.status)}
                                        />
                                        <InfoBox
                                          label="Latest update"
                                          value={formatDate(linkedReport.fieldUpdatedAt)}
                                        />
                                      </div>

                                      <div className="mt-3 min-w-0 rounded-xl border border-cyan-100 bg-white p-3">
                                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                          <div className="min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-700">
                                              Volunteer-only field action
                                            </p>
                                            <p className="mt-1 text-xs font-black text-slate-900">
                                              Field Response Workspace
                                            </p>
                                            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                              The actual Start, Update and Complete actions are protected for the assigned Field Volunteer account.
                                            </p>
                                          </div>
                                          <span className="shrink-0 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-[8px] font-black text-cyan-700">
                                            {linkedReport.assignedVolunteerName
                                              ? "Assigned volunteer"
                                              : "Unassigned"}
                                          </span>
                                        </div>

                                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                          <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                              Current situation
                                            </label>
                                            <div className="mt-1 min-h-[88px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] leading-5 text-slate-700">
                                              {linkedReport.fieldSituation ||
                                                "No field situation submitted yet. The assigned volunteer must enter the latest on-site situation."}
                                            </div>
                                          </div>

                                          <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                              Field notes
                                            </label>
                                            <div className="mt-1 min-h-[88px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] leading-5 text-slate-700">
                                              {linkedReport.fieldUpdateNotes ||
                                                "No field notes submitted yet. The volunteer records observations, actions taken, resource needs and safety issues."}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                          <InfoBox
                                            label="Field latitude"
                                            value={
                                              linkedReport.fieldUpdateLatitude != null
                                                ? Number(linkedReport.fieldUpdateLatitude).toFixed(5)
                                                : "Not updated"
                                            }
                                          />
                                          <InfoBox
                                            label="Field longitude"
                                            value={
                                              linkedReport.fieldUpdateLongitude != null
                                                ? Number(linkedReport.fieldUpdateLongitude).toFixed(5)
                                                : "Not updated"
                                            }
                                          />
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                          <span className="rounded-lg bg-white px-2 py-1 text-[8px] font-black text-blue-700">
                                            STEP 7 ACTIONS
                                          </span>
                                          <span className="text-[9px] font-semibold text-blue-800">
                                            Start Field Response → Submit Field Update → Complete Field Response
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] font-semibold text-amber-800">
                                      Complete Volunteer Assignment in Step 6 before the Field Response Form becomes available.
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* STEP 8 — RESOLUTION */}
                              {step === 8 && linkedReport && (
                                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-black text-slate-900">
                                        Resolution Form
                                      </p>
                                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        The final stage closes the linked incident
                                        after the field response is completed.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        linkedStatus === "resolved" ||
                                        linkedStatus !== "fieldcompleted" ||
                                        actionLoading ===
                                          `resolve-${linkedReport.id}`
                                      }
                                      onClick={() =>
                                        void runWorkflowAction(
                                          linkedReport,
                                          "resolve",
                                        )
                                      }
                                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                                    >
                                      {linkedStatus === "resolved"
                                        ? "✓ Resolved"
                                        : actionLoading ===
                                            `resolve-${linkedReport.id}`
                                          ? "Resolving..."
                                          : "Mark Resolved"}
                                    </button>
                                  </div>

                                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    <InfoBox
                                      label="Incident"
                                      value={
                                        linkedReport.location ||
                                        prediction.location ||
                                        "Unknown"
                                      }
                                    />
                                    <InfoBox
                                      label="Field completion"
                                      value={
                                        linkedStatus === "fieldcompleted"
                                          ? "Completed"
                                          : "Pending"
                                      }
                                    />
                                    <InfoBox
                                      label="Current lifecycle"
                                      value={formatStatus(
                                        linkedReport.status,
                                      )}
                                    />
                                  </div>
                                </div>
                              )}

                              {step === 8 && !linkedReport && (
                                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-[10px] font-semibold text-amber-800">
                                  Link this prediction to an incident report in
                                  Step 1 before the final resolution stage.
                                </div>
                              )}

                              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                                {step > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPredictionStage(
                                        (step - 1) as
                                          | 1
                                          | 2
                                          | 3
                                          | 4
                                          | 5
                                          | 6
                                          | 7
                                          | 8,
                                      )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700"
                                  >
                                    ← Previous Step
                                  </button>
                                )}

                                {step < 8 && (
                                  <button
                                    type="button"
                                    disabled={nextBlocked}
                                    onClick={() =>
                                      setPredictionStage(
                                        (step + 1) as
                                          | 1
                                          | 2
                                          | 3
                                          | 4
                                          | 5
                                          | 6
                                          | 7
                                          | 8,
                                      )
                                    }
                                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Next Step →
                                  </button>
                                )}

                                {prediction.latitude != null &&
                                  prediction.longitude != null && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        focusMap({
                                          latitude: Number(
                                            prediction.latitude,
                                          ),
                                          longitude: Number(
                                            prediction.longitude,
                                          ),
                                          title:
                                            prediction.location ||
                                            "AI risk prediction",
                                          subtitle: `${risk.disasterType} · ${risk.riskScore.toFixed(1)} · ${risk.riskLevel}`,
                                          kind: "prediction",
                                        })
                                      }
                                      className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-700"
                                    >
                                      View on Global Map
                                    </button>
                                  )}
                              </div>
                            </div>
                          </section>

                          <aside className="space-y-4">
                            <section className="rounded-[24px] border border-slate-200 bg-white p-5">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Incident Intelligence
                              </p>
                              <h5 className="mt-1 text-sm font-black text-slate-900">
                                Operational Snapshot
                              </h5>

                              <div className="mt-4 space-y-2">
                                <InfoBox
                                  label="Risk"
                                  value={`${risk.riskScore.toFixed(1)} · ${risk.riskLevel}`}
                                />
                                <InfoBox
                                  label="Agent 02"
                                  value={
                                    assessment
                                      ? "Assessment completed"
                                      : "Waiting"
                                  }
                                />
                                <InfoBox
                                  label="Agent 03"
                                  value={
                                    resourcesReady
                                      ? `${resources?.length || 0} allocations`
                                      : assessment
                                        ? "Ready"
                                        : "Waiting"
                                  }
                                />
                                <InfoBox
                                  label="Agent 04"
                                  value={
                                    alert
                                      ? `${alert.severity || "Warning"} · ${alert.status || "Active"}`
                                      : "Not generated"
                                  }
                                />
                                <InfoBox
                                  label="Volunteer"
                                  value={
                                    linkedReport?.assignedVolunteerName ||
                                    "Not assigned"
                                  }
                                />
                                <InfoBox
                                  label="Field response"
                                  value={
                                    linkedReport
                                      ? formatStatus(linkedReport.status)
                                      : "Waiting"
                                  }
                                />
                              </div>
                            </section>

                            <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">
                                Prediction Context
                              </p>

                              <div className="mt-3 grid gap-2">
                                <InfoBox
                                  label="Location"
                                  value={prediction.location || "Unknown"}
                                />
                                <InfoBox
                                  label="Source"
                                  value={
                                    prediction.predictionSource ||
                                    "Risk Prediction Service"
                                  }
                                />
                                <InfoBox
                                  label="Model"
                                  value={prediction.modelVersion || "Default"}
                                />
                                <InfoBox
                                  label="Created"
                                  value={formatDate(prediction.createdAt)}
                                />
                                <InfoBox
                                  label="Incident link"
                                  value={
                                    linkedReport
                                      ? linkedReport.location ||
                                        "Linked incident"
                                      : "Not linked"
                                  }
                                />
                              </div>

                              {linkedReport?.description && (
                                <div className="mt-3 rounded-xl border border-white bg-white p-3">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    Incident description
                                  </p>
                                  <p className="mt-1 text-[10px] leading-4 text-slate-600">
                                    {linkedReport.description}
                                  </p>
                                </div>
                              )}
                            </section>
                          </aside>
                        </div>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {mapModalOpen && (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-5"
            onMouseDown={() => setMapModalOpen(false)}
          >
            <div
              className="flex max-h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
                    ReliefNexus · Geographic Intelligence
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Global Disaster Risk & Incident Map
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {validMappedCount(filteredReports)} submitted incidents · {mappedPredictionCount} AI prediction locations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMapModalOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-500 hover:bg-slate-50"
                  aria-label="Close global disaster map"
                >
                  ×
                </button>
              </div>

              <div className="min-h-0 overflow-y-auto p-3 sm:p-5">
                <div className="mb-3 grid gap-2 sm:grid-cols-4">
                  <InfoBox label="Mapped incidents" value={validMappedCount(filteredReports)} />
                  <InfoBox label="AI locations" value={mappedPredictionCount} />
                  <InfoBox label="Critical reports" value={criticalReports} />
                  <InfoBox label="Active reports" value={activeReports} />
                </div>
                <DisasterReportsMap
                  reports={filteredReports}
                  predictions={predictions}
                  focus={mapFocus}
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-[10px] font-semibold text-slate-400">
                  Click a report or AI prediction location to inspect live operational coordinates.
                </p>
                <button
                  type="button"
                  onClick={() => setMapModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  Close Map
                </button>
              </div>
            </div>
          </div>
        )}

      </section>

      </div>

    </div>
  );
}

import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  Eye,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  X,
  Trash2,
  Save,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../../lib/api/apiClient";

import {
  useResourceOptimization,
} from "../hooks/useResourceOptimization";

import type {
  ResourceAllocation,
  ResourceOptimizationFilters as Filters,
} from "../types/resourceOptimization.types";

import {
  calculateResourceSummary,
  filterResourceAllocations,
} from "../utils/resourceOptimization.utils";

/* =========================================================
   TYPES
========================================================= */

type TabType =
  | "allocations"
  | "inventory"
  | "requests"
  | "history";

type AssessmentWorkflowStep = 1 | 2 | 3 | 4;

interface MapPoint {
  lat: number;
  lng: number;
  location: string;
  count: number;
  priority: string;
  assessmentCount?: number;
  riskLevel?: string;
  disasterType?: string;
}

interface VulnerabilityAssessmentSummary {
  id?: string;
  riskPredictionId?: string;
  location?: string;
  disasterType?: string;
  riskScore?: number | null;
  riskLevel?: string;
  vulnerabilityScore?: number | null;
  vulnerabilityLevel?: string;
  impactScore?: number | null;
  impactLevel?: string;
  affectedPopulation?: number | null;
  createdAt?: string;
}

interface RiskPredictionSummary {
  id?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  disasterType?: string;
  riskScore?: number | null;
  riskLevel?: string;
  confidence?: number | null;
  predictionSource?: string;
  modelVersion?: string;
  createdAt?: string;
}

interface ResourceDemandLine {
  resourceId: string;
  resourceType: string;
  resourceName: string;
  location: string;
  requiredQuantity: number;
  availableQuantity: number;
  allocatableQuantity: number;
  gapQuantity: number;
  coverageStatus: string;
}

interface ResourceDemandAssessment {
  vulnerabilityAssessmentId: string;
  location: string;
  disasterType: string;
  affectedPopulation: number;
  priorityAffectedPopulation: number;
  riskScore: number;
  vulnerabilityScore: number;
  impactScore: number;
  severityIndex: number;
  priority: string;
  severityMultiplier: number;
  priorityMultiplier: number;
  populationBlocks: number;
  resources: ResourceDemandLine[];
}

interface ReliefResourceInventory {
  id: string;
  resourceType: string;
  resourceName: string;
  availableQuantity: number;
  allocatedQuantity: number;
  location: string;
  status: string;
  createdAt?: string;
}

function unwrapApiData<T = unknown>(response: any): T {
  const value = response?.data ?? response;
  return (value?.data ?? value?.result ?? value) as T;
}

function toArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

/* =========================================================
   HELPERS
========================================================= */

function getPriorityColor(priority?: string) {
  switch (priority?.toLowerCase()) {
    case "critical":
      return "#ef4444";

    case "high":
      return "#f97316";

    case "medium":
      return "#f59e0b";

    case "low":
      return "#10b981";

    default:
      return "#2563eb";
  }
}

function getPriorityBadge(priority?: string) {
  switch (priority?.toLowerCase()) {
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
}

function getCoordinates(
  location: string
) {
  const value =
    location.toLowerCase();

  if (
    value.includes("trincomalee")
  ) {
    return {
      lat: 8.5874,
      lng: 81.2152,
    };
  }

  if (value.includes("kinniya")) {
    return {
      lat: 8.497,
      lng: 81.181,
    };
  }

  if (
    value.includes("mutur") ||
    value.includes("muttur")
  ) {
    return {
      lat: 8.448,
      lng: 81.268,
    };
  }

  if (value.includes("kantale")) {
    return {
      lat: 8.354,
      lng: 81.004,
    };
  }

  if (
    value.includes("batticaloa")
  ) {
    return {
      lat: 7.717,
      lng: 81.7,
    };
  }

  if (
    value.includes("polonnaruwa")
  ) {
    return {
      lat: 7.9403,
      lng: 81.0188,
    };
  }

  if (
    value.includes("anuradhapura")
  ) {
    return {
      lat: 8.3114,
      lng: 80.4037,
    };
  }

  if (value.includes("colombo")) {
    return {
      lat: 6.9271,
      lng: 79.8612,
    };
  }

  if (
    value.includes("kurunegala")
  ) {
    return {
      lat: 7.4863,
      lng: 80.3623,
    };
  }

  return {
    lat: 7.8731,
    lng: 80.7718,
  };
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const publicAsset = (relativePath: string) => {
  const cleanPath = relativePath.replace(/^\/+/, "");
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${encodeURI(cleanPath)}`;
};

const publicAssetCandidates = (relativePath: string) => {
  const cleanPath = relativePath.replace(/^\/+/, "");
  const withoutAssets = cleanPath.startsWith("assets/")
    ? cleanPath.slice("assets/".length)
    : cleanPath;
  const withAssets = cleanPath.startsWith("assets/")
    ? cleanPath
    : `assets/${cleanPath}`;

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;

  return Array.from(
    new Set([
      `${normalizedBase}${encodeURI(cleanPath)}`,
      `/${encodeURI(cleanPath)}`,
      `${normalizedBase}${encodeURI(withoutAssets)}`,
      `/${encodeURI(withoutAssets)}`,
      `${normalizedBase}${encodeURI(withAssets)}`,
      `/${encodeURI(withAssets)}`,
    ])
  );
};

const advanceImageFallback = (
  event: SyntheticEvent<HTMLImageElement>,
  candidates: string[]
) => {
  const image = event.currentTarget;
  const index = Number(image.dataset.fallbackIndex || "0");
  const next = candidates[index];

  if (next) {
    image.dataset.fallbackIndex = String(index + 1);
    image.src = next;
  } else {
    image.style.opacity = "0";
  }
};

const getResourceImagePath = (
  resourceName?: string,
  resourceType?: string
) => {
  const value = `${resourceName || ""} ${resourceType || ""}`.toLowerCase();

  if (value.includes("drinking water") || value.includes("water")) {
    return "assets/images/resources/drinking-water (2).svg";
  }

  if (value.includes("first aid") || value.includes("medical")) {
    return "assets/images/resources/first-aid-kit (2).svg";
  }

  if (value.includes("hygiene") || value.includes("sanitation")) {
    return "assets/images/resources/hygiene-kit (2).svg";
  }

  if (value.includes("shelter") || value.includes("tent")) {
    return "assets/images/resources/shelter-kit (2).svg";
  }

  if (value.includes("blanket")) {
    return "assets/images/resources/blanket (2).svg";
  }

  if (value.includes("clothing")) {
    return "assets/images/resources/clothing (2).svg";
  }

  if (value.includes("transport") || value.includes("vehicle")) {
    return "assets/images/resources/transport (2).svg";
  }

  if (
    value.includes("food") ||
    value.includes("meal") ||
    value.includes("ration")
  ) {
    return "assets/images/resources/food-pack (1).svg";
  }

  return "assets/images/resources/other (1).svg";
};

const getResourceImageUrl = (
  resourceName?: string,
  resourceType?: string
) => publicAsset(getResourceImagePath(resourceName, resourceType));

const getResourceImageCandidates = (
  resourceName?: string,
  resourceType?: string
) => publicAssetCandidates(getResourceImagePath(resourceName, resourceType));

const getDisasterImagePath = (disasterType?: string) => {
  const type = (disasterType || "").toLowerCase().trim();

  // Exact files from frontend/public/assets/disasters
  if (type.includes("drought")) return "assets/disasters/drought.jpg";
  if (type.includes("flood")) return "assets/disasters/flood.jpg";
  if (type.includes("landslide")) return "assets/disasters/landslide.jpg";
  if (type.includes("earthquake")) return "assets/disasters/earthquake.jpg";

  if (
    type.includes("forest fire") ||
    type.includes("forest-fire") ||
    type.includes("wildfire") ||
    type === "fire" ||
    type.includes("fire")
  ) {
    return "assets/disasters/wildfire.jpg";
  }

  if (type.includes("cyclone") || type.includes("storm")) {
    return "assets/disasters/cyclone.svg";
  }

  if (
    type.includes("heavy rain") ||
    type.includes("hailstorm") ||
    type.includes("hail") ||
    type.includes("rain")
  ) {
    return "assets/disasters/hailstorm.jpg";
  }

  if (type.includes("lightning") || type.includes("thunder")) {
    return "assets/disasters/lightning.jpg";
  }

  if (type.includes("tornado")) return "assets/disasters/tornado.jpg";
  if (type.includes("tsunami")) return "assets/disasters/tsunami.jpg";

  if (
    type.includes("volcanic") ||
    type.includes("volcano") ||
    type.includes("eruption")
  ) {
    return "assets/disasters/volcanic-eruption.jpg";
  }

  if (type.includes("avalanche")) return "assets/disasters/avalanche.jpg";

  // Existing fallback asset in public/images/disasters.
  return "images/disasters/disaster-default (1).svg";
};

const getDisasterImageUrl = (disasterType?: string) =>
  publicAsset(getDisasterImagePath(disasterType));

const getDisasterImageCandidates = (disasterType?: string) =>
  publicAssetCandidates(getDisasterImagePath(disasterType));

const getDisasterPhotoUrl = (disasterType?: string) =>
  getDisasterImageUrl(disasterType);

function ResourceImage({
  name,
  type,
  className = "h-9 w-9",
}: {
  name?: string;
  type?: string;
  className?: string;
}) {
  const src = getResourceImageUrl(name, type);
  const candidates = getResourceImageCandidates(name, type);

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 ${className}`}
    >
      <img
        src={src}
        alt={name || "Resource"}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(event) => {
          advanceImageFallback(event, candidates);
        }}
      />
    </div>
  );
}
/* =========================================================
   KPI CARD
=========================================================


========================================================= */

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
  trend,
  negative,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  iconClass: string;
  trend?: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        {trend && (
          <span
            className={`rounded-full px-2 py-1 text-[9px] font-bold ${
              negative
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      <p className="mt-4 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}



function IntelligenceMetric({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-[8px] text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

/* =========================================================
   SELECTED ASSESSMENT MINI MAP
========================================================= */

function AssessmentMiniMap({
  location,
  disasterType,
  lat,
  lng,
}: {
  location: string;
  disasterType?: string;
  lat: number;
  lng: number;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;

    const map = L.map(elementRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([lat, lng], 10);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 5,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const disasterImage = getDisasterImageUrl(
      disasterType || "Other"
    );

    const icon = L.divIcon({
      className: "relief-disaster-mini-marker",
      html: `
        <div style="
          width:44px;
          height:44px;
          border-radius:9999px;
          overflow:hidden;
          background:#ffffff;
          border:3px solid #ffffff;
          box-shadow:0 8px 20px rgba(15,23,42,.30);
        ">
          <img
            src="${disasterImage}"
            alt="${disasterType || "Disaster"}"
            style="
              width:100%;
              height:100%;
              object-fit:cover;
              display:block;
            "
            onerror="this.src='${publicAsset("images/disasters/disaster-default (1).svg")}'"
          />
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:Arial,sans-serif;">
          <strong>${location}</strong><br/>
          <span style="font-size:10px;color:#64748b;">${disasterType || "Disaster"} assessment</span><br/>
          <span style="font-size:10px;color:#2563eb;font-weight:700;">${lat.toFixed(
            4
          )}, ${lng.toFixed(4)}</span>
        </div>`
      );

    mapRef.current = map;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 250);

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    mapRef.current.setView([lat, lng], 10, { animate: true });
    markerRef.current.setLatLng([lat, lng]);
  }, [lat, lng]);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-blue-50 bg-blue-50/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-blue-600" />
          <span className="text-[9px] font-black uppercase tracking-wider text-blue-700">
            Assessment Location
          </span>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold text-slate-500">
          Live Map
        </span>
      </div>

      <div ref={elementRef} className="h-40 w-full bg-slate-100" />

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-2.5">
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <p className="text-[7px] font-bold uppercase tracking-wide text-slate-400">
            Latitude
          </p>
          <p className="mt-1 text-[9px] font-bold text-slate-700">
            {lat.toFixed(4)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <p className="text-[7px] font-bold uppercase tracking-wide text-slate-400">
            Longitude
          </p>
          <p className="mt-1 text-[9px] font-bold text-slate-700">
            {lng.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAP
========================================================= */

function ResourceAllocationMap({
  allocations,
  assessmentLocations,
  selectedAllocation,
  selectedAssessment,
}: {
  allocations: ResourceAllocation[];
  assessmentLocations: MapPoint[];
  selectedAllocation: ResourceAllocation | null;
  selectedAssessment: VulnerabilityAssessmentSummary | null;
}) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const markerByLocation = useRef<Map<string, L.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  const points = useMemo(() => {
    const byLocation = new Map<string, MapPoint>();

    assessmentLocations.forEach((point) => {
      const key = point.location.trim().toLowerCase();
      if (!key) return;

      const existing = byLocation.get(key);

      if (!existing) {
        byLocation.set(key, { ...point });
      } else {
        existing.assessmentCount =
          (existing.assessmentCount || 0) +
          (point.assessmentCount || 1);

        if (
          point.priority === "Critical" ||
          point.priority === "High"
        ) {
          existing.priority = point.priority;
        }
      }
    });

    allocations.forEach((allocation) => {
      const location = allocation.location?.trim();
      if (!location) return;

      const key = location.toLowerCase();

      if (!byLocation.has(key)) {
        const coordinates = getCoordinates(location);
        byLocation.set(key, {
          lat: coordinates.lat,
          lng: coordinates.lng,
          location,
          count: 1,
          priority: allocation.priority || "Medium",
          assessmentCount: 0,
          riskLevel: "Allocation",
          disasterType:
            assessmentLocations.find(
              (item) =>
                item.location.trim().toLowerCase() === key
            )?.disasterType || "Other",
        });
      }

      const existing = byLocation.get(key)!;
      existing.count = allocations.filter(
        (item) =>
          item.location?.trim().toLowerCase() === key
      ).length;
    });

    return Array.from(byLocation.values());
  }, [allocations, assessmentLocations]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = L.map(mapElement.current, {
      zoomControl: false,
      attributionControl: true,
    });

    map.setView([7.8731, 80.7718], 7);

    L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        minZoom: 6,
        attribution: "&copy; OpenStreetMap contributors",
      }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    markerLayer.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);

    setTimeout(() => map.invalidateSize(), 400);

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayer.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerLayer.current) return;

    markerLayer.current.clearLayers();
    markerByLocation.current.clear();

    points.forEach((point) => {
      const color = getPriorityColor(point.priority);

      const disasterImage = getDisasterImageUrl(point.disasterType || "Other");
      const markerCount = point.assessmentCount || point.count || 1;

      const markerIcon = L.divIcon({
        className: "relief-disaster-marker",
        html: `
          <div style="
            width:50px;
            height:50px;
            border-radius:9999px;
            overflow:hidden;
            background:#ffffff;
            border:3px solid ${color};
            box-shadow:0 8px 22px rgba(15,23,42,.35);
            position:relative;
          ">
            <img
              src="${disasterImage}"
              alt="${point.disasterType || "Disaster"}"
              style="
                width:100%;
                height:100%;
                object-fit:cover;
                display:block;
              "
              onerror="this.src='${publicAsset("images/disasters/disaster-default (1).svg")}'"
            />
            <span style="
              position:absolute;
              right:-1px;
              bottom:-1px;
              min-width:18px;
              height:18px;
              padding:0 4px;
              border-radius:9999px;
              background:${color};
              border:2px solid #ffffff;
              color:#ffffff;
              font:800 9px/14px Arial,sans-serif;
              text-align:center;
            ">${markerCount}</span>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      });

      const marker = L.marker([point.lat, point.lng], {
        icon: markerIcon,
      });

      const allocationCount = allocations.filter(
        (item) =>
          item.location?.trim().toLowerCase() ===
          point.location.trim().toLowerCase()
      ).length;

      marker.bindPopup(`
        <div style="min-width:210px;font-family:Arial,sans-serif">
          <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:4px">
            ${point.location}
          </div>
          <div style="font-size:10px;font-weight:700;color:#2563eb;margin-bottom:7px">
            ${point.disasterType || "Disaster"} assessment
          </div>
          <div style="font-size:11px;color:#64748b;margin-bottom:5px">
            Agent 02 assessments: ${point.assessmentCount || 0}
          </div>
          <div style="font-size:11px;color:#64748b;margin-bottom:5px">
            Agent 03 allocations: ${allocationCount}
          </div>
          <div style="color:${color};font-size:11px;font-weight:800">
            ${point.priority || "Medium"} Priority
          </div>
        </div>
      `);

      marker.addTo(markerLayer.current!);
      markerByLocation.current.set(
        point.location.trim().toLowerCase(),
        marker
      );
    });

    if (points.length) {
      const bounds = L.latLngBounds(
        points.map(
          (point) =>
            [point.lat, point.lng] as [number, number]
        )
      );

      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 9,
        });
      }
    }
  }, [points, allocations, mapReady]);

  // Focus the map on the currently selected Agent 02 assessment.
  // Prefer the assessment location over an older allocation so a previous
  // selection cannot move the map back to another location.
  useEffect(() => {
    if (!mapRef.current || !points.length) return;

    const selectedLocation =
      selectedAssessment?.location?.trim() ||
      selectedAllocation?.location?.trim();

    if (!selectedLocation) return;

    const target = points.find(
      (point) =>
        point.location.trim().toLowerCase() ===
        selectedLocation.toLowerCase()
    );

    if (!target) return;

    mapRef.current.flyTo(
      [target.lat, target.lng],
      Math.max(mapRef.current.getZoom(), 10),
      { duration: 0.8 }
    );

  }, [selectedAssessment, selectedAllocation, points]);

  return (
    <div className="resource-allocation-map relative z-0 isolate h-[360px] overflow-hidden rounded-xl border border-slate-200">
      <style>{`
        .resource-allocation-map .leaflet-pane {
          z-index: 1 !important;
        }
        .resource-allocation-map .leaflet-popup-pane {
          z-index: 2 !important;
        }
        .resource-allocation-map .leaflet-control-container {
          z-index: 3 !important;
        }
      `}</style>
      <div
        ref={mapElement}
        className="absolute inset-0 z-0 h-full w-full overflow-hidden"
      />

      <div className="absolute left-4 top-4 z-[10] rounded-xl border border-white/20 bg-slate-950/85 p-3 text-white shadow-xl backdrop-blur">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-slate-300">
          Agent 02 Locations
        </p>
        <div className="space-y-2">
          <LegendItem color="bg-red-500" label="Critical" />
          <LegendItem color="bg-orange-500" label="High" />
          <LegendItem color="bg-amber-400" label="Medium" />
          <LegendItem color="bg-emerald-500" label="Low" />
        </div>
      </div>

      <div className="absolute right-4 top-4 z-[10]">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 shadow-md">
          {points.length} locations
        </div>
      </div>

      {points.length === 0 && (
        <div className="absolute inset-0 z-[10] flex items-center justify-center pointer-events-none">
          <div className="rounded-xl border border-white/70 bg-white/90 px-5 py-4 text-center shadow-lg backdrop-blur-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin size={19} />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-700">
              No Agent 02 Locations Yet
            </p>
            <p className="mt-1 max-w-[240px] text-[9px] leading-4 text-slate-400">
              Run an Agent 02 assessment to place the affected location on the map.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   LEGEND ITEM
========================================================= */

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      <span className="text-slate-200">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   RESOURCE DISTRIBUTION
========================================================= */

function ResourceDistribution({
  allocations,
}: {
  allocations: ResourceAllocation[];
}) {
  const data = useMemo(() => {
    const map =
      new Map<string, number>();

    allocations.forEach(
      (allocation) => {
        const type =
          allocation.resourceType ||
          "Other";

        map.set(
          type,
          (map.get(type) || 0) +
            Number(
              allocation.recommendedQuantity ||
                0
            )
        );
      }
    );

    return Array.from(
      map.entries()
    )
      .sort(
        (a, b) => b[1] - a[1]
      )
      .slice(0, 5);
  }, [allocations]);

  const total =
    data.reduce(
      (sum, item) =>
        sum + item[1],
      0
    );

  const colors = [
    "#2563eb",
    "#14b8a6",
    "#f97316",
    "#8b5cf6",
    "#ef4444",
  ];

  let current = 0;

  const gradient =
    total > 0
      ? `conic-gradient(${data
          .map(
            (item, index) => {
              const start =
                (current / total) *
                100;

              current += item[1];

              const end =
                (current / total) *
                100;

              return `${colors[index]} ${start}% ${end}%`;
            }
          )
          .join(", ")})`
      : "#e2e8f0";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Resource Distribution
          </h3>

          <p className="mt-1 text-[10px] text-slate-500">
            Allocation by resource type
          </p>
        </div>

        <Boxes
          size={17}
          className="text-cyan-500"
        />
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div
          className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
          style={{
            background: gradient,
          }}
        >
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-xl font-bold text-slate-900">
              {total}
            </span>

            <span className="text-[9px] text-slate-400">
              Allocated
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {data.map(
            ([type, value], index) => (
              <div
                key={type}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background:
                        colors[index],
                    }}
                  />

                  <span className="text-[10px] text-slate-600">
                    {type}
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-700">
                  {value}
                </span>
              </div>
            )
          )}

          {data.length === 0 && (
            <p className="text-[10px] text-slate-400">
              No allocation data
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PRIORITY ALLOCATION
========================================================= */

function PriorityAllocation({
  allocations,
}: {
  allocations: ResourceAllocation[];
}) {
  const items = useMemo(() => {
    const calculate = (
      priority: string
    ) =>
      allocations
        .filter(
          (item) =>
            item.priority?.toLowerCase() ===
            priority.toLowerCase()
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.recommendedQuantity ||
                0
            ),
          0
        );

    return [
      {
        label: "Critical",
        value: calculate(
          "Critical"
        ),
        color: "bg-red-500",
      },
      {
        label: "High",
        value: calculate("High"),
        color: "bg-orange-500",
      },
      {
        label: "Medium",
        value: calculate(
          "Medium"
        ),
        color: "bg-amber-400",
      },
      {
        label: "Low",
        value: calculate("Low"),
        color: "bg-emerald-500",
      },
    ];
  }, [allocations]);

  const max = Math.max(
    ...items.map(
      (item) => item.value
    ),
    1
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Priority Allocation
          </h3>

          <p className="mt-1 text-[10px] text-slate-500">
            Resources by response priority
          </p>
        </div>

        <Activity
          size={17}
          className="text-blue-500"
        />
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3"
          >
            <span className="w-12 text-[10px] font-semibold text-slate-500">
              {item.label}
            </span>

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{
                  width:
                    item.value > 0
                      ? `${Math.max(
                          (item.value /
                            max) *
                            100,
                          7
                        )}%`
                      : "0%",
                }}
              />
            </div>

            <span className="w-7 text-right text-[10px] font-bold text-slate-700">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   FILTER
========================================================= */

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-9 min-w-[125px] appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-[10px] font-semibold text-slate-600 outline-none focus:border-blue-400"
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>

      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function ResourceFilters({
  filters,
  setFilters,
  priorities,
  resourceTypes,
  locations,
}: {
  filters: Filters;
  setFilters: (
    value: Filters
  ) => void;
  priorities: string[];
  resourceTypes: string[];
  locations: string[];
}) {
  return (
    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
      <div className="relative flex-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={
            filters.search
          }
          onChange={(event) =>
            setFilters({
              ...filters,
              search:
                event.target.value,
            })
          }
          placeholder="Search resources..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-[10px] outline-none focus:border-blue-400 focus:bg-white"
        />
      </div>

      <FilterSelect
        value={
          filters.resourceType ===
          "All"
            ? "All Types"
            : filters.resourceType
        }
        options={[
          "All Types",
          ...resourceTypes,
        ]}
        onChange={(value) =>
          setFilters({
            ...filters,
            resourceType:
              value ===
              "All Types"
                ? "All"
                : value,
          })
        }
      />

      <FilterSelect
        value={
          filters.priority ===
          "All"
            ? "All Priority"
            : filters.priority
        }
        options={[
          "All Priority",
          ...priorities,
        ]}
        onChange={(value) =>
          setFilters({
            ...filters,
            priority:
              value ===
              "All Priority"
                ? "All"
                : value,
          })
        }
      />

      <FilterSelect
        value={
          filters.location ===
          "All"
            ? "All Locations"
            : filters.location
        }
        options={[
          "All Locations",
          ...locations,
        ]}
        onChange={(value) =>
          setFilters({
            ...filters,
            location:
              value ===
              "All Locations"
                ? "All"
                : value,
          })
        }
      />

      <button
        type="button"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600"
      >
        <CalendarDays size={13} />
        From  To
      </button>
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

function AllocationTable({
  allocations,
  selectedAllocation,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onCreate,
  onExport,
}: {
  allocations: ResourceAllocation[];
  selectedAllocation:
    | ResourceAllocation
    | null;
  onSelect: (
    allocation: ResourceAllocation
  ) => void;
  onView: (allocation: ResourceAllocation) => void;
  onEdit: (allocation: ResourceAllocation) => void;
  onDelete: (allocation: ResourceAllocation) => void;
  onCreate: () => void;
  onExport: () => void;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Resource Allocations
          </h3>

          <p className="text-[10px] text-slate-400">
            AI-generated resource recommendations
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={13} />
            Add Allocation
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {[
                "ID",
                "Resource",
                "Type",
                "Quantity",
                "Location",
                "Priority",
                "Status",
                "Allocated At",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {allocations.map(
              (allocation) => {
                const selected =
                  selectedAllocation?.id ===
                  allocation.id;

                return (
                  <tr
                    key={allocation.id}
                    onClick={() => {
                      onSelect(allocation);
                      onView(allocation);
                    }}
                    className={`cursor-pointer ${
                      selected
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                      RA-
                      {allocation.id
                        .slice(
                          0,
                          6
                        )
                        .toUpperCase()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ResourceImage name={allocation.resourceName} type={allocation.resourceType} className="h-8 w-8" />

                        <span className="max-w-[150px] truncate text-[10px] font-bold text-slate-800">
                          {
                            allocation.resourceName
                          }
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-[10px] text-slate-500">
                      {
                        allocation.resourceType
                      }
                    </td>

                    <td className="px-4 py-3 text-[10px] font-bold text-slate-800">
                      {
                        allocation.recommendedQuantity
                      }{" "}
                      units
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[10px] text-slate-600">
                        <MapPin
                          size={12}
                          className="text-slate-400"
                        />

                        {
                          allocation.location
                        }
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-bold ${getPriorityBadge(
                          allocation.priority
                        )}`}
                      >
                        {
                          allocation.priority
                        }
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        Allocated
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[10px] text-slate-500">
                      {formatDate(
                        allocation.createdAt
                      )}
                    </td>

                    <td
                      className="px-4 py-3"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="View allocation"
                          onClick={() => onView(allocation)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          type="button"
                          title="Edit allocation"
                          onClick={() => onEdit(allocation)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          title="Delete allocation"
                          onClick={() => onDelete(allocation)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}

            {allocations.length ===
              0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-14 text-center"
                >
                  <Boxes
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-xs font-bold text-slate-700">
                    No allocations found
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Run Agent 03 to generate resource allocations.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <span className="text-[9px] text-slate-400">
          Showing 1 to{" "}
          {allocations.length}{" "}
          allocations
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded border border-slate-200 p-1 text-slate-400"
          >
            <ChevronLeft
              size={13}
            />
          </button>

          <button
            type="button"
            className="h-6 min-w-6 rounded bg-blue-600 px-2 text-[9px] font-bold text-white"
          >
            1
          </button>

          <button
            type="button"
            className="h-6 min-w-6 rounded px-2 text-[9px] text-slate-500"
          >
            2
          </button>

          <button
            type="button"
            className="h-6 min-w-6 rounded px-2 text-[9px] text-slate-500"
          >
            3
          </button>

          <button
            type="button"
            className="rounded border border-slate-200 p-1 text-slate-400"
          >
            <ChevronRight
              size={13}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAILS
========================================================= */

function AllocationDetails({
  allocation,
}: {
  allocation:
    | ResourceAllocation
    | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Selected Allocation
          </p>

          <h3 className="mt-1 text-sm font-bold text-slate-900">
            {allocation
              ? allocation.resourceName
              : "No allocation selected"}
          </h3>
        </div>

        {allocation && (
          <span
            className={`rounded-full border px-2 py-1 text-[9px] font-bold ${getPriorityBadge(
              allocation.priority
            )}`}
          >
            {allocation.priority}
          </span>
        )}
      </div>

      {!allocation ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <PackageCheck
            size={32}
            className="text-slate-300"
          />

          <p className="mt-3 text-xs font-bold text-slate-600">
            Allocation Details
          </p>

          <p className="mt-1 max-w-[220px] text-[10px] leading-5 text-slate-400">
            Select an allocation from the table to view its details.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Package
                  size={18}
                />
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-800">
                  {
                    allocation.resourceType
                  }
                </p>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  Resource ID{" "}
                  {allocation.resourceId.slice(
                    0,
                    8
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <DetailRow
              label="Quantity"
              value={`${allocation.recommendedQuantity} units`}
            />

            <DetailRow
              label="Location"
              value={
                allocation.location
              }
            />

            <DetailRow
              label="Priority"
              value={
                allocation.priority
              }
            />

            <DetailRow
              label="Status"
              value="Allocated"
            />

            <DetailRow
              label="Created"
              value={formatDate(
                allocation.createdAt
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ContextValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-[11px] font-black text-slate-700">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
      <span className="text-[10px] text-slate-400">
        {label}
      </span>

      <span className="max-w-[180px] truncate text-right text-[10px] font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}


/* =========================================================
   AGENT 03 DEMAND / RESOURCE PLANNING CALCULATION

   Transparent planning model used by the dashboard preview.
   The backend Agent 03 should remain the authoritative allocator.
========================================================= */
const RESOURCE_RATE_PER_100: Record<string, number> = {
  water: 40,
  food: 30,
  medical: 5,
  shelter: 10,
  hygiene: 8,
  blanket: 20,
  clothing: 8,
  transport: 4,
};

const getResourceRate = (resourceType: string, resourceName = "") => {
  const key = `${resourceType} ${resourceName}`.toLowerCase();
  const match = Object.keys(RESOURCE_RATE_PER_100).find((item) => key.includes(item));
  return match ? RESOURCE_RATE_PER_100[match] : 5;
};

const getSeverityScore = (assessment: VulnerabilityAssessmentSummary | null) => {
  if (!assessment) return 0;
  const risk = Math.max(0, Math.min(100, Number(assessment.riskScore) || 0));
  const vulnerability = Math.max(0, Math.min(100, Number(assessment.vulnerabilityScore) || 0));
  const impact = Math.max(0, Math.min(100, Number(assessment.impactScore) || 0));
  return Math.round((risk * 0.4 + vulnerability * 0.3 + impact * 0.3) * 10) / 10;
};

const getPlanningPriority = (severity: number) => {
  if (severity >= 75) return "Critical";
  if (severity >= 55) return "High";
  if (severity >= 30) return "Medium";
  return "Low";
};

/**
 * Agent 03 is intentionally restricted to Agent 01 High/Critical risk
 * assessments. Risk level from Agent 01 is preferred; the numeric risk
 * score is used as a safe fallback when the level is missing.
 */
const getAgent03Priority = (assessment: VulnerabilityAssessmentSummary | null | undefined) => {
  if (!assessment) return null;

  const explicit = String(assessment.riskLevel || "").trim().toLowerCase();
  if (explicit === "critical") return "Critical";
  if (explicit === "high") return "High";

  const riskScore = Number(assessment.riskScore);
  if (Number.isFinite(riskScore)) {
    if (riskScore >= 75) return "Critical";
    if (riskScore >= 55) return "High";
  }

  return null;
};

const isAgent03Eligible = (assessment: VulnerabilityAssessmentSummary | null | undefined) =>
  Boolean(getAgent03Priority(assessment));

const getPriorityMultiplier = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "critical": return 1.35;
    case "high": return 1.20;
    case "medium": return 1.05;
    default: return 0.90;
  }
};

const getSeverityMultiplier = (severity: number) =>
  Math.round((0.75 + (Math.max(0, Math.min(100, severity)) / 100) * 0.75) * 100) / 100;

const getPriorityAffectedPopulation = (affectedPopulation: number, severity: number) => {
  const share = Math.min(0.35, Math.max(0.10, 0.10 + severity * 0.002));
  return Math.ceil(Math.max(0, affectedPopulation) * share);
};

const calculateResourceDemand = (
  assessment: VulnerabilityAssessmentSummary | null,
  resourceType: string,
  resourceName = "",
) => {
  const affected = Math.max(0, Number(assessment?.affectedPopulation) || 0);
  const severity = getSeverityScore(assessment);
  const priority = getPlanningPriority(severity);
  const populationBlocks = Math.max(1, Math.ceil(affected / 100));
  const rate = getResourceRate(resourceType, resourceName);
  return Math.max(
    1,
    Math.ceil(
      populationBlocks *
        rate *
        getSeverityMultiplier(severity) *
        getPriorityMultiplier(priority),
    ),
  );
};

const selectBestAssessment = (items: VulnerabilityAssessmentSummary[]) => {
  return items
    .filter((item) => item.id)
    .slice()
    .sort((a, b) => {
      const aValid = Number(a.affectedPopulation || 0) > 0 &&
        (Number(a.riskScore || 0) > 0 || Number(a.vulnerabilityScore || 0) > 0 || Number(a.impactScore || 0) > 0);
      const bValid = Number(b.affectedPopulation || 0) > 0 &&
        (Number(b.riskScore || 0) > 0 || Number(b.vulnerabilityScore || 0) > 0 || Number(b.impactScore || 0) > 0);
      if (aValid !== bValid) return Number(bValid) - Number(aValid);
      return getSeverityScore(b) - getSeverityScore(a);
    })[0] ?? null;
};

/* =========================================================
   MAIN PAGE
========================================================= */

void ResourceFilters;
void AllocationTable;
void getPriorityAffectedPopulation;
void calculateResourceDemand;
void EmptyTab;

export default function ResourceOptimizationPage() {
  const [
    assessmentId,
    setAssessmentId,
  ] = useState("");

  const [
    currentAssessment,
    setCurrentAssessment,
  ] = useState<VulnerabilityAssessmentSummary | null>(null);

  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [assessmentError, setAssessmentError] = useState("");
  const [inventory, setInventory] = useState<ReliefResourceInventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const loading = assessmentLoading || inventoryLoading;
  const [inventoryError, setInventoryError] = useState("");
  const [inventoryModal, setInventoryModal] = useState<"create" | "edit" | null>(null);
  const [inventoryDelete, setInventoryDelete] = useState<ReliefResourceInventory | null>(null);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    id: "",
    resourceType: "",
    resourceName: "",
    availableQuantity: 0,
    location: "",
  });
  const [dashboardAllocations, setDashboardAllocations] = useState<ResourceAllocation[]>([]);
  const [dashboardAllocationError, setDashboardAllocationError] = useState("");
  const [allAssessments, setAllAssessments] = useState<VulnerabilityAssessmentSummary[]>([]);
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState("All");
  const [assessmentActionStatus, setAssessmentActionStatus] = useState<{
    type: "idle" | "running" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [assessmentActionModal, setAssessmentActionModal] = useState<VulnerabilityAssessmentSummary | null>(null);
  const [assessmentWorkflowStep, setAssessmentWorkflowStep] = useState<AssessmentWorkflowStep>(1);
  const [demandReport, setDemandReport] = useState<ResourceDemandAssessment | null>(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [showRecentAssessmentDetails, setShowRecentAssessmentDetails] = useState(false);

  const [allocationModal, setAllocationModal] = useState<"create" | "edit" | null>(null);
  const [viewAllocation, setViewAllocation] = useState<ResourceAllocation | null>(null);
  const [deleteAllocation, setDeleteAllocation] = useState<ResourceAllocation | null>(null);
  const [crudSaving, setCrudSaving] = useState(false);
  const [crudError, setCrudError] = useState("");

  const [resourceRun, setResourceRun] = useState<{
    allocation: ResourceAllocation;
    running: boolean;
    completed: boolean;
    error?: string;
    resultAllocation?: ResourceAllocation | null;
    resourceAfter?: ReliefResourceInventory | null;
  } | null>(null);

  const [allocationForm, setAllocationForm] = useState({
    id: "",
    vulnerabilityAssessmentId: "",
    resourceId: "",
    resourceType: "",
    resourceName: "",
    recommendedQuantity: 1,
    priority: "Medium",
    location: "",
  });

  const [
    activeTab,
    setActiveTab,
  ] = useState<TabType>(
    "inventory"
  );

  const [
    filters,
    setFilters,
  ] = useState<Filters>({
    priority: "All",
    resourceType: "All",
    location: "All",
    search: "",
  });

  const {
    optimizing,
    error,
    selectedAllocation,
    loadAllocations,
    selectAllocation,
  } =
    useResourceOptimization();

  const [riskPredictions, setRiskPredictions] = useState<RiskPredictionSummary[]>([]);
  const riskPrediction = useMemo<RiskPredictionSummary | null>(() => {
    if (!currentAssessment) return null;

    // Prefer the exact Agent 01 prediction linked by Agent 02.
    if (currentAssessment.riskPredictionId) {
      const linked = riskPredictions.find(
        (item) => item.id === currentAssessment.riskPredictionId
      );
      if (linked) return linked;
    }

    // Fallback for older assessments where the foreign-key field is missing
    // from the API response: match the same location + disaster type.
    const location = (currentAssessment.location || '').trim().toLowerCase();
    const disasterType = (currentAssessment.disasterType || '').trim().toLowerCase();

    const matches = riskPredictions
      .filter((item) => {
        const sameLocation =
          !location ||
          (item.location || '').trim().toLowerCase() === location;
        const sameType =
          !disasterType ||
          (item.disasterType || '').trim().toLowerCase() === disasterType;
        return sameLocation && sameType;
      })
      .slice()
      .sort((a, b) =>
        String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
      );

    return matches[0] || null;
  }, [currentAssessment, riskPredictions]);

  const riskPredictionLoading =
    Boolean(currentAssessment) &&
    riskPredictions.length === 0;
  const inventorySummary = useMemo(() => {
    const total = inventory.reduce(
      (sum, item) => sum + Math.max(Number(item.availableQuantity) || 0, 0),
      0
    );
    const allocated = inventory.reduce(
      (sum, item) => sum + Math.max(Number(item.allocatedQuantity) || 0, 0),
      0
    );
    const available = inventory.reduce(
      (sum, item) => sum + Math.max(
        (Number(item.availableQuantity) || 0) -
          (Number(item.allocatedQuantity) || 0),
        0
      ),
      0
    );
    return {
      total,
      allocated,
      available,
      utilization: total > 0 ? Math.round((allocated / total) * 100) : 0,
    };
  }, [inventory]);

  const summary = useMemo(
    () =>
      calculateResourceSummary(
        dashboardAllocations
      ),
    [dashboardAllocations]
  );

  const assessmentMapPoints = useMemo<MapPoint[]>(() => {
    const riskById = new Map<string, RiskPredictionSummary>(
      riskPredictions
        .filter((item) => item.id)
        .map((item) => [item.id!, item])
    );

    return allAssessments
      .filter((assessment) => assessment.location)
      .map((assessment) => {
        const risk = assessment.riskPredictionId
          ? riskById.get(assessment.riskPredictionId)
          : undefined;

        const coordinates =
          risk?.latitude != null && risk?.longitude != null
            ? {
                lat: Number(risk.latitude),
                lng: Number(risk.longitude),
              }
            : getCoordinates(assessment.location || "");

        const riskLevel =
          assessment.riskLevel ||
          risk?.riskLevel ||
          "Medium";

        const allocationForAssessment = dashboardAllocations.filter(
          (allocation) =>
            allocation.vulnerabilityAssessmentId === assessment.id
        );

        const normalizedRisk = String(riskLevel).toLowerCase();

        return {
          lat: coordinates.lat,
          lng: coordinates.lng,
          location: assessment.location || "Unknown",
          count: allocationForAssessment.length,
          assessmentCount: 1,
          priority:
            allocationForAssessment[0]?.priority ||
            (normalizedRisk === "critical"
              ? "Critical"
              : normalizedRisk === "high"
                ? "High"
                : normalizedRisk === "low"
                  ? "Low"
                  : "Medium"),
          riskLevel,
          disasterType: assessment.disasterType || risk?.disasterType || "Other",
        };
      });
  }, [allAssessments, riskPredictions, dashboardAllocations]);

  const filteredAllocations =
    useMemo(
      () =>
        filterResourceAllocations(
          dashboardAllocations,
          filters
        ),
      [dashboardAllocations, filters]
    );

  const priorities = useMemo(
    () =>
      Array.from(
        new Set(
          dashboardAllocations
            .map(
              (item) =>
                item.priority
            )
            .filter(Boolean)
        )
      ),
    [dashboardAllocations]
  );

  const resourceTypes =
    useMemo(
      () =>
        Array.from(
          new Set(
            dashboardAllocations
              .map(
                (item) =>
                  item.resourceType
              )
              .filter(Boolean)
          )
        ),
      [dashboardAllocations]
    );

  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          dashboardAllocations
            .map(
              (item) =>
                item.location
            )
            .filter(Boolean)
        )
      ),
    [dashboardAllocations]
  );

  const requestRows = useMemo(
    () =>
      dashboardAllocations
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [dashboardAllocations]
  );

  // Keep recent Agent 02 data in its own dashboard panel.
  // This is derived only from the live API response; no mock or seed data is used.
  const recentAssessments = useMemo(() => {
    return allAssessments
      .filter((item) => item?.id)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 6);
  }, [allAssessments]);

  // All Agent 03 allocations linked to the currently selected recent Agent 02 assessment.
  // These are read directly from the live ResourceAllocations API response.
  const selectedRecentAllocations = useMemo(() => {
    if (!currentAssessment?.id) return [];

    return dashboardAllocations
      .filter((item) => item.vulnerabilityAssessmentId === currentAssessment.id)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [currentAssessment, dashboardAllocations]);

  const historyRows = useMemo(() => {
    const grouped = new Map<string, {
      assessmentId: string;
      location: string;
      disasterType: string;
      allocations: number;
      quantity: number;
      latestRun?: string;
    }>();

    dashboardAllocations.forEach((item) => {
      const assessmentId = item.vulnerabilityAssessmentId || "unlinked";
      const current = grouped.get(assessmentId) || {
        assessmentId,
        location: item.location || "",
        disasterType: "Agent 03",
        allocations: 0,
        quantity: 0,
        latestRun: item.createdAt,
      };
      current.allocations += 1;
      current.quantity += Number(item.recommendedQuantity || 0);
      if (!current.latestRun || new Date(item.createdAt || 0).getTime() > new Date(current.latestRun).getTime()) current.latestRun = item.createdAt;
      grouped.set(assessmentId, current);
    });

    return Array.from(grouped.values()).sort((a, b) => new Date(b.latestRun || 0).getTime() - new Date(a.latestRun || 0).getTime());
  }, [dashboardAllocations]);

  const workflowPlan = useMemo(() => {
    if (!demandReport) return [];
    return demandReport.resources
      .map((resource) => {
        const required = Math.max(Number(resource.requiredQuantity) || 0, 0);
        const available = Math.max(Number(resource.availableQuantity) || 0, 0);
        const allocatable = Math.max(Number(resource.allocatableQuantity) || 0, 0);
        const recommended = Math.min(required, allocatable);
        return {
          ...resource,
          required,
          available,
          allocatable,
          recommended,
          gap: Math.max(required - recommended, 0),
        };
      })
      .filter((resource) => resource.required > 0);
  }, [demandReport]);

  const resourceIntelligence = useMemo(() => {
    const required = workflowPlan.reduce(
      (sum, item) => sum + Math.max(Number(item.required) || 0, 0),
      0
    );
    const available = workflowPlan.reduce(
      (sum, item) => sum + Math.max(Number(item.available) || 0, 0),
      0
    );
    const recommended = workflowPlan.reduce(
      (sum, item) => sum + Math.max(Number(item.recommended) || 0, 0),
      0
    );
    const gap = workflowPlan.reduce(
      (sum, item) => sum + Math.max(Number(item.gap) || 0, 0),
      0
    );
    const allocated = selectedRecentAllocations.reduce(
      (sum, item) =>
        sum + Math.max(Number(item.recommendedQuantity) || 0, 0),
      0
    );

    const coverage =
      required > 0 ? Math.min(100, (recommended / required) * 100) : 0;

    const shortageItems = workflowPlan
      .filter((item) => Number(item.gap) > 0)
      .sort((a, b) => Number(b.gap) - Number(a.gap));

    const recommendations: string[] = [];

    if (shortageItems.length > 0) {
      recommendations.push(
        `${shortageItems.length} resource type(s) have a calculated shortage. Prioritize additional supply before full response coverage.`
      );
    }

    if (available < required && required > 0) {
      recommendations.push(
        `Live available inventory (${available.toLocaleString()}) is below calculated demand (${required.toLocaleString()}).`
      );
    }

    if (allocated > 0) {
      recommendations.push(
        `${allocated.toLocaleString()} units are already linked to this Agent 02 assessment in the live allocation records.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Current calculated demand is covered by the available resource plan."
      );
    }

    return {
      required,
      available,
      recommended,
      allocated,
      gap,
      coverage,
      shortageItems,
      recommendations,
      priority: getAgent03Priority(currentAssessment) || "High",
    };
  }, [workflowPlan, selectedRecentAllocations, currentAssessment]);

  const workflowTotals = useMemo(
    () => ({
      resources: workflowPlan.length,
      required: workflowPlan.reduce((sum, item) => sum + item.required, 0),
      available: workflowPlan.reduce((sum, item) => sum + item.available, 0),
      allocate: workflowPlan.reduce((sum, item) => sum + item.recommended, 0),
      gap: workflowPlan.reduce((sum, item) => sum + item.gap, 0),
    }),
    [workflowPlan]
  );

  // After confirmation, read the actual allocation rows refreshed from the DB.
  const completedAssessmentAllocations = useMemo(() => {
    if (!assessmentActionModal?.id) return [];
    return dashboardAllocations.filter(
      (allocation) =>
        allocation.vulnerabilityAssessmentId === assessmentActionModal.id
    );
  }, [dashboardAllocations, assessmentActionModal?.id]);

  const completedAllocationTotals = useMemo(() => {
    const allocated = completedAssessmentAllocations.reduce(
      (sum, allocation) =>
        sum + Math.max(Number(allocation.recommendedQuantity) || 0, 0),
      0
    );

    const required = workflowTotals.required;
    const gap = Math.max(required - allocated, 0);
    const coverage =
      required > 0
        ? Math.min(100, (allocated / required) * 100)
        : 0;

    return {
      allocated,
      required,
      gap,
      coverage,
    };
  }, [completedAssessmentAllocations, workflowTotals.required]);

  const loadAssessmentContext = async () => {
    let loadedAssessments: VulnerabilityAssessmentSummary[] = [];
    let loadedRiskPredictions: RiskPredictionSummary[] = [];

    // Agent 02 assessments must load independently.
    // A failure in risk-predictions must not hide valid Agent 02 assessments.
    try {
      const response = await api.get("/vulnerability-impact");
      loadedAssessments = toArray<VulnerabilityAssessmentSummary>(
        unwrapApiData(response)
      );
    } catch (err) {
      console.error("Failed to load Agent 02 assessments:", err);
    }

    try {
      const response = await api.get("/risk-predictions");
      loadedRiskPredictions = toArray<RiskPredictionSummary>(
        unwrapApiData(response)
      );
    } catch (err) {
      console.error("Failed to load risk predictions:", err);
    }

    // Keep the currently active Agent 02 assessment visible even if
    // the list request temporarily fails or returns a different wrapper.
    if (
      currentAssessment?.id &&
      !loadedAssessments.some(
        (item) => item.id === currentAssessment.id
      )
    ) {
      loadedAssessments = [
        currentAssessment,
        ...loadedAssessments,
      ];
    }

    setAllAssessments(loadedAssessments);
    setRiskPredictions(loadedRiskPredictions);
  };

  const loadAllDashboardAllocations = async () => {
    setDashboardAllocationError("");
    try {
      const response = await api.get("/resource-optimization/allocations");
      setDashboardAllocations(
        toArray<ResourceAllocation>(unwrapApiData(response))
      );
    } catch (err: any) {
      setDashboardAllocations([]);
      setDashboardAllocationError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Unable to load resource allocations."
      );
    }
  };

  const loadInventory = async () => {
    setInventoryLoading(true);
    setInventoryError("");
    try {
      const response = await api.get("/resource-optimization/resources");
      setInventory(
        toArray<ReliefResourceInventory>(unwrapApiData(response))
      );
    } catch (err: any) {
      setInventory([]);
      setInventoryError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load resource inventory from the database."
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadLatestAssessment = async () => {
      setAssessmentLoading(true);
      setAssessmentError("");

      try {
        const response = await api.get("/vulnerability-impact");
        const data = toArray<VulnerabilityAssessmentSummary>(
          unwrapApiData(response)
        );

        const latest = [...data]
          .filter((item) => item?.id)
          .sort((a, b) => {
            const aTime = a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0;
            const bTime = b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0;
            return bTime - aTime;
          })[0] ?? null;

        if (cancelled) return;

        const preferred = selectBestAssessment(data) || latest;
        setCurrentAssessment(preferred);
        setAssessmentId(preferred?.id ?? "");

        if (preferred?.id) {
          // Load assessment details once on initial page load.
          // Action buttons below do not use the hook's global loading state.
          await loadAllocations(preferred.id);
          await loadDemandReport(preferred.id);
        }
      } catch (err: any) {
        if (cancelled) return;

        setCurrentAssessment(null);
        setAssessmentId("");
        setAssessmentError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load the latest Vulnerability Assessment."
        );
      } finally {
        if (!cancelled) setAssessmentLoading(false);
      }
    };

    void loadLatestAssessment();
    void loadInventory();
    void loadAllDashboardAllocations();
    void loadAssessmentContext();

    return () => {
      cancelled = true;
    };
  }, [loadAllocations]);

  const loadDemandReport = async (id: string) => {
    if (!id) {
      setDemandReport(null);
      return null;
    }

    setDemandLoading(true);
    try {
      const response = await api.get(`/resource-optimization/${id}/demand`);
      const report = unwrapApiData<ResourceDemandAssessment | null>(response);
      setDemandReport(report);
      return report;
    } catch (err) {
      console.error("Failed to load Agent 03 demand report:", err);
      setDemandReport(null);
      return null;
    } finally {
      setDemandLoading(false);
    }
  };

  const resetInventoryForm = () => {
    setInventoryForm({
      id: "",
      resourceType: "",
      resourceName: "",
      availableQuantity: 0,
      location: "",
    });
  };

  const openCreateInventory = () => {
    setCrudError("");
    resetInventoryForm();
    setInventoryModal("create");
  };

  const openEditInventory = (resource: ReliefResourceInventory) => {
    setCrudError("");
    setInventoryForm({
      id: resource.id,
      resourceType: resource.resourceType || "",
      resourceName: resource.resourceName || "",
      availableQuantity: Math.max(Number(resource.availableQuantity) || 0, 0),
      location: resource.location || "",
    });
    setInventoryModal("edit");
  };

  const handleSaveInventory = async () => {
    const resourceType = inventoryForm.resourceType.trim();
    const resourceName = inventoryForm.resourceName.trim();
    const location = inventoryForm.location.trim();
    const quantity = Math.floor(Number(inventoryForm.availableQuantity));

    if (!resourceType || !resourceName || !location) {
      setCrudError("Resource type, resource name and location are required.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      setCrudError("Quantity must be a valid number greater than or equal to zero.");
      return;
    }

    setInventorySaving(true);
    setCrudError("");

    try {
      const payload = {
        resourceType,
        resourceName,
        availableQuantity: quantity,
        location,
      };

      if (inventoryModal === "edit" && inventoryForm.id) {
        await api.put(`/resource-optimization/resources/${inventoryForm.id}`, payload);
      } else {
        await api.post("/resource-optimization/resources", payload);
      }

      setInventoryModal(null);
      resetInventoryForm();
      await handleRefresh();
    } catch (err: any) {
      setCrudError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          (typeof err?.response?.data === "string" ? err.response.data : "") ||
          (err?.response?.status === 404
            ? "Inventory API endpoint was not found. Expected: /resource-optimization/resources."
            : "") ||
          err?.message ||
          "Unable to save the inventory record."
      );
    } finally {
      setInventorySaving(false);
    }
  };

  const handleDeleteInventory = async () => {
    if (!inventoryDelete?.id) return;

    setInventorySaving(true);
    setCrudError("");

    try {
      await api.delete(`/resource-optimization/resources/${inventoryDelete.id}`);
      setInventoryDelete(null);
      await handleRefresh();
    } catch (err: any) {
      setCrudError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          (typeof err?.response?.data === "string" ? err.response.data : "") ||
          (err?.response?.status === 404
            ? "Inventory API endpoint was not found. Expected: /resource-optimization/resources."
            : "") ||
          err?.message ||
          "Unable to delete the inventory record."
      );
    } finally {
      setInventorySaving(false);
    }
  };

  const handleOptimize = async () => {
    if (!currentAssessment?.id) {
      setAssessmentActionStatus({
        type: "error",
        message: "Select an Agent 02 assessment before running Agent 03.",
      });
      return;
    }

    // Open the four-step workflow. No database mutation happens here.
    openAssessmentActionModal(currentAssessment);
  };

  const handleRefresh =
    async () => {
      await Promise.all([
        loadInventory(),
        loadAllDashboardAllocations(),
        loadAssessmentContext(),
        assessmentId.trim() ? loadDemandReport(assessmentId.trim()) : Promise.resolve(),
      ]);
    };

  const openCreateAllocation = () => {
    setCrudError("");
    const firstResource = inventory[0];

    setAllocationForm({
      id: "",
      vulnerabilityAssessmentId: assessmentId,
      resourceId: firstResource?.id || "",
      resourceType: firstResource?.resourceType || "",
      resourceName: firstResource?.resourceName || "",
      recommendedQuantity: 1,
      priority: "Medium",
      location: firstResource?.location || currentAssessment?.location || "",
    });
    setAllocationModal("create");
  };

  const openEditAllocation = (allocation: ResourceAllocation) => {
    setCrudError("");
    setAllocationForm({
      id: allocation.id,
      vulnerabilityAssessmentId: allocation.vulnerabilityAssessmentId,
      resourceId: allocation.resourceId,
      resourceType: allocation.resourceType,
      resourceName: allocation.resourceName,
      recommendedQuantity: Number(allocation.recommendedQuantity) || 1,
      priority: allocation.priority || "Medium",
      location: allocation.location || "",
    });
    setAllocationModal("edit");
  };

  const handleResourceFormChange = (resourceId: string) => {
    const resource = inventory.find((item) => item.id === resourceId);
    setAllocationForm((current) => ({
      ...current,
      resourceId,
      resourceType: resource?.resourceType || current.resourceType,
      resourceName: resource?.resourceName || current.resourceName,
      location: resource?.location || current.location,
    }));
  };

  const handleSaveAllocation = async () => {
    if (!allocationForm.vulnerabilityAssessmentId) {
      setCrudError("Select an Agent 02 assessment before creating an allocation.");
      return;
    }

    if (!allocationForm.resourceId) {
      setCrudError("Select a resource from the live inventory.");
      return;
    }

    if (Number(allocationForm.recommendedQuantity) <= 0) {
      setCrudError("Quantity must be greater than zero.");
      return;
    }

    setCrudSaving(true);
    setCrudError("");

    try {
      const payload = {
        vulnerabilityAssessmentId: allocationForm.vulnerabilityAssessmentId,
        resourceId: allocationForm.resourceId,
        resourceType: allocationForm.resourceType,
        resourceName: allocationForm.resourceName,
        recommendedQuantity: Number(allocationForm.recommendedQuantity),
        priority: allocationForm.priority,
        location: allocationForm.location,
      };

      if (allocationModal === "edit" && allocationForm.id) {
        await api.put(
          `/resource-optimization/allocations/${allocationForm.id}`,
          payload
        );
      } else {
        await api.post("/resource-optimization/allocations", payload);
      }

      setAllocationModal(null);
      await handleRefresh();
    } catch (err: any) {
      setCrudError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Unable to save the allocation."
      );
    } finally {
      setCrudSaving(false);
    }
  };

  const handleDeleteAllocation = async () => {
    if (!deleteAllocation?.id) return;

    setCrudSaving(true);
    setCrudError("");

    try {
      await api.delete(
        `/resource-optimization/allocations/${deleteAllocation.id}`
      );
      setDeleteAllocation(null);
      await handleRefresh();
    } catch (err: any) {
      setCrudError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Unable to delete the allocation."
      );
    } finally {
      setCrudSaving(false);
    }
  };

  const handleRunResourceAssessment = async (allocation: ResourceAllocation) => {
    if (!allocation.vulnerabilityAssessmentId) {
      setCrudError("This allocation has no linked assessment ID.");
      return;
    }

    setViewAllocation(null);
    setResourceRun({
      allocation,
      running: true,
      completed: false,
      resultAllocation: null,
      resourceAfter: null,
    });

    try {
      // This is the real Agent 03 backend call. The UI does not fake
      // completion anymore; it waits for the API response.
      const response = await api.post(
        `/resource-optimization/${allocation.vulnerabilityAssessmentId}/optimize`
      );

      const returnedAllocations = toArray<ResourceAllocation>(unwrapApiData(response));
      const returned =
        returnedAllocations.find((item) => item.id === allocation.id) ||
        returnedAllocations.find(
          (item) => item.resourceId === allocation.resourceId
        ) ||
        returnedAllocations[0] ||
        allocation;

      // Refresh the real database state after Agent 03 completes.
      await Promise.all([
        loadInventory(),
        loadAllDashboardAllocations(),
        loadAssessmentContext(),
      ]);

      // Find the resource after the backend updated its allocated quantity.
      const freshInventory = await api.get("/resource-optimization/resources");
      const inventoryRows = toArray<ReliefResourceInventory>(unwrapApiData(freshInventory));
      const resourceAfter = inventoryRows.find(
        (item) => item.id === returned.resourceId
      ) || null;

      setResourceRun((current) =>
        current
          ? {
              ...current,
              running: false,
              completed: true,
              resultAllocation: returned,
              resourceAfter,
            }
          : current
      );
    } catch (err: any) {
      setResourceRun((current) =>
        current
          ? {
              ...current,
              running: false,
              completed: true,
              error:
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Agent 03 resource optimization failed.",
            }
          : current
      );
    }
  };

  const handleRunAssessmentFromExplorer = async (
    assessment: VulnerabilityAssessmentSummary
  ): Promise<boolean> => {
    const agent03Priority = getAgent03Priority(assessment);

    if (!agent03Priority) {
      setAssessmentActionStatus({
        type: "error",
        message: "Agent 03 can run only for High or Critical Agent 01 risk assessments.",
      });
      return false;
    }

    if (!assessment.id) {
      setAssessmentActionStatus({
        type: "error",
        message: "This Agent 02 assessment has no valid ID.",
      });
      return false;
    }

    setAssessmentId(assessment.id);
    setCurrentAssessment(assessment);
    setAssessmentActionModal(assessment);
    setCrudError("");
    setAssessmentActionStatus({
      type: "running",
      message: `Loading Agent 01 prediction and running Agent 03 for ${assessment.location || "selected assessment"}...`,
    });

    try {
      // Always refresh the real Agent 01 prediction context first so the
      // prediction result is visible together with Agent 02/03 results.
      try {
        const predictionResponse = await api.get("/risk-predictions");
        const latestPredictions = toArray<RiskPredictionSummary>(
          unwrapApiData(predictionResponse)
        );
        setRiskPredictions(latestPredictions);
      } catch (predictionError) {
        console.warn("Agent 01 prediction refresh failed:", predictionError);
      }

      // Run Agent 03 using the exact Agent 02 assessment ID.
      const response = await api.post(
        `/resource-optimization/${assessment.id}/optimize`
      );

      const result = toArray<ResourceAllocation>(unwrapApiData(response));

      await Promise.all([
        loadDemandReport(assessment.id),
        loadInventory(),
        loadAllDashboardAllocations(),
        loadAssessmentContext(),
      ]);

      setAssessmentActionStatus({
        type: "success",
        message: `Agent 03 Optimization Completed. ${result.length} allocation${result.length === 1 ? "" : "s"} returned by the live database.`,
      });
      return true;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : "") ||
        err?.message ||
        "Agent 03 optimization failed.";

      setAssessmentActionStatus({
        type: "error",
        message,
      });
      setCrudError(message);
      return false;
    }
  };

  const openAssessmentActionModal = (assessment: VulnerabilityAssessmentSummary) => {
    const agent03Priority = getAgent03Priority(assessment);

    if (!agent03Priority) {
      setAssessmentActionStatus({
        type: "error",
        message: "Agent 03 is available only for High or Critical Agent 01 risk assessments.",
      });
      return;
    }

    setAssessmentId(assessment.id || "");
    setCurrentAssessment(assessment);
    setAssessmentActionModal(assessment);
    setAssessmentWorkflowStep(1);
    setCrudError("");
    setAssessmentActionStatus({ type: "idle", message: "" });

    // Load the linked Agent 01 prediction immediately when the workflow opens.
    // This keeps Step 1 complete: prediction + Agent 02 assessment are visible
    // before the user starts the Agent 03 analysis.
    void (async () => {
      try {
        const predictionResponse = await api.get("/risk-predictions");
        setRiskPredictions(
          toArray<RiskPredictionSummary>(unwrapApiData(predictionResponse))
        );
      } catch (predictionError) {
        console.warn("Unable to load Agent 01 prediction for Agent 03 workflow:", predictionError);
      }

      if (assessment.id) {
        await loadDemandReport(assessment.id);
      }
    })();
  };

  const handleWorkflowNext = async () => {
    if (!assessmentActionModal?.id) return;

    if (assessmentWorkflowStep === 1) {
      setAssessmentWorkflowStep(2);
      if (!demandReport) {
        await loadDemandReport(assessmentActionModal.id);
      }
      return;
    }

    if (assessmentWorkflowStep === 2) {
      setAssessmentWorkflowStep(3);
      return;
    }

    if (assessmentWorkflowStep === 3) {
      setAssessmentWorkflowStep(4);
    }
  };

  const handleWorkflowBack = () => {
    if (assessmentActionStatus.type === "running") return;
    if (assessmentWorkflowStep === 1) return;
    setAssessmentWorkflowStep((step) => (step - 1) as AssessmentWorkflowStep);
  };

  const handleWorkflowConfirm = async () => {
    const assessment = assessmentActionModal;

    if (!assessment?.id) {
      setAssessmentActionStatus({
        type: "error",
        message: "Unable to run Agent 03 because the selected Agent 02 assessment ID is missing.",
      });
      return;
    }

    if (assessmentActionStatus.type === "running") return;

    const priority = getAgent03Priority(assessment);
    if (!priority) {
      setAssessmentActionStatus({
        type: "error",
        message: "Agent 03 can run only for High or Critical Agent 01 risk assessments.",
      });
      return;
    }

    setAssessmentWorkflowStep(4);
    setCrudError("");
    setAssessmentActionStatus({
      type: "running",
      message: `Running Agent 03 for ${assessment.location || "selected assessment"}...`,
    });

    try {
      console.info("[Agent 03] Confirm clicked", {
        assessmentId: assessment.id,
        location: assessment.location,
        priority,
      });

      // This is the ONLY mutation in the four-step workflow.
      const response = await api.post(
        `/resource-optimization/${assessment.id}/optimize`
      );

      const result = toArray<ResourceAllocation>(unwrapApiData(response));

      // Refresh the UI from the real database after the POST succeeds.
      await Promise.all([
        loadDemandReport(assessment.id),
        loadInventory(),
        loadAllDashboardAllocations(),
        loadAssessmentContext(),
      ]);

      setAssessmentActionStatus({
        type: "success",
        message: result.length > 0
          ? `Agent 03 completed successfully. ${result.length} real allocation${result.length === 1 ? "" : "s"} created from database inventory.`
          : "Agent 03 completed. No new allocation was created because no relevant inventory was available or this assessment already has allocations.",
      });

      return;
    } catch (err: any) {
      console.error("[Agent 03] Confirmation failed:", err);

      const apiData = err?.response?.data;
      const message =
        apiData?.message ||
        apiData?.title ||
        (typeof apiData === "string" ? apiData : "") ||
        err?.message ||
        "Agent 03 optimization failed. Check the backend API response.";

      setAssessmentActionStatus({
        type: "error",
        message,
      });
      setCrudError(message);
    }
  };

  const closeAssessmentActionModal = () => {
    if (assessmentActionStatus.type === "running") return;
    setAssessmentActionModal(null);
    setAssessmentWorkflowStep(1);
  };

  const handleDeleteAssessmentAllocations = async (
    assessment: VulnerabilityAssessmentSummary
  ) => {
    if (!assessment.id) {
      setAssessmentActionStatus({
        type: "error",
        message: "This Agent 02 assessment has no valid ID.",
      });
      return;
    }

    setCrudSaving(true);
    setCrudError("");

    try {
      const response = await api.get(
        `/resource-optimization/${assessment.id}`
      );
      const linkedAllocations = toArray<ResourceAllocation>(
        unwrapApiData(response)
      );

      if (linkedAllocations.length === 0) {
        setAssessmentActionStatus({
          type: "error",
          message: "There are no Agent 03 allocations linked to this assessment.",
        });
        return;
      }

      const confirmed = window.confirm(
        `Delete ${linkedAllocations.length} linked allocation(s) for ${assessment.location || "this assessment"}? The Agent 02 assessment will remain in the database.`
      );

      if (!confirmed) return;

      await Promise.all(
        linkedAllocations.map((allocation) =>
          api.delete(`/resource-optimization/allocations/${allocation.id}`)
        )
      );

      await Promise.all([
        loadAllDashboardAllocations(),
        loadInventory(),
        loadAssessmentContext(),
      ]);

      setAssessmentActionStatus({
        type: "success",
        message: `Deleted ${linkedAllocations.length} linked allocation(s). The Agent 02 assessment was kept.`,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : "") ||
        err?.message ||
        "Unable to delete the linked allocations.";

      setAssessmentActionStatus({
        type: "error",
        message,
      });
      setCrudError(message);
    } finally {
      setCrudSaving(false);
    }
  };

  const handleExportAllocations = () => {
    const rows = filteredAllocations;
    const header = [
      "ID",
      "Resource",
      "Type",
      "Quantity",
      "Location",
      "Priority",
      "Assessment ID",
      "Created At",
    ];

    const csv = [
      header.join(","),
      ...rows.map((item) =>
        [
          item.id,
          item.resourceName,
          item.resourceType,
          item.recommendedQuantity,
          item.location,
          item.priority,
          item.vulnerabilityAssessmentId,
          item.createdAt,
        ]
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reliefnexus-resource-allocations-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  void dashboardAllocationError;
  void setFilters;
  void error;
  void selectAllocation;
  void riskPredictionLoading;
  void priorities;
  void resourceTypes;
  void locations;
  void openCreateAllocation;
  void handleRunAssessmentFromExplorer;
  void handleExportAllocations;

  return (
    <div className="min-h-full bg-[#f4f7fb]">
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6">

        {/* AGENT 03 HERO + DASHBOARD */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-950 shadow-[0_22px_60px_rgba(15,23,42,0.20)]">
          <img
            src={
              currentAssessment
                ? getDisasterPhotoUrl(currentAssessment.disasterType)
                : publicAsset("assets/disasters/flood.jpg")
            }
            alt={currentAssessment?.disasterType || "Disaster response"}
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={(event) => {
              const candidates = currentAssessment
                ? getDisasterImageCandidates(currentAssessment.disasterType)
                : publicAssetCandidates("assets/disasters/flood.jpg");
              advanceImageFallback(event, candidates);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/76 via-slate-950/42 to-slate-950/10" />
          <div className="relative flex min-h-[230px] flex-col justify-between gap-7 p-6 md:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[9px] font-semibold text-white/60">
                  <span>AI Agent Management</span>
                  <ChevronRight size={10} />
                  <span className="text-white">Resource Optimization</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-blue-500/20 text-blue-300 backdrop-blur">
                    <Boxes size={21} />
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Resource Optimization</h1>
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-black text-white">AGENT 03</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2.5 py-1 text-[9px] font-black text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Agent 03 Active
                  </span>
                </div>
                <p className="mt-3 text-sm text-white/85">AI-powered resource allocation and optimization for disaster response.</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {[
                    ["Resource Analysis", Package],
                    ["Allocation Planning", ShieldAlert],
                    ["Optimization Results", TrendingUp],
                  ].map(([label, Icon]) => (
                    <span key={String(label)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-bold text-white/90 backdrop-blur">
                      {(() => { const C = Icon as typeof Package; return <C size={11} />; })()}
                      {String(label)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur sm:block">
                  <p className="text-[7px] font-bold uppercase tracking-wider text-white/50">Last Run</p>
                  <p className="mt-0.5 text-[9px] font-bold text-white">
                    {dashboardAllocations[0]?.createdAt ? formatDate(dashboardAllocations[0].createdAt) : "Not run yet"}
                  </p>
                </div>
                <button type="button" onClick={handleRefresh} disabled={loading || optimizing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 text-xs font-bold text-white backdrop-blur hover:bg-white/15 disabled:opacity-50">
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
                <button type="button" onClick={handleOptimize} disabled={optimizing || !currentAssessment?.id || !isAgent03Eligible(currentAssessment)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                  <Sparkles size={13} /> {optimizing ? "Running..." : "Run Optimization"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {assessmentError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle size={18} className="text-red-600" />
            <p className="flex-1 text-xs font-semibold text-red-700">{assessmentError}</p>
          </div>
        )}

        {/* KPI ROW */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <KpiCard title="Affected People" value={Number(currentAssessment?.affectedPopulation || 0).toLocaleString()} subtitle="From selected locations" icon={<Package size={18} />} iconClass="bg-blue-50 text-blue-600" trend={currentAssessment ? "+12%" : undefined} />
          <KpiCard title="Risk Level" value={currentAssessment?.riskScore != null ? `${Number(currentAssessment.riskScore).toFixed(1)}/100` : ""} subtitle="Current disaster risk" icon={<AlertTriangle size={18} />} iconClass="bg-red-50 text-red-600" trend={currentAssessment?.riskLevel || undefined} negative={String(currentAssessment?.riskLevel || "").toLowerCase() === "critical"} />
          <KpiCard title="Vulnerability" value={currentAssessment?.vulnerabilityScore != null ? `${Number(currentAssessment.vulnerabilityScore).toFixed(1)}/100` : ""} subtitle="Exposure vulnerability" icon={<ShieldAlert size={18} />} iconClass="bg-amber-50 text-amber-600" trend={currentAssessment?.vulnerabilityLevel || undefined} />
          <KpiCard title="Impact" value={currentAssessment?.impactScore != null ? `${Number(currentAssessment.impactScore).toFixed(1)}/100` : ""} subtitle="Potential disaster impact" icon={<TrendingUp size={18} />} iconClass="bg-orange-50 text-orange-600" trend={currentAssessment?.impactLevel || undefined} />
          <KpiCard title="Total Resources" value={inventorySummary.total.toLocaleString()} subtitle="Available in database" icon={<Boxes size={18} />} iconClass="bg-cyan-50 text-cyan-600" />
          <KpiCard title="Allocated" value={inventorySummary.allocated.toLocaleString()} subtitle="Currently allocated" icon={<PackageCheck size={18} />} iconClass="bg-red-50 text-red-600" />
          <KpiCard title="Utilization Rate" value={`${inventorySummary.utilization}%`} subtitle="Current allocation rate" icon={<Activity size={18} />} iconClass="bg-emerald-50 text-emerald-600" />
        </div>

        {/* AGENT 03 RESOURCE INTELLIGENCE */}
        {currentAssessment && demandReport && (
          <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                      <Sparkles size={15} />
                    </span>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600">
                        Agent 03  Resource Intelligence
                      </p>
                      <h2 className="mt-0.5 text-base font-black text-slate-900">
                        Demand, Coverage & Optimization Analysis
                      </h2>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    Live Agent 02 assessment context compared against the real Agent 03 demand and inventory data.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[9px] font-black text-indigo-700">
                  <Activity size={12} />
                  {resourceIntelligence.priority} Priority
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <IntelligenceMetric
                  label="Required"
                  value={resourceIntelligence.required.toLocaleString()}
                  subtitle="Calculated demand"
                />
                <IntelligenceMetric
                  label="Allocated"
                  value={resourceIntelligence.allocated.toLocaleString()}
                  subtitle="Saved allocations"
                />
                <IntelligenceMetric
                  label="Live Available"
                  value={resourceIntelligence.available.toLocaleString()}
                  subtitle="Inventory capacity"
                />
                <IntelligenceMetric
                  label="Coverage"
                  value={`${resourceIntelligence.coverage.toFixed(1)}%`}
                  subtitle={
                    resourceIntelligence.gap > 0
                      ? `${resourceIntelligence.gap.toLocaleString()} units gap`
                      : "Fully covered"
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        Demand vs Supply
                      </p>
                      <p className="mt-1 text-xs font-black text-slate-800">
                        Resource coverage by type
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500">
                      {resourceIntelligence.shortageItems.length} gaps
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {workflowPlan.slice(0, 6).map((item) => {
                      const itemCoverage =
                        item.required > 0
                          ? Math.min(
                              100,
                              (item.recommended / item.required) * 100
                            )
                          : 100;

                      return (
                        <div
                          key={`${item.resourceId}-${item.resourceType}-${item.resourceName}`}
                          className="rounded-xl border border-white bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-black text-slate-800">
                                {item.resourceName}
                              </p>
                              <p className="mt-0.5 text-[8px] text-slate-400">
                                {item.location || "Location not specified"}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2 py-1 text-[8px] font-black ${
                                item.gap > 0
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {item.gap > 0
                                ? `Short ${item.gap.toLocaleString()}`
                                : "Covered"}
                            </span>
                          </div>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${itemCoverage}%` }}
                            />
                          </div>

                          <div className="mt-1.5 flex justify-between text-[8px] text-slate-400">
                            <span>
                              Required {item.required.toLocaleString()}
                            </span>
                            <span>
                              Available {item.available.toLocaleString()}
                            </span>
                            <span>
                              Plan {item.recommended.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={15} className="text-blue-600" />
                      <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">
                        Agent 03 Recommendation
                      </p>
                    </div>

                    <p className="mt-2 text-[10px] leading-5 text-slate-700">
                      The recommendation below is derived from the live demand report, available inventory and saved allocation records.
                    </p>

                    <div className="mt-3 space-y-2">
                      {resourceIntelligence.recommendations.map(
                        (recommendation, index) => (
                          <div
                            key={recommendation}
                            className="flex gap-2 rounded-lg border border-white bg-white px-3 py-2.5"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[8px] font-black text-white">
                              {index + 1}
                            </span>
                            <p className="text-[9px] leading-4 text-slate-600">
                              {recommendation}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                          Resource Shortage Alerts
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Items requiring additional supply or allocation.
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[8px] font-black text-amber-700">
                        {resourceIntelligence.shortageItems.length}
                      </span>
                    </div>

                    {resourceIntelligence.shortageItems.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {resourceIntelligence.shortageItems
                          .slice(0, 5)
                          .map((item) => (
                            <div
                              key={`${item.resourceId}-${item.resourceName}`}
                              className="flex items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2.5"
                            >
                              <div>
                                <p className="text-[9px] font-black text-slate-800">
                                  {item.resourceName}
                                </p>
                                <p className="text-[8px] text-slate-400">
                                  {item.location || "Location not specified"}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-[10px] font-black text-amber-700">
                                  -{item.gap.toLocaleString()}
                                </p>
                                <p className="text-[7px] text-slate-400">
                                  units
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg border border-emerald-100 bg-white px-3 py-3 text-[9px] font-bold text-emerald-700">
                        No calculated resource shortage in the current demand report.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Operational decision
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    {resourceIntelligence.gap > 0
                      ? "Additional resources should be considered before full response coverage."
                      : "Current calculated demand is covered by the saved allocation plan."}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black ${
                    resourceIntelligence.gap > 0
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {resourceIntelligence.gap > 0 ? (
                    <AlertTriangle size={12} />
                  ) : (
                    <Check size={12} />
                  )}
                  {resourceIntelligence.gap > 0
                    ? "Action required"
                    : "Coverage achieved"}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* AGENT 02 ASSESSMENT EXPLORER */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                  Agent 02 Assessment Locations
                </p>
                <h2 className="mt-1 text-base font-black text-slate-900">
                  Select an assessment to run Agent 03
                </h2>
                <p className="mt-1 text-[10px] text-slate-500">
                  View the real assessment context, run resource optimization, or manage its linked allocations.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-[230px]">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={assessmentSearch}
                    onChange={(event) => setAssessmentSearch(event.target.value)}
                    placeholder="Search assessments..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-[10px] font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                </div>

                <FilterSelect
                  value={assessmentTypeFilter}
                  options={[
                    "All",
                    ...Array.from(
                      new Set(
                        allAssessments
                          .map((item) => item.disasterType)
                          .filter(Boolean) as string[]
                      )
                    ),
                  ]}
                  onChange={setAssessmentTypeFilter}
                />

                <span className="inline-flex h-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-[9px] font-black text-blue-700">
                  {allAssessments.filter(isAgent03Eligible).length} High/Critical assessments
                </span>
              </div>
            </div>
          </div>

          {assessmentActionStatus.type !== "idle" && (
            <div
              className={`mx-5 mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-[10px] font-semibold ${
                assessmentActionStatus.type === "running"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : assessmentActionStatus.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {assessmentActionStatus.type === "running" ? (
                <RefreshCw size={14} className="mt-0.5 shrink-0 animate-spin" />
              ) : assessmentActionStatus.type === "success" ? (
                <Check size={14} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              )}
              <span>{assessmentActionStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:h-[470px] xl:grid-cols-[minmax(0,1.45fr)_390px]">
            {/* ASSESSMENT LIST */}
            <div className="min-h-0 overflow-y-auto border-b border-slate-100 xl:h-full xl:border-b-0 xl:border-r">
              {(() => {
                const normalizedSearch = assessmentSearch.trim().toLowerCase();

                const visibleAssessments = allAssessments
                  .filter(isAgent03Eligible)
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt || 0).getTime() -
                      new Date(a.createdAt || 0).getTime()
                  )
                  .filter((assessment) => {
                    const matchesSearch =
                      !normalizedSearch ||
                      `${assessment.location || ""} ${assessment.disasterType || ""} ${assessment.riskLevel || ""}`
                        .toLowerCase()
                        .includes(normalizedSearch);

                    const matchesType =
                      assessmentTypeFilter === "All" ||
                      assessment.disasterType === assessmentTypeFilter;

                    return matchesSearch && matchesType;
                  });

                if (visibleAssessments.length === 0) {
                  return (
                    <div className="px-5 py-14 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                        <MapPin size={19} />
                      </div>
                      <p className="mt-3 text-xs font-bold text-slate-700">
                        No matching Agent 02 assessments
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Try another location, disaster type, or search term.
                      </p>
                    </div>
                  );
                }

                return visibleAssessments.map((assessment) => {
                  const active = assessment.id === assessmentId;
                  const assessmentAllocations = dashboardAllocations.filter(
                    (item) => item.vulnerabilityAssessmentId === assessment.id
                  );
                  const priority =
                    getAgent03Priority(assessment) ||
                    "High";
                  const imageUrl = getDisasterPhotoUrl(assessment.disasterType);

                  return (
                    <div
                      key={assessment.id}
                      className={`group flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 transition ${
                        active
                          ? "bg-blue-50/80"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setAssessmentId(assessment.id || "");
                          setCurrentAssessment(assessment);
                          setCrudError("");

                          // Selecting an assessment is instant.
                          // Allocations are already available in dashboardAllocations.
                          if (assessment.id) {
                            void loadDemandReport(assessment.id);
                          }
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <img
                            src={imageUrl}
                            alt={assessment.disasterType || "Disaster"}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(event) => {
                              advanceImageFallback(
                                event,
                                getDisasterImageCandidates(
                                  assessment.disasterType
                                )
                              );
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-xs font-black text-slate-800">
                              {assessment.location || "Unknown Location"}
                            </span>

                            {assessment.disasterType && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">
                                {assessment.disasterType}
                              </span>
                            )}

                            {active && (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-bold text-white">
                                Selected
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-400">
                            <span>
                              {Number(
                                assessment.affectedPopulation || 0
                              ).toLocaleString()}{" "}
                              affected
                            </span>
                            <span>
                              Severity{" "}
                              {getSeverityScore(assessment).toFixed(1)}
                            </span>
                            <span>
                              {assessmentAllocations.length} allocation
                              {assessmentAllocations.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`hidden rounded-full border px-2 py-1 text-[8px] font-bold sm:inline-flex ${getPriorityBadge(
                            priority
                          )}`}
                        >
                          {priority}
                        </span>
                      </button>

                      {/* ACTION ICONS */}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          title="View assessment"
                          onClick={() => {
                            setAssessmentId(assessment.id || "");
                            setCurrentAssessment(assessment);
                            setCrudError("");

                            if (assessment.id) {
                              void loadDemandReport(assessment.id);
                            }

                            window.setTimeout(() => {
                              document
                                .getElementById("agent-02-assessment-details")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "nearest",
                                });
                            }, 50);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          title="Run Agent 03 assessment"
                          disabled={!assessment.id || assessmentActionStatus.type === "running"}
                          onClick={() => {
                            openAssessmentActionModal(assessment);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Sparkles size={14} />
                        </button>

                        <button
                          type="button"
                          title="Delete linked allocations"
                          disabled={crudSaving}
                          onClick={() => {
                            void handleDeleteAssessmentAllocations(assessment);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>

                        <button
                          type="button"
                          title="Open assessment"
                          onClick={() => {
                            setAssessmentId(assessment.id || "");
                            setCurrentAssessment(assessment);
                          }}
                          className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 sm:flex"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* SELECTED ASSESSMENT DETAILS */}
            <aside id="agent-02-assessment-details" className="min-h-0 overflow-y-auto bg-slate-50/70 p-4 xl:h-full">
              {currentAssessment ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={getDisasterPhotoUrl(
                        currentAssessment.disasterType
                      )}
                      alt={
                        currentAssessment.disasterType ||
                        "Disaster assessment"
                      }
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        advanceImageFallback(
                          event,
                          getDisasterImageCandidates(
                            currentAssessment?.disasterType ||
                              assessmentActionModal?.disasterType
                          )
                        );
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />

                    <div className="absolute left-4 top-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-[8px] font-black text-emerald-700 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live Assessment
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/75">
                        Assessment Details
                      </p>
                      <h3 className="mt-1 text-lg font-black text-white">
                        {currentAssessment.location ||
                          "Unknown Location"}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {currentAssessment.location ||
                            "Unknown Location"}
                        </span>
                        {currentAssessment.disasterType && (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-bold text-amber-700">
                            {currentAssessment.disasterType}
                          </span>
                        )}
                      </div>

                      <span
                        className={`rounded-full border px-2 py-1 text-[8px] font-bold ${getPriorityBadge(
                          currentAssessment.riskLevel ||
                            getPlanningPriority(
                              getSeverityScore(currentAssessment)
                            )
                        )}`}
                      >
                        {currentAssessment.riskLevel ||
                          getPlanningPriority(
                            getSeverityScore(currentAssessment)
                          )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <ContextValue
                        label="Affected People"
                        value={Number(
                          currentAssessment.affectedPopulation || 0
                        ).toLocaleString()}
                      />
                      <ContextValue
                        label="Severity"
                        value={getSeverityScore(
                          currentAssessment
                        ).toFixed(1)}
                      />
                      <ContextValue
                        label="Allocations"
                        value={String(
                          dashboardAllocations.filter(
                            (item) =>
                              item.vulnerabilityAssessmentId ===
                              currentAssessment.id
                          ).length
                        )}
                      />
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-blue-600">
                        <MapPin size={13} />
                        <span className="text-[9px] font-black uppercase tracking-wider">
                          Location Information
                        </span>
                      </div>

                      <p className="mt-2 text-[10px] font-semibold text-slate-700">
                        {currentAssessment.location || "Location unavailable"}
                      </p>

                      <p className="mt-1 text-[9px] text-slate-400">
                        Assessment ID:{" "}
                        {currentAssessment.id
                          ? `VA-${currentAssessment.id
                              .slice(0, 8)
                              .toUpperCase()}`
                          : ""}
                      </p>
                    </div>

                    {(() => {
                      const coords =
                        riskPrediction?.latitude != null &&
                        riskPrediction?.longitude != null
                          ? {
                              lat: Number(riskPrediction.latitude),
                              lng: Number(riskPrediction.longitude),
                            }
                          : getCoordinates(
                              currentAssessment.location || "Sri Lanka"
                            );

                      return (
                        <AssessmentMiniMap
                          location={
                            currentAssessment.location || "Selected Location"
                          }
                          disasterType={currentAssessment.disasterType}
                          lat={coords.lat}
                          lng={coords.lng}
                        />
                      );
                    })()}

                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-blue-700">
                          <ShieldAlert size={13} />
                          <span className="text-[9px] font-black uppercase tracking-wider">Agent 01 | Risk Prediction Result</span>
                        </div>
                        {riskPrediction ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">Live Result</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-bold text-slate-500">No Linked Result</span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <ContextValue
                          label="Disaster"
                          value={riskPrediction?.disasterType || currentAssessment.disasterType || ""}
                        />
                        <ContextValue
                          label="Risk Score"
                          value={
                            riskPrediction?.riskScore != null
                              ? `${Number(riskPrediction.riskScore).toFixed(1)} / 100`
                              : currentAssessment.riskScore != null
                                ? `${Number(currentAssessment.riskScore).toFixed(1)} / 100`
                                : ""
                          }
                        />
                        <ContextValue
                          label="Risk Level"
                          value={riskPrediction?.riskLevel || currentAssessment.riskLevel || ""}
                        />
                        <ContextValue
                          label="Confidence"
                          value={
                            riskPrediction?.confidence != null
                              ? `${Number(riskPrediction.confidence).toFixed(1)}%`
                              : ""
                          }
                        />
                      </div>

                      <p className="mt-2 text-[8px] leading-4 text-blue-600">
                        Agent 01 prediction remains visible while Agent 02 assessment and Agent 03 resource optimization are processed.
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <ContextValue
                        label="Risk"
                        value={
                          currentAssessment.riskScore != null
                            ? `${Number(
                                currentAssessment.riskScore
                              ).toFixed(1)} / 100`
                            : ""
                        }
                      />
                      <ContextValue
                        label="Impact"
                        value={
                          currentAssessment.impactScore != null
                            ? `${Number(
                                currentAssessment.impactScore
                              ).toFixed(1)} / 100`
                            : ""
                        }
                      />
                    </div>

                    {(demandLoading || demandReport) && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/60">
                        <div className="border-b border-indigo-100 bg-white/70 px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600">Agent 03 | Resource Analysis</p>
                              <p className="mt-0.5 text-[9px] text-slate-500">Population-based demand and real inventory coverage</p>
                            </div>
                            {demandLoading ? (
                              <RefreshCw size={13} className="animate-spin text-indigo-600" />
                            ) : demandReport ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">Calculated</span>
                            ) : null}
                          </div>
                        </div>

                        {demandReport && (
                          <div className="p-3">
                            <div className="grid grid-cols-3 gap-2">
                              <ContextValue label="Population" value={Number(demandReport.affectedPopulation || 0).toLocaleString()} />
                              <ContextValue label="Severity" value={`${Number(demandReport.severityIndex || 0).toFixed(1)}`} />
                              <ContextValue label="Priority" value={demandReport.priority || ""} />
                            </div>

                            <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                              {demandReport.resources.map((resource) => (
                                <div key={`${resource.resourceId}-${resource.resourceType}-${resource.resourceName}`} className="rounded-lg border border-white bg-white px-2.5 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="min-w-0 truncate text-[9px] font-bold text-slate-800">{resource.resourceName}</p>
                                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-bold ${resource.gapQuantity > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                                      {resource.gapQuantity > 0 ? `Gap ${resource.gapQuantity}` : "Covered"}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[8px] text-slate-500">
                                    Required <b>{resource.requiredQuantity}</b> | Available <b>{resource.availableQuantity}</b> | Allocate <b>{resource.allocatableQuantity}</b>
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        openAssessmentActionModal(currentAssessment);
                      }}
                      disabled={!currentAssessment.id || assessmentActionStatus.type === "running"}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-[10px] font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      {optimizing
                        ? "Running Agent 03..."
                        : "Run Agent 03 Assessment"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById("resource-allocation-map")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                      }}
                      className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      <MapPin size={13} />
                      View on Full Resource Map
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Eye size={20} />
                  </div>
                  <p className="mt-3 text-sm font-black text-slate-800">
                    Select an assessment
                  </p>
                  <p className="mt-1 max-w-[240px] text-[10px] leading-5 text-slate-400">
                    Select any Agent 02 result to view its disaster image,
                    location, risk context, and Agent 03 actions.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>


        {/* RECENT AGENT 02 DATA */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock3 size={15} className="text-blue-600" />
                <h2 className="text-sm font-black text-slate-900">Recent Assessment Data</h2>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8px] font-black text-blue-700">LIVE DB</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Latest Agent 02 assessments loaded directly from the backend database.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || optimizing}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </div>

          {recentAssessments.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CalendarDays size={20} className="mx-auto text-slate-300" />
              <p className="mt-2 text-[10px] font-bold text-slate-500">No recent assessment data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2 xl:grid-cols-3">
              {recentAssessments.map((assessment) => {
                const active = assessment.id === currentAssessment?.id;
                const eligible = isAgent03Eligible(assessment);

                return (
                  <button
                    key={assessment.id}
                    type="button"
                    onClick={() => {
                      setAssessmentId(assessment.id || "");
                      setCurrentAssessment(assessment);
                      setCrudError("");
                      if (assessment.id) {
                        void loadDemandReport(assessment.id);
                      }

                      setShowRecentAssessmentDetails(true);
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-blue-300 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 bg-slate-50/50 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-slate-800">
                          {assessment.location || "Unknown Location"}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">
                          {assessment.disasterType || "Disaster"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-black ${getPriorityBadge(
                          getAgent03Priority(assessment) || assessment.riskLevel || "Medium"
                        )}`}
                      >
                        {getAgent03Priority(assessment) || assessment.riskLevel || "Medium"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                        <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Risk</p>
                        <p className="mt-0.5 text-[10px] font-black text-slate-800">
                          {assessment.riskScore != null ? `${Number(assessment.riskScore).toFixed(1)}/100` : ""}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                        <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Affected</p>
                        <p className="mt-0.5 text-[10px] font-black text-slate-800">
                          {Number(assessment.affectedPopulation || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[8px] font-semibold text-slate-400">
                        {formatDate(assessment.createdAt)}
                      </span>
                      <span className={`text-[8px] font-black ${eligible ? "text-emerald-600" : "text-slate-400"}`}>
                        {eligible ? "Agent 03 Ready" : "Review Only"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* SELECTED RECENT ASSESSMENT - STEP 2 STYLE DETAILS PANEL */}
        {currentAssessment && showRecentAssessmentDetails && (
          <div
            id="recent-assessment-details"
            className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Selected assessment details"
          >
            <button
              type="button"
              aria-label="Close assessment details"
              className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]"
              onClick={() => setShowRecentAssessmentDetails(false)}
            />

            <section
              onClick={(event) => event.stopPropagation()}
              className="relative z-10 flex max-h-[calc(100vh-1rem)] w-full max-w-[1450px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)]"
            >
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900">
                    Selected Assessment  Full Details
                  </h2>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[8px] font-black text-emerald-700">
                    LIVE DB
                  </span>
                  {selectedRecentAllocations.length > 0 && (
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8px] font-black text-blue-700">
                      {selectedRecentAllocations.length} ALLOCATED
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Complete Agent 02 context and every saved Agent 03 allocation linked to this assessment.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => currentAssessment.id && void loadDemandReport(currentAssessment.id)}
                  disabled={demandLoading}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={11} className={demandLoading ? "animate-spin" : ""} />
                  Refresh Details
                </button>
                <button
                  type="button"
                  aria-label="Close assessment details"
                  title="Close"
                  onClick={() => setShowRecentAssessmentDetails(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                {/* Assessment + Agent 01 */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={getDisasterPhotoUrl(currentAssessment.disasterType)}
                      alt={currentAssessment.disasterType || "Disaster assessment"}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        advanceImageFallback(
                          event,
                          getDisasterImageCandidates(currentAssessment.disasterType)
                        );
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-[8px] font-black text-emerald-700">
                        LIVE ASSESSMENT
                      </span>
                      <span className="rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-[8px] font-black text-slate-700">
                        {currentAssessment.disasterType || "Disaster"}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/70">Agent 02 Vulnerability & Impact</p>
                      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                        <h3 className="text-xl font-black text-white">
                          {currentAssessment.location || "Unknown Location"}
                        </h3>
                        <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${getPriorityBadge(currentAssessment.riskLevel || getPlanningPriority(getSeverityScore(currentAssessment)))}`}>
                          {currentAssessment.riskLevel || getPlanningPriority(getSeverityScore(currentAssessment))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-5">
                    <ContextValue label="Affected People" value={Number(currentAssessment.affectedPopulation || 0).toLocaleString()} />
                    <ContextValue label="Risk Score" value={currentAssessment.riskScore != null ? `${Number(currentAssessment.riskScore).toFixed(1)} / 100` : ""} />
                    <ContextValue label="Vulnerability" value={currentAssessment.vulnerabilityScore != null ? `${Number(currentAssessment.vulnerabilityScore).toFixed(1)} / 100` : ""} />
                    <ContextValue label="Impact" value={currentAssessment.impactScore != null ? `${Number(currentAssessment.impactScore).toFixed(1)} / 100` : ""} />
                    <ContextValue label="Created" value={formatDate(currentAssessment.createdAt)} />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-blue-700">
                      <ShieldAlert size={14} />
                      <h3 className="text-[10px] font-black uppercase tracking-wider">Agent 01  Linked Risk Prediction</h3>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold text-blue-700">
                      {riskPrediction ? "Linked" : "Not Linked"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <ContextValue label="Disaster" value={riskPrediction?.disasterType || currentAssessment.disasterType || ""} />
                    <ContextValue label="Risk" value={riskPrediction?.riskScore != null ? `${Number(riskPrediction.riskScore).toFixed(1)} / 100` : currentAssessment.riskScore != null ? `${Number(currentAssessment.riskScore).toFixed(1)} / 100` : ""} />
                    <ContextValue label="Level" value={riskPrediction?.riskLevel || currentAssessment.riskLevel || ""} />
                    <ContextValue label="Confidence" value={riskPrediction?.confidence != null ? `${Number(riskPrediction.confidence).toFixed(1)}%` : ""} />
                  </div>
                </div>

                {/* All Agent 03 allocations */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <div>
                      <h3 className="text-xs font-black text-slate-900">All Allocated Resources</h3>
                      <p className="mt-0.5 text-[9px] text-slate-500">
                        Every saved ResourceAllocation linked to this Agent 02 assessment.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-600">
                      {selectedRecentAllocations.length} records
                    </span>
                  </div>

                  {selectedRecentAllocations.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <Package size={24} className="mx-auto text-slate-300" />
                      <p className="mt-2 text-[10px] font-bold text-slate-500">No Agent 03 allocations saved for this assessment.</p>
                      <p className="mt-1 text-[9px] text-slate-400">Run Agent 03 optimization to create allocation records.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
                      {selectedRecentAllocations.map((allocation) => (
                        <div key={allocation.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 transition hover:border-blue-200 hover:bg-white">
                          <div className="relative h-36 overflow-hidden bg-slate-100">
                            <img
                              src={getResourceImageUrl(allocation.resourceName, allocation.resourceType)}
                              alt={allocation.resourceName || "Allocated resource"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(event) => {
                                advanceImageFallback(
                                  event,
                                  getResourceImageCandidates(allocation.resourceName, allocation.resourceType)
                                );
                              }}
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-3 pt-8">
                              <p className="truncate text-[10px] font-black text-white">{allocation.resourceName || "Resource"}</p>
                              <p className="mt-0.5 text-[8px] font-semibold text-white/75">{allocation.resourceType || "Emergency resource"}</p>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="grid grid-cols-2 gap-2">
                              <ContextValue label="Quantity" value={`${Number(allocation.recommendedQuantity || 0).toLocaleString()} units`} />
                              <ContextValue label="Priority" value={allocation.priority || ""} />
                              <ContextValue label="Location" value={allocation.location || currentAssessment.location || ""} />
                              <ContextValue label="Status" value="Allocated" />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[8px] text-slate-400">{formatDate(allocation.createdAt)}</span>
                              <button
                                type="button"
                                onClick={() => setViewAllocation(allocation)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-[8px] font-bold text-blue-700 hover:bg-blue-100"
                              >
                                <Eye size={10} /> View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Demand report */}
                {(demandLoading || demandReport) && (
                  <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50">
                    <div className="flex items-center justify-between gap-2 border-b border-indigo-100 bg-white/70 px-4 py-3">
                      <div>
                        <h3 className="text-xs font-black text-indigo-700">Agent 03 Resource Demand</h3>
                        <p className="mt-0.5 text-[9px] text-slate-500">Live demand calculation and inventory coverage.</p>
                      </div>
                      {demandLoading && <RefreshCw size={13} className="animate-spin text-indigo-600" />}
                    </div>
                    {demandReport && (
                      <div className="p-3">
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                          <ContextValue label="Population" value={Number(demandReport.affectedPopulation || 0).toLocaleString()} />
                          <ContextValue label="Priority Population" value={Number(demandReport.priorityAffectedPopulation || 0).toLocaleString()} />
                          <ContextValue label="Severity Index" value={Number(demandReport.severityIndex || 0).toFixed(1)} />
                          <ContextValue label="Priority" value={demandReport.priority || ""} />
                          <ContextValue label="Resources" value={String(demandReport.resources?.length || 0)} />
                        </div>
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-[760px] w-full text-left">
                            <thead className="bg-white/80">
                              <tr className="border-b border-indigo-100">
                                {['RESOURCE', 'REQUIRED', 'AVAILABLE', 'ALLOCATABLE', 'GAP', 'COVERAGE'].map((head) => (
                                  <th key={head} className="px-3 py-2 text-[8px] font-black tracking-wide text-slate-400">{head}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {demandReport.resources.map((resource) => (
                                <tr key={`${resource.resourceId}-${resource.resourceName}`} className="border-b border-white/70">
                                  <td className="px-3 py-2 text-[9px] font-bold text-slate-800">{resource.resourceName}</td>
                                  <td className="px-3 py-2 text-[9px] text-slate-600">{resource.requiredQuantity}</td>
                                  <td className="px-3 py-2 text-[9px] text-slate-600">{resource.availableQuantity}</td>
                                  <td className="px-3 py-2 text-[9px] font-bold text-slate-700">{resource.allocatableQuantity}</td>
                                  <td className="px-3 py-2 text-[9px] font-bold text-amber-700">{resource.gapQuantity}</td>
                                  <td className="px-3 py-2 text-[9px] font-bold text-slate-700">{resource.coverageStatus}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right-side location + summary */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <MapPin size={14} />
                    <h3 className="text-[10px] font-black uppercase tracking-wider">Assessment Location</h3>
                  </div>
                  <p className="mt-2 text-xs font-black text-slate-800">{currentAssessment.location || "Location unavailable"}</p>
                  <p className="mt-1 break-all text-[8px] text-slate-400">Assessment ID: {currentAssessment.id || ""}</p>
                  {(() => {
                    const coords =
                      riskPrediction?.latitude != null && riskPrediction?.longitude != null
                        ? { lat: Number(riskPrediction.latitude), lng: Number(riskPrediction.longitude) }
                        : getCoordinates(currentAssessment.location || "Sri Lanka");
                    return (
                      <AssessmentMiniMap
                        location={currentAssessment.location || "Selected Location"}
                        disasterType={currentAssessment.disasterType}
                        lat={coords.lat}
                        lng={coords.lng}
                      />
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Assessment Summary</h3>
                  <div className="mt-3 space-y-2">
                    <ContextValue label="Vulnerability Level" value={currentAssessment.vulnerabilityLevel || ""} />
                    <ContextValue label="Impact Level" value={currentAssessment.impactLevel || ""} />
                    <ContextValue label="Risk Level" value={currentAssessment.riskLevel || ""} />
                    <ContextValue label="Created At" value={formatDate(currentAssessment.createdAt)} />
                    <ContextValue label="Linked Risk Prediction" value={currentAssessment.riskPredictionId ? "Yes" : "Fallback match"} />
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <PackageCheck size={14} />
                      <h3 className="text-[10px] font-black uppercase tracking-wider">Allocation Summary</h3>
                    </div>
                    <span className="text-sm font-black text-emerald-700">{selectedRecentAllocations.length}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ContextValue
                      label="Total Units"
                      value={selectedRecentAllocations.reduce((sum, item) => sum + (Number(item.recommendedQuantity) || 0), 0).toLocaleString()}
                    />
                    <ContextValue
                      label="Resource Types"
                      value={String(new Set(selectedRecentAllocations.map((item) => item.resourceType || item.resourceName)).size)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById("resource-allocation-map")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-[9px] font-bold text-emerald-700 hover:bg-emerald-50"
                  >
                    <MapPin size={12} /> View Allocation Map
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openAssessmentActionModal(currentAssessment)}
                  disabled={!currentAssessment.id || assessmentActionStatus.type === "running"}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-[10px] font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {optimizing ? "Running Agent 03..." : "Run Agent 03 Assessment"}
                </button>
              </div>
            </div>
            </div>
            </section>
          </div>
        )}


        {/* MAP + DISTRIBUTION */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
          <div id="resource-allocation-map" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" />
                  <h2 className="text-sm font-black text-slate-900">Assessment Locations ({assessmentMapPoints.length})</h2>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">Select an assessment to run Agent 03 and manage resource allocation.</p>
              </div>
              <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700">Map</span>
            </div>
            <ResourceAllocationMap
              allocations={dashboardAllocations}
              assessmentLocations={assessmentMapPoints}
              selectedAllocation={selectedAllocation}
              selectedAssessment={currentAssessment}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ResourceDistribution allocations={dashboardAllocations.length ? dashboardAllocations : []} />
            <PriorityAllocation allocations={dashboardAllocations.length ? dashboardAllocations : []} />
          </div>
        </div>

        {/* TABS + TABLE */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto border-b border-slate-100 px-4">
            {(
              [
                {
                  id: "inventory" as TabType,
                  label: "Resource Inventory",
                  count: inventory.length,
                },
                {
                  id: "requests" as TabType,
                  label: "Allocation Requests",
                },
                {
                  id: "history" as TabType,
                  label: "Optimization History",
                },
              ] as Array<{
                id: TabType;
                label: string;
                count?: number;
              }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.id
                  )
                }
                className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-[10px] font-bold ${
                  activeTab === tab.id
                    ? "text-blue-600"
                    : "text-slate-500"
                }`}
              >
                {tab.label}

                {typeof tab.count ===
                  "number" && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px]">
                    {tab.count}
                  </span>
                )}

                {activeTab ===
                  tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          {activeTab === "inventory" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                      <Boxes size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Resource Inventory</h3>
                      <p className="mt-1 text-[10px] text-slate-500">Live inventory from ReliefResources. Add stock here and Agent 03 will use the same database records.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateInventory}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[10px] font-black text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Plus size={14} />
                    Add Inventory
                  </button>
                </div>
              </div>
              {inventoryError && (
                <div className="mx-5 mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">{inventoryError}</div>
              )}
              {inventoryLoading ? (
                <div className="px-5 py-12 text-center text-xs text-slate-500">Loading inventory from database...</div>
              ) : inventory.length === 0 ? (
                <div className="px-5 py-12 text-center text-xs text-slate-500">No resource records were found in the database.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Resource</th>
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Type</th>
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</th>
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Allocated</th>
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Available</th>
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Location</th>
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => {
                        const available = Math.max(
                          (Number(item.availableQuantity) || 0) -
                            (Number(item.allocatedQuantity) || 0),
                          0
                        );
                        return (
                          <tr key={item.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <ResourceImage name={item.resourceName} type={item.resourceType} />
                                <div className="min-w-0">
                                  <p className="truncate text-[10px] font-bold text-slate-800">{item.resourceName || ""}</p>
                                  <p className="truncate text-[8px] text-slate-400">{item.location || ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-600">{item.resourceType || ""}</td>
                            <td className="px-5 py-3 text-xs font-semibold text-slate-700">{item.availableQuantity ?? 0}</td>
                            <td className="px-5 py-3 text-xs font-semibold text-slate-700">{item.allocatedQuantity ?? 0}</td>
                            <td className="px-5 py-3 text-xs font-semibold text-slate-700">{available}</td>
                            <td className="px-5 py-3 text-xs text-slate-600">{item.location || ""}</td>
                            <td className="px-5 py-3 text-xs font-semibold text-slate-600">{item.status || ""}</td>
                            <td className="px-5 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditInventory(item)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] font-bold text-slate-600 hover:bg-slate-50"
                                  title="Edit inventory"
                                >
                                  <Edit3 size={12} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInventoryDelete(item)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-2.5 py-1.5 text-[9px] font-bold text-red-600 hover:bg-red-50"
                                  title="Delete inventory"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="p-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"><Clock3 size={17}/></div>
                    <div><h3 className="text-sm font-black text-slate-900">Allocation Requests</h3><p className="mt-1 text-[10px] text-slate-500">Live allocation records stored in ResourceAllocations.</p></div>
                  </div>
                  <button type="button" onClick={handleRefresh} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-bold text-slate-600 hover:bg-slate-50"><RefreshCw size={12}/> Refresh</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full text-left">
                    <thead className="bg-slate-50"><tr className="border-b border-slate-100">{["RESOURCE","LOCATION","QUANTITY","PRIORITY","CREATED","STATUS","ACTIONS"].map((h)=><th key={h} className="px-5 py-3 text-[9px] font-bold tracking-wide text-slate-400">{h}</th>)}</tr></thead>
                    <tbody>
                      {requestRows.slice(0,10).map((item)=>(
                        <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                          <td className="px-5 py-3"><div className="flex items-center gap-2"><ResourceImage name={item.resourceName} type={item.resourceType}/><div><p className="text-[10px] font-bold text-slate-800">{item.resourceName}</p><p className="text-[8px] text-slate-400">{item.resourceType}</p></div></div></td>
                          <td className="px-5 py-3 text-[10px] text-slate-600">{item.location || ""}</td>
                          <td className="px-5 py-3 text-[10px] font-bold text-slate-800">{Number(item.recommendedQuantity || 0).toLocaleString()}</td>
                          <td className="px-5 py-3"><span className={`rounded-full border px-2 py-1 text-[8px] font-bold ${getPriorityBadge(item.priority)}`}>{item.priority || ""}</span></td>
                          <td className="px-5 py-3 text-[9px] text-slate-500">{formatDate(item.createdAt)}</td>
                          <td className="px-5 py-3"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">Recorded</span></td>
                          <td className="px-5 py-3"><button type="button" onClick={()=>setViewAllocation(item)} className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[8px] font-bold text-blue-700 hover:bg-blue-100"><Eye size={10}/> View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3"><span className="text-[9px] text-slate-400">Showing {Math.min(10, requestRows.length)} of {requestRows.length} requests</span><span className="text-[9px] font-semibold text-slate-400">10 per page</span></div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="p-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><TrendingUp size={17}/></div>
                    <div><h3 className="text-sm font-black text-slate-900">Historical Agent 03 Allocations</h3><p className="mt-1 text-[10px] text-slate-500">Historical Agent 03 allocation results derived from saved database records.</p></div>
                  </div>
                  <button type="button" onClick={handleRefresh} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-bold text-slate-600 hover:bg-slate-50"><RefreshCw size={12}/> Refresh</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full text-left">
                    <thead className="bg-slate-50"><tr className="border-b border-slate-100">{["ASSESSMENT ID","LOCATION","ALLOCATIONS","TOTAL QUANTITY","LATEST RUN","STATUS","ACTIONS"].map((h)=><th key={h} className="px-5 py-3 text-[9px] font-bold tracking-wide text-slate-400">{h}</th>)}</tr></thead>
                    <tbody>
                      {historyRows.slice(0,10).map((row)=>(
                        <tr key={row.assessmentId} className="border-b border-slate-100 transition hover:bg-slate-50">
                          <td className="px-5 py-3"><p className="max-w-[250px] truncate text-[9px] font-bold text-slate-700">{row.assessmentId}</p><p className="text-[8px] text-slate-400">{row.disasterType}</p></td>
                          <td className="px-5 py-3 text-[10px] text-slate-600">{row.location}</td>
                          <td className="px-5 py-3 text-[10px] font-bold text-slate-800">{row.allocations}</td>
                          <td className="px-5 py-3 text-[10px] font-bold text-slate-800">{row.quantity.toLocaleString()}</td>
                          <td className="px-5 py-3 text-[9px] text-slate-500">{formatDate(row.latestRun)}</td>
                          <td className="px-5 py-3"><span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[8px] font-bold text-blue-700">Completed</span></td>
                          <td className="px-5 py-3"><button type="button" onClick={()=>{const found=dashboardAllocations.find((x)=>x.vulnerabilityAssessmentId===row.assessmentId); if(found) setViewAllocation(found);}} className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[8px] font-bold text-blue-700 hover:bg-blue-100"><Eye size={10}/> View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3"><span className="text-[9px] text-slate-400">Showing {Math.min(10, historyRows.length)} of {historyRows.length} runs</span><span className="text-[9px] font-semibold text-slate-400">10 per page</span></div>
              </div>
            </div>
          )}
        </div>

        {/* SELECTED DETAILS */}

        {selectedAllocation && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Check
                    size={18}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Agent 03 Optimization Completed
                  </h3>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Resource allocations generated successfully.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniMetric
                  label="Allocations"
                  value={
                    summary.totalAllocations
                  }
                />

                <MiniMetric
                  label="Quantity"
                  value={
                    summary.totalRecommendedQuantity
                  }
                />

                <MiniMetric
                  label="Locations"
                  value={
                    summary.locationsCovered
                  }
                />

                <MiniMetric
                  label="Resource Types"
                  value={
                    summary.resourceTypes
                  }
                />
              </div>
            </div>

            <AllocationDetails
              allocation={
                selectedAllocation
              }
            />
          </div>
        )}


        {/* VIEW ALLOCATION MODAL */}
        {viewAllocation && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Agent 03 | Resource Assessment</p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">{viewAllocation.resourceName}</h3>
                  <p className="mt-1 text-[10px] text-slate-400">RA-{viewAllocation.id.slice(0, 6).toUpperCase()}</p>
                </div>
                <button type="button" onClick={() => setViewAllocation(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                  <X size={17} />
                </button>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {getResourceImageUrl(viewAllocation.resourceName, viewAllocation.resourceType) ? (
                    <img
                      src={getResourceImageUrl(
                        viewAllocation.resourceName,
                        viewAllocation.resourceType
                      )}
                      alt={viewAllocation.resourceName}
                      className="h-52 w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        advanceImageFallback(
                          event,
                          getResourceImageCandidates(
                            viewAllocation.resourceName,
                            viewAllocation.resourceType
                          )
                        );
                      }}
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-slate-100 text-slate-400">
                      <Package size={42} />
                    </div>
                  )}
                  <div className="border-t border-slate-200 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Resource</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{viewAllocation.resourceName}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{viewAllocation.resourceType || "Emergency resource"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ContextValue label="Quantity" value={`${viewAllocation.recommendedQuantity} units`} />
                    <ContextValue label="Priority" value={viewAllocation.priority || ""} />
                    <ContextValue label="Location" value={viewAllocation.location || ""} />
                    <ContextValue label="Status" value="Allocated" />
                    <ContextValue label="Created" value={formatDate(viewAllocation.createdAt)} />
                    <ContextValue label="Assessment" value={`VA-${viewAllocation.vulnerabilityAssessmentId.slice(0, 6).toUpperCase()}`} />
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Sparkles size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wide">Resource Optimization</span>
                    </div>
                    <p className="mt-1 text-[10px] leading-5 text-blue-700/80">
                      Run the Agent 03 optimization for this allocation. The live inventory is checked and the allocation is synchronized with the database.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 px-6 py-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setViewAllocation(null); setDeleteAllocation(viewAllocation); }} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                    <Trash2 size={14} /> Delete
                  </button>
                  <button type="button" onClick={() => { setViewAllocation(null); openEditAllocation(viewAllocation); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <Edit3 size={14} /> Edit
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setViewAllocation(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Close</button>
                  <button type="button" onClick={() => handleRunResourceAssessment(viewAllocation)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
                    <Sparkles size={14} /> Run Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AGENT 03 REAL RESOURCE ASSESSMENT */}
        {resourceRun && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                      Agent 03 | Resource Optimization
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      {resourceRun.running ? "Agent 03 is working" : resourceRun.error ? "Resource Optimization Failed" : "Resource Optimization Result"}
                    </h3>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {resourceRun.allocation.resourceName} | {resourceRun.allocation.location}
                    </p>
                  </div>
                  {!resourceRun.running && !resourceRun.error && (
                    <Check className="text-emerald-600" size={20} />
                  )}
                </div>
              </div>

              <div className="space-y-4 p-6">
                {resourceRun.running && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                        <RefreshCw size={18} className="animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-blue-900">Executing Agent 03...</p>
                        <p className="mt-1 text-[10px] leading-5 text-blue-700">
                          Checking the real inventory, calculating the allocation, updating the database, and returning the optimized resource result.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {resourceRun.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-[11px] font-semibold text-red-700">
                    {resourceRun.error}
                  </div>
                )}

                {resourceRun.completed && !resourceRun.error && resourceRun.resultAllocation && (
                  <>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                      <p className="text-sm font-black text-emerald-900"> Agent 03 completed successfully</p>
                      <p className="mt-1 text-[10px] leading-5 text-emerald-700">
                        The result below came from the Agent 03 API response and refreshed database inventory.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <ContextValue label="Allocated" value={`${resourceRun.resultAllocation.recommendedQuantity} units`} />
                      <ContextValue label="Priority" value={resourceRun.resultAllocation.priority || ""} />
                      <ContextValue label="Location" value={resourceRun.resultAllocation.location || ""} />
                      <ContextValue label="Resource" value={resourceRun.resultAllocation.resourceName || ""} />
                    </div>

                    {resourceRun.resourceAfter && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Live inventory after optimization</p>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                          <ContextValue label="Available" value={String(resourceRun.resourceAfter.availableQuantity)} />
                          <ContextValue label="Allocated" value={String(resourceRun.resourceAfter.allocatedQuantity)} />
                          <ContextValue label="Status" value={resourceRun.resourceAfter.status || ""} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                {resourceRun.running ? (
                  <span className="text-[10px] font-semibold text-slate-400">Waiting for Agent 03 API response...</span>
                ) : (
                  <button type="button" onClick={() => setResourceRun(null)} className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700">
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AGENT 03 FOUR-STEP EXECUTION WORKFLOW */}
        {assessmentActionModal && (
          <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/60 p-3 md:p-6 backdrop-blur-sm">
            <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
              <div className="border-b border-slate-100 bg-white px-5 py-4 md:px-7 md:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-blue-700">
                        <Sparkles size={11} /> Agent 03 | Resource Optimization
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${getPriorityBadge(
                        getAgent03Priority(assessmentActionModal) || "High"
                      )}`}>
                        {getAgent03Priority(assessmentActionModal) || "High"}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-black tracking-tight text-slate-900 md:text-xl">
                      Run Agent 03 - {assessmentActionModal.location || "Selected Assessment"}
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Review the assessment, analyze live inventory, review the allocation plan, then confirm the real database operation.
                    </p>
                  </div>
                  <button type="button" onClick={closeAssessmentActionModal} disabled={assessmentActionStatus.type === "running"} className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40">
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-1.5 md:gap-2">
                  {[
                    { step: 1 as AssessmentWorkflowStep, label: "Assessment Overview" },
                    { step: 2 as AssessmentWorkflowStep, label: "Resource Analysis" },
                    { step: 3 as AssessmentWorkflowStep, label: "Allocation Plan" },
                    { step: 4 as AssessmentWorkflowStep, label: "Confirmation" },
                  ].map((item) => {
                    const done = assessmentWorkflowStep > item.step || (item.step === 4 && assessmentActionStatus.type === "success");
                    const active = assessmentWorkflowStep === item.step;
                    return (
                      <div key={item.step} className={`rounded-xl border px-2.5 py-2.5 ${active ? "border-blue-200 bg-blue-50" : done ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${active ? "bg-blue-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-white text-slate-400"}`}>
                            {done ? <Check size={12} /> : item.step}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[8px] font-black uppercase tracking-wide ${active ? "text-blue-700" : done ? "text-emerald-700" : "text-slate-400"}`}>Step {item.step}</p>
                            <p className="truncate text-[9px] font-bold text-slate-700">{item.label}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-5 md:p-7">
                {assessmentWorkflowStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-blue-600">Step 1 | Assessment Overview</p>
                      <h4 className="mt-1 text-base font-black text-slate-900">Review the selected Agent 02 assessment</h4>
                      <p className="mt-1 text-[10px] leading-5 text-slate-500">Agent 03 will use this exact assessment ID. Nothing is allocated at this step.</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="relative h-52 overflow-hidden">
                          <img src={getDisasterPhotoUrl(assessmentActionModal.disasterType)} alt={assessmentActionModal.disasterType || "Disaster"} className="h-full w-full object-cover" onError={(event) => {
                            advanceImageFallback(
                              event,
                              getDisasterImageCandidates(
                                assessmentActionModal.disasterType
                              )
                            );
                          }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-[8px] font-black text-slate-700">{assessmentActionModal.disasterType || "Disaster"}</span>
                            <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${getPriorityBadge(getAgent03Priority(assessmentActionModal) || "High")}`}>{getAgent03Priority(assessmentActionModal) || "High"}</span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Selected Assessment</p>
                            <h4 className="mt-1 text-2xl font-black text-white">{assessmentActionModal.location || "Unknown Location"}</h4>
                            <p className="mt-1 text-[9px] text-white/75">VA-{assessmentActionModal.id?.slice(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
                          <ContextValue label="Affected Population" value={Number(assessmentActionModal.affectedPopulation || 0).toLocaleString()} />
                          <ContextValue label="Risk Score" value={assessmentActionModal.riskScore != null ? `${Number(assessmentActionModal.riskScore).toFixed(1)} / 100` : ""} />
                          <ContextValue label="Vulnerability" value={assessmentActionModal.vulnerabilityScore != null ? `${Number(assessmentActionModal.vulnerabilityScore).toFixed(1)} / 100` : ""} />
                          <ContextValue label="Impact" value={assessmentActionModal.impactScore != null ? `${Number(assessmentActionModal.impactScore).toFixed(1)} / 100` : ""} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-blue-600" />
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Location</p>
                              <p className="mt-1 text-sm font-black text-slate-900">{assessmentActionModal.location || ""}</p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <ContextValue label="Coordinates" value={riskPrediction?.latitude != null && riskPrediction?.longitude != null ? `${Number(riskPrediction.latitude).toFixed(4)}, ${Number(riskPrediction.longitude).toFixed(4)}` : `${getCoordinates(assessmentActionModal.location || "").lat.toFixed(4)}, ${getCoordinates(assessmentActionModal.location || "").lng.toFixed(4)}`} />
                            <ContextValue label="Assessment ID" value={`VA-${assessmentActionModal.id?.slice(0, 8).toUpperCase() || ""}`} />
                          </div>
                          <button type="button" onClick={() => { closeAssessmentActionModal(); window.setTimeout(() => document.getElementById("resource-allocation-map")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100); }} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-bold text-slate-600 hover:bg-slate-50">
                            <MapPin size={13} /> View Location on Resource Map
                          </button>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-blue-700">
                              <ShieldAlert size={15} />
                              <span className="text-[9px] font-black uppercase tracking-wider">Agent 01 | Risk Prediction</span>
                            </div>
                            <span className="rounded-full border border-blue-200 bg-white px-2 py-1 text-[8px] font-black text-blue-700">Completed</span>
                          </div>
                          <p className="mt-2 text-sm font-black text-slate-900">
                            {riskPrediction?.disasterType || assessmentActionModal.disasterType || "Prediction unavailable"}
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <ContextValue label="Risk Score" value={riskPrediction?.riskScore != null ? `${Number(riskPrediction.riskScore).toFixed(1)} / 100` : assessmentActionModal.riskScore != null ? `${Number(assessmentActionModal.riskScore).toFixed(1)} / 100` : ""} />
                            <ContextValue label="Risk Level" value={riskPrediction?.riskLevel || assessmentActionModal.riskLevel || ""} />
                            <ContextValue label="Confidence" value={riskPrediction?.confidence != null ? `${Number(riskPrediction.confidence).toFixed(1)}%` : ""} />
                            <ContextValue label="Prediction Source" value={riskPrediction?.predictionSource || "Not available"} />
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <ContextValue label="Latitude" value={riskPrediction?.latitude != null ? Number(riskPrediction.latitude).toFixed(4) : ""} />
                            <ContextValue label="Longitude" value={riskPrediction?.longitude != null ? Number(riskPrediction.longitude).toFixed(4) : ""} />
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-emerald-700">
                              <ShieldAlert size={15} />
                              <span className="text-[9px] font-black uppercase tracking-wider">Agent 02 | Vulnerability & Impact</span>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[8px] font-black text-emerald-700">Completed</span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <ContextValue label="Affected Population" value={Number(assessmentActionModal.affectedPopulation || 0).toLocaleString()} />
                            <ContextValue label="Vulnerability" value={assessmentActionModal.vulnerabilityScore != null ? `${Number(assessmentActionModal.vulnerabilityScore).toFixed(1)} / 100` : ""} />
                            <ContextValue label="Impact" value={assessmentActionModal.impactScore != null ? `${Number(assessmentActionModal.impactScore).toFixed(1)} / 100` : ""} />
                            <ContextValue label="Severity Index" value={`${getSeverityScore(assessmentActionModal).toFixed(1)} / 100`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {assessmentWorkflowStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600">Step 2 | Resource Analysis</p>
                      <h4 className="mt-1 text-base font-black text-slate-900">Agent 03 predicts resource demand and checks the real inventory</h4>
                      <p className="mt-1 text-[10px] leading-5 text-slate-500">Demand is predicted from Agent 02 risk, vulnerability, impact, disaster type and affected population, then matched against live ReliefResources inventory.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <ContextValue label="Affected Population" value={Number(assessmentActionModal.affectedPopulation || 0).toLocaleString()} />
                      <ContextValue label="Severity Index" value={`${getSeverityScore(assessmentActionModal).toFixed(1)} / 100`} />
                      <ContextValue label="Priority" value={getAgent03Priority(assessmentActionModal) || "High"} />
                      <ContextValue label="Inventory Records" value={String(inventory.length)} />
                    </div>

                    {demandLoading ? (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
                        <RefreshCw size={24} className="mx-auto animate-spin text-blue-600" />
                        <p className="mt-3 text-sm font-black text-blue-900">Analyzing real-time inventory...</p>
                        <p className="mt-1 text-[10px] text-blue-700">Calculating required resources and coverage.</p>
                      </div>
                    ) : demandReport ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <div>
                            <p className="text-sm font-black text-slate-900">Resource requirement analysis</p>
                            <p className="mt-1 text-[9px] text-slate-500">{demandReport.resources.length} inventory record(s) analyzed for {assessmentActionModal.location}.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-black text-blue-700">Predicted demand</span>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700">Live database</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50 p-4 md:grid-cols-4">
                          <ContextValue label="Severity" value={`${Number(demandReport.severityIndex || 0).toFixed(1)} / 100`} />
                          <ContextValue label="Priority Population" value={Number(demandReport.priorityAffectedPopulation || 0).toLocaleString()} />
                          <ContextValue label="Population Blocks" value={String(demandReport.populationBlocks || 0)} />
                          <ContextValue label="Severity Multiplier" value={Number(demandReport.severityMultiplier || 0).toFixed(2)} />
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                          <div className="grid grid-cols-[minmax(180px,1.4fr)_80px_90px_90px_80px] gap-2 border-b border-slate-100 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-wide text-slate-400">
                            <span>Resource</span><span>Required</span><span>Available</span><span>Allocatable</span><span>Gap</span>
                          </div>
                          {demandReport.resources.map((resource) => (
                            <div key={`${resource.resourceId}-${resource.resourceType}-${resource.resourceName}`} className="grid grid-cols-[minmax(180px,1.4fr)_80px_90px_90px_80px] items-center gap-2 border-b border-slate-100 px-4 py-3 last:border-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                  {getResourceImageUrl(resource.resourceName, resource.resourceType) ? <img src={getResourceImageUrl(resource.resourceName, resource.resourceType)} alt={resource.resourceName} className="h-full w-full object-cover" onError={(event) => {
                                    advanceImageFallback(
                                      event,
                                      getResourceImageCandidates(
                                        resource.resourceName,
                                        resource.resourceType
                                      )
                                    );
                                  }} /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><Package size={15} /></div>}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-[10px] font-bold text-slate-800">{resource.resourceName}</p>
                                  <p className="truncate text-[8px] text-slate-400">{resource.resourceType} | {resource.location}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-700">{resource.requiredQuantity}</span>
                              <span className="text-[10px] font-semibold text-slate-600">{resource.availableQuantity}</span>
                              <span className="text-[10px] font-bold text-emerald-700">{resource.allocatableQuantity}</span>
                              <span className={`text-[10px] font-black ${resource.gapQuantity > 0 ? "text-red-600" : "text-emerald-600"}`}>{resource.gapQuantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                        <AlertTriangle size={20} className="mx-auto text-amber-600" />
                        <p className="mt-2 text-xs font-black text-amber-800">Demand analysis is unavailable</p>
                        <p className="mt-1 text-[10px] text-amber-700">The Agent 03 demand endpoint did not return a report.</p>
                      </div>
                    )}
                  </div>
                )}

                {assessmentWorkflowStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-violet-600">Step 3 | Allocation Plan</p>
                      <h4 className="mt-1 text-base font-black text-slate-900">Review the recommended resource allocation</h4>
                      <p className="mt-1 text-[10px] leading-5 text-slate-500">All predicted resource requirements are shown. Real inventory is matched against each prediction; zero inventory remains a visible gap. Backend Agent 03 remains authoritative.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                      <ContextValue label="Resources" value={String(workflowTotals.resources)} />
                      <ContextValue label="Total Required" value={workflowTotals.required.toLocaleString()} />
                      <ContextValue label="Total Available" value={workflowTotals.available.toLocaleString()} />
                      <ContextValue label="Recommended" value={workflowTotals.allocate.toLocaleString()} />
                      <ContextValue label="Projected Gap" value={workflowTotals.gap.toLocaleString()} />
                    </div>

                    {workflowPlan.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                          <div className="min-w-[760px]">
                            <div className="grid grid-cols-[minmax(200px,1.5fr)_80px_90px_90px_80px_minmax(130px,1fr)] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[8px] font-black uppercase tracking-wide text-slate-400">
                              <span>Resource</span><span>Required</span><span>Available</span><span>Allocate</span><span>Gap</span><span>Location</span>
                            </div>
                            {workflowPlan.map((resource) => (
                              <div key={`${resource.resourceId}-${resource.resourceType}-${resource.resourceName}`} className="grid grid-cols-[minmax(200px,1.5fr)_80px_90px_90px_80px_minmax(130px,1fr)] items-center gap-2 border-b border-slate-100 px-4 py-3 last:border-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                    {getResourceImageUrl(resource.resourceName, resource.resourceType) ? <img src={getResourceImageUrl(resource.resourceName, resource.resourceType)} alt={resource.resourceName} className="h-full w-full object-cover" onError={(event) => {
                                    advanceImageFallback(
                                      event,
                                      getResourceImageCandidates(
                                        resource.resourceName,
                                        resource.resourceType
                                      )
                                    );
                                  }} /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><Package size={16} /></div>}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-bold text-slate-800">{resource.resourceName}</p>
                                    <p className="truncate text-[8px] text-slate-400">{resource.resourceType}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-700">{resource.required}</span>
                                <span className="text-[10px] font-semibold text-slate-600">{resource.available}</span>
                                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-center text-[10px] font-black text-emerald-700">{resource.recommended}</span>
                                <span className={`text-[10px] font-black ${resource.gap > 0 ? "text-red-600" : "text-emerald-600"}`}>{resource.gap}</span>
                                <span className="truncate text-[9px] font-semibold text-slate-600">{resource.location || assessmentActionModal.location || ""}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border-t border-blue-100 bg-blue-50 px-4 py-3 text-[9px] font-semibold text-blue-700">Agent 03 will check the real inventory again during confirmation and allocate only what is actually available.</div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                        <Boxes size={28} className="mx-auto text-slate-300" />
                        <p className="mt-3 text-xs font-black text-slate-700">No real inventory is available for the predicted requirements</p>
                        <p className="mt-1 text-[10px] text-slate-400">The demand prediction is still valid, but no matching real inventory is currently available for allocation.</p>
                      </div>
                    )}
                  </div>
                )}

                {assessmentWorkflowStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Step 4 | Confirmation</p>
                      <h4 className="mt-1 text-base font-black text-slate-900">{assessmentActionStatus.type === "success" ? "Agent 03 completed successfully" : "Confirm resource optimization"}</h4>
                      <p className="mt-1 text-[10px] leading-5 text-slate-500">{assessmentActionStatus.type === "success" ? "The live Agent 03 response was received and the dashboard was refreshed from the database." : "Review the final plan before creating real resource allocations."}</p>
                    </div>

                    {assessmentActionStatus.message && (
                      <div className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-[10px] font-semibold ${assessmentActionStatus.type === "error" ? "border-red-200 bg-red-50 text-red-700" : assessmentActionStatus.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                        {assessmentActionStatus.type === "running" ? <RefreshCw size={15} className="mt-0.5 shrink-0 animate-spin" /> : assessmentActionStatus.type === "success" ? <Check size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                        <span>{assessmentActionStatus.message}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                      <ContextValue label="Resources in Plan" value={String(workflowTotals.resources)} />
                      <ContextValue label="Total Required" value={workflowTotals.required.toLocaleString()} />
                      <ContextValue label="Total Available" value={workflowTotals.available.toLocaleString()} />
                      <ContextValue label="Planned Allocate" value={workflowTotals.allocate.toLocaleString()} />
                      <ContextValue label="Planned Gap" value={workflowTotals.gap.toLocaleString()} />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-black text-slate-900">Allocation Summary</p>
                        <p className="mt-1 text-[9px] text-slate-500">{assessmentActionModal.location} | {assessmentActionModal.disasterType}</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {(workflowPlan.length > 0 ? workflowPlan : demandReport?.resources || []).map((resource: any) => {
                          const quantity = "recommended" in resource ? resource.recommended : Math.min(Number(resource.requiredQuantity || 0), Number(resource.allocatableQuantity || 0));
                          return (
                            <div key={`${resource.resourceId}-${resource.resourceType}-${resource.resourceName}`} className="flex items-center justify-between gap-3 px-4 py-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                  {getResourceImageUrl(resource.resourceName, resource.resourceType) ? <img src={getResourceImageUrl(resource.resourceName, resource.resourceType)} alt={resource.resourceName} className="h-full w-full object-cover" onError={(event) => {
                                    advanceImageFallback(
                                      event,
                                      getResourceImageCandidates(
                                        resource.resourceName,
                                        resource.resourceType
                                      )
                                    );
                                  }} /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><Package size={16} /></div>}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-[10px] font-black text-slate-800">{resource.resourceName}</p>
                                  <p className="mt-0.5 truncate text-[8px] text-slate-400">{resource.location || assessmentActionModal.location || ""} | {resource.resourceType}</p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <span className="text-[11px] font-black text-slate-800">{Number(quantity).toLocaleString()} units</span>
                                <span className={`rounded-full px-2 py-1 text-[8px] font-black ${quantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{quantity > 0 ? "Ready" : "Not allocated"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {assessmentActionStatus.type === "success" && (
                      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check size={22} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-emerald-900">Resource Allocation Completed</p>
                            <p className="mt-1 text-[10px] text-emerald-700">
                              Agent 03 completed the real database operation. The values below are the allocations returned from the live database.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <ContextValue
                            label="Total Allocated"
                            value={completedAllocationTotals.allocated.toLocaleString()}
                          />
                          <ContextValue
                            label="Remaining Gap"
                            value={completedAllocationTotals.gap.toLocaleString()}
                          />
                          <ContextValue
                            label="Coverage"
                            value={`${completedAllocationTotals.coverage.toFixed(1)}%`}
                          />
                        </div>

                        <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
                          <div className="border-b border-emerald-100 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                              Actual Allocation Details
                            </p>
                          </div>

                          {completedAssessmentAllocations.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                              {completedAssessmentAllocations.map((allocation) => (
                                <div
                                  key={allocation.id}
                                  className="flex items-center justify-between gap-3 px-4 py-3"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                      {getResourceImageUrl(
                                        allocation.resourceName,
                                        allocation.resourceType
                                      ) ? (
                                        <img
                                          src={getResourceImageUrl(
                                            allocation.resourceName,
                                            allocation.resourceType
                                          )}
                                          alt={allocation.resourceName}
                                          className="h-full w-full object-cover"
                                          onError={(event) => {
                                            advanceImageFallback(
                                            event,
                                            getResourceImageCandidates(
                                              allocation.resourceName,
                                              allocation.resourceType
                                            )
                                          );
                                          }}
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                                          <Package size={16} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-[10px] font-black text-slate-800">
                                        {allocation.resourceName}
                                      </p>
                                      <p className="mt-0.5 truncate text-[8px] text-slate-400">
                                        {allocation.location || ""} | {allocation.resourceType}
                                      </p>
                                    </div>
                                  </div>

                                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                                    {Number(
                                      allocation.recommendedQuantity || 0
                                    ).toLocaleString()}{" "}
                                    units
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-5 text-center text-[10px] font-semibold text-slate-500">
                              No real inventory was available to allocate. The predicted demand remains visible above as the outstanding gap.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 md:px-7">
                <div className="text-[9px] font-semibold text-slate-400">
                  {assessmentWorkflowStep === 1 && "No resources will be changed yet."}
                  {assessmentWorkflowStep === 2 && "Prediction + inventory analysis | no database values are changed at this stage."}
                  {assessmentWorkflowStep === 3 && "Review only | backend Agent 03 remains authoritative."}
                  {assessmentWorkflowStep === 4 && assessmentActionStatus.type !== "success" && "Confirmation will create real allocations only from inventory that actually exists in the database."}
                  {assessmentWorkflowStep === 4 && assessmentActionStatus.type === "success" && "Database operation completed."}
                </div>

                <div className="flex items-center gap-2">
                  {assessmentWorkflowStep > 1 && assessmentActionStatus.type !== "running" && (
                    <button type="button" onClick={handleWorkflowBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50">
                      <ChevronLeft size={13} /> Back
                    </button>
                  )}

                  {assessmentWorkflowStep === 1 && (
                    <button type="button" onClick={closeAssessmentActionModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  )}

                  {assessmentWorkflowStep < 3 && (
                    <button type="button" onClick={() => void handleWorkflowNext()} disabled={assessmentWorkflowStep === 2 && demandLoading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[10px] font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {assessmentWorkflowStep === 1 ? "Start Resource Analysis" : "Review Allocation Plan"} <ChevronRight size={13} />
                    </button>
                  )}

                  {assessmentWorkflowStep === 3 && (
                    <button type="button" onClick={() => setAssessmentWorkflowStep(4)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[10px] font-black text-white shadow-sm hover:bg-blue-700">
                      Continue to Confirmation <ChevronRight size={13} />
                    </button>
                  )}

                  {assessmentWorkflowStep === 4 && assessmentActionStatus.type !== "success" && (
                    <button
                      type="button"
                      aria-label="Confirm and Run Agent 03"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void handleWorkflowConfirm();
                      }}
                      disabled={assessmentActionStatus.type === "running" || !assessmentActionModal?.id}
                      className="relative z-[1600] inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[10px] font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
                      style={{ pointerEvents: assessmentActionStatus.type === "running" || !assessmentActionModal?.id ? "none" : "auto" }}
                    >
                      {assessmentActionStatus.type === "running" ? <><RefreshCw size={13} className="animate-spin" /> Running Agent 03...</> : <><Sparkles size={13} /> Confirm & Run Agent 03</>}
                    </button>
                  )}

                  {assessmentWorkflowStep === 4 && assessmentActionStatus.type === "success" && (
                    <button type="button" onClick={closeAssessmentActionModal} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[10px] font-black text-white shadow-sm hover:bg-emerald-700">
                      <Check size={13} /> Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / UPDATE MODAL */}
        {inventoryModal && (
          <div className="fixed inset-0 z-[1700] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Boxes size={17} /></div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{inventoryModal === "create" ? "Add Resource Inventory" : "Edit Resource Inventory"}</h3>
                      <p className="mt-1 text-[10px] text-slate-500">This record is saved directly to the ReliefResources database.</p>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => { if (!inventorySaving) setInventoryModal(null); }} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
              </div>

              <div className="space-y-4 px-6 py-5">
                {crudError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-semibold text-red-700">{crudError}</div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">Resource Type</span>
                    <select
                      value={inventoryForm.resourceType}
                      onChange={(e) => setInventoryForm((current) => ({ ...current, resourceType: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                    >
                      <option value="">Select type</option>
                      <option value="Water">Water</option>
                      <option value="Food">Food</option>
                      <option value="Medical">Medical</option>
                      <option value="Hygiene">Hygiene</option>
                      <option value="Shelter">Shelter</option>
                      <option value="Blanket">Blanket</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Transport">Transport</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">Resource Name</span>
                    <input
                      value={inventoryForm.resourceName}
                      onChange={(e) => setInventoryForm((current) => ({ ...current, resourceName: e.target.value }))}
                      placeholder="e.g. Drinking Water"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">Available Quantity</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={inventoryForm.availableQuantity}
                      onChange={(e) => setInventoryForm((current) => ({ ...current, availableQuantity: Number(e.target.value) }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">Location</span>
                    <input
                      value={inventoryForm.location}
                      onChange={(e) => setInventoryForm((current) => ({ ...current, location: e.target.value }))}
                      placeholder="e.g. Trincomalee"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[10px] leading-5 text-blue-700">
                  Agent 03 will read this quantity from the live database during Resource Analysis and Confirmation. No mock quantity is created by the frontend.
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <button type="button" disabled={inventorySaving} onClick={() => setInventoryModal(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="button" disabled={inventorySaving} onClick={() => void handleSaveInventory()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50">
                  {inventorySaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {inventorySaving ? "Saving..." : inventoryModal === "create" ? "Add Inventory" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {inventoryDelete && (
          <div className="fixed inset-0 z-[1750] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
              <div className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><Trash2 size={18} /></div>
                <h3 className="mt-4 text-base font-black text-slate-900">Delete inventory record?</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">This will permanently remove <strong>{inventoryDelete.resourceName}</strong> from the ReliefResources database at <strong>{inventoryDelete.location}</strong>.</p>
                {crudError && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-semibold text-red-700">{crudError}</div>}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <button type="button" disabled={inventorySaving} onClick={() => setInventoryDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="button" disabled={inventorySaving} onClick={() => void handleDeleteInventory()} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50">
                  {inventorySaving ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {inventorySaving ? "Deleting..." : "Delete Inventory"}
                </button>
              </div>
            </div>
          </div>
        )}

        {allocationModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Agent 03 Resource Allocation</p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    {allocationModal === "create" ? "Create Allocation" : "Update Allocation"}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-400">Uses live ReliefResources inventory and the selected Agent 02 assessment.</p>
                </div>
                <button type="button" onClick={() => setAllocationModal(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-4 p-6">
                {crudError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">{crudError}</div>
                )}

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Agent 02 Assessment</label>
                  <input
                    value={allocationForm.vulnerabilityAssessmentId}
                    readOnly
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Resource</label>
                    <select
                      value={allocationForm.resourceId}
                      onChange={(e) => handleResourceFormChange(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="">Select resource</option>
                      {inventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.resourceName} | {item.location} | {item.availableQuantity - item.allocatedQuantity} available
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Priority</label>
                    <select
                      value={allocationForm.priority}
                      onChange={(e) => setAllocationForm((v) => ({ ...v, priority: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                    >
                      {["Critical", "High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={allocationForm.recommendedQuantity}
                      onChange={(e) => setAllocationForm((v) => ({ ...v, recommendedQuantity: Number(e.target.value) }))}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Location</label>
                    <input
                      value={allocationForm.location}
                      onChange={(e) => setAllocationForm((v) => ({ ...v, location: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ContextValue label="Type" value={allocationForm.resourceType || ""} />
                  <ContextValue label="Resource" value={allocationForm.resourceName || ""} />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <button type="button" onClick={() => setAllocationModal(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="button" onClick={handleSaveAllocation} disabled={crudSaving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  <Save size={14} />
                  {crudSaving ? "Saving..." : allocationModal === "create" ? "Create Allocation" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION */}
        {deleteAllocation && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={19} />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">Delete allocation?</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                This will remove <span className="font-bold text-slate-700">{deleteAllocation.resourceName}</span> ({deleteAllocation.recommendedQuantity} units) and return its quantity to the live inventory.
              </p>
              {crudError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[10px] text-red-700">{crudError}</p>}
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteAllocation(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="button" onClick={handleDeleteAllocation} disabled={crudSaving} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                  {crudSaving ? "Deleting..." : "Delete Allocation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NON-BLOCKING ACTION STATUS */}
        {(optimizing || assessmentActionStatus.type === "running") && (
          <div className="pointer-events-none fixed bottom-5 right-5 z-[1500] w-[320px] rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <RefreshCw size={17} className="animate-spin" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800">Agent 03 is running...</p>
                <p className="mt-0.5 truncate text-[9px] text-slate-400">Backend is processing the selected assessment.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY TAB
========================================================= */

function EmptyTab({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-[9px] font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}


import type { FormEvent } from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  CloudRain,
  Gauge,
  Globe2,
  Leaf,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Users,
  Wind,
} from "lucide-react";

import RiskPredictionForm from "../components/RiskPredictionForm";
import RiskMap from "../components/RiskMap";
import PredictionDetailsModal from "../components/PredictionDetailsModal";
import DisasterRiskGrid from "../components/DisasterRiskGrid";
import DataSources from "../components/DataSources";

import { useRiskPrediction } from "../hooks/useRiskPrediction";
import { getRiskPredictionEnvironment } from "../services/riskPredictionApi";


import type {
  RiskPrediction,
  RiskPredictionRequest,
} from "../types/riskPrediction.types";

const EMPTY_FORM: RiskPredictionRequest = {
  location: "",
  latitude: 0,
  longitude: 0,

  rainfall1h: 0,
  rainfall3h: 0,
  rainfall24h: 0,

  riverLevel: 0,
  riverFlow: 0,

  temperature: 0,
  humidity: 0,
  windSpeed: 0,
  soilMoisture: 0,

  elevation: 0,
  populationDensity: 0,

  historicalFloodCount: 0,
  historicalSeverity: 0,
  drainageCapacity: 0,

  forecastRainfall: 0,
};

const SRI_LANKA_CENTER = {
  latitude: 7.8731,
  longitude: 80.7718,
};

type RiskEnvironmentData = {
  rainfall1h?: number | null;
  rainfall3h?: number | null;
  rainfall24h?: number | null;
  riverLevel?: number | null;
  riverFlow?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  soilMoisture?: number | null;
  elevation?: number | null;
  forecastRainfall?: number | null;
  populationDensity?: number | null;
  historicalFloodCount?: number | null;
  historicalSeverity?: number | null;
  drainageCapacity?: number | null;
};

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function isValidNumber(value: number): boolean {
  return Number.isFinite(value);
}

function disasterPhoto(type?: string): string {
  const value = String(type ?? "").toLowerCase();

  if (value.includes("flood")) return "/assets/disasters/flood.jpg";
  if (value.includes("drought")) return "/assets/disasters/drought.jpg";
  if (value.includes("cyclone") || value.includes("storm")) return "/assets/disasters/cyclone.jpg";
  if (value.includes("earthquake")) return "/assets/disasters/earthquake.jpg";
  if (value.includes("landslide")) return "/assets/disasters/landslide.jpg";
  if (value.includes("wildfire") || value.includes("forest fire")) return "/assets/disasters/wildfire.jpg";
  if (value.includes("tsunami")) return "/assets/disasters/tsunami.jpg";
  if (value.includes("lightning")) return "/assets/disasters/lightning.jpg";
  return "";
}

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function predictionMatchesForm(
  item: RiskPrediction | null | undefined,
  currentForm: RiskPredictionRequest
): boolean {
  if (!item) return false;

  const itemLat = Number((item as any).latitude);
  const itemLng = Number((item as any).longitude);

  const formHasCoords =
    Number.isFinite(currentForm.latitude) &&
    Number.isFinite(currentForm.longitude) &&
    !(currentForm.latitude === 0 && currentForm.longitude === 0);

  const itemHasCoords =
    Number.isFinite(itemLat) &&
    Number.isFinite(itemLng) &&
    !(itemLat === 0 && itemLng === 0);

  if (formHasCoords && itemHasCoords) {
    const coordinatesMatch =
      Math.abs(itemLat - currentForm.latitude) < 0.02 &&
      Math.abs(itemLng - currentForm.longitude) < 0.02;

    if (coordinatesMatch) return true;
  }

  const formLocation = currentForm.location.trim().toLowerCase();
  const itemLocation = String((item as any).location ?? "").trim().toLowerCase();

  return Boolean(
    formLocation &&
      itemLocation &&
      (formLocation === itemLocation ||
        formLocation.includes(itemLocation) ||
        itemLocation.includes(formLocation))
  );
}

function getPrimaryRiskDisplay(
  prediction: RiskPrediction | null
): RiskPrediction | null {
  if (!prediction) {
    return null;
  }

  const available = (prediction.disasterRisks ?? [])
    .filter(
      (risk) =>
        risk.dataAvailable === true &&
        risk.riskScore !== null &&
        risk.riskScore !== undefined &&
        Number.isFinite(Number(risk.riskScore))
    )
    .sort((a, b) => Number(b.riskScore) - Number(a.riskScore))[0];

  if (!available) {
    return null;
  }

  return {
    ...prediction,
    disasterType:
      String(available.disasterType ?? "").trim() ||
      prediction.disasterType,
    riskScore: Number(available.riskScore),
    riskLevel:
      available.riskLevel ||
      prediction.riskLevel,
  };
}

export default function RiskPredictionPage() {
  const [approvalMessage, setApprovalMessage] = useState("");
  const {
    prediction,
    recentPredictions,
    externalEvents,
    loading,
    loadingRecent,
    loadingEvents,
    error,
    eventsError,
    predict,
    loadRecentPredictions,
    loadExternalEvents,
    updatePrediction,
  } = useRiskPrediction();

  const [form, setForm] =
    useState<RiskPredictionRequest>(EMPTY_FORM);

  const [showDetails, setShowDetails] = useState(false);

  // Shows an existing saved prediction in the right-side result panel
  // before a new prediction is generated in this session.
  const [selectedRecentPrediction, setSelectedRecentPrediction] =
    useState<RiskPrediction | null>(null);

  // Dedicated selection for the Recent Predictions details window.
  // This is intentionally separate from the main result-panel state so
  // clicking a saved prediction can open its own complete detail view.
  const [selectedRecentDetails, setSelectedRecentDetails] =
    useState<RiskPrediction | null>(null);

  const skipLocationAutoPredictRef = useRef(false);

  /*
   * Load real history and external disaster events
   * when the page is opened.
   */
  useEffect(() => {
    void loadRecentPredictions();
    void loadExternalEvents();
  }, [loadRecentPredictions, loadExternalEvents]);

  useEffect(() => {
    if (!prediction && recentPredictions.length > 0 && !selectedRecentPrediction) {
      setSelectedRecentPrediction(recentPredictions[0]);
    }
  }, [prediction, recentPredictions, selectedRecentPrediction]);

  function updateField<K extends keyof RiskPredictionRequest>(
    field: K,
    value: RiskPredictionRequest[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleMapLocation(
    latitude: number,
    longitude: number
  ) {
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return;
    }

    let locationName = form.location || "Selected location";

    // Reverse geocode the clicked map location.
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data?.address;

        locationName =
          address?.city ||
          address?.town ||
          address?.municipality ||
          address?.village ||
          address?.county ||
          data?.display_name?.split(",")[0] ||
          locationName;
      }
    } catch (error) {
      console.error("[Map Location ERROR] Reverse geocoding failed:", error);
    }

    // Load real environmental data for the selected point.
    let environment: RiskEnvironmentData = {};
    try {
      environment = await getRiskPredictionEnvironment(
        latitude,
        longitude,
        locationName
      );
    } catch (error) {
      console.error("[Environment ERROR] Failed to load live environment data:", error);
    }

    const nextForm: RiskPredictionRequest = {
      ...form,
      location: locationName,
      latitude,
      longitude,
      rainfall1h: environment.rainfall1h ?? form.rainfall1h,
      rainfall3h: environment.rainfall3h ?? form.rainfall3h,
      rainfall24h: environment.rainfall24h ?? form.rainfall24h,
      riverLevel: environment.riverLevel ?? form.riverLevel,
      riverFlow: environment.riverFlow ?? form.riverFlow,
      temperature: environment.temperature ?? form.temperature,
      humidity: environment.humidity ?? form.humidity,
      windSpeed: environment.windSpeed ?? form.windSpeed,
      soilMoisture: environment.soilMoisture ?? form.soilMoisture,
      forecastRainfall:
        environment.forecastRainfall ?? form.forecastRainfall,
      populationDensity:
        environment.populationDensity ?? form.populationDensity,
      historicalFloodCount:
        environment.historicalFloodCount ?? form.historicalFloodCount,
      historicalSeverity:
        environment.historicalSeverity ?? form.historicalSeverity,
      drainageCapacity:
        environment.drainageCapacity ?? form.drainageCapacity,
    };

    setForm(nextForm);
    setSelectedRecentPrediction(null);

    // Automatically generate the risk prediction from the map-selected location.
    try {
      await predict(nextForm);
      await loadRecentPredictions();
    } catch (error) {
      console.error("[Map Prediction ERROR]", error);
    }
  }

  // ============================================================
  // LOCATION NAME -> AUTOMATIC LATITUDE / LONGITUDE
  // ============================================================
  useEffect(() => {
    const location = form.location.trim();

    if (location.length < 3) {
      return;
    }

    if (skipLocationAutoPredictRef.current) {
      skipLocationAutoPredictRef.current = false;
      return;
    }

    const timer = window.setTimeout(async () => {
      setSelectedRecentPrediction(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(location)}`
        );

        if (!response.ok) {
          return;
        }

        const results = await response.json();

        if (!Array.isArray(results) || results.length === 0) {
          return;
        }

        const result = results[0];
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);

        if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
          return;
        }

        let environment: RiskEnvironmentData = {};

        try {
          environment = await getRiskPredictionEnvironment(
            latitude,
            longitude,
            location
          );
        } catch (environmentError) {
          console.error(
            "[Location Search] Environment loading failed:",
            environmentError
          );
        }

        const nextForm: RiskPredictionRequest = {
          ...form,
          location,
          latitude,
          longitude,
          rainfall1h: environment.rainfall1h ?? form.rainfall1h,
          rainfall3h: environment.rainfall3h ?? form.rainfall3h,
          rainfall24h: environment.rainfall24h ?? form.rainfall24h,
          riverLevel: environment.riverLevel ?? form.riverLevel,
          riverFlow: environment.riverFlow ?? form.riverFlow,
          temperature: environment.temperature ?? form.temperature,
          humidity: environment.humidity ?? form.humidity,
          windSpeed: environment.windSpeed ?? form.windSpeed,
          soilMoisture: environment.soilMoisture ?? form.soilMoisture,
          forecastRainfall:
            environment.forecastRainfall ?? form.forecastRainfall,
          populationDensity:
            environment.populationDensity ?? form.populationDensity,
          historicalFloodCount:
            environment.historicalFloodCount ?? form.historicalFloodCount,
          historicalSeverity:
            environment.historicalSeverity ?? form.historicalSeverity,
          drainageCapacity:
            environment.drainageCapacity ?? form.drainageCapacity,
        };

        setForm(nextForm);
        setSelectedRecentPrediction(null);

        try {
          await predict(nextForm);
          await loadRecentPredictions();
        } catch (predictionError) {
          console.error(
            "[Location Search] Prediction failed:",
            predictionError
          );
        }
      } catch (error) {
        console.error("[Location Search ERROR]", error);
      }
    }, 850);

    return () => window.clearTimeout(timer);
  }, [form.location]);

  function validateForm(): string | null {
    if (!form.location.trim()) {
      return "Please enter a location.";
    }

    if (!isValidLatitude(form.latitude)) {
      return "Please enter a valid latitude.";
    }

    if (!isValidLongitude(form.longitude)) {
      return "Please enter a valid longitude.";
    }

    const numericFields: Array<
      keyof Omit<
        RiskPredictionRequest,
        "location" | "latitude" | "longitude"
      >
    > = [
      "rainfall1h",
      "rainfall3h",
      "rainfall24h",
      "riverLevel",
      "riverFlow",
      "temperature",
      "humidity",
      "windSpeed",
      "soilMoisture",
      "elevation",
      "populationDensity",
      "historicalFloodCount",
      "historicalSeverity",
      "drainageCapacity",
      "forecastRainfall",
    ];

    for (const field of numericFields) {
      if (!isValidNumber(form[field])) {
        return `${String(field)} must be a valid number.`;
      }
    }

    return null;
  }

  async function handlePredict(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      return;
    }

    try {
      setSelectedRecentPrediction(null);
      await predict(form);

      // Refresh the Recent Predictions cards so the newly generated
      // prediction (including its disasterRisks) appears immediately.
      await loadRecentPredictions();
    } catch {
      /*
       * The hook stores the API error.
       */
    }
  }

  const mapLatitude =
    isValidLatitude(form.latitude)
      ? form.latitude
      : SRI_LANKA_CENTER.latitude;

  const mapLongitude =
    isValidLongitude(form.longitude)
      ? form.longitude
      : SRI_LANKA_CENTER.longitude;

  const candidatePrediction = prediction ?? selectedRecentPrediction;

  const displayPrediction = predictionMatchesForm(candidatePrediction, form)
    ? getPrimaryRiskDisplay(candidatePrediction)
    : null;

  const hasRealPrimaryRisk =
    Boolean(displayPrediction) &&
    String(displayPrediction?.disasterType ?? "").trim() !== "" &&
    String(displayPrediction?.disasterType ?? "").trim().toLowerCase() !== "dataunavailable" &&
    displayPrediction?.riskScore !== null &&
    displayPrediction?.riskScore !== undefined &&
    Number.isFinite(Number(displayPrediction?.riskScore));

  const primaryDisasterType = hasRealPrimaryRisk
    ? String(displayPrediction?.disasterType ?? "").trim()
    : "";

  const primaryDisasterPhoto = primaryDisasterType
    ? disasterPhoto(primaryDisasterType)
    : "";

  return (
    <div className="min-h-screen bg-[#edf3f9] text-slate-900">
      <main className="mx-auto max-w-[1880px] px-3 pb-10 sm:px-5 lg:px-6">

        {/* TOP HERO */}
        <section className="relative mt-3 overflow-hidden rounded-[26px] border border-white shadow-[0_22px_65px_rgba(12,35,65,0.16)]">
          <img
            src="/assets/disasters/flood.jpg"
            alt="Sri Lankan disaster risk environment"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,18,40,.96)_0%,rgba(5,32,58,.82)_38%,rgba(7,38,62,.42)_72%,rgba(7,38,62,.18)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071a32]/55 via-transparent to-transparent" />

          <div className="relative px-5 py-7 sm:px-8 lg:px-10 lg:py-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
                  Risk Prediction Agent
                </div>

                <h1 className="mt-4 text-[38px] font-black tracking-[-0.035em] sm:text-[52px] lg:text-[58px]">
                  Risk <span className="text-blue-400">Prediction</span>
                </h1>

                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-white/75 sm:text-base">
                  AI-powered multi-disaster risk analysis for a safer Sri Lanka.
                  Combine location, environmental conditions and historical signals in one operational workspace.
                </p>

                <div className="mt-6 grid max-w-3xl gap-2 sm:grid-cols-3">
                  <HeroFeature icon={<MapPin className="h-4 w-4" />} title="Location Analysis" text="Precise coordinates and local context." />
                  <HeroFeature icon={<Leaf className="h-4 w-4" />} title="Environmental Data" text="Live and historical environmental signals." />
                  <HeroFeature icon={<BarChart3 className="h-4 w-4" />} title="AI Risk Assessment" text="Multi-disaster scores and insights." />
                </div>
              </div>

              <div className="hidden w-[310px] shrink-0 xl:block">
                <div className="rounded-[22px] border border-white/15 bg-slate-950/35 p-5 text-white shadow-2xl backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/45">Current Focus</p>
                      <p className="mt-2 text-lg font-black">{form.location || "Sri Lanka"}</p>
                      <p className="mt-1 text-[9px] font-semibold text-white/55">
                        {isValidLatitude(form.latitude) && isValidLongitude(form.longitude)
                          ? `${form.latitude.toFixed(4)}°, ${form.longitude.toFixed(4)}°`
                          : "Select a location"}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                      <Globe2 className="h-5 w-5 text-blue-200" />
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <HeroStat label="External Events" value={String(externalEvents.length)} />
                    <HeroStat label="Prediction" value={displayPrediction ? "Ready" : "Waiting"} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATUS / LIVE CONTEXT */}
        <section className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <ContextCard
            icon={<MapPin className="h-4 w-4" />}
            label="Selected Location"
            value={form.location || "Not selected"}
            detail={
              isValidLatitude(form.latitude) && isValidLongitude(form.longitude)
                ? `${form.latitude.toFixed(4)}°, ${form.longitude.toFixed(4)}°`
                : "Map selectable"
            }
          />
          <ContextCard
            icon={<CloudRain className="h-4 w-4" />}
            label="Rainfall 24h"
            value={`${safeNumber(form.rainfall24h).toFixed(1)} mm`}
            detail={`${safeNumber(form.rainfall1h).toFixed(1)} mm / last hour`}
          />
          <ContextCard
            icon={<Thermometer className="h-4 w-4" />}
            label="Temperature"
            value={`${safeNumber(form.temperature).toFixed(1)} °C`}
            detail={`${safeNumber(form.humidity).toFixed(0)}% humidity`}
          />
          <ContextCard
            icon={<Users className="h-4 w-4" />}
            label="Population Density"
            value={`${safeNumber(form.populationDensity).toLocaleString()} / km²`}
            detail="Local population context"
          />
          <ContextCard
            icon={<Activity className="h-4 w-4" />}
            label="Prediction Status"
            value={displayPrediction ? "Analysis Ready" : "Ready"}
            detail={displayPrediction ? "AI result available" : "Awaiting prediction"}
            success={Boolean(displayPrediction)}
          />
        </section>

        {approvalMessage && (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 shadow-sm">
            {approvalMessage}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {eventsError && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 shadow-sm">
            External disaster events could not be loaded. The map may not show current events.
          </div>
        )}

        {/* MAIN WORKSPACE */}
        <section className="mt-3 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,35,65,0.09)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Radar className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[14px] font-black tracking-tight">Prediction Workspace</h2>
                  <p className="mt-0.5 text-[8px] font-semibold text-slate-400">
                    Configure inputs, select a location and review the AI prediction result.
                  </p>
                </div>
                <span className="ml-1 rounded-full bg-blue-50 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-blue-700">
                  Live Analysis
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[8px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Live</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Map</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />AI</span>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:p-4 xl:grid-cols-[390px_minmax(0,1fr)_390px]">

            {/* FORM */}
            <div className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Gauge className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-black">Predict Disaster Risk</h3>
                    <p className="mt-1 text-[8px] font-semibold leading-4 text-slate-400">
                      Select a location and provide environmental data for AI analysis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[720px] overflow-y-auto">
                <RiskPredictionForm
                  value={form}
                  loading={loading}
                  onChange={updateField}
                  onPredict={handlePredict}
                />
              </div>
            </div>

            {/* MAP */}
            <div className="relative min-h-[560px] min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-[#08233a] shadow-sm">
              <div className="absolute left-4 top-4 z-[1000] rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20">
                    <Radar className="h-4 w-4 text-blue-300" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black">Interactive Risk Map</p>
                    <p className="mt-0.5 text-[7px] font-semibold text-white/55">Click anywhere to select a prediction location</p>
                  </div>
                </div>
              </div>

              <div className="absolute right-4 top-4 z-[1000] rounded-2xl border border-white/20 bg-white/95 p-3 shadow-xl backdrop-blur">
                <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">External Events</p>
                <p className="mt-1 text-xl font-black text-slate-900">{externalEvents.length}</p>
                <div className="mt-1 flex items-center gap-2 text-[7px] font-bold">
                  <span className="text-red-600">Red alerts</span>
                  <span className="text-orange-500">Live events</span>
                </div>
              </div>

              {loadingEvents && (
                <div className="absolute bottom-4 left-4 z-[1000] rounded-full bg-white/95 px-3 py-2 text-[8px] font-black text-slate-700 shadow-lg">
                  Loading events...
                </div>
              )}

              <RiskMap
                latitude={mapLatitude}
                longitude={mapLongitude}
                locationLabel={form.location}
                events={externalEvents}
                onLocationChange={handleMapLocation}
              />
            </div>

            {/* RESULT */}
            <div className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Activity className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-black">Prediction Result</h3>
                    <p className="mt-1 text-[8px] font-semibold text-slate-400">AI analysis based on provided data</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[7px] font-black ${
                  displayPrediction
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-600"
                }`}>
                  {displayPrediction ? "Generated" : "Ready"}
                </span>
              </div>

              <div className="p-4">
                {hasRealPrimaryRisk ? (
                  <>
                    <div className="relative overflow-hidden rounded-[22px] bg-slate-950">
                      {primaryDisasterPhoto ? (
                        <img
                          src={primaryDisasterPhoto}
                          alt={`${primaryDisasterType} risk`}
                          className="h-[205px] w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-[205px] w-full items-center justify-center bg-slate-100">
                          <div className="px-6 text-center">
                            <Radar className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-3 text-[10px] font-black text-slate-500">
                              Disaster image unavailable
                            </p>
                            <p className="mt-1 text-[8px] font-semibold text-slate-400">
                              No image is configured for this disaster type.
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-white/50">Risk Score</p>
                            <p className="mt-1 text-[42px] font-black leading-none text-white">
                              {safeNumber((displayPrediction as any).riskScore).toFixed(1)}%
                            </p>
                            <p className="mt-2 text-[9px] font-bold text-white/70">
                              {(displayPrediction as any).disasterType || "Multi-disaster analysis"}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[8px] font-black text-white backdrop-blur-md">
                            {(displayPrediction as any).riskLevel || "ASSESSED"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <MetricCard
                        icon={<ShieldCheck className="h-4 w-4" />}
                        label="Confidence"
                        value={`${safeNumber((displayPrediction as any).confidence).toFixed(1)}%`}
                      />
                      <MetricCard
                        icon={<MapPin className="h-4 w-4" />}
                        label="Location"
                        value={(displayPrediction as any).location || form.location || "Selected area"}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <MetricCard
                        icon={<Thermometer className="h-4 w-4" />}
                        label="Temperature"
                        value={`${safeNumber(form.temperature).toFixed(1)} °C`}
                      />
                      <MetricCard
                        icon={<CloudRain className="h-4 w-4" />}
                        label="Rainfall 24h"
                        value={`${safeNumber(form.rainfall24h).toFixed(1)} mm`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDetails(true)}
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[9px] font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      <Radar className="h-4 w-4" />
                      View Full Prediction Details
                    </button>
                  </>
                ) : (
                  <div className="flex min-h-[510px] flex-col items-center justify-center px-5 text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-slate-100 shadow-sm">
                      <BarChart3 className="h-9 w-9 text-slate-300" />
                    </div>
                    <h3 className="mt-5 text-[17px] font-black">No prediction yet</h3>
                    <p className="mt-2 max-w-[290px] text-[9px] font-medium leading-5 text-slate-400">
                      Select a location, confirm the environmental data, and run a fresh prediction.
                    </p>

                    <div className="mt-6 w-full rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left">
                      <div className="flex items-start gap-3">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <div>
                          <p className="text-[9px] font-black text-blue-900">How it works</p>
                          <p className="mt-1 text-[8px] font-semibold leading-4 text-blue-700/75">
                            The backend risk analysis service evaluates the submitted location and environmental values and returns available risks, factors and recommendations.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid w-full grid-cols-3 gap-2">
                      <TinyCard icon={<MapPin className="h-3.5 w-3.5" />} label="Location" />
                      <TinyCard icon={<CloudRain className="h-3.5 w-3.5" />} label="Environment" />
                      <TinyCard icon={<Gauge className="h-3.5 w-3.5" />} label="Risk Score" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* INTELLIGENCE STRIP */}
        <section className="mt-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[12px] font-black">Risk Intelligence</h2>
              <p className="mt-1 text-[8px] font-semibold text-slate-400">
                Signals currently available to the prediction engine.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[7px] font-black text-slate-500">
              LIVE DATA
            </span>
          </div>

          <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
            <PhotoInsightCard
              photo="/assets/disasters/flood.jpg"
              icon={<CloudRain className="h-4 w-4" />}
              title="Hydrological Signals"
              value={`${safeNumber(form.rainfall24h).toFixed(1)} mm / 24h`}
              detail={`River ${safeNumber(form.riverLevel).toFixed(1)} m`}
              tag="Flood context"
            />
            <PhotoInsightCard
              photo="/assets/disasters/heatstorm.jpg"
              icon={<Thermometer className="h-4 w-4" />}
              title="Atmospheric Conditions"
              value={`${safeNumber(form.temperature).toFixed(1)} °C`}
              detail={`${safeNumber(form.humidity).toFixed(0)}% humidity`}
              tag="Weather context"
            />
            <PhotoInsightCard
              photo="/assets/disasters/landslide.jpg"
              icon={<Wind className="h-4 w-4" />}
              title="Wind & Soil"
              value={`${safeNumber(form.windSpeed).toFixed(1)} km/h`}
              detail={`Soil moisture ${safeNumber(form.soilMoisture).toFixed(2)}`}
              tag="Terrain context"
            />
            <PhotoInsightCard
              photo="/assets/disasters/tsunami.jpg"
              icon={<Users className="h-4 w-4" />}
              title="Population Context"
              value={`${safeNumber(form.populationDensity).toLocaleString()} /km²`}
              detail={`${safeNumber(form.historicalFloodCount).toFixed(0)} historical events`}
              tag="Exposure context"
            />
          </div>
        </section>

        {/* PREDICTION ANALYSIS */}
        {hasRealPrimaryRisk && (
          <>
            <section className="mt-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="relative h-[145px]">
                {primaryDisasterPhoto ? (
                  <img
                    src={primaryDisasterPhoto}
                    alt={`${primaryDisasterType} risk`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-slate-100" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-transparent" />
                <div className="absolute inset-y-0 left-0 flex items-center px-6">
                  <div>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur">
                      Generated Risk Profile
                    </span>
                    <h2 className="mt-3 text-[20px] font-black text-white">
                      {(displayPrediction as any).disasterType || "Disaster"} Assessment
                    </h2>
                    <p className="mt-1 text-[8px] font-semibold text-white/60">
                      {(displayPrediction as any).location || form.location || "Selected area"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <AnalysisMetric title="Risk Score" value={`${safeNumber((displayPrediction as any).riskScore).toFixed(1)}%`} />
                <AnalysisMetric title="Confidence" value={`${safeNumber((displayPrediction as any).confidence).toFixed(1)}%`} />
                <AnalysisMetric title="Risk Level" value={(displayPrediction as any).riskLevel || "Assessed"} />
              </div>
            </section>

        <div className="mt-3 w-full">
          <DisasterRiskGrid risks={displayPrediction?.disasterRisks ?? []} />
        </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <DataSources source={displayPrediction?.predictionSource || "Backend Risk Prediction Service"} />
              <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <h2 className="text-[12px] font-black">Geospatial Context</h2>
                    <p className="mt-1 text-[8px] font-semibold text-slate-400">
                      Coordinates used for this prediction.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <AnalysisMetric title="Latitude" value={form.latitude.toFixed(5)} />
                  <AnalysisMetric title="Longitude" value={form.longitude.toFixed(5)} />
                </div>
              </section>
            </div>
          </>
        )}

        {/* RECENT PREDICTIONS */}
        <section className="mt-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[12px] font-black">Recent Predictions</h2>
                  <p className="mt-1 text-[8px] font-semibold text-slate-400">
                    Saved predictions from the prediction service.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[7px] font-black text-blue-700">
                {prediction ? Math.max(recentPredictions.length, 1) : recentPredictions.length} Total
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[7px] font-black text-emerald-600">
                Saved history
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {loadingRecent ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[155px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
                  />
                ))}
              </div>
            ) : (
              (() => {
                /*
                 * IMPORTANT:
                 * Render the actual saved API history.
                 * Do NOT filter DataUnavailable records here.
                 * They are still saved records and must remain visible.
                 *
                 * The newest prediction is shown first. If the API already
                 * contains that same prediction, it is not duplicated.
                 */

                const currentId = prediction?.id
                  ? String(prediction.id)
                  : "";

                const historyItems = recentPredictions
                  .filter((item: any) => {
                    if (!item) return false;

                    if (
                      currentId &&
                      item.id &&
                      String(item.id) === currentId
                    ) {
                      return false;
                    }

                    return true;
                  })
                  .slice(0, 9);

                const items: Array<{
                  item: RiskPrediction;
                  isCurrent: boolean;
                }> = [];

                if (prediction) {
                  items.push({
                    item: prediction,
                    isCurrent: true,
                  });
                }

                historyItems.forEach((item: RiskPrediction) => {
                  items.push({
                    item,
                    isCurrent: false,
                  });
                });

                if (items.length === 0) {
                  return (
                    <div className="flex min-h-[190px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                        <Radar className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-[10px] font-black text-slate-600">
                        No saved predictions
                      </p>
                      <p className="mt-1 text-[8px] font-semibold text-slate-400">
                        Completed risk predictions will appear here.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map(
                      (
                        { item, isCurrent },
                        index
                      ) => {
                        const displayItem =
                          getPrimaryRiskDisplay(item) ?? item;

                        const rawType = String(
                          displayItem?.disasterType ??
                            "DataUnavailable"
                        ).trim();

                        const unavailable =
                          rawType.toLowerCase() ===
                            "dataunavailable" ||
                          String(
                            displayItem?.riskLevel ?? ""
                          ).toLowerCase() ===
                            "dataunavailable";

                        const scoreValue =
                          safeNumber(
                            displayItem?.riskScore
                          );

                        const level = unavailable
                          ? "Data unavailable"
                          : displayItem?.riskLevel ||
                            (scoreValue >= 80
                              ? "Critical"
                              : scoreValue >= 60
                                ? "High"
                                : scoreValue >= 40
                                  ? "Moderate"
                                  : "Low");

                        const levelStyle = unavailable
                          ? "border-slate-200 bg-slate-100 text-slate-500"
                          : String(level)
                                .toLowerCase()
                                .includes("critical")
                            ? "border-red-200 bg-red-50 text-red-600"
                            : String(level)
                                  .toLowerCase()
                                  .includes("high")
                              ? "border-orange-200 bg-orange-50 text-orange-600"
                              : String(level)
                                    .toLowerCase()
                                    .includes("moderate")
                                ? "border-amber-200 bg-amber-50 text-amber-600"
                                : "border-emerald-200 bg-emerald-50 text-emerald-600";

                        const cardType =
                          unavailable
                            ? "Data Unavailable"
                            : rawType;

                        return (
                          <button
                            type="button"
                            key={
                              item.id ??
                              `${item.location}-${item.createdAt}-${index}`
                            }
                            onClick={() => {
                              setSelectedRecentPrediction(item);
                              setSelectedRecentDetails(item);
                            }}
                            aria-label={`View full prediction details for ${
                              displayItem?.location || "selected area"
                            }`}
                            className="group block w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            <div className="relative h-[105px] overflow-hidden bg-slate-900">
                              <img
                                src={disasterPhoto(
                                  unavailable
                                    ? "flood"
                                    : rawType
                                )}
                                alt=""
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                              <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                                {isCurrent
                                  ? "Current"
                                  : "Saved"}
                              </span>

                              <span
                                className={`absolute right-3 top-3 rounded-full border px-2 py-1 text-[7px] font-black ${levelStyle}`}
                              >
                                {level}
                              </span>

                              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                <div className="min-w-0">
                                  <h3 className="truncate text-[14px] font-black text-white">
                                    {cardType}
                                  </h3>
                                  <p className="mt-0.5 truncate text-[8px] font-semibold text-white/70">
                                    {displayItem?.location ||
                                      "Selected area"}
                                  </p>
                                </div>

                                <div className="ml-2 rounded-xl border border-white/10 bg-black/25 px-2.5 py-1.5 text-right backdrop-blur-md">
                                  <p className="text-[6px] font-black uppercase tracking-wider text-white/50">
                                    Risk
                                  </p>
                                  <p className="text-[12px] font-black text-white">
                                    {unavailable
                                      ? "—"
                                      : scoreValue.toFixed(1)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-3">
                              <div className="rounded-xl bg-slate-50 px-3 py-2">
                                <p className="text-[6px] font-black uppercase tracking-wider text-slate-400">
                                  Created
                                </p>
                                <p className="mt-1 text-[8px] font-bold text-slate-700">
                                  {displayItem?.createdAt
                                    ? new Date(
                                        displayItem.createdAt
                                      ).toLocaleDateString()
                                    : "—"}
                                </p>
                              </div>

                              <div className="rounded-xl bg-slate-50 px-3 py-2">
                                <p className="text-[6px] font-black uppercase tracking-wider text-slate-400">
                                  Confidence
                                </p>
                                <p className="mt-1 text-[8px] font-black text-blue-700">
                                  {unavailable
                                    ? "—"
                                    : `${safeNumber(
                                        displayItem?.confidence
                                      ).toFixed(1)}%`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between px-3 pb-3">
                              <span className="text-[7px] font-semibold text-slate-400">
                                {isCurrent
                                  ? "Current prediction"
                                  : "Saved prediction"}
                              </span>

                              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <Activity className="h-4 w-4" />
                              </span>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </section>

        {hasRealPrimaryRisk && displayPrediction && showDetails && (
          <PredictionDetailsModal
            prediction={displayPrediction}
            onClose={() => setShowDetails(false)}
            onApprovalComplete={(updatedPrediction: RiskPrediction, action: string) => {
              updatePrediction(updatedPrediction);
              setApprovalMessage(
                `Prediction ${
                  action === "approve" ? "approved" : "rejected"
                } successfully.`,
              );
              setShowDetails(false);
            }}
          />
        )}

        {selectedRecentDetails && (
          <PredictionDetailsModal
            prediction={
              getPrimaryRiskDisplay(selectedRecentDetails) ??
              selectedRecentDetails
            }
            onClose={() => setSelectedRecentDetails(null)}
            onApprovalComplete={(updatedPrediction: RiskPrediction, action: string) => {
              updatePrediction(updatedPrediction);
              setSelectedRecentDetails(null);
              setApprovalMessage(
                `Prediction ${
                  action === "approve" ? "approved" : "rejected"
                } successfully.`,
              );
            }}
          />
        )}
      </main>
    </div>
  );
}



function PhotoInsightCard({
  photo,
  icon,
  title,
  value,
  detail,
  tag,
}: {
  photo: string;
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  tag: string;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-[95px] overflow-hidden bg-slate-900">
        <img
          src={photo}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-white backdrop-blur-md">
          {tag}
        </span>
        <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-black/25 text-white backdrop-blur-md">
          {icon}
        </span>
      </div>
      <div className="p-3.5">
        <p className="text-[8px] font-black text-slate-700">{title}</p>
        <p className="mt-1 text-[11px] font-black text-slate-900">{value}</p>
        <p className="mt-1 text-[7.5px] font-semibold text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function HeroFeature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3.5 py-3 backdrop-blur-md">
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100">
          {icon}
        </span>
        <div>
          <p className="text-[9px] font-black text-white">{title}</p>
          <p className="mt-1 text-[7.5px] font-medium leading-4 text-white/60">{text}</p>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
      <p className="text-[6px] font-black uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 truncate text-[11px] font-black text-white">{value}</p>
    </div>
  );
}

function ContextCard({
  icon,
  label,
  value,
  detail,
  success,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  success?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        success ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
      }`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p>
        <p className="truncate text-[10px] font-black text-slate-800">{value}</p>
        <p className="truncate text-[7px] font-semibold text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}
        <span className="text-[7px] font-black uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <p className="mt-1.5 truncate text-[10px] font-black text-slate-700">{value}</p>
    </div>
  );
}

function TinyCard({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-2 py-2.5 text-blue-600 shadow-sm">
      {icon}
      <span className="text-[7px] font-black text-slate-500">{label}</span>
    </div>
  );
}

function AnalysisMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="text-[7px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-1 truncate text-[11px] font-black text-slate-800">{value}</p>
    </div>
  );
}









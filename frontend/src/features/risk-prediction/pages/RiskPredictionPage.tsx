import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import RiskPredictionForm from "../components/RiskPredictionForm";
import RiskMap from "../components/RiskMap";
import PredictionSummary from "../components/PredictionSummary";
import PredictionDetailsModal from "../components/PredictionDetailsModal";
import DisasterRiskGrid from "../components/DisasterRiskGrid";
import RiskFactors from "../components/RiskFactors";
import Recommendations from "../components/Recommendations";
import DataSources from "../components/DataSources";
import RecentPredictions from "../components/RecentPredictions";

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

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function isValidNumber(value: number): boolean {
  return Number.isFinite(value);
}

export default function RiskPredictionPage() {
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
  } = useRiskPrediction();

  const [form, setForm] =
    useState<RiskPredictionRequest>(EMPTY_FORM);

  const [showDetails, setShowDetails] = useState(false);

  /*
   * Load real history and external disaster events
   * when the page is opened.
   */
  useEffect(() => {
    void loadRecentPredictions();
    void loadExternalEvents();
  }, [loadRecentPredictions, loadExternalEvents]);

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
    if (
      !isValidLatitude(latitude) ||
      !isValidLongitude(longitude)
    ) {
      return;
    }

    // Immediately update coordinates
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
    }));

    let locationName = form.location;

    // Reverse geocode coordinates -> location name
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
          form.location;

        if (locationName) {
          console.log(
            "[Map Location] Selected:",
            locationName,
            latitude,
            longitude
          );

          setForm((current) => ({
            ...current,
            location: locationName,
            latitude,
            longitude,
          }));
        }
      }
    } catch (error) {
      console.error(
        "[Map Location ERROR] Reverse geocoding failed:",
        error
      );
    }

    // ============================================================
    // LOAD REAL ENVIRONMENT DATA FOR SELECTED LOCATION
    // ============================================================
    try {
      console.log(
        "[Environment] Loading live data:",
        latitude,
        longitude
      );

      const environment =
        await getRiskPredictionEnvironment(
          latitude,
          longitude,
          locationName
        );

      console.log(
        "[Environment] Live data received:",
        environment
      );

      setForm((current) => ({
        ...current,

        latitude,
        longitude,

        rainfall1h:
          environment.rainfall1h ??
          current.rainfall1h,

        rainfall3h:
          environment.rainfall3h ??
          current.rainfall3h,

        rainfall24h:
          environment.rainfall24h ??
          current.rainfall24h,

        riverLevel:
          environment.riverLevel ??
          current.riverLevel,

        riverFlow:
          environment.riverFlow ??
          current.riverFlow,

        temperature:
          environment.temperature ??
          current.temperature,

        humidity:
          environment.humidity ??
          current.humidity,

        windSpeed:
          environment.windSpeed ??
          current.windSpeed,

        populationDensity:
          environment.populationDensity ??
          current.populationDensity,

        historicalFloodCount:
          environment.historicalFloodCount ??
          current.historicalFloodCount,

        historicalSeverity:
          environment.historicalSeverity ??
          current.historicalSeverity,

        drainageCapacity:
          environment.drainageCapacity ??
          current.drainageCapacity,
      }));
    } catch (error) {
      console.error(
        "[Environment ERROR] Failed to load live environment data:",
        error
      );
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

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(location)}`
        );

        if (!response.ok) {
          return;
        }

        const results = await response.json();

        if (!Array.isArray(results) || results.length === 0) {
          console.log(
            "[Location Search] No location found:",
            location
          );
          return;
        }

        const result = results[0];

        const latitude = Number(result.lat);
        const longitude = Number(result.lon);

        if (
          !isValidLatitude(latitude) ||
          !isValidLongitude(longitude)
        ) {
          return;
        }

        console.log(
          "[Location Search] Found:",
          location,
          latitude,
          longitude
        );

        setForm((current) => ({
          ...current,
          latitude,
          longitude,
        }));
      } catch (error) {
        console.error(
          "[Location Search ERROR]",
          error
        );
      }
    }, 700);

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
      await predict(form);
    } catch {
      /*
       * The hook stores the API error.
       */
    }
  }

  function handleRecentSelect(item: RiskPrediction) {
    setForm((current) => ({
      ...current,

      location: item.location,

      latitude:
        item.latitude ?? current.latitude,

      longitude:
        item.longitude ?? current.longitude,

      rainfall1h: item.rainfall1h,
      rainfall3h: item.rainfall3h,
      rainfall24h: item.rainfall24h,

      riverLevel: item.riverLevel,
      riverFlow: item.riverFlow,

      temperature: item.temperature,
      humidity: item.humidity,
      windSpeed: item.windSpeed,
      soilMoisture: item.soilMoisture,

      elevation: item.elevation,
      populationDensity: item.populationDensity,

      historicalFloodCount:
        item.historicalFloodCount,

      historicalSeverity:
        item.historicalSeverity,

      drainageCapacity:
        item.drainageCapacity,

      forecastRainfall:
        item.forecastRainfall,
    }));
  }

  const mapLatitude =
    isValidLatitude(form.latitude)
      ? form.latitude
      : SRI_LANKA_CENTER.latitude;

  const mapLongitude =
    isValidLongitude(form.longitude)
      ? form.longitude
      : SRI_LANKA_CENTER.longitude;

  return (
    <div className="risk-pro-page min-h-screen bg-slate-50">
      {/* Page header */}
      <header className="risk-pro-hero border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1800px] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                🛡️
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  Risk Prediction
                </h1>

                <p className="text-sm text-slate-500">
                  AI-powered multi-disaster risk analysis
                  for a safer Sri Lanka.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-sm text-slate-400 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Risk Prediction Agent
            </div>
          </div>
        </div>
      </header>

      <main className="risk-pro-main mx-auto max-w-[1860px] space-y-5 p-6">
        {/* Prediction error */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {error}
          </div>
        )}

        {/* External events warning */}
        {eventsError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            External disaster events could not be loaded.
            The map may not show current external events.
          </div>
        )}

        {/* Main prediction workspace */}
        <div className="risk-pro-workspace grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)_380px]">
          <RiskPredictionForm
            value={form}
            loading={loading}
            onChange={updateField}
            onPredict={handlePredict}
          />

          <div className="risk-pro-card risk-pro-map-card relative">
            {loadingEvents && (
              <div className="absolute right-4 top-4 z-[1001] rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-lg">
                Loading live events...
              </div>
            )}

            <RiskMap
              latitude={mapLatitude}
              longitude={mapLongitude}
              events={externalEvents}
              onLocationChange={handleMapLocation}
            />
          </div>

          <PredictionSummary
            prediction={prediction}
            onViewDetails={() => setShowDetails(true)}
          />
        </div>

        {/* Prediction analysis */}
        {prediction && (
          <>
            <div className="risk-pro-disaster-grid">
              <DisasterRiskGrid
                risks={prediction.disasterRisks ?? []}
              />
            </div>

            <div className="risk-pro-analysis grid grid-cols-1 gap-5 lg:grid-cols-3">
              <RiskFactors
                factors={prediction.riskFactors ?? []}
              />

              <Recommendations
                recommendations={
                  prediction.recommendations ?? []
                }
              />

              <DataSources
                source={
                  prediction.predictionSource ||
                  "Backend Risk Prediction Service"
                }
              />
            </div>
          </>
        )}

        {/* Recent history */}
        <div className="risk-pro-recent">
          <RecentPredictions
            predictions={recentPredictions}
            loading={loadingRecent}
            onSelect={handleRecentSelect}
          />
        </div>

        {/* Detailed prediction modal */}
        {prediction && showDetails && (
          <PredictionDetailsModal
            prediction={prediction}
            onClose={() => setShowDetails(false)}
          />
        )}
      </main>
    </div>
  );
}







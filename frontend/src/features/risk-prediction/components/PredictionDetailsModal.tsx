import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  DisasterRisk,
  RiskFactor,
  RiskPrediction,
} from "../types/riskPrediction.types";
import {
  approveRiskPrediction,
  rejectRiskPrediction,
} from "../services/riskPredictionApi";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CloudRain,
  Clock3,
  Database,
  Gauge,
  Globe2,
  Info,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Thermometer,
  Users,
  Wind,
  X,
} from "lucide-react";

interface Props {
  prediction: RiskPrediction;
  onClose: () => void;
  onApprovalComplete?: (
    prediction: RiskPrediction,
    action: "approve" | "reject"
  ) => void;
}

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}



function formatScore(value: unknown): string {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "N/A";
  }

  return n.toFixed(1);
}

function formatConfidence(value: unknown): string {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return "Not available";
  }

  return `${clamp(n).toFixed(0)}%`;
}

function formatNumber(value: unknown): string {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "N/A";
  }

  return n.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string): string {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeLevel(level?: string | null): string {
  const value = String(level ?? "").trim().toLowerCase();

  if (value.includes("critical")) return "Critical";
  if (value.includes("high")) return "High";
  if (value.includes("moderate") || value.includes("medium")) {
    return "Moderate";
  }

  if (value.includes("low")) return "Low";

  return "No Data";
}

function riskTone(level?: string | null) {
  switch (normalizeLevel(level)) {
    case "Critical":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        accent: "bg-red-500",
        text: "text-red-600",
        soft: "bg-red-50",
      };

    case "High":
      return {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        accent: "bg-orange-500",
        text: "text-orange-600",
        soft: "bg-orange-50",
      };

    case "Moderate":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        accent: "bg-amber-500",
        text: "text-amber-600",
        soft: "bg-amber-50",
      };

    case "Low":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        accent: "bg-emerald-500",
        text: "text-emerald-600",
        soft: "bg-emerald-50",
      };

    default:
      return {
        badge: "border-slate-200 bg-slate-100 text-slate-600",
        accent: "bg-slate-400",
        text: "text-slate-500",
        soft: "bg-slate-50",
      };
  }
}

function disasterIcon(_type?: string): string {
  return "";
}

function disasterPhoto(type?: string): string {
  const value = String(type ?? "").toLowerCase();

  if (value.includes("flood")) return "/assets/disasters/flood.jpg";
  if (value.includes("drought")) return "/assets/disasters/drought.jpg";
  if (value.includes("wildfire") || value.includes("forest fire")) {
    return "/assets/disasters/wildfire.jpg";
  }
  if (value.includes("landslide")) return "/assets/disasters/landslide.jpg";
  if (value.includes("storm") || value.includes("cyclone")) {
    return "/assets/disasters/cyclone.jpg";
  }
  if (value.includes("earthquake")) return "/assets/disasters/earthquake.jpg";
  if (value.includes("tsunami")) return "/assets/disasters/tsunami.jpg";
  if (value.includes("lightning")) return "/assets/disasters/lightning.jpg";
  if (value.includes("heatwave")) return "/assets/disasters/heatstorm.jpg";
  if (value.includes("cold")) return "/assets/disasters/avalanche.jpg";
  if (value.includes("volcanic")) {
    return "/assets/disasters/volcanic-eruption.jpg";
  }

  return "/assets/disasters/flood.jpg";
}

function approvalLabel(prediction: RiskPrediction): string {
  if (!prediction.requiresHumanApproval) return "Not Required";
  if (prediction.isApproved) return "Approved";

  return prediction.approvalStatus?.trim() || "Pending Review";
}

function approvalClass(prediction: RiskPrediction): string {
  if (!prediction.requiresHumanApproval) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (prediction.isApproved) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}





export default function PredictionDetailsModal({
  prediction,
  onClose,
  onApprovalComplete,
}: Props) {
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !approvalLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [approvalLoading, onClose]);

  const disasterRisks = useMemo(
    () => prediction.disasterRisks ?? [],
    [prediction.disasterRisks]
  );

  const riskFactors = useMemo(
    () => prediction.riskFactors ?? [],
    [prediction.riskFactors]
  );

  const recommendations = useMemo(
    () => prediction.recommendations ?? [],
    [prediction.recommendations]
  );

  const scoredRisks = useMemo(
    () =>
      [...disasterRisks]
        .filter((risk) => Number.isFinite(Number(risk.riskScore)))
        .sort(
          (a, b) => safeNumber(b.riskScore) - safeNumber(a.riskScore)
        ),
    [disasterRisks]
  );

  const sourceBackedRisks = useMemo(
    () =>
      [...disasterRisks]
        .filter(
          (risk) =>
            risk.dataAvailable === true &&
            Number.isFinite(Number(risk.riskScore))
        )
        .sort(
          (a, b) => safeNumber(b.riskScore) - safeNumber(a.riskScore)
        ),
    [disasterRisks]
  );

  const primaryRisk =
    sourceBackedRisks[0] ?? scoredRisks[0] ?? null;

  const primaryType =
    primaryRisk?.disasterType?.trim() ||
    prediction.disasterType?.trim() ||
    "Risk Assessment";

  const primaryScore = primaryRisk
    ? safeNumber(primaryRisk.riskScore)
    : safeNumber(prediction.riskScore);

  const primaryLevel = primaryRisk
    ? normalizeLevel(primaryRisk.riskLevel)
    : normalizeLevel(prediction.riskLevel);

  const primaryTone = riskTone(primaryLevel);const topBackendFactors = [...riskFactors]
    .sort(
      (a: RiskFactor, b: RiskFactor) =>
        safeNumber(b.contribution) - safeNumber(a.contribution)
    )
    

  const scoredCount = scoredRisks.length;
  const sourceDataCount = sourceBackedRisks.length;
  const dataCoverage =
    disasterRisks.length > 0
      ? (scoredCount / disasterRisks.length) * 100
      : 0;

  const handleApproval = async (action: "approve" | "reject") => {
    if (!prediction.id || approvalLoading) return;

    setApprovalLoading(true);
    setApprovalError("");

    try {
      const updatedPrediction =
        action === "approve"
          ? await approveRiskPrediction(prediction.id)
          : await rejectRiskPrediction(prediction.id);

      onApprovalComplete?.(updatedPrediction, action);
      onClose();
    } catch (error) {
      setApprovalError(
        error instanceof Error
          ? error.message
          : `Failed to ${action} prediction.`
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !approvalLoading) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-[#f6f8fc] shadow-[0_30px_100px_rgba(2,18,40,0.35)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Radar className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Risk Prediction Agent
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Analysis Ready
                  </span>
                </div>

                <h2
                  id="prediction-details-title"
                  className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl"
                >
                  Detailed Risk Analysis
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] font-semibold text-slate-500">
                  <span>{prediction.location || "Unknown location"}</span>
                  <span className="text-slate-300">-</span>
                  <span>{primaryType}</span>
                  <span className="text-slate-300">-</span>
                  <span>{formatDate(prediction.createdAt)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={approvalLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              aria-label="Close detailed risk analysis"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {/* PRIMARY + COVERAGE */}
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-[158px] overflow-hidden bg-slate-950">
                <img
                  src={disasterPhoto(primaryType)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-65"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/5" />

                <div className="relative flex h-full items-end p-5">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/55">
                      Primary Prediction
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-[20px] font-black text-white">
                        {primaryType}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[7px] font-black uppercase ${primaryTone.badge}`}
                      >
                        {primaryLevel}
                      </span>
                    </div>

                    <div className="mt-2 flex items-end gap-1">
                      <span className="text-[46px] font-black leading-none tracking-tight text-white">
                        {formatScore(primaryScore)}
                      </span>
                      <span className="pb-1.5 text-sm font-bold text-white/45">
                        /100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Model Confidence
                  </span>
                  <span className="text-[10px] font-black text-slate-800">
                    {formatConfidence(prediction.confidence)}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${primaryTone.accent}`}
                    style={{
                      width: `${
                        Number(prediction.confidence) > 0
                          ? clamp(Number(prediction.confidence))
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MiniMetric
                    icon={<Gauge className="h-3.5 w-3.5" />}
                    label="Risk Level"
                    value={primaryLevel}
                  />
                  <MiniMetric
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                    label="Generated"
                    value={formatDate(prediction.createdAt)}
                  />
                </div>

                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-700">
                        Primary selection
                      </p>
                      <p className="mt-1 text-[9px] font-semibold leading-5 text-blue-800">
                        Highest available disaster risk returned by the
                        backend.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-black text-slate-950">
                      Risk Portfolio
                    </h3>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[7px] font-black text-blue-700">
                      {scoredCount}/{disasterRisks.length || 0} SCORED
                    </span>
                  </div>

                  <p className="mt-1 text-[8px] font-semibold text-slate-400">
                    Multi-disaster numeric coverage for this location - {sourceDataCount}/{disasterRisks.length || 0} live-source
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <MiniKpi
                    label="Highest"
                    value={formatScore(primaryScore)}
                    detail={primaryType}
                  />
                  <MiniKpi
                    label="Scored"
                    value={String(scoredCount)}
                    detail={`of ${disasterRisks.length || 0} types`}
                  />
                  <MiniKpi
                    label="Coverage"
                    value={`${dataCoverage.toFixed(0)}%`}
                    detail="numeric coverage"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {disasterRisks
                  .slice()
                  .sort(
                    (a, b) =>
                      safeNumber(b.riskScore) -
                      safeNumber(a.riskScore)
                  )
                  .map((risk: DisasterRisk, index) => {
                    const available =
                      Number.isFinite(Number(risk.riskScore));
                    const sourceAvailable = risk.dataAvailable === true;
                    const score = safeNumber(risk.riskScore);
                    const calculatedLevel =
                      score >= 75
                        ? "Critical"
                        : score >= 50
                          ? "High"
                          : score >= 25
                            ? "Moderate"
                            : "Low";
                    const tone = riskTone(
                      available ? calculatedLevel : "No Data"
                    );

                    return (
                      <div
                        key={`${risk.disasterType}-${index}`}
                        className={`rounded-xl border p-3.5 transition ${
                          available
                            ? "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md"
                            : "border-slate-100 bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-base ring-1 ring-slate-100">
                              {disasterIcon(risk.disasterType)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[9px] font-black text-slate-800">
                                {risk.disasterType}
                              </p>
                              <p className="mt-0.5 truncate text-[7px] font-semibold text-slate-400">
                                {risk.dataSource || "Backend source"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[7px] font-black uppercase ${
                              available
                                ? tone.badge
                                : "border-slate-200 bg-slate-100 text-slate-500"
                            }`}
                          >
                            {available
                              ? calculatedLevel
                              : "No Data"}
                          </span>
                        </div>

                        <div className="mt-3 flex items-end justify-between">
                          <p className="text-[22px] font-black text-slate-950">
                            {available ? score.toFixed(1) : "0.0"}
                          </p>

                          <span className="text-[7px] font-bold text-slate-400">
                            {available
                              ? sourceAvailable
                                ? "Live source data"
                                : "Numeric baseline"
                              : "Numeric baseline"}
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              available
                                ? tone.accent
                                : "bg-slate-200"
                            }`}
                            style={{
                              width: `${clamp(score)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>

          {/* CALCULATION */}
          <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-black text-slate-950">
                      Risk Calculation
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-black text-slate-600">
                      TRANSPARENT BREAKDOWN
                    </span>
                  </div>

                  <p className="mt-1 text-[8px] font-semibold text-slate-400">
                    Showing the same weighting logic used by the backend for
                    the selected primary disaster when supported.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="text-[8px] font-black text-slate-600">
                    Backend score: {formatScore(primaryScore)} / 100
                  </span>
                </div>
              </div>
            </div>

            {topBackendFactors.length > 0 ? (
              <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
                {topBackendFactors.map((factor, index) => (
                  <div
                    key={`${factor.factor}-${index}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-black text-slate-800">
                            {index + 1}. {factor.factor}
                          </p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[7px] font-black text-blue-600 ring-1 ring-slate-100">
                            Backend
                          </span>
                        </div>

                        <p className="mt-1 text-[7px] font-semibold leading-4 text-slate-400">
                          Value: {safeNumber(factor.value).toFixed(2)} - {factor.impact || "Backend factor"}
                        </p>
                      </div>

                      <span className="shrink-0 text-[11px] font-black text-slate-800">
                        +{safeNumber(factor.contribution).toFixed(1)}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${clamp(safeNumber(factor.contribution))}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1.5 text-[7px] font-semibold text-slate-400">
                      Contribution returned directly by the Risk Engine
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5">
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <Info className="mx-auto h-5 w-5 text-slate-400" />
                  <p className="mt-2 text-[9px] font-black text-slate-600">
                    No factor-level contributions were returned by the backend.
                  </p>
                </div>
              </div>
            )}          </section>

          {/* ENVIRONMENTAL SIGNALS */}
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[12px] font-black text-slate-950">
                    Environmental Signals
                  </h3>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[7px] font-black text-blue-700">
                    SOURCE INPUTS
                  </span>
                </div>
                <p className="mt-1 text-[8px] font-semibold text-slate-400">
                  Actual values available to the prediction model
                </p>
              </div>

              <Activity className="h-4 w-4 text-blue-500" />
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
              <SignalCard
                icon={<CloudRain className="h-4 w-4" />}
                label="Rainfall 24h"
                value={`${safeNumber(prediction.rainfall24h).toFixed(1)} mm`}
              />
              <SignalCard
                icon={<CloudRain className="h-4 w-4" />}
                label="Forecast Rain"
                value={`${safeNumber(
                  prediction.forecastRainfall
                ).toFixed(1)} mm`}
              />
              <SignalCard
                icon={<Thermometer className="h-4 w-4" />}
                label="Temperature"
                value={`${safeNumber(prediction.temperature).toFixed(1)} C`}
              />
              <SignalCard
                icon={<Wind className="h-4 w-4" />}
                label="Wind Speed"
                value={`${safeNumber(prediction.windSpeed).toFixed(1)} km/h`}
              />
              <SignalCard
                icon={<Users className="h-4 w-4" />}
                label="Population Density"
                value={`${formatNumber(
                  prediction.populationDensity
                )} /km2`}
              />
            </div>
          </section>

          {/* FINDINGS + ACTIONS */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-black text-slate-950">
                      Risk Factors
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-black text-slate-600">
                      {topBackendFactors.length}
                    </span>
                  </div>
                  <p className="mt-1 text-[8px] font-semibold text-slate-400">
                    Backend factor-level details
                  </p>
                </div>
                <Target className="h-4 w-4 text-blue-500" />
              </div>

              <div className="mt-4 space-y-2.5">
                {topBackendFactors.map((factor, index) => (
                  <div
                    key={`${factor.factor}-detail-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[8px] font-black text-white">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-800">
                        {factor.factor}
                      </p>
                      <p className="mt-1 text-[7px] font-semibold leading-4 text-slate-400">
                        Value {safeNumber(factor.value).toFixed(2)} -
                        Contribution{" "}
                        {safeNumber(factor.contribution).toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}

                {topBackendFactors.length === 0 && (
                  <EmptyPanel text="No factor-level records returned by the backend." />
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-black text-slate-950">
                      Recommendations
                    </h3>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[7px] font-black text-blue-700">
                      {recommendations.length} ACTIONS
                    </span>
                  </div>
                  <p className="mt-1 text-[8px] font-semibold text-slate-400">
                    Operational guidance returned by the backend
                  </p>
                </div>
                <Sparkles className="h-4 w-4 text-blue-500" />
              </div>

              <div className="mt-4 space-y-2.5">
                {recommendations.slice(0, 6).map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[8px] font-black text-white">
                      {index + 1}
                    </div>

                    <p className="text-[9px] font-semibold leading-5 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}

                {recommendations.length === 0 && (
                  <EmptyPanel text="No recommendations returned by the backend." />
                )}
              </div>
            </section>
          </div>

          {/* METADATA */}
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <MetaCard
              icon={<MapPin className="h-4 w-4" />}
              label="Location"
              value={prediction.location || "Unknown location"}
              secondary={
                prediction.latitude !== null &&
                prediction.latitude !== undefined &&
                prediction.longitude !== null &&
                prediction.longitude !== undefined
                  ? `${prediction.latitude.toFixed(
                      5
                    )}, ${prediction.longitude.toFixed(5)}`
                  : "Coordinates unavailable"
              }
            />

            <MetaCard
              icon={<Database className="h-4 w-4" />}
              label="Data Sources"
              value={
                prediction.predictionSource ||
                "Backend Risk Prediction Service"
              }
              secondary={`Model ${
                prediction.modelVersion || "Not specified"
              }`}
            />

            <MetaCard
              icon={<Globe2 className="h-4 w-4" />}
              label="Prediction ID"
              value={prediction.id || "N/A"}
              secondary="Risk analysis record"
            />
          </div>

          {/* APPROVAL */}
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[12px] font-black text-slate-950">
                      Approval Status
                    </h3>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[7px] font-black uppercase ${approvalClass(
                        prediction
                      )}`}
                    >
                      {approvalLabel(prediction)}
                    </span>
                  </div>

                  <p className="mt-1 text-[8px] font-semibold text-slate-400">
                    Human approval required:{" "}
                    <span className="text-slate-700">
                      {prediction.requiresHumanApproval ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
              </div>

              {prediction.requiresHumanApproval &&
                !prediction.isApproved &&
                String(
                  prediction.approvalStatus ?? ""
                ).toLowerCase() === "pending" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={approvalLoading}
                      onClick={() => handleApproval("approve")}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-[9px] font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {approvalLoading ? "Processing..." : "Approve"}
                    </button>

                    <button
                      type="button"
                      disabled={approvalLoading}
                      onClick={() => handleApproval("reject")}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-[9px] font-black text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {approvalLoading ? "Processing..." : "Reject"}
                    </button>
                  </div>
                )}
            </div>

            {approvalError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[8px] font-bold text-red-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {approvalError}
              </div>
            )}
          </section>

          {/* FOOTER */}
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <FooterMetric
              icon={<CloudRain className="h-3.5 w-3.5" />}
              label="Rainfall 24h"
              value={`${safeNumber(prediction.rainfall24h).toFixed(1)} mm`}
            />
            <FooterMetric
              icon={<Users className="h-3.5 w-3.5" />}
              label="Population Density"
              value={`${formatNumber(
                prediction.populationDensity
              )} /km2`}
            />
            <FooterMetric
              icon={<Thermometer className="h-3.5 w-3.5" />}
              label="Temperature"
              value={`${safeNumber(prediction.temperature).toFixed(1)} C`}
            />
            <FooterMetric
              icon={<Wind className="h-3.5 w-3.5" />}
              label="Wind Speed"
              value={`${safeNumber(prediction.windSpeed).toFixed(1)} km/h`}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[0.13em] text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[9px] font-black text-slate-800">{value}</p>
    </div>
  );
}

function MiniKpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-[90px] rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-black text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[7px] font-semibold text-slate-400">
        {detail}
      </p>
    </div>
  );
}

function SignalCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
      <div className="flex items-center gap-1.5 text-blue-600">
        {icon}
        <span className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function MetaCard({
  icon,
  label,
  value,
  secondary,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 break-words text-[9px] font-black leading-4 text-slate-800">
            {value}
          </p>
          <p className="mt-1 break-words text-[7px] font-semibold leading-4 text-slate-400">
            {secondary}
          </p>
        </div>
      </div>
    </div>
  );
}

function FooterMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[9px] font-black text-slate-800">{value}</p>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
      <Info className="mx-auto h-4 w-4 text-slate-400" />
      <p className="mt-2 text-[8px] font-bold text-slate-500">{text}</p>
    </div>
  );
}

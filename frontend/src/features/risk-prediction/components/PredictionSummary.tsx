import type { RiskPrediction } from "../types/riskPrediction.types";
import {
  formatDate,
  riskLevelClass,
  riskLevelLabel,
} from "../utils/riskPrediction.utils";

interface Props {
  prediction: RiskPrediction | null;
  onViewDetails: () => void;
}

function formatScore(score: number | null | undefined): string {
  if (
    score === null ||
    score === undefined ||
    !Number.isFinite(score)
  ) {
    return "N/A";
  }

  return score.toFixed(1);
}

function formatConfidence(
  confidence: number | null | undefined
): string {
  if (
    confidence === null ||
    confidence === undefined ||
    !Number.isFinite(confidence)
  ) {
    return "N/A";
  }

  return `${Math.max(
    0,
    Math.min(confidence, 100)
  ).toFixed(0)}%`;
}

function getRiskIcon(disasterType?: string): string {
  const type = disasterType?.toLowerCase() ?? "";

  if (type.includes("flood")) return "🌊";
  if (type.includes("landslide")) return "⛰️";
  if (type.includes("storm")) return "🌪️";
  if (type.includes("cyclone")) return "🌀";
  if (type.includes("drought")) return "☀️";
  if (type.includes("wildfire")) return "🔥";
  if (type.includes("earthquake")) return "🌍";
  if (type.includes("tsunami")) return "🌊";
  if (type.includes("lightning")) return "⚡";
  if (type.includes("heatwave")) return "🌡️";
  if (type.includes("volcanic")) return "🌋";
  if (type.includes("avalanche")) return "🏔️";
  if (type.includes("cold")) return "❄️";

  return "🛡️";
}

export default function PredictionSummary({
  prediction,
  onViewDetails,
}: Props) {
  if (!prediction) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            🛡️
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            No prediction yet
          </h2>

          <p className="mt-2 max-w-[260px] text-sm leading-6 text-slate-500">
            Select a location, provide the available
            environmental data, and run a prediction.
          </p>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left">
            <div className="text-xs font-bold text-blue-800">
              How it works
            </div>

            <div className="mt-1 text-xs leading-5 text-blue-700">
              The backend risk analysis service evaluates
              the submitted data and returns the available
              disaster risks, factors, and recommendations.
            </div>
          </div>
        </div>
      </section>
    );
  }

  const score = formatScore(prediction.riskScore);

  const confidence = formatConfidence(
    prediction.confidence
  );

  const hasScore =
    prediction.riskScore !== null &&
    prediction.riskScore !== undefined &&
    Number.isFinite(prediction.riskScore);

  const riskLevel = riskLevelLabel(
    prediction.riskLevel
  );

  const disasterType =
    prediction.disasterType?.trim() ||
    "Risk Assessment";

  const predictionSource =
    prediction.predictionSource?.trim() ||
    "Backend Risk Prediction Service";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-500">
            Prediction Result
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              {getRiskIcon(disasterType)}
            </div>

            <div className="min-w-0">
              <div className="truncate text-base font-bold text-slate-900">
                {disasterType}
              </div>

              <div className="mt-0.5 flex items-end gap-1.5">
                <span className="text-4xl font-black text-slate-900">
                  {score}
                </span>

                {hasScore && (
                  <span className="pb-1 text-xs text-slate-400">
                    / 100
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${riskLevelClass(
            prediction.riskLevel
          )}`}
        >
          {riskLevel}
        </span>
      </div>

      {/* Data unavailable notice */}
      {!hasScore && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="text-base">ℹ️</span>

            <div>
              <div className="text-sm font-bold text-amber-800">
                Risk score unavailable
              </div>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                The backend did not have enough supported
                data to calculate a numeric risk score for
                this assessment. No score has been invented
                by the frontend.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main metrics */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Confidence
          </div>

          <div className="mt-1 text-lg font-bold text-slate-900">
            {confidence}
          </div>
        </div>

        <div className="min-w-0 rounded-xl bg-slate-50 p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Location
          </div>

          <div
            className="mt-1 truncate text-sm font-bold text-slate-900"
            title={prediction.location}
          >
            {prediction.location || "Unknown location"}
          </div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="mt-3 rounded-xl border border-slate-100 p-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Coordinates
        </div>

        <div className="mt-1 text-sm font-medium text-slate-700">
          {prediction.latitude !== null &&
          prediction.latitude !== undefined &&
          prediction.longitude !== null &&
          prediction.longitude !== undefined ? (
            <>
              {prediction.latitude.toFixed(5)},{" "}
              {prediction.longitude.toFixed(5)}
            </>
          ) : (
            "Not available"
          )}
        </div>
      </div>

      {/* Source */}
      <div className="mt-3 rounded-xl border border-slate-100 p-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Prediction Source
        </div>

        <div className="mt-1 text-sm font-medium text-slate-700">
          {predictionSource}
        </div>
      </div>

      {/* Model information */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-100 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Model Version
          </div>

          <div className="mt-1 truncate text-xs font-bold text-slate-700">
            {prediction.modelVersion || "Not specified"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Approval
          </div>

          <div className="mt-1 text-xs font-bold text-slate-700">
            {prediction.requiresHumanApproval
              ? prediction.isApproved
                ? "Approved"
                : "Pending Review"
              : "Not Required"}
          </div>
        </div>
      </div>

      {/* Generated time */}
      <div className="mt-3 text-xs text-slate-400">
        Generated{" "}
        {prediction.createdAt
          ? formatDate(prediction.createdAt)
          : "time unavailable"}
      </div>

      {/* Details button */}
      <button
        type="button"
        onClick={onViewDetails}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        View Detailed Analysis
        <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
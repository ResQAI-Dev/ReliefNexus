import type { RiskPrediction } from "../types/riskPrediction.types";
import {
  formatDate,
  riskLevelClass,
  riskLevelLabel,
} from "../utils/riskPrediction.utils";

interface Props {
  prediction: RiskPrediction;
  onClose: () => void;
}

function formatScore(
  score: number | null | undefined
): string {
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

function formatNumber(
  value: number | null | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "N/A";
  }

  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2);
}

function getRiskIcon(type?: string): string {
  const value = type?.toLowerCase() ?? "";

  if (value.includes("flood")) return "🌊";
  if (value.includes("landslide")) return "⛰️";
  if (
    value.includes("storm") ||
    value.includes("cyclone")
  ) {
    return "🌀";
  }
  if (value.includes("drought")) return "☀️";
  if (value.includes("wildfire")) return "🔥";
  if (value.includes("earthquake")) return "🌍";
  if (value.includes("tsunami")) return "🌊";
  if (value.includes("lightning")) return "⚡";
  if (value.includes("heatwave")) return "🌡️";
  if (value.includes("volcanic")) return "🌋";
  if (value.includes("avalanche")) return "🏔️";
  if (value.includes("cold")) return "❄️";

  return "🛡️";
}

function getApprovalLabel(
  prediction: RiskPrediction
): string {
  if (!prediction.requiresHumanApproval) {
    return "Not Required";
  }

  if (prediction.isApproved) {
    return "Approved";
  }

  return (
    prediction.approvalStatus?.trim() ||
    "Pending Review"
  );
}

function getApprovalClass(
  prediction: RiskPrediction
): string {
  if (!prediction.requiresHumanApproval) {
    return "bg-slate-100 text-slate-600";
  }

  if (prediction.isApproved) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-amber-100 text-amber-700";
}

export default function PredictionDetailsModal({
  prediction,
  onClose,
}: Props) {
  const disasterRisks =
    prediction.disasterRisks ?? [];

  const riskFactors =
    prediction.riskFactors ?? [];

  const recommendations =
    prediction.recommendations ?? [];

  const score = formatScore(
    prediction.riskScore
  );

  const hasPrimaryScore =
    prediction.riskScore !== null &&
    prediction.riskScore !== undefined &&
    Number.isFinite(prediction.riskScore);

  const location =
    prediction.location?.trim() ||
    "Unknown location";

  const disasterType =
    prediction.disasterType?.trim() ||
    "Risk Assessment";

  const source =
    prediction.predictionSource?.trim() ||
    "Backend Risk Prediction Service";

  const modelVersion =
    prediction.modelVersion?.trim() ||
    "Not specified";

  const approvalLabel =
    getApprovalLabel(prediction);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Risk Prediction Agent
            </div>

            <h2
              id="prediction-details-title"
              className="mt-1 text-2xl font-black text-slate-900"
            >
              Detailed Risk Analysis
            </h2>

            <p className="mt-1 truncate text-sm text-slate-500">
              {location}
              <span className="mx-2 text-slate-300">
                •
              </span>
              {prediction.createdAt
                ? formatDate(prediction.createdAt)
                : "Date unavailable"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detailed risk analysis"
            className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl leading-none text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(90vh-95px)] overflow-y-auto p-6">
          {/* Primary prediction + disaster risks */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Primary prediction */}
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Primary Prediction
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                  {getRiskIcon(disasterType)}
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {disasterType}
                </h3>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <div
                  className={`text-5xl font-black ${
                    hasPrimaryScore
                      ? "text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {score}
                </div>

                {hasPrimaryScore && (
                  <p className="text-sm text-slate-400">
                    / 100
                  </p>
                )}
              </div>

              <span
                className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${riskLevelClass(
                  prediction.riskLevel
                )}`}
              >
                {riskLevelLabel(
                  prediction.riskLevel
                )}
              </span>

              {!hasPrimaryScore && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs leading-5 text-amber-700">
                    A numeric risk score was not available
                    from the backend for this assessment.
                  </p>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Confidence
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatConfidence(
                      prediction.confidence
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Approval
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {approvalLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* All disaster risks */}
            <div className="rounded-2xl border border-slate-200 p-5 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    All Disaster Risks
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Risk values returned by the backend
                  </p>
                </div>

                {disasterRisks.length > 0 && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                    {disasterRisks.length} Risks
                  </span>
                )}
              </div>

              {disasterRisks.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No disaster risk data available
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    The backend did not return individual
                    disaster risk assessments.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {disasterRisks.map((risk) => {
                    const available =
                      risk.dataAvailable &&
                      risk.riskScore !== null &&
                      Number.isFinite(
                        risk.riskScore
                      );

                    return (
                      <div
                        key={risk.disasterType}
                        className="rounded-xl border border-slate-200 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-base">
                            {getRiskIcon(
                              risk.disasterType
                            )}
                          </div>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${riskLevelClass(
                              risk.riskLevel
                            )}`}
                          >
                            {riskLevelLabel(
                              risk.riskLevel
                            )}
                          </span>
                        </div>

                        <p className="mt-3 text-xs font-bold text-slate-700">
                          {risk.disasterType}
                        </p>

                        <p
                          className={`mt-1 text-2xl font-black ${
                            available
                              ? "text-slate-900"
                              : "text-slate-400"
                          }`}
                        >
                          {formatScore(
                            risk.riskScore
                          )}
                        </p>

                        <p className="mt-2 text-[10px] leading-4 text-slate-400">
                          {risk.dataSource ||
                            "No data source reported"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Factors + recommendations */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Risk factors */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-lg font-bold text-slate-900">
                Risk Factors
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Factors returned by the risk analysis service
              </p>

              {riskFactors.length === 0 ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No risk factors available.
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {riskFactors.map(
                    (factor, index) => {
                      const contribution =
                        Number.isFinite(
                          factor.contribution
                        )
                          ? factor.contribution
                          : 0;

                      const width = Math.min(
                        Math.max(
                          Math.abs(contribution),
                          0
                        ),
                        100
                      );

                      return (
                        <div
                          key={`${factor.factor}-${index}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-700">
                                {factor.factor}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Value:{" "}
                                {formatNumber(
                                  factor.value
                                )}

                                {factor.impact && (
                                  <>
                                    <span className="mx-1">
                                      •
                                    </span>
                                    {factor.impact}
                                  </>
                                )}
                              </p>
                            </div>

                            <span className="shrink-0 text-sm font-black text-slate-900">
                              {Number.isFinite(
                                factor.contribution
                              )
                                ? factor.contribution.toFixed(
                                    1
                                  )
                                : "N/A"}
                            </span>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{
                                width: `${width}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-lg font-bold text-slate-900">
                Recommendations
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Response actions returned by the backend
              </p>

              {recommendations.length === 0 ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No recommendations available.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {recommendations
                    .filter(
                      (item) =>
                        typeof item ===
                          "string" &&
                        item.trim()
                    )
                    .map(
                      (recommendation, index) => (
                        <div
                          key={`${recommendation}-${index}`}
                          className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-700">
                            {index + 1}
                          </div>

                          <p className="text-sm leading-6 text-slate-700">
                            {recommendation}
                          </p>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Location */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Location
              </p>

              <p className="mt-2 text-sm font-bold text-slate-800">
                {location}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {prediction.latitude !== null &&
                prediction.latitude !== undefined &&
                prediction.longitude !== null &&
                prediction.longitude !==
                  undefined
                  ? `${prediction.latitude.toFixed(
                      5
                    )}, ${prediction.longitude.toFixed(
                      5
                    )}`
                  : "Coordinates unavailable"}
              </p>
            </div>

            {/* Source */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Data Sources
              </p>

              <p className="mt-2 text-sm font-bold text-slate-800">
                {source}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Model: {modelVersion}
              </p>
            </div>

            {/* Approval */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Approval
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getApprovalClass(
                  prediction
                )}`}
              >
                {approvalLabel}
              </span>

              <p className="mt-2 text-xs text-slate-500">
                Human approval required:{" "}
                {prediction.requiresHumanApproval
                  ? "Yes"
                  : "No"}
              </p>

              {prediction.requiresHumanApproval &&
                !prediction.isApproved && (
                  <p className="mt-1 text-xs text-amber-600">
                    This assessment is awaiting human
                    review.
                  </p>
                )}
            </div>
          </div>

          {/* Technical metadata */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Prediction ID
                </p>

                <p className="mt-1 truncate text-xs font-medium text-slate-600">
                  {prediction.id || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Model Version
                </p>

                <p className="mt-1 text-xs font-medium text-slate-600">
                  {modelVersion}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Prediction Source
                </p>

                <p className="mt-1 text-xs font-medium text-slate-600">
                  {source}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
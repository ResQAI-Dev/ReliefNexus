import type { DisasterRisk } from "../types/riskPrediction.types";
import {
  riskLevelClass,
  riskLevelLabel,
} from "../utils/riskPrediction.utils";

interface Props {
  risks: DisasterRisk[];
}

const EXPECTED_RISKS = [
  "Flood",
  "Landslide",
  "Storm / Cyclone",
  "Drought",
  "Wildfire",
  "Earthquake",
  "Tsunami",
  "Lightning",
  "Heatwave",
  "Volcanic",
  "Avalanche",
  "Extreme Cold / Cold Wave",
];

function getRiskIcon(type: string): string {
  const value = type.toLowerCase();

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

function getRiskByType(
  risks: DisasterRisk[],
  type: string
): DisasterRisk | undefined {
  const normalizedType = type.toLowerCase();

  return risks.find(
    (risk) =>
      risk.disasterType?.toLowerCase() ===
      normalizedType
  );
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

function getAvailabilityText(
  risk: DisasterRisk
): string {
  if (!risk.dataAvailable) {
    return "Data unavailable";
  }

  if (risk.dataSource?.trim()) {
    return risk.dataSource;
  }

  return "Risk engine";
}

export default function DisasterRiskGrid({
  risks,
}: Props) {
  /*
   * The backend may return fewer than 12 risks depending
   * on which data sources are currently available.
   *
   * We display the known 12 disaster categories without
   * inventing scores. Missing categories are shown as
   * "N/A" / "Data unavailable".
   */
  const displayedRisks = EXPECTED_RISKS.map(
    (expectedType) =>
      getRiskByType(risks, expectedType) ?? {
        disasterType: expectedType,
        riskScore: null,
        riskLevel: "DataUnavailable",
        dataAvailable: false,
        dataSource: "No backend data available",
      }
  );

  /*
   * If the backend introduces an additional disaster type
   * in the future, preserve it instead of silently hiding it.
   */
  const additionalRisks = risks.filter(
    (risk) =>
      !EXPECTED_RISKS.some(
        (expectedType) =>
          expectedType.toLowerCase() ===
          risk.disasterType?.toLowerCase()
      )
  );

  const allRisks = [
    ...displayedRisks,
    ...additionalRisks,
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            All Disaster Risks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Multi-disaster assessment from available
            backend data sources
          </p>
        </div>

        <div className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:block">
          {allRisks.length} Risk Types
        </div>
      </div>

      {/* Risk cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allRisks.map((risk) => {
          const score = formatScore(
            risk.riskScore
          );

          const available =
            risk.dataAvailable &&
            risk.riskScore !== null &&
            Number.isFinite(risk.riskScore);

          return (
            <article
              key={risk.disasterType}
              className={`rounded-xl border p-4 transition ${
                available
                  ? "border-slate-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              {/* Card top */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  {getRiskIcon(
                    risk.disasterType
                  )}
                </div>

                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${riskLevelClass(
                    risk.riskLevel
                  )}`}
                >
                  {riskLevelLabel(
                    risk.riskLevel
                  )}
                </span>
              </div>

              {/* Disaster name */}
              <div className="mt-4 min-h-[32px] text-sm font-bold leading-5 text-slate-800">
                {risk.disasterType}
              </div>

              {/* Score */}
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className={`text-2xl font-black ${
                    available
                      ? "text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {score}
                </span>

                {available && (
                  <span className="text-[10px] text-slate-400">
                    / 100
                  </span>
                )}
              </div>

              {/* Availability */}
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    available
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                />

                <span
                  className={`text-[10px] font-semibold ${
                    available
                      ? "text-emerald-700"
                      : "text-slate-500"
                  }`}
                >
                  {available
                    ? "Data available"
                    : "No data"}
                </span>
              </div>

              {/* Data source */}
              <div
                className="mt-2 truncate text-[10px] leading-4 text-slate-400"
                title={getAvailabilityText(risk)}
              >
                {getAvailabilityText(risk)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
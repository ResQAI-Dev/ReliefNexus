import type { RiskPrediction } from "../types/riskPrediction.types";
import {
  formatDate,
  riskLevelClass,
  riskLevelLabel,
} from "../utils/riskPrediction.utils";

interface Props {
  predictions: RiskPrediction[];
  loading: boolean;
  onSelect: (prediction: RiskPrediction) => void;
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

function getRiskIcon(disasterType?: string): string {
  const type = disasterType?.toLowerCase() ?? "";

  if (type.includes("flood")) return "🌊";
  if (type.includes("landslide")) return "⛰️";
  if (
    type.includes("storm") ||
    type.includes("cyclone")
  ) {
    return "🌀";
  }
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

function safeFormatDate(value: string): string {
  if (!value) {
    return "Date unavailable";
  }

  try {
    return formatDate(value);
  } catch {
    return "Date unavailable";
  }
}

export default function RecentPredictions({
  predictions,
  loading,
  onSelect,
}: Props) {
  const recentItems = predictions.slice(0, 5);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Recent Predictions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest risk assessments
          </p>
        </div>

        {predictions.length > 0 && (
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
            {predictions.length} Total
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center justify-between rounded-xl border border-slate-100 p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200" />

                <div>
                  <div className="h-3 w-32 rounded bg-slate-200" />
                  <div className="mt-2 h-2.5 w-44 rounded bg-slate-100" />
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="h-4 w-12 rounded bg-slate-200" />
                <div className="h-4 w-14 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : recentItems.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <div className="text-2xl">📋</div>

          <div className="mt-2 text-sm font-semibold text-slate-700">
            No previous predictions found
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Completed risk assessments will appear here
            after they are returned by the backend.
          </p>
        </div>
      ) : (
        /* Prediction list */
        <div className="space-y-2.5">
          {recentItems.map((item, index) => {
            const score = formatScore(
              item.riskScore
            );

            const disasterType =
              item.disasterType?.trim() ||
              "Risk Assessment";

            const location =
              item.location?.trim() ||
              "Unknown location";

            return (
              <button
                key={`${item.id}-${index}`}
                type="button"
                onClick={() => onSelect(item)}
                className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 p-3.5 text-left transition hover:border-blue-200 hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {/* Left side */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg transition group-hover:bg-white">
                    {getRiskIcon(disasterType)}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-800">
                      {location}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                      <span>{disasterType}</span>

                      <span aria-hidden="true">
                        •
                      </span>

                      <span>
                        {safeFormatDate(
                          item.createdAt
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex shrink-0 flex-col items-end">
                  <div
                    className={`text-sm font-black ${
                      score === "N/A"
                        ? "text-slate-400"
                        : "text-slate-900"
                    }`}
                  >
                    {score}
                  </div>

                  <span
                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${riskLevelClass(
                      item.riskLevel
                    )}`}
                  >
                    {riskLevelLabel(
                      item.riskLevel
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && recentItems.length > 0 && (
        <div className="mt-4 text-center text-[11px] text-slate-400">
          Select an assessment to load its values into
          the prediction form.
        </div>
      )}
    </section>
  );
}
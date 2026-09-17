interface Props {
  recommendations: string[];
}

function cleanRecommendations(
  recommendations: string[]
): string[] {
  return recommendations
    .filter(
      (recommendation): recommendation is string =>
        typeof recommendation === "string"
    )
    .map((recommendation) => recommendation.trim())
    .filter(Boolean);
}

export default function Recommendations({
  recommendations,
}: Props) {
  const items = cleanRecommendations(
    recommendations
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recommendations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Suggested response actions from the risk analysis
              service
            </p>
          </div>

          {items.length > 0 && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
              {items.length} Actions
            </span>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <div className="text-2xl">📋</div>

          <div className="mt-2 text-sm font-semibold text-slate-700">
            No recommendations available
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            The backend did not return any response
            recommendations for this prediction.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((recommendation, index) => (
            <div
              key={`${recommendation}-${index}`}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/40"
            >
              {/* Number */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-700">
                {index + 1}
              </div>

              {/* Recommendation text */}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6 text-slate-700">
                  {recommendation}
                </p>
              </div>

              {/* Action indicator */}
              <span
                className="mt-1 text-blue-500"
                aria-hidden="true"
              >
                →
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Source note */}
      {items.length > 0 && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="text-sm">ℹ️</span>

            <p className="text-xs leading-5 text-blue-700">
              These actions are provided by the backend
              risk analysis service based on the available
              prediction data.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
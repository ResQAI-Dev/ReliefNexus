import type { RiskFactor } from "../types/riskPrediction.types";

interface Props {
  factors: RiskFactor[];
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "N/A";
  }

  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2);
}

function formatContribution(
  contribution: number
): string {
  if (!Number.isFinite(contribution)) {
    return "N/A";
  }

  return contribution.toFixed(1);
}

function getContributionWidth(
  contribution: number
): number {
  if (!Number.isFinite(contribution)) {
    return 0;
  }

  return Math.min(
    Math.max(Math.abs(contribution), 0),
    100
  );
}

function getImpactClass(impact?: string): string {
  const value = impact?.toLowerCase() ?? "";

  if (
    value.includes("high") ||
    value.includes("critical") ||
    value.includes("strong")
  ) {
    return "bg-rose-50 text-rose-700";
  }

  if (
    value.includes("medium") ||
    value.includes("moderate")
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    value.includes("low") ||
    value.includes("weak")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function RiskFactors({
  factors,
}: Props) {
  const validFactors = factors.filter(
    (factor) =>
      factor &&
      typeof factor.factor === "string"
  );

  const sortedFactors = [...validFactors].sort(
    (a, b) => {
      const aContribution = Number.isFinite(
        a.contribution
      )
        ? Math.abs(a.contribution)
        : -1;

      const bContribution = Number.isFinite(
        b.contribution
      )
        ? Math.abs(b.contribution)
        : -1;

      return bContribution - aContribution;
    }
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Top Risk Factors
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Factors contributing to this prediction
            </p>
          </div>

          {sortedFactors.length > 0 && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
              {sortedFactors.length} Factors
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {sortedFactors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <div className="text-2xl">📊</div>

          <div className="mt-2 text-sm font-semibold text-slate-700">
            No risk factors available
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            The backend did not return contributing
            factors for this prediction.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedFactors.map((factor, index) => {
            const width = getContributionWidth(
              factor.contribution
            );

            const impactClass = getImpactClass(
              factor.impact
            );

            return (
              <div
                key={`${factor.factor}-${index}`}
                className="rounded-xl border border-slate-100 p-3.5"
              >
                {/* Factor heading */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-black text-blue-700">
                        {index + 1}
                      </span>

                      <span className="text-sm font-bold text-slate-800">
                        {factor.factor}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-black text-slate-900">
                    {formatContribution(
                      factor.contribution
                    )}
                  </span>
                </div>

                {/* Contribution bar */}
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${width}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Factor details */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Value
                    </span>

                    <span className="ml-1.5 text-xs font-bold text-slate-700">
                      {formatNumber(factor.value)}
                    </span>
                  </div>

                  {factor.impact?.trim() && (
                    <span
                      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${impactClass}`}
                    >
                      {factor.impact}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Explanation */}
      {sortedFactors.length > 0 && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="text-sm">ℹ️</span>

            <p className="text-xs leading-5 text-blue-700">
              Contribution values are provided by the
              backend risk analysis service. The frontend
              only visualizes the returned values.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
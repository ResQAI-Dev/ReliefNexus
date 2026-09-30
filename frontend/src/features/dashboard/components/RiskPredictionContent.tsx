import type { RiskPrediction } from "../types/userDashboard.types";

export const RiskPredictionContent = ({ risk, loading, factors, LoadingState, EmptyState, RiskMetric, numberValue, getRiskColor, ShieldCheckIcon, CloudIcon, WaterIcon, DropIcon, ChartIcon }: { risk: RiskPrediction | null; loading: boolean; factors: string[]; LoadingState: React.ComponentType; EmptyState: React.ComponentType<{ text: string }>; RiskMetric: React.ComponentType<{ icon: React.ReactNode; label: string; value: string }>; numberValue: (value?: number | null) => number | null; getRiskColor: (level?: string) => string; ShieldCheckIcon: React.ComponentType; CloudIcon: React.ComponentType; WaterIcon: React.ComponentType; DropIcon: React.ComponentType; ChartIcon: React.ComponentType; }) => {
  if (loading) return <LoadingState />;
  if (!risk) {
    return (
      <EmptyState text="No risk prediction has been returned by the Risk Prediction API." />
    );
  }

  const score = numberValue(risk.riskScore);
  const level = risk.riskLevel || "Unknown";
  const degrees = (score ?? 0) * 3.6;

  return (
    <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
      <div className="flex flex-col items-center justify-center">
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-slate-100">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#10b981 0deg ${degrees}deg,#e2e8f0 ${degrees}deg 360deg)`,
            }}
          />
          <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-bold text-slate-900">
              {score !== null ? `${score}%` : "N/A"}
            </span>
            <span className="mt-1 text-xs text-slate-500">Risk Score</span>
          </div>
        </div>

        <div
          className={`mt-3 rounded-full px-3 py-1.5 text-xs font-semibold ${getRiskColor(
            level
          )}`}
        >
          {level} Risk
        </div>
      </div>

      <div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ShieldCheckIcon />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                {risk.disasterType || "Risk assessment"}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {risk.recommendation ||
                  "No recommendation was returned by the Risk Prediction Agent."}
              </p>

              {risk.confidence != null && (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Confidence: {numberValue(risk.confidence)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RiskMetric
            icon={<CloudIcon />}
            label="Rainfall"
            value={
              risk.rainfall != null
                ? String(risk.rainfall)
                : risk.rainfallLevel || "N/A"
            }
          />
          <RiskMetric
            icon={<WaterIcon />}
            label="River Level"
            value={risk.riverLevel || "N/A"}
          />
          <RiskMetric
            icon={<DropIcon />}
            label="Temperature"
            value={
              risk.temperature != null
                ? `${risk.temperature}C`
                : "N/A"
            }
          />
          <RiskMetric
            icon={<ChartIcon />}
            label="History"
            value={risk.historicalRisk || "N/A"}
          />
        </div>

        {factors.length > 0 && (
          <div className="mt-4 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-bold text-slate-900">
              Main risk factors
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {factors.map((factor, index) => (
                <li key={`${factor}-${index}`}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};



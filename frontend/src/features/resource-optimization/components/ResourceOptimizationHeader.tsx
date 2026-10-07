import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Play,
  RefreshCw,
} from "lucide-react";

interface ResourceOptimizationHeaderProps {
  assessmentId: string;
  onAssessmentIdChange: (
    value: string
  ) => void;
  onOptimize: () => void;
  onRefresh: () => void;
  optimizing: boolean;
  loading: boolean;
}

export default function ResourceOptimizationHeader({
  assessmentId,
  onAssessmentIdChange,
  onOptimize,
  onRefresh,
  optimizing,
  loading,
}: ResourceOptimizationHeaderProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <BrainCircuit size={24} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Resource Optimization
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={13} />
                Agent 03 Ready
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Optimize relief resource allocation
              based on vulnerability assessments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
            <Activity size={14} />
            AI Resource Planning
          </span>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || optimizing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vulnerability Assessment ID
            </label>

            <input
              type="text"
              value={assessmentId}
              onChange={(event) =>
                onAssessmentIdChange(
                  event.target.value
                )
              }
              placeholder="Enter vulnerability assessment ID"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={onOptimize}
            disabled={
              optimizing ||
              !assessmentId.trim()
            }
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play
              size={16}
              fill="currentColor"
            />

            {optimizing
              ? "Optimizing..."
              : "Run Optimization"}
          </button>
        </div>
      </div>
    </div>
  );
}
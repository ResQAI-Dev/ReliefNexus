import {
  BrainCircuit,
  Play,
} from "lucide-react";

interface ResourceEmptyStateProps {
  onOptimize: () => void;
  disabled?: boolean;
}

export default function ResourceEmptyState({
  onOptimize,
  disabled = false,
}: ResourceEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <BrainCircuit size={27} />
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-900">
        No Resource Optimization Results
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Enter a vulnerability assessment ID and
        run Agent 03 to generate optimized relief
        resource allocations.
      </p>

      <button
        type="button"
        onClick={onOptimize}
        disabled={disabled}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Play
          size={15}
          fill="currentColor"
        />
        Run Optimization
      </button>
    </div>
  );
}
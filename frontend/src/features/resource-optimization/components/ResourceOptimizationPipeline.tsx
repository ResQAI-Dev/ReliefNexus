import {
  CheckCircle2,
  Circle,
  Database,
  GitBranch,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

interface ResourceOptimizationPipelineProps {
  hasAllocations: boolean;
  optimizing: boolean;
}

export default function ResourceOptimizationPipeline({
  hasAllocations,
  optimizing,
}: ResourceOptimizationPipelineProps) {
  const steps = [
    {
      label: "Assessment Loaded",
      icon: Database,
    },
    {
      label: "Resources Loaded",
      icon: PackageCheck,
    },
    {
      label: "Priority Calculated",
      icon: GitBranch,
    },
    {
      label: "Allocations Created",
      icon: PackageCheck,
    },
    {
      label: "Resources Updated",
      icon: GitBranch,
    },
    {
      label: "Validation",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Agent 03 Execution Pipeline
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Resource optimization workflow status.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => {
          const completed =
            hasAllocations;

          const Icon = step.icon;

          return (
            <div
              key={step.label}
              className="relative"
            >
              <div
                className={`flex min-h-[100px] flex-col items-center justify-center rounded-xl border p-3 text-center ${
                  completed
                    ? "border-emerald-200 bg-emerald-50"
                    : optimizing
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                {completed ? (
                  <CheckCircle2
                    size={21}
                    className="text-emerald-600"
                  />
                ) : optimizing &&
                  index === 0 ? (
                  <Icon
                    size={21}
                    className="animate-pulse text-blue-600"
                  />
                ) : (
                  <Circle
                    size={21}
                    className="text-slate-300"
                  />
                )}

                <span className="mt-2 text-xs font-semibold text-slate-700">
                  {step.label}
                </span>

                <span className="mt-1 text-[10px] text-slate-400">
                  Step {index + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
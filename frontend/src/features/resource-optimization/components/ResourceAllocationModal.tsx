import {
  X,
  MapPin,
  Package,
  ShieldAlert,
} from "lucide-react";

import type {
  ResourceAllocation,
} from "../types/resourceOptimization.types";

import {
  getPriorityClass,
} from "../utils/resourceOptimization.utils";

interface ResourceAllocationModalProps {
  allocation:
    | ResourceAllocation
    | null;
  open: boolean;
  onClose: () => void;
}

export default function ResourceAllocationModal({
  allocation,
  open,
  onClose,
}: ResourceAllocationModalProps) {
  if (!open || !allocation) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Resource Allocation
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {allocation.resourceName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Package size={16} />

                <span className="text-xs">
                  Quantity
                </span>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {allocation.recommendedQuantity}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldAlert size={16} />

                <span className="text-xs">
                  Priority
                </span>
              </div>

              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(
                  allocation.priority
                )}`}
              >
                {allocation.priority}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <MapPin
                size={17}
                className="text-blue-600"
              />

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Deployment Location
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {allocation.location ||
                "Location not specified"}
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-500">
            <p>
              <span className="font-semibold text-slate-600">
                Resource type:
              </span>{" "}
              {allocation.resourceType}
            </p>

            <p className="break-all">
              <span className="font-semibold text-slate-600">
                Assessment:
              </span>{" "}
              {allocation.vulnerabilityAssessmentId}
            </p>

            <p className="break-all">
              <span className="font-semibold text-slate-600">
                Allocation:
              </span>{" "}
              {allocation.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
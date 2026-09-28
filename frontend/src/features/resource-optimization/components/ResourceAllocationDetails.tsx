import {
  CalendarDays,
  Hash,
  MapPin,
  Package,
  ShieldAlert,
} from "lucide-react";

import type {
  ResourceAllocation,
} from "../types/resourceOptimization.types";

import {
  formatResourceDate,
  getPriorityClass,
} from "../utils/resourceOptimization.utils";

interface ResourceAllocationDetailsProps {
  allocation:
    | ResourceAllocation
    | null;
}

export default function ResourceAllocationDetails({
  allocation,
}: ResourceAllocationDetailsProps) {
  if (!allocation) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="py-8 text-center">
          <Package
            size={30}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Select an allocation
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Allocation details will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Allocation Details
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900">
          {allocation.resourceName}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {allocation.resourceType}
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Recommended Quantity
            </span>

            <span className="text-xl font-bold text-slate-900">
              {allocation.recommendedQuantity}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-100 p-3">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <ShieldAlert size={15} />

              <span className="text-xs">
                Priority
              </span>
            </div>

            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getPriorityClass(
                allocation.priority
              )}`}
            >
              {allocation.priority}
            </span>
          </div>

          <div className="rounded-lg border border-slate-100 p-3">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <MapPin size={15} />

              <span className="text-xs">
                Location
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-700">
              {allocation.location ||
                "—"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Hash
              size={16}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Allocation ID
              </p>

              <p className="mt-1 break-all text-xs font-medium text-slate-700">
                {allocation.id}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package
              size={16}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Resource ID
              </p>

              <p className="mt-1 break-all text-xs font-medium text-slate-700">
                {allocation.resourceId}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarDays
              size={16}
              className="mt-0.5 text-slate-400"
            />

            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Created
              </p>

              <p className="mt-1 text-xs font-medium text-slate-700">
                {formatResourceDate(
                  allocation.createdAt
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
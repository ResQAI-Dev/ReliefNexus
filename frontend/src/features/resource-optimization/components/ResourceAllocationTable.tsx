import {
  ChevronRight,
  MapPin,
  Package,
} from "lucide-react";

import type {
  ResourceAllocation,
} from "../types/resourceOptimization.types";

import {
  formatResourceDate,
  getPriorityClass,
} from "../utils/resourceOptimization.utils";

interface ResourceAllocationTableProps {
  allocations: ResourceAllocation[];
  selectedAllocation:
    | ResourceAllocation
    | null;
  onSelect: (
    allocation: ResourceAllocation
  ) => void;
}

export default function ResourceAllocationTable({
  allocations,
  selectedAllocation,
  onSelect,
}: ResourceAllocationTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Resource Allocations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Recommended relief resources generated
              by Agent 03.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {allocations.length} records
          </span>
        </div>
      </div>

      {allocations.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <Package
            size={30}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-medium text-slate-600">
            No allocations match the current filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Resource
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>

                <th className="px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {allocations.map(
                (allocation) => {
                  const isSelected =
                    selectedAllocation?.id ===
                    allocation.id;

                  return (
                    <tr
                      key={allocation.id}
                      onClick={() =>
                        onSelect(allocation)
                      }
                      className={`cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/40 ${
                        isSelected
                          ? "bg-blue-50/60"
                          : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {allocation.resourceName}
                        </div>

                        <div className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                          {allocation.resourceId}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {allocation.resourceType}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {allocation.recommendedQuantity}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(
                            allocation.priority
                          )}`}
                        >
                          {allocation.priority}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin
                            size={14}
                            className="text-slate-400"
                          />
                          {allocation.location ||
                            ""}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatResourceDate(
                          allocation.createdAt
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <ChevronRight
                          size={17}
                          className="text-slate-400"
                        />
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

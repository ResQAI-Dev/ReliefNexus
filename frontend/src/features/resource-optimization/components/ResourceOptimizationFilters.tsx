import {
  Filter,
  Search,
  X,
} from "lucide-react";

import type {
  ResourceOptimizationFilters as Filters,
} from "../types/resourceOptimization.types";

interface ResourceOptimizationFiltersProps {
  filters: Filters;
  onChange: (
    filters: Filters
  ) => void;
  priorities: string[];
  resourceTypes: string[];
  locations: string[];
}

export default function ResourceOptimizationFilters({
  filters,
  onChange,
  priorities,
  resourceTypes,
  locations,
}: ResourceOptimizationFiltersProps) {
  const update = (
    key: keyof Filters,
    value: string
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onChange({
      priority: "All",
      resourceType: "All",
      location: "All",
      search: "",
    });
  };

  const hasFilters =
    filters.search ||
    filters.priority !== "All" ||
    filters.resourceType !== "All" ||
    filters.location !== "All";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter
            size={17}
            className="text-blue-600"
          />

          <h2 className="text-sm font-semibold text-slate-800">
            Allocation Filters
          </h2>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={filters.search}
            onChange={(event) =>
              update(
                "search",
                event.target.value
              )
            }
            placeholder="Search resource..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={filters.priority}
          onChange={(event) =>
            update(
              "priority",
              event.target.value
            )
          }
          className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
        >
          <option value="All">
            All priorities
          </option>

          {priorities.map((priority) => (
            <option
              key={priority}
              value={priority}
            >
              {priority}
            </option>
          ))}
        </select>

        <select
          value={filters.resourceType}
          onChange={(event) =>
            update(
              "resourceType",
              event.target.value
            )
          }
          className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
        >
          <option value="All">
            All resource types
          </option>

          {resourceTypes.map((type) => (
            <option
              key={type}
              value={type}
            >
              {type}
            </option>
          ))}
        </select>

        <select
          value={filters.location}
          onChange={(event) =>
            update(
              "location",
              event.target.value
            )
          }
          className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
        >
          <option value="All">
            All locations
          </option>

          {locations.map((location) => (
            <option
              key={location}
              value={location}
            >
              {location}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
import type {
  ResourceAllocation,
  ResourceOptimizationFilters,
  ResourceOptimizationSummary,
} from "../types/resourceOptimization.types";

export function calculateResourceSummary(
  allocations: ResourceAllocation[]
): ResourceOptimizationSummary {
  const totalRecommendedQuantity =
    allocations.reduce(
      (total, allocation) =>
        total +
        Number(
          allocation.recommendedQuantity || 0
        ),
      0
    );

  const locations = new Set(
    allocations
      .map((allocation) =>
        allocation.location?.trim()
      )
      .filter(
        (location): location is string =>
          Boolean(location)
      )
  );

  const resourceTypes = new Set(
    allocations
      .map((allocation) =>
        allocation.resourceType?.trim()
      )
      .filter(
        (type): type is string =>
          Boolean(type)
      )
  );

  return {
    totalAllocations:
      allocations.length,

    totalRecommendedQuantity,

    criticalAllocations:
      allocations.filter(
        (allocation) =>
          allocation.priority
            ?.toLowerCase() === "critical"
      ).length,

    highAllocations:
      allocations.filter(
        (allocation) =>
          allocation.priority
            ?.toLowerCase() === "high"
      ).length,

    mediumAllocations:
      allocations.filter(
        (allocation) =>
          allocation.priority
            ?.toLowerCase() === "medium"
      ).length,

    lowAllocations:
      allocations.filter(
        (allocation) =>
          allocation.priority
            ?.toLowerCase() === "low"
      ).length,

    locationsCovered:
      locations.size,

    resourceTypes:
      resourceTypes.size,
  };
}

export function filterResourceAllocations(
  allocations: ResourceAllocation[],
  filters: ResourceOptimizationFilters
): ResourceAllocation[] {
  const search =
    filters.search.trim().toLowerCase();

  return allocations.filter(
    (allocation) => {
      const matchesSearch =
        !search ||
        allocation.resourceName
          ?.toLowerCase()
          .includes(search) ||
        allocation.resourceType
          ?.toLowerCase()
          .includes(search) ||
        allocation.location
          ?.toLowerCase()
          .includes(search);

      const matchesPriority =
        filters.priority === "All" ||
        !filters.priority ||
        allocation.priority ===
          filters.priority;

      const matchesType =
        filters.resourceType === "All" ||
        !filters.resourceType ||
        allocation.resourceType ===
          filters.resourceType;

      const matchesLocation =
        filters.location === "All" ||
        !filters.location ||
        allocation.location ===
          filters.location;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesType &&
        matchesLocation
      );
    }
  );
}

export function getPriorityClass(
  priority: string
): string {
  switch (priority?.toLowerCase()) {
    case "critical":
      return "bg-red-50 text-red-700 border-red-200";

    case "high":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "low":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export function formatResourceDate(
  value?: string
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

import {
  Boxes,
  MapPin,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";

import type {
  ResourceOptimizationSummary,
} from "../types/resourceOptimization.types";

interface ResourceOptimizationKpiCardsProps {
  summary: ResourceOptimizationSummary;
}

export default function ResourceOptimizationKpiCards({
  summary,
}: ResourceOptimizationKpiCardsProps) {
  const cards = [
    {
      label: "Total Allocations",
      value: summary.totalAllocations,
      icon: PackageCheck,
      description: "Generated allocations",
    },
    {
      label: "Recommended Quantity",
      value: summary.totalRecommendedQuantity,
      icon: Boxes,
      description: "Units recommended",
    },
    {
      label: "High / Critical",
      value:
        summary.highAllocations +
        summary.criticalAllocations,
      icon: ShieldAlert,
      description: "Priority allocations",
    },
    {
      label: "Locations Covered",
      value: summary.locationsCovered,
      icon: MapPin,
      description: `${summary.resourceTypes} resource types`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {card.value.toLocaleString()}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {card.description}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function riskLevelClass(
  level?: string
): string {
  switch ((level ?? "").trim().toLowerCase()) {
    case "critical":
      return "border-red-200 bg-red-100 text-red-700";

    case "high":
      return "border-rose-200 bg-rose-100 text-rose-700";

    case "moderate":
      return "border-orange-200 bg-orange-100 text-orange-700";

    case "medium":
      return "border-amber-200 bg-amber-100 text-amber-700";

    case "low":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";

    case "dataunavailable":
    case "data unavailable":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function riskLevelLabel(
  level?: string
): string {
  if (!level?.trim()) {
    return "Unknown";
  }

  const normalized = level.trim().toLowerCase();

  switch (normalized) {
    case "dataunavailable":
    case "data unavailable":
      return "No Data";

    case "critical":
      return "Critical";

    case "high":
      return "High";

    case "moderate":
      return "Moderate";

    case "medium":
      return "Medium";

    case "low":
      return "Low";

    default:
      return level.trim();
  }
}

export function formatDate(
  value: string
): string {
  if (!value?.trim()) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
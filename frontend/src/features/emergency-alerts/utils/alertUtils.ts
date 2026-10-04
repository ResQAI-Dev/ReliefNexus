import {
  AlertTriangle,
  Waves,
  Flame,
  Wind,
  CloudRain,
  Mountain,
  Bug,
} from "lucide-react";

export const getSeverityConfig = (severity?: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return {
        badgeColor: "bg-red-100 text-red-800",
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
      };

    case "high":
      return {
        badgeColor: "bg-orange-100 text-orange-800",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
      };

    case "medium":
      return {
        badgeColor: "bg-yellow-100 text-yellow-800",
        iconBg: "bg-yellow-50",
        iconColor: "text-yellow-600",
      };

    default:
      return {
        badgeColor: "bg-green-100 text-green-800",
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
      };
  }
};

export const getStatusConfig = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return {
        badgeColor: "bg-green-100 text-green-800",
      };

    case "monitoring":
      return {
        badgeColor: "bg-blue-100 text-blue-800",
      };

    case "resolved":
      return {
        badgeColor: "bg-purple-100 text-purple-800",
      };

    case "closed":
      return {
        badgeColor: "bg-gray-100 text-gray-800",
      };

    default:
      return {
        badgeColor: "bg-gray-100 text-gray-800",
      };
  }
};

export const getDisasterIcon = (type?: string) => {
  switch (type?.toLowerCase()) {
    case "flood":
      return Waves;

    case "wildfire":
    case "fire":
      return Flame;

    case "storm":
    case "cyclone":
      return Wind;

    case "rainfall":
      return CloudRain;

    case "landslide":
      return Mountain;

    case "earthquake":
      return AlertTriangle;

    default:
      return Bug;
  }
};

export const formatDateTime = (
  value?: string
) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

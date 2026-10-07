import type { Role, SectionId } from "../types/userDashboard.types";

export const numberValue = (value?: number | null) =>
  value == null || Number.isNaN(Number(value)) ? null : Number(value);

export const normalizeFactors = (value?: string[] | string) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

export const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export const normalizeRole = (role?: string): Role => {
  const value = (role || "").toLowerCase().replace(/[\s_-]/g, "");

  if (value === "fieldvolunteer") return "FieldVolunteer";
  if (value === "reliefcoordinator") return "ReliefCoordinator";
  return "AffectedUser";
};

export const getCurrentSection = (pathname: string): SectionId => {
  if (
    pathname.endsWith("/reports") ||
    pathname.endsWith("/report-disaster") ||
    pathname.endsWith("/disaster-reports")
  ) {
    return "reports";
  }

  if (
    pathname.endsWith("/my-requests") ||
    pathname.endsWith("/assigned-requests") ||
    pathname.endsWith("/assistance-requests")
  ) {
    return "requests";
  }

  if (pathname.endsWith("/emergency-alerts")) return "alerts";

  if (
    pathname.endsWith("/risk-prediction") ||
    pathname.endsWith("/risk-information")
  ) {
    return "risk";
  }

  if (pathname.endsWith("/relief-resources")) return "resources";
  if (pathname.endsWith("/location-sharing")) return "location";
  if (pathname.endsWith("/profile")) return "profile";

  return "dashboard";
};

export const sectionRoute = (section: SectionId) => {
  const routes: Record<Exclude<SectionId, "dashboard">, string> = {
    reports: "reports",
    requests: "requests",
    alerts: "emergency-alerts",
    risk: "risk-prediction",
    resources: "relief-resources",
    location: "location-sharing",
    profile: "profile",
  };

  return section === "dashboard"
    ? ""
    : routes[section as Exclude<SectionId, "dashboard">];
};

export const actionLabel = (section: SectionId, role: Role) => {
  if (section === "reports") {
    return role === "AffectedUser" ? "Report Disaster" : "Disaster Reports";
  }

  if (section === "requests") {
    return role === "AffectedUser"
      ? "My Requests"
      : role === "FieldVolunteer"
        ? "Assigned Requests"
        : "Assistance Requests";
  }

  if (section === "alerts") return "Emergency Alerts";
  if (section === "risk") return "Risk Prediction";
  if (section === "resources") return "Relief Resources";
  if (section === "location") return "Location Sharing";

  return "Profile";
};

export const actionDescription = (section: SectionId, role: Role) => {
  if (section === "reports") {
    return role === "AffectedUser"
      ? "Report a disaster and share the situation with the relief team."
      : "Review disaster reports available to your role.";
  }

  if (section === "requests") {
    return role === "AffectedUser"
      ? "Track your assistance requests and their latest status."
      : role === "FieldVolunteer"
        ? "Review and manage relief requests assigned to field operations."
        : "Review and coordinate assistance requests.";
  }

  if (section === "alerts") {
    return "Review active emergency alerts and recommended response actions.";
  }

  if (section === "risk") {
    return "Review the latest real risk prediction and supporting factors.";
  }

  if (section === "resources") {
    return "Monitor available relief resources and allocation information.";
  }

  if (section === "location") {
    return "Share your current location with the relief coordination team.";
  }

  return "Review your account profile and personal information.";
};


import type { Role, RoleConfig } from "../types/userDashboard.types";

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  AffectedUser: {
    title: "Community Safety Dashboard",
    badge: "Affected User",
    description:
      "Stay informed, report emergencies, request assistance, and monitor the latest safety information.",
    menu: [
      "dashboard",
      "reports",
      "requests",
      "alerts",
      "risk",
      "resources",
      "location",
      "profile",
    ],
    quickActions: ["reports", "requests", "location", "alerts"],
  },

  FieldVolunteer: {
    title: "Field Operations Dashboard",
    badge: "Field Volunteer",
    description:
      "Monitor disaster information, support affected communities, and coordinate field response activities.",
    menu: [
      "dashboard",
      "reports",
      "requests",
      "alerts",
      "risk",
      "location",
      "profile",
    ],
    quickActions: ["reports", "requests", "risk", "alerts"],
  },

  ReliefCoordinator: {
    title: "Relief Coordination Dashboard",
    badge: "Relief Coordinator",
    description:
      "Coordinate relief operations, monitor risk intelligence, and manage response resources.",
    menu: [
      "dashboard",
      "reports",
      "requests",
      "alerts",
      "risk",
      "resources",
      "profile",
    ],
    quickActions: ["requests", "risk", "resources", "alerts"],
  },
};

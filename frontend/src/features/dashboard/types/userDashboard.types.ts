import type { ReactNode } from "react";

export type Role =
  | "AffectedUser"
  | "FieldVolunteer"
  | "ReliefCoordinator";

export type SectionId =
  | "dashboard"
  | "reports"
  | "requests"
  | "alerts"
  | "risk"
  | "resources"
  | "location"
  | "profile";

export interface RiskPrediction {
  id?: string;
  location?: string;
  disasterType?: string;
  riskScore?: number;
  riskLevel?: string;
  confidence?: number;
  rainfall?: number;
  rainfallLevel?: string;
  riverLevel?: string;
  temperature?: number;
  historicalRisk?: string;
  mainFactors?: string[] | string;
  recommendation?: string;
  createdAt?: string;
}

export interface AssistanceRequest {
  id?: string;
  requestId?: string;
  title?: string;
  type?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencyAlert {
  id?: string;
  riskPredictionId?: string;
  vulnerabilityAssessmentId?: string;
  title?: string;
  message?: string;
  location?: string;
  disasterType?: string;
  severity?: string;
  status?: string;
  recommendedActions?: string;
  resourceSummary?: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface ReliefResource {
  id?: string;
  resourceType?: string;
  resourceName?: string;
  availableQuantity?: number;
  allocatedQuantity?: number;
  location?: string;
  status?: string;
}

export interface Notification {
  id?: string;
  userId?: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface MenuItem {
  id: SectionId;
  label: string;
  icon: ReactNode;
}

export interface RoleConfig {
  title: string;
  badge: string;
  description: string;
  menu: SectionId[];
  quickActions: SectionId[];
}

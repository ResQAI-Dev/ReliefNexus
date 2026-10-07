export interface EmergencyAlert {
  id: string;
  riskPredictionId: string;
  vulnerabilityAssessmentId: string;
  title: string;
  message: string;
  location: string;
  disasterType: string;
  severity: string;
  status: string;
  recommendedActions: string;
  resourceSummary: string;
  createdAt: string;
  isActive: boolean;
}

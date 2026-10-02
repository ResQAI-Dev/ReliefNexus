export type RiskLevel =
  | "Low"
  | "Moderate"
  | "Medium"
  | "High"
  | "Critical"
  | "DataUnavailable"
  | string;

export interface RiskFactor {
  factor: string;
  value: number;
  impact: string;
  contribution: number;
}

export interface DisasterRisk {
  disasterType: string;
  riskScore: number | null;
  riskLevel: RiskLevel;
  dataAvailable: boolean;
  dataSource: string;
}

export interface RiskPrediction {
  id: string;

  location: string;
  latitude: number | null;
  longitude: number | null;

  rainfall1h: number;
  rainfall3h: number;
  rainfall24h: number;

  riverLevel: number;
  riverFlow: number;

  temperature: number;
  humidity: number;
  windSpeed: number;
  soilMoisture: number;

  elevation: number;
  populationDensity: number;

  historicalFloodCount: number;
  historicalSeverity: number;
  drainageCapacity: number;
  forecastRainfall: number;

  disasterType: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;

  /**
   * Risk assessment for the supported disaster types.
   *
   * The backend may return null risk scores when
   * sufficient data is not available.
   */
  disasterRisks: DisasterRisk[];

  riskFactors: RiskFactor[];
  recommendations: string[];

  predictionSource: string;
  modelVersion: string;

  requiresHumanApproval: boolean;
  isApproved: boolean;

  /**
   * Some backend versions may not return this field.
   */
  approvalStatus?: string;

  createdAt: string;
}

export interface RiskPredictionRequest {
  location: string;

  latitude: number;
  longitude: number;

  rainfall1h: number;
  rainfall3h: number;
  rainfall24h: number;

  riverLevel: number;
  riverFlow: number;

  temperature: number;
  humidity: number;
  windSpeed: number;
  soilMoisture: number;

  elevation: number;
  populationDensity: number;

  historicalFloodCount: number;
  historicalSeverity: number;
  drainageCapacity: number;
  forecastRainfall: number;
}

export interface RiskPredictionFormState {
  location: string;

  latitude: string;
  longitude: string;

  rainfall1h: string;
  rainfall3h: string;
  rainfall24h: string;

  riverLevel: string;
  riverFlow: string;

  temperature: string;
  humidity: string;
  windSpeed: string;
  soilMoisture: string;

  elevation: string;
  populationDensity: string;

  historicalFloodCount: string;
  historicalSeverity: string;
  drainageCapacity: string;

  forecastRainfall: string;
}

export interface ExternalDisasterEvent {
  eventType: string;
  eventId: string;
  name: string;
  alertLevel: string;

  latitude: number | null;
  longitude: number | null;
}

export interface PaginatedRiskPredictions {
  items: RiskPrediction[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
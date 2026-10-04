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

export interface RiskPrediction {
  id?: string;

  location: string;
  latitude?: number | null;
  longitude?: number | null;

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

  riskFactors: RiskFactor[];
  recommendations: string[];

  predictionSource: string;
  modelVersion: string;

  requiresHumanApproval: boolean;
  isApproved: boolean;

  createdAt: string;

  /**
   * Newer versions of the backend risk engine can expose
   * multiple disaster-specific predictions.
   *
   * This is optional so the frontend remains compatible
   * with the currently verified RiskPredictionDto.
   */
  disasterRisks?: DisasterRisk[];
}

export interface DisasterRisk {
  disasterType: string;
  riskScore: number | null;
  riskLevel: RiskLevel;
  dataAvailable?: boolean;
  dataSource?: string;
}

export interface RiskPredictionRequest {
  location: string;

  latitude?: number | null;
  longitude?: number | null;

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

  /**
   * The backend calculates these values.
   * They are therefore optional on create.
   */
  disasterType?: string;
  riskScore?: number;
  riskLevel?: string;
  confidence?: number;
}

export interface LocationSearchResult {
  id: number;

  name: string;
  latitude: number;
  longitude: number;

  country?: string;
  countryCode?: string;

  admin1?: string;
  admin2?: string;

  timezone?: string;
  population?: number;
}

export interface OpenMeteoCurrentWeather {
  time?: string;

  temperature_2m?: number;
  relative_humidity_2m?: number;

  precipitation?: number;
  rain?: number;
  showers?: number;

  wind_speed_10m?: number;
  wind_gusts_10m?: number;
  wind_direction_10m?: number;

  weather_code?: number;
}

export interface OpenMeteoHourlyWeather {
  time: string[];

  precipitation?: number[];
  rain?: number[];
  showers?: number[];

  precipitation_probability?: number[];

  temperature_2m?: number[];
  relative_humidity_2m?: number[];

  wind_speed_10m?: number[];
  wind_gusts_10m?: number[];

  soil_moisture_0_to_1cm?: number[];
  soil_moisture_1_to_3cm?: number[];
  soil_moisture_3_to_9cm?: number[];
  soil_moisture_9_to_27cm?: number[];
}

export interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;

  timezone?: string;
  timezone_abbreviation?: string;

  elevation?: number;

  current?: OpenMeteoCurrentWeather;
  hourly?: OpenMeteoHourlyWeather;

  current_units?: Record<string, string>;
  hourly_units?: Record<string, string>;
}

export interface GdacsEvent {
  eventtype?: string;
  eventid?: string | number;
  episodeid?: string | number;

  eventname?: string;

  alertlevel?: string;

  fromdate?: string;
  todate?: string;

  latitude?: number;
  longitude?: number;

  country?: string;
  iso3?: string;

  severity?: number | null;

  [key: string]: unknown;
}

export interface MapMarker {
  id: string;

  latitude: number;
  longitude: number;

  title: string;

  disasterType?: string;
  riskLevel?: RiskLevel;

  source?: string;

  popupData?: Record<string, unknown>;
}

export interface RiskPredictionState {
  prediction: RiskPrediction | null;

  recentPredictions: RiskPrediction[];

  loading: boolean;
  submitting: boolean;

  error: string | null;
}
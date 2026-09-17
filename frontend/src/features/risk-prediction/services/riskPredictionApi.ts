import type {
  ExternalDisasterEvent,
  PaginatedRiskPredictions,
  RiskPrediction,
  RiskPredictionRequest,
} from "../types/riskPrediction.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5115/api";

function getAccessToken(): string | null {
  const keys = ["accessToken", "token", "jwtToken"];

  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body: unknown = await response.json();

      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object") {
        const errorBody = body as {
          message?: string;
          title?: string;
          detail?: string;
          errors?: Record<string, string[]>;
        };

        message =
          errorBody.message ??
          errorBody.detail ??
          errorBody.title ??
          message;

        if (errorBody.errors) {
          const validationMessages = Object.values(errorBody.errors)
            .flat()
            .filter(Boolean);

          if (validationMessages.length > 0) {
            message = validationMessages.join(" ");
          }
        }
      }
    } catch {
      // Keep the HTTP status message when the response
      // doesn't contain readable JSON.
    }

    throw new Error(message);
  }

  /*
   * Some successful endpoints may return 204 No Content.
   */
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function createRiskPrediction(
  payload: RiskPredictionRequest
): Promise<RiskPrediction> {
  return request<RiskPrediction>("/risk-predictions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRiskPredictions(): Promise<
  PaginatedRiskPredictions | RiskPrediction[]
> {
  return request<PaginatedRiskPredictions | RiskPrediction[]>(
    "/risk-predictions?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc"
  );
}

export async function getPredictionHistory(): Promise<
  PaginatedRiskPredictions | RiskPrediction[]
> {
  return request<PaginatedRiskPredictions | RiskPrediction[]>(
    "/risk-predictions/history"
  );
}

export async function getExternalEvents(): Promise<
  ExternalDisasterEvent[]
> {
  return request<ExternalDisasterEvent[]>(
    "/risk-predictions/external-events"
  );
}

export async function getPredictionById(
  id: string
): Promise<RiskPrediction> {
  if (!id.trim()) {
    throw new Error("Prediction ID is required.");
  }

  return request<RiskPrediction>(
    `/risk-predictions/${encodeURIComponent(id)}`
  );
}

export async function explainPrediction(
  id: string
): Promise<unknown> {
  if (!id.trim()) {
    throw new Error("Prediction ID is required.");
  }

  return request(
    `/risk-predictions/${encodeURIComponent(id)}/explain`
  );
}
export async function getRiskPredictionEnvironment(
  latitude: number,
  longitude: number,
  location?: string
): Promise<RiskPrediction> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  if (location?.trim()) {
    params.set("location", location.trim());
  }

  return request<RiskPrediction>(
    `/risk-predictions/environment-live?${params.toString()}`
  );
}




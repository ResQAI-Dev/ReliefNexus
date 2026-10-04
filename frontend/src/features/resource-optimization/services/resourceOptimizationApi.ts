import type {
  ResourceAllocation,
} from "../types/resourceOptimization.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5115/api";

function getAccessToken(): string | null {
  const keys = [
    "accessToken",
    "token",
    "jwtToken",
  ];

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

  const headers = new Headers(
    options.headers
  );

  if (!headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}`;

    try {
      const body: unknown =
        await response.json();

      if (typeof body === "string") {
        message = body;
      } else if (
        body &&
        typeof body === "object"
      ) {
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
          const validationMessages =
            Object.values(
              errorBody.errors
            )
              .flat()
              .filter(Boolean);

          if (
            validationMessages.length > 0
          ) {
            message =
              validationMessages.join(" ");
          }
        }
      }
    } catch {
      // Keep default HTTP error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function optimizeResources(
  vulnerabilityAssessmentId: string
): Promise<ResourceAllocation[]> {
  if (!vulnerabilityAssessmentId.trim()) {
    throw new Error(
      "Vulnerability assessment ID is required."
    );
  }

  return request<ResourceAllocation[]>(
    `/resource-optimization/${encodeURIComponent(
      vulnerabilityAssessmentId
    )}/optimize`,
    {
      method: "POST",
    }
  );
}

export async function getResourceAllocations(
  vulnerabilityAssessmentId: string
): Promise<ResourceAllocation[]> {
  if (!vulnerabilityAssessmentId.trim()) {
    throw new Error(
      "Vulnerability assessment ID is required."
    );
  }

  return request<ResourceAllocation[]>(
    `/resource-optimization/${encodeURIComponent(
      vulnerabilityAssessmentId
    )}`
  );
}
import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "http://localhost:5115/api").replace(/\/$/,""),
  headers: {
    "Content-Type": "application/json",
  },
});

// AI AUTH HEADER FIX
// Always attach the currently logged-in JWT to API requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
  console.error(
    "RELIEFNEXUS 401 FOUND:",
    error.config?.method?.toUpperCase(),
    error.config?.url,
    "STATUS:",
    error.response?.status,
    "TOKEN EXISTS:",
    Boolean(localStorage.getItem("accessToken")),
    "RESPONSE:",
    error.response?.data
  );

  // TEMPORARY DEBUG:
  // Do NOT remove token or redirect.
}

    return Promise.reject(error);
  }
);



/**
 * Shared read requests.
 *
 * Operational pages can mount together and ask for the same
 * backend dataset. These helpers share the same in-flight
 * Promise so only one HTTP request is created.
 */
let vulnerabilityImpactRequest: Promise<any> | null = null;
let riskPredictionsRequest: Promise<any> | null = null;

export const getVulnerabilityImpactShared = () => {
  if (vulnerabilityImpactRequest) {
    return vulnerabilityImpactRequest;
  }

  vulnerabilityImpactRequest = api
    .get("/vulnerability-impact")
    .finally(() => {
      vulnerabilityImpactRequest = null;
    });

  return vulnerabilityImpactRequest;
};

export const getRiskPredictionsShared = () => {
  if (riskPredictionsRequest) {
    return riskPredictionsRequest;
  }

  riskPredictionsRequest = api
    .get("/risk-predictions")
    .finally(() => {
      riskPredictionsRequest = null;
    });

  return riskPredictionsRequest;
};

export default api;








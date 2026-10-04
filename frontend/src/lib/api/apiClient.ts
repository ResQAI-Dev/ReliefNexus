import axios from "axios";

const api = axios.create({
  baseURL: "https://reliefnexus.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
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

export default api;




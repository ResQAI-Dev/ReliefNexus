import api from "../../../lib/api/apiClient";

export const getRiskPredictions = () =>
  api.get("/risk-predictions");

export const getUserProfile = (userId: string) =>
  api.get(`/users/${userId}`);

export const updateUserProfile = (
  userId: string,
  data: {
    fullName: string;
    email: string;
    role?: string;
    isActive?: boolean;
  }
) =>
  api.put(`/users/${userId}`, data);

export const getDisasterReports = () =>
  api.get("/disaster-reports");

export const getMyReliefRequests = () =>
  api.get("/relief-requests/my");

export const createReliefRequest = (data: {
  requestType: string;
  description: string;
  location: string;
  quantity?: number;
  urgency: string;
}) =>
  api.post("/relief-requests", data);

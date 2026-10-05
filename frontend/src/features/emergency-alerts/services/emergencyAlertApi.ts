import api from "../../../lib/api/apiClient";
import type { EmergencyAlert } from "../types/emergencyAlert";

export const emergencyAlertApi = {
  getAll: async (): Promise<EmergencyAlert[]> => {
    const response = await api.get("/emergency-alerts");
    return response.data;
  },

  getById: async (
    id: string
  ): Promise<EmergencyAlert> => {
    const response = await api.get(
      `/emergency-alerts/${id}`
    );

    return response.data;
  },

  createFromAssessment: async (
    assessmentId: string
  ): Promise<EmergencyAlert> => {
    const response = await api.post(
      `/emergency-alerts/assessment/${assessmentId}`
    );

    return response.data;
  },

  updateStatus: async (
    id: string,
    status: string
  ): Promise<EmergencyAlert> => {
    const response = await api.put(
      `/emergency-alerts/${id}/status`,
      { status }
    );

    return response.data;
  },
};


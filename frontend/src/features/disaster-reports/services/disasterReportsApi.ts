import api from "../../../lib/api/apiClient";

import type {
  DisasterReport,
  VolunteerUser,
} from "../types/disasterReports.types";

const normalizeReports = (payload: unknown): DisasterReport[] => {
  if (Array.isArray(payload)) {
    return payload as DisasterReport[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: DisasterReport[] }).data;
  }

  return [];
};

export const getDisasterReports = async (): Promise<DisasterReport[]> => {
  const response = await api.get("/disaster-reports");
  return normalizeReports(response.data);
};

export const reviewDisasterReport = async (id: string) => {
  return api.patch(`/disaster-reports/${id}/review`);
};

export const verifyDisasterReport = async (id: string) => {
  return api.patch(`/disaster-reports/${id}/verify`);
};

export const assignDisasterReport = async (
  id: string,
  volunteerUserId: string
) => {
  return api.patch(`/disaster-reports/${id}/assign`, {
    volunteerUserId,
  });
};

export const resolveDisasterReport = async (id: string) => {
  return api.patch(`/disaster-reports/${id}/resolve`);
};

export const rejectDisasterReport = async (id: string) => {
  return api.patch(`/disaster-reports/${id}/reject`);
};

export const claimDisasterReport = async (id: string) => {
  return api.patch(`/disaster-reports/${id}/claim`);
};

export const getVolunteers = async (
  users: VolunteerUser[]
): Promise<VolunteerUser[]> => {
  return users.filter(
    (user) =>
      user.role === "FieldVolunteer" &&
      user.isActive !== false
  );
};

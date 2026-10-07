import { useCallback, useEffect, useState } from "react";
import { emergencyAlertApi } from "../services/emergencyAlertApi";
import type { EmergencyAlert } from "../types/emergencyAlert";

export const useEmergencyAlerts = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await emergencyAlertApi.getAll();

      setAlerts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch emergency alerts:", err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch emergency alerts"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createFromAssessment = async (assessmentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const newAlert =
        await emergencyAlertApi.createFromAssessment(assessmentId);

      setAlerts((current) => [newAlert, ...current]);

      return newAlert;
    } catch (err: any) {
      console.error("Failed to create emergency alert:", err);

      throw new Error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create emergency alert"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: string
  ) => {
    try {
      setError(null);

      const updated =
        await emergencyAlertApi.updateStatus(id, status);

      setAlerts((current) =>
        current.map((alert) =>
          alert.id === id ? updated : alert
        )
      );

      return updated;
    } catch (err: any) {
      console.error("Failed to update alert status:", err);

      throw new Error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update alert status"
      );
    }
  };

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    createFromAssessment,
    updateStatus,
  };
};

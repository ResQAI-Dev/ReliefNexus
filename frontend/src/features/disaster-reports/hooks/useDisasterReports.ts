import { useCallback, useEffect, useState } from "react";

import {
  assignDisasterReport,
  claimDisasterReport,
  getDisasterReports,
  rejectDisasterReport,
  resolveDisasterReport,
  reviewDisasterReport,
  verifyDisasterReport,
} from "../services/disasterReportsApi";

import type { DisasterReport } from "../types/disasterReports.types";

export type DisasterWorkflowAction =
  | "review"
  | "verify"
  | "assign"
  | "resolve"
  | "reject";

export const useDisasterReports = () => {
  const [reports, setReports] = useState<DisasterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDisasterReports();

      const unique = new Map<string, DisasterReport>();

      data.forEach((report) => {
        if (report.id) {
          unique.set(report.id, report);
        }
      });

      setReports(Array.from(unique.values()));
    } catch (err: any) {
      console.error("Failed to load disaster reports:", err);

      setError(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : "Unable to load disaster reports.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const runAction = async (
    report: DisasterReport,
    action: DisasterWorkflowAction,
    volunteerUserId?: string
  ) => {
    const key = `${action}-${report.id}`;

    setActionLoading(key);
    setError("");

    try {
      switch (action) {
        case "review":
          await reviewDisasterReport(report.id);
          break;

        case "verify":
          await verifyDisasterReport(report.id);
          break;

        case "assign":
          if (!volunteerUserId) {
            throw new Error("Please select a Field Volunteer.");
          }

          await assignDisasterReport(
            report.id,
            volunteerUserId
          );
          break;

        case "resolve":
          await resolveDisasterReport(report.id);
          break;

        case "reject":
          await rejectDisasterReport(report.id);
          break;
      }

      await loadReports();
    } catch (err: any) {
      console.error("Disaster workflow action failed:", err);

      setError(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : err?.message ||
              "The disaster workflow action could not be completed.")
      );

      throw err;
    } finally {
      setActionLoading("");
    }
  };

  const claimReport = async (report: DisasterReport) => {
    const key = `claim-${report.id}`;

    setActionLoading(key);
    setError("");

    try {
      await claimDisasterReport(report.id);
      await loadReports();
    } catch (err: any) {
      console.error("Failed to claim disaster:", err);

      setError(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : "This disaster could not be claimed.")
      );

      throw err;
    } finally {
      setActionLoading("");
    }
  };

  return {
    reports,
    loading,
    actionLoading,
    error,
    loadReports,
    runAction,
    claimReport,
  };
};

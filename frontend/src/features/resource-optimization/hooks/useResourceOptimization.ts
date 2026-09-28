import { useCallback, useState } from "react";

import {
  getResourceAllocations,
  optimizeResources,
} from "../services/resourceOptimizationApi";

import type {
  ResourceAllocation,
} from "../types/resourceOptimization.types";

export function useResourceOptimization() {
  const [allocations, setAllocations] =
    useState<ResourceAllocation[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [optimizing, setOptimizing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedAllocation, setSelectedAllocation] =
    useState<ResourceAllocation | null>(null);

  const loadAllocations = useCallback(
    async (
      vulnerabilityAssessmentId: string
    ) => {
      if (!vulnerabilityAssessmentId.trim()) {
        setError(
          "Vulnerability assessment ID is required."
        );
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result =
          await getResourceAllocations(
            vulnerabilityAssessmentId
          );

        setAllocations(result);

        setSelectedAllocation(
          result.length > 0
            ? result[0]
            : null
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load resource allocations.";

        setError(message);
        setAllocations([]);
        setSelectedAllocation(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const runOptimization = useCallback(
    async (
      vulnerabilityAssessmentId: string
    ) => {
      if (!vulnerabilityAssessmentId.trim()) {
        setError(
          "Vulnerability assessment ID is required."
        );
        return null;
      }

      try {
        setOptimizing(true);
        setError(null);

        const result =
          await optimizeResources(
            vulnerabilityAssessmentId
          );

        setAllocations(result);

        setSelectedAllocation(
          result.length > 0
            ? result[0]
            : null
        );

        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Resource optimization failed.";

        setError(message);

        return null;
      } finally {
        setOptimizing(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const selectAllocation = useCallback(
    (
      allocation: ResourceAllocation | null
    ) => {
      setSelectedAllocation(
        allocation
      );
    },
    []
  );

  return {
    allocations,
    loading,
    optimizing,
    error,
    selectedAllocation,
    loadAllocations,
    runOptimization,
    clearError,
    selectAllocation,
  };
}
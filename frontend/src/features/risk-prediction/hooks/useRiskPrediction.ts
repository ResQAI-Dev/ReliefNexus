import { useCallback, useState } from "react";
import {
  createRiskPrediction,
  explainPrediction,
  getExternalEvents,
  getRiskPredictions,
} from "../services/riskPredictionApi";
import type {
  ExternalDisasterEvent,
  RiskPrediction,
  RiskPredictionRequest,
} from "../types/riskPrediction.types";

export function useRiskPrediction() {
  const [prediction, setPrediction] =
    useState<RiskPrediction | null>(null);

  const [recentPredictions, setRecentPredictions] =
    useState<RiskPrediction[]>([]);

  const [externalEvents, setExternalEvents] =
    useState<ExternalDisasterEvent[]>([]);

  const [explanation, setExplanation] =
    useState<unknown>(null);

  const [loading, setLoading] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [eventsError, setEventsError] =
    useState<string | null>(null);

  const loadRecentPredictions = useCallback(async () => {
    setLoadingRecent(true);

    try {
      const response = await getRiskPredictions();

      const items = Array.isArray(response)
        ? response
        : response.items ?? [];

      setRecentPredictions(items);
    } catch (err) {
      setRecentPredictions([]);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load recent predictions.";

      console.error(
        "Failed to load recent risk predictions:",
        err
      );

      /*
       * Recent-history failure should not prevent
       * the main prediction feature from working.
       */
      console.warn(message);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  const loadExternalEvents = useCallback(async () => {
    setLoadingEvents(true);
    setEventsError(null);

    try {
      const response = await getExternalEvents();

      setExternalEvents(
        Array.isArray(response) ? response : []
      );
    } catch (err) {
      setExternalEvents([]);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load external disaster events.";

      setEventsError(message);

      console.error(
        "Failed to load external disaster events:",
        err
      );
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const predict = useCallback(
    async (payload: RiskPredictionRequest) => {
      setLoading(true);
      setError(null);

      try {
        const result = await createRiskPrediction(payload);

        setPrediction(result);

        /*
         * Refresh history after a successful prediction
         * so the new prediction appears immediately.
         */
        await loadRecentPredictions();

        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to generate risk prediction.";

        setError(message);

        console.error(
          "Failed to generate risk prediction:",
          err
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadRecentPredictions]
  );

  const loadExplanation = useCallback(
    async (id: string) => {
      if (!id.trim()) {
        setExplanation(null);
        return null;
      }

      try {
        const result = await explainPrediction(id);

        setExplanation(result);

        return result;
      } catch (err) {
        console.error(
          "Failed to load prediction explanation:",
          err
        );

        setExplanation(null);

        return null;
      }
    },
    []
  );

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setExplanation(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    prediction,
    recentPredictions,
    externalEvents,
    explanation,

    loading,
    loadingRecent,
    loadingEvents,

    error,
    eventsError,

    predict,
    loadRecentPredictions,
    loadExternalEvents,
    loadExplanation,

    clearPrediction,
    clearError,
  };
}

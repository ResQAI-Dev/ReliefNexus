import { useCallback, useState } from "react";
import {
  createRiskPrediction,
  explainPrediction,
  getExternalEvents,
  getPredictionById,
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

  const [error, setError] =
    useState<string | null>(null);

  const [eventsError, setEventsError] =
    useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * Load Recent Predictions
   * ---------------------------------------------------------
   *
   * The history endpoint can return lightweight prediction
   * records without the complete disasterRisks[] collection.
   *
   * Therefore:
   *
   *   1. Load recent prediction records.
   *   2. For each record, load its complete prediction by ID.
   *   3. Keep the complete records for the UI.
   *
   * This allows RecentPredictions.tsx to correctly determine
   * the highest available disaster risk.
   */
  const loadRecentPredictions = useCallback(async () => {
    setLoadingRecent(true);

    try {
      const response = await getRiskPredictions();

      const items = Array.isArray(response)
        ? response
        : response.items ?? [];

      /*
       * No records.
       */
      if (items.length === 0) {
        setRecentPredictions([]);
        return;
      }

      /*
       * Fetch complete prediction details.
       *
       * If a history record already contains disasterRisks,
       * there is no need to request it again.
       */
      const hydratedResults =
        await Promise.allSettled(
          items.map(async (item) => {
            const existingRisks =
              Array.isArray(item.disasterRisks)
                ? item.disasterRisks
                : [];

            /*
             * If this record already contains actual risk
             * data, keep it as-is.
             */
            const hasUsableRisk =
              existingRisks.some(
                (risk) =>
                  risk.dataAvailable === true &&
                  risk.riskScore !== null &&
                  risk.riskScore !== undefined &&
                  Number.isFinite(
                    Number(risk.riskScore)
                  )
              );

            if (hasUsableRisk) {
              return item;
            }

            /*
             * History record is only a summary.
             *
             * Fetch the complete prediction using its ID.
             */
            if (!item.id?.trim()) {
              return item;
            }

            try {
              const fullPrediction =
                await getPredictionById(item.id);

              return fullPrediction;
            } catch (err) {
              /*
               * One failed historical record must not
               * prevent the other records from appearing.
               */
              console.warn(
                `Failed to load full prediction ${item.id}:`,
                err
              );

              return item;
            }
          })
        );

      /*
       * Keep successfully resolved prediction objects.
       *
       * Promise.allSettled guarantees that one failed
       * prediction does not break the entire history list.
       */
      const hydratedPredictions =
        hydratedResults
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<RiskPrediction> =>
              result.status === "fulfilled"
          )
          .map((result) => result.value);

      /*
       * Preserve backend ordering:
       * newest prediction first.
       */
      setRecentPredictions(
        hydratedPredictions.slice(0, 10)
      );
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
       * History failure should never prevent
       * the main prediction feature from working.
       */
      console.warn(message);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * Load External Events
   * ---------------------------------------------------------
   */
  const loadExternalEvents = useCallback(async () => {
    setLoadingEvents(true);
    setEventsError(null);

    try {
      const response =
        await getExternalEvents();

      setExternalEvents(
        Array.isArray(response)
          ? response
          : []
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

  /*
   * ---------------------------------------------------------
   * Create Prediction
   * ---------------------------------------------------------
   */
  const predict = useCallback(
    async (
      payload: RiskPredictionRequest
    ) => {
      setLoading(true);
      setError(null);

      try {
        /*
         * POST returns the complete prediction including
         * disasterRisks[].
         */
        const result =
          await createRiskPrediction(payload);

        /*
         * Main Prediction Result.
         */
        setPrediction(result);

        /*
         * Refresh history.
         */
        await loadRecentPredictions();

        /*
         * Make absolutely sure the freshly-created
         * full prediction appears at the top.
         *
         * This prevents the history endpoint from replacing
         * the newest complete result with a lightweight
         * summary record.
         */
        setRecentPredictions((current) => {
          const withoutCurrent =
            current.filter(
              (item) =>
                item.id !== result.id
            );

          return [
            result,
            ...withoutCurrent,
          ].slice(0, 10);
        });

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

  /*
   * ---------------------------------------------------------
   * Load Explanation
   * ---------------------------------------------------------
   */
  const loadExplanation = useCallback(
    async (id: string) => {
      if (!id.trim()) {
        setExplanation(null);
        return null;
      }

      try {
        const result =
          await explainPrediction(id);

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

  /*
   * ---------------------------------------------------------
   * Update Prediction
   * ---------------------------------------------------------
   */
  const updatePrediction = useCallback(
    (updatedPrediction: RiskPrediction) => {
      /*
       * Update the main prediction.
       */
      setPrediction(updatedPrediction);

      /*
       * Update the same record inside Recent Predictions.
       */
      setRecentPredictions((current) =>
        current.map((item) =>
          item.id === updatedPrediction.id
            ? updatedPrediction
            : item
        )
      );
    },
    []
  );

  /*
   * ---------------------------------------------------------
   * Clear Prediction
   * ---------------------------------------------------------
   */
  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setExplanation(null);
    setError(null);
  }, []);

  /*
   * ---------------------------------------------------------
   * Clear Error
   * ---------------------------------------------------------
   */
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
    updatePrediction,

    clearPrediction,
    clearError,
  };
}
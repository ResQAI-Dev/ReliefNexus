SELECT "AgentName", "Status", "InputTokens", "OutputTokens", "TotalTokens", "ModelName", "EstimatedCost", "RiskPredictionId"
FROM public."RiskAgentExecutions"
ORDER BY "StartedAt" DESC
LIMIT 3;

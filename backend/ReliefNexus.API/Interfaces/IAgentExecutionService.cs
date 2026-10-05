using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface IAgentExecutionService
{
    Task<RiskAgentExecution> StartAsync(
        string inputSummary,
        string objective,
        string plan,
        string agentName = "Risk Prediction Agent");

    Task<RiskAgentExecution?> UpdateStepAsync(
        Guid executionId,
        string currentStep,
        string completedSteps,
        string toolResults);

    Task<RiskAgentExecution?> CompleteAsync(
        Guid executionId,
        Guid predictionId,
        string outputSummary,
        string validationResults,
        string finalOutcome,
        string approvalStatus,
        int inputTokens = 0,
        int outputTokens = 0,
        int totalTokens = 0,
        string modelName = "",
        decimal? estimatedCost = null);

    Task<RiskAgentExecution?> RecordUsageAsync(
        Guid executionId,
        int inputTokens,
        int outputTokens,
        int totalTokens,
        string modelName);

    Task<RiskAgentExecution?> FailAsync(
        Guid executionId,
        string errorMessage);

    Task<RiskAgentExecution?> RecordApprovalAsync(
        Guid executionId,
        string approvalStatus,
        string approvalUser);

    Task<List<RiskAgentExecution>> GetAllAsync();

    Task<List<RiskAgentExecution>> GetByPredictionIdAsync(
        Guid predictionId);
}



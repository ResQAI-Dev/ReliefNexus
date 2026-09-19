using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface IAgentExecutionService
{
    Task<RiskAgentExecution> StartAsync(
        string inputSummary,
        string objective,
        string plan);

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
        string approvalStatus);

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

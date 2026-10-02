using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface IAgentExecutionService
{
    Task<RiskAgentExecution> StartAsync(
        string inputSummary);

    Task<RiskAgentExecution?> CompleteAsync(
        Guid executionId,
        Guid predictionId,
        string outputSummary);

    Task<List<RiskAgentExecution>> GetAllAsync();

    Task<List<RiskAgentExecution>> GetByPredictionIdAsync(
        Guid predictionId);
}

using ReliefNexus.API.AI.Models;
using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.AI.Services;

public interface IPythonAIService
{
    Task<PythonRiskAssessment?> AssessRiskAsync(
        RiskPredictionDto prediction,
        CancellationToken cancellationToken = default);
}

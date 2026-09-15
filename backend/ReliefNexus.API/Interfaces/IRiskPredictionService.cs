using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IRiskPredictionService
{
    Task<RiskPredictionDto> CreateAsync(RiskPredictionDto request);
    Task<List<RiskPredictionDto>> GetAllAsync();
    Task<RiskPredictionDto?> GetByIdAsync(Guid id);
    Task<List<RiskPredictionDto>> GetByLocationAsync(string location);
    Task<List<RiskPredictionDto>> GetHighRiskAsync();
}

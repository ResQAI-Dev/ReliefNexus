using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IRiskPredictionService
{
    Task<RiskPredictionDto> CreateAsync(
        RiskPredictionDto request,
        Guid executionId);

    Task<List<RiskPredictionDto>> GetAllAsync();

    Task<RiskPredictionDto?> GetByIdAsync(Guid id);

    Task<List<RiskPredictionDto>> GetByLocationAsync(
        string location);

    Task<List<RiskPredictionDto>> GetHighRiskAsync();

    Task<PaginatedRiskPredictionDto> GetPagedAsync(
        RiskPredictionQueryDto query);

    Task<List<RiskPredictionDto>> GetHistoryAsync();

    Task<List<RiskPredictionDto>> GetPendingApprovalAsync();

    Task<RiskPredictionDto?> ApproveAsync(Guid id);

    Task<RiskPredictionDto?> RejectAsync(Guid id);
}

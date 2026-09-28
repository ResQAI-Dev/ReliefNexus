using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IRiskPredictionService
{
    Task<RiskPredictionDto> CreateAsync(
        Guid userId,
        RiskPredictionDto request,
        Guid executionId);

    Task<List<RiskPredictionDto>> GetAllAsync();

    Task<RiskPredictionDto?> GetByIdAsync(Guid id);

    Task<List<RiskPredictionDto>> GetByLocationAsync(
        string location);

    Task<List<RiskPredictionDto>> GetHighRiskAsync();

    Task<PaginatedRiskPredictionDto> GetPagedAsync(
        Guid userId,
        RiskPredictionQueryDto query,
        bool isAdministrator);

    Task<List<RiskPredictionDto>> GetHistoryAsync(Guid userId);

    Task<List<RiskPredictionDto>> GetPendingApprovalAsync();

    Task<RiskPredictionDto?> ApproveAsync(Guid id);

    Task<RiskPredictionDto?> RejectAsync(Guid id);
}






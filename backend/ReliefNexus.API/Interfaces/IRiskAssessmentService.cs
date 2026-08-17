using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IRiskAssessmentService
{
    Task<RiskAssessmentResponseDto> CreateAsync(
        CreateRiskAssessmentDto dto,
        Guid userId);

    Task<IEnumerable<RiskAssessmentResponseDto>> GetAllAsync();

    Task<RiskAssessmentResponseDto?> GetByIdAsync(Guid id);

    Task<RiskAssessmentResponseDto?> UpdateAsync(
        Guid id,
        UpdateRiskAssessmentDto dto);

    Task<bool> DeleteAsync(Guid id);

    Task<RiskPredictionResponseDto?> PredictAsync(Guid id);
}
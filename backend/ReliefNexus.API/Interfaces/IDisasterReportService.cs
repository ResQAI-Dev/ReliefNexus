using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IDisasterReportService
{
    Task<List<DisasterReportDto>> GetAllAsync();

    Task<List<DisasterReportDto>> GetMyReportsAsync(
        Guid userId);

    Task<List<DisasterReportDto>> GetAssignedReportsAsync(
        Guid userId);

    Task<DisasterReportDto?> CreateAsync(
        Guid userId,
        DisasterReportDto request);

    Task<DisasterReportDto?> CreateFromPredictionAsync(
        Guid userId,
        Guid predictionId,
        DisasterReportDto request);

    Task<DisasterReportDto?> UpdateStatusAsync(
        Guid id,
        string status);

    Task<DisasterReportDto?> ReviewAsync(
        Guid id);

    Task<DisasterReportDto?> VerifyAsync(
        Guid id);

    Task<DisasterReportDto?> AssignVolunteerAsync(
        Guid id,
        Guid volunteerUserId);

    Task<DisasterReportDto?> FieldStartAsync(
        Guid id,
        Guid volunteerUserId);

    Task<DisasterReportDto?> FieldUpdateAsync(
        Guid id,
        Guid volunteerUserId,
        FieldUpdateRequest request);

    Task<DisasterReportDto?> FieldCompleteAsync(
        Guid id,
        Guid volunteerUserId);

    Task<DisasterReportDto?> ResolveAsync(
        Guid id);

    Task<DisasterReportDto?> RejectAsync(
        Guid id);
}

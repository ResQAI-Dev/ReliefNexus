using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface IEmergencyAlertService
{
    Task<List<EmergencyAlert>> GetAllAsync();
    Task<EmergencyAlert?> GetByIdAsync(Guid id);
    Task<EmergencyAlert?> CreateFromAssessmentAsync(Guid vulnerabilityAssessmentId);
    Task<EmergencyAlert?> UpdateStatusAsync(Guid id, string status);
    Task<object?> SendMessageAndReportAsync(Guid alertId);
    Task<bool> DeleteAsync(Guid id);
}
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface INotificationService
{
    Task<Notification?> CreateAsync(
        Guid warningId,
        CreateNotificationRequest request);

    Task<List<Notification>> GetByWarningIdAsync(
        Guid warningId);
}
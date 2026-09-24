using ReliefNexus.API.DTOs;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface ICoordinationTaskService
{
    Task<CoordinationTask?> CreateAsync(
        CreateCoordinationTaskRequest request);

    Task<CoordinationTask?> GetByIdAsync(
        Guid id);

    Task<List<CoordinationTask>> GetAllAsync();

    Task<bool> AssignAsync(
        Guid taskId,
        Guid assignedToId);

    Task<bool> UpdateStatusAsync(
        Guid taskId,
        string newStatus);
}
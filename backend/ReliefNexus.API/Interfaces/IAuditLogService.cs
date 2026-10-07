using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface IAuditLogService
{
    Task<List<AuditLog>> GetAllAsync();

    Task<AuditLog> CreateAsync(
        Guid? userId,
        string action,
        string description,
        string? userEmail = null,
        string? role = null,
        string status = "Success",
        string severity = "Normal");
}
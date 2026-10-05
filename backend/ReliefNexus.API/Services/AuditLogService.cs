using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _context;

    public AuditLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AuditLog>> GetAllAsync()
    {
        return await _context.AuditLogs
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(500)
            .ToListAsync();
    }

    public async Task<AuditLog> CreateAsync(
        Guid? userId,
        string action,
        string description,
        string? userEmail = null,
        string? role = null,
        string status = "Success",
        string severity = "Normal")
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),

            UserId = userId,

            UserEmail = userEmail,

            Role = role,

            Action = action,

            Description = description ?? string.Empty,

            Status = string.IsNullOrWhiteSpace(status)
                ? "Success"
                : status,

            Severity = string.IsNullOrWhiteSpace(severity)
                ? "Normal"
                : severity,

            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);

        await _context.SaveChangesAsync();

        return log;
    }
}
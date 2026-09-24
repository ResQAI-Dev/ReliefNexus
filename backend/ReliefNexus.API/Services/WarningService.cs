using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class WarningService : IWarningService
{
    private readonly AppDbContext _context;

    public WarningService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<WarningResponse> CreateAsync(
        CreateWarningRequest request,
        Guid createdById)
    {
        var warning = new Warning
        {
            Id = Guid.NewGuid(),

            DisasterEventId = request.DisasterEventId,
            RiskAssessmentId = request.RiskAssessmentId,
            ImpactAssessmentId = request.ImpactAssessmentId,

            Title = request.Title,
            Message = request.Message,
            Guidance = request.Guidance,

            Severity = request.Severity,
            Status = "DRAFT",

            CreatedById = createdById,

            ExpiresAt = request.ExpiresAt,

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Warnings.Add(warning);

        await _context.SaveChangesAsync();

        return MapToResponse(warning);
    }

    public async Task<WarningResponse?> GetByIdAsync(Guid id)
    {
        var warning = await _context.Warnings
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id);

        return warning == null
            ? null
            : MapToResponse(warning);
    }

    public async Task<List<WarningResponse>> GetAllAsync()
    {
        var warnings = await _context.Warnings
            .AsNoTracking()
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return warnings
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<WarningResponse?> UpdateAsync(
        Guid id,
        UpdateWarningRequest request)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == id);

        if (warning == null)
            return null;

        warning.Title = request.Title;
        warning.Message = request.Message;
        warning.Guidance = request.Guidance;
        warning.Severity = request.Severity;
        warning.ExpiresAt = request.ExpiresAt;

        warning.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(warning);
    }

    private static WarningResponse MapToResponse(Warning warning)
    {
        return new WarningResponse
        {
            Id = warning.Id,

            DisasterEventId = warning.DisasterEventId,
            RiskAssessmentId = warning.RiskAssessmentId,
            ImpactAssessmentId = warning.ImpactAssessmentId,

            Title = warning.Title,
            Message = warning.Message,
            Guidance = warning.Guidance,

            Severity = warning.Severity,
            Status = warning.Status,

            CreatedById = warning.CreatedById,

            ApprovedById = warning.ApprovedById,
            ApprovedAt = warning.ApprovedAt,

            PublishedAt = warning.PublishedAt,

            ExpiresAt = warning.ExpiresAt,

            CancelledAt = warning.CancelledAt,
            CancellationReason = warning.CancellationReason,

            CreatedAt = warning.CreatedAt,
            UpdatedAt = warning.UpdatedAt
        };
    }
}
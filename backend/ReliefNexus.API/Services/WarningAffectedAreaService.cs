using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class WarningAffectedAreaService : IWarningAffectedAreaService
{
    private readonly AppDbContext _context;

    public WarningAffectedAreaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<WarningAffectedArea?> AddAsync(
        Guid warningId,
        AddWarningAffectedAreaRequest request)
    {
        // Verify that the warning exists
        var warningExists = await _context.Warnings
            .AnyAsync(w => w.Id == warningId);

        if (!warningExists)
        {
            return null;
        }

        if (request.AffectedAreaId == Guid.Empty)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(request.AreaName))
        {
            return null;
        }

        var validAudiences = new[]
        {
            "ALL",
            "AFFECTED_USERS",
            "FIELD_VOLUNTEERS",
            "RELIEF_COORDINATORS"
        };

        var targetAudience = request.TargetAudience
            .Trim()
            .ToUpper();

        if (!validAudiences.Contains(targetAudience))
        {
            return null;
        }

        // Prevent duplicate area targeting for the same warning
        var alreadyExists = await _context.WarningAffectedAreas
            .AnyAsync(x =>
                x.WarningId == warningId &&
                x.AffectedAreaId == request.AffectedAreaId);

        if (alreadyExists)
        {
            return null;
        }

        var target = new WarningAffectedArea
        {
            Id = Guid.NewGuid(),
            WarningId = warningId,
            AffectedAreaId = request.AffectedAreaId,
            AreaName = request.AreaName.Trim(),
            TargetAudience = targetAudience,
            CreatedAt = DateTime.UtcNow
        };

        _context.WarningAffectedAreas.Add(target);

        await _context.SaveChangesAsync();

        return target;
    }

    public async Task<List<WarningAffectedArea>> GetByWarningIdAsync(
        Guid warningId)
    {
        return await _context.WarningAffectedAreas
            .AsNoTracking()
            .Where(x => x.WarningId == warningId)
            .OrderBy(x => x.AreaName)
            .ToListAsync();
    }

    public async Task<bool> RemoveAsync(
        Guid warningId,
        Guid affectedAreaId)
    {
        var target = await _context.WarningAffectedAreas
            .FirstOrDefaultAsync(x =>
                x.WarningId == warningId &&
                x.AffectedAreaId == affectedAreaId);

        if (target == null)
        {
            return false;
        }

        _context.WarningAffectedAreas.Remove(target);

        await _context.SaveChangesAsync();

        return true;
    }
}
using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class WarningApprovalService : IWarningApprovalService
{
    private readonly AppDbContext _context;

    public WarningApprovalService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> SubmitAsync(Guid warningId)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null)
            return false;

        if (warning.Status != "DRAFT" &&
            warning.Status != "REVISION_REQUIRED")
        {
            return false;
        }

        warning.Status = "PENDING_APPROVAL";
        warning.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ApproveAsync(
        Guid warningId,
        Guid reviewerId,
        string? comments)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null ||
            warning.Status != "PENDING_APPROVAL")
        {
            return false;
        }

        warning.Status = "APPROVED";
        warning.ApprovedById = reviewerId;
        warning.ApprovedAt = DateTime.UtcNow;
        warning.UpdatedAt = DateTime.UtcNow;

        var approval = new WarningApproval
        {
            Id = Guid.NewGuid(),
            WarningId = warningId,
            ReviewerId = reviewerId,
            Decision = "APPROVED",
            Comments = comments,
            CreatedAt = DateTime.UtcNow
        };

        _context.WarningApprovals.Add(approval);

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RejectAsync(
        Guid warningId,
        Guid reviewerId,
        string? comments)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null ||
            warning.Status != "PENDING_APPROVAL")
        {
            return false;
        }

        warning.Status = "REJECTED";
        warning.UpdatedAt = DateTime.UtcNow;

        var approval = new WarningApproval
        {
            Id = Guid.NewGuid(),
            WarningId = warningId,
            ReviewerId = reviewerId,
            Decision = "REJECTED",
            Comments = comments,
            CreatedAt = DateTime.UtcNow
        };

        _context.WarningApprovals.Add(approval);

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RequestRevisionAsync(
        Guid warningId,
        Guid reviewerId,
        string? comments)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null ||
            warning.Status != "PENDING_APPROVAL")
        {
            return false;
        }

        warning.Status = "REVISION_REQUIRED";
        warning.UpdatedAt = DateTime.UtcNow;

        var approval = new WarningApproval
        {
            Id = Guid.NewGuid(),
            WarningId = warningId,
            ReviewerId = reviewerId,
            Decision = "REVISION_REQUIRED",
            Comments = comments,
            CreatedAt = DateTime.UtcNow
        };

        _context.WarningApprovals.Add(approval);

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> PublishAsync(Guid warningId)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null || warning.Status != "APPROVED")
        {
            return false;
        }

        warning.Status = "PUBLISHED";
        warning.PublishedAt = DateTime.UtcNow;
        warning.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> CancelAsync(Guid warningId, string reason)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null)
        {
            return false;
        }

        if (warning.Status != "PUBLISHED")
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            return false;
        }

        warning.Status = "CANCELLED";
        warning.CancelledAt = DateTime.UtcNow;
        warning.CancellationReason = reason;
        warning.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> EscalateAsync(
    Guid warningId,
    string newSeverity,
    string reason)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null)
        {
            return false;
        }

        // Escalation is only allowed for published warnings
        if (warning.Status != "PUBLISHED")
        {
            return false;
        }

        // Reason is required
        if (string.IsNullOrWhiteSpace(reason))
        {
            return false;
        }

        var validSeverities = new[] { "LOW", "MEDIUM", "HIGH", "CRITICAL" };

        newSeverity = newSeverity.Trim().ToUpper();

        if (!validSeverities.Contains(newSeverity))
        {
            return false;
        }

        var currentSeverity = warning.Severity.Trim().ToUpper();

        var currentLevel = Array.IndexOf(validSeverities, currentSeverity);
        var newLevel = Array.IndexOf(validSeverities, newSeverity);

        // The new severity must actually be higher
        if (newLevel <= currentLevel)
        {
            return false;
        }

        warning.Severity = newSeverity;
        warning.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ExpireAsync(Guid warningId)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null)
        {
            return false;
        }

        // Only published warnings can expire
        if (warning.Status != "PUBLISHED")
        {
            return false;
        }

        // Warning must actually have an expiry time
        if (!warning.ExpiresAt.HasValue)
        {
            return false;
        }

        // It cannot expire before the expiry time
        if (warning.ExpiresAt.Value > DateTime.UtcNow)
        {
            return false;
        }

        warning.Status = "EXPIRED";
        warning.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }
}
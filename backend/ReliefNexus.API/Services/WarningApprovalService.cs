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
}
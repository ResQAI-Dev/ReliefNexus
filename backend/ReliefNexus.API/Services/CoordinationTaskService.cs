using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class CoordinationTaskService : ICoordinationTaskService
{
    private readonly AppDbContext _context;

    public CoordinationTaskService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CoordinationTask?> CreateAsync(
        CreateCoordinationTaskRequest request)
    {
        // Verify that the warning exists
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == request.WarningId);

        if (warning == null)
        {
            return null;
        }

        // Verify that the assigned user exists, if provided
        if (request.AssignedToId.HasValue)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.Id == request.AssignedToId.Value);

            if (!userExists)
            {
                return null;
            }
        }

        var task = new CoordinationTask
        {
            Id = Guid.NewGuid(),
            WarningId = request.WarningId,
            PreparednessActionId = request.PreparednessActionId,
            Title = request.Title,
            Description = request.Description,
            AssignedToId = request.AssignedToId,
            DueAt = request.DueAt,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CoordinationTasks.Add(task);

        await _context.SaveChangesAsync();

        return task;
    }

    public async Task<CoordinationTask?> GetByIdAsync(Guid id)
    {
        return await _context.CoordinationTasks
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<List<CoordinationTask>> GetAllAsync()
    {
        return await _context.CoordinationTasks
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> AssignAsync(
        Guid taskId,
        Guid assignedToId)
    {
        var task = await _context.CoordinationTasks
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            return false;
        }

        var userExists = await _context.Users
            .AnyAsync(u => u.Id == assignedToId);

        if (!userExists)
        {
            return false;
        }

        // Completed and cancelled tasks cannot be reassigned
        if (task.Status == "COMPLETED" ||
            task.Status == "CANCELLED")
        {
            return false;
        }

        task.AssignedToId = assignedToId;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateStatusAsync(
        Guid taskId,
        string newStatus)
    {
        var task = await _context.CoordinationTasks
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(newStatus))
        {
            return false;
        }

        newStatus = newStatus.Trim().ToUpper();

        var validStatuses = new[]
        {
            "PENDING",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED"
        };

        if (!validStatuses.Contains(newStatus))
        {
            return false;
        }

        var currentStatus = task.Status.ToUpper();

        // PENDING → IN_PROGRESS
        if (currentStatus == "PENDING" &&
            newStatus == "IN_PROGRESS")
        {
            task.Status = "IN_PROGRESS";
            task.StartedAt = DateTime.UtcNow;
        }

        // IN_PROGRESS → COMPLETED
        else if (currentStatus == "IN_PROGRESS" &&
                 newStatus == "COMPLETED")
        {
            task.Status = "COMPLETED";
            task.CompletedAt = DateTime.UtcNow;
        }

        // PENDING → CANCELLED
        else if (currentStatus == "PENDING" &&
                 newStatus == "CANCELLED")
        {
            task.Status = "CANCELLED";
        }

        // IN_PROGRESS → CANCELLED
        else if (currentStatus == "IN_PROGRESS" &&
                 newStatus == "CANCELLED")
        {
            task.Status = "CANCELLED";
        }

        else
        {
            // Invalid state transition
            return false;
        }

        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }
}
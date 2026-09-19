using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Notification?> CreateAsync(
        Guid warningId,
        CreateNotificationRequest request)
    {
        var warning = await _context.Warnings
            .FirstOrDefaultAsync(w => w.Id == warningId);

        if (warning == null)
        {
            return null;
        }

        var recipient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.RecipientId);

        if (recipient == null)
        {
            return null;
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            WarningId = warningId,
            RecipientId = request.RecipientId,
            Channel = request.Channel,
            Status = "SENT",
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();

        return notification;
    }

    public async Task<List<Notification>> GetByWarningIdAsync(
        Guid warningId)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => n.WarningId == warningId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }
}
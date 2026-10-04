using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class EmergencyAlertService : IEmergencyAlertService
{
    private readonly AppDbContext _context;
    private readonly EarlyWarningCoordinationAgent _agent;
    private readonly IEmailService _emailService;

    public EmergencyAlertService(
        AppDbContext context,
        EarlyWarningCoordinationAgent agent,
        IEmailService emailService)
    {
        _context = context;
        _agent = agent;
        _emailService = emailService;
    }

    public async Task<List<EmergencyAlert>> GetAllAsync()
    {
        return await _context.EmergencyAlerts
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<EmergencyAlert?> GetByIdAsync(
        Guid id)
    {
        return await _context.EmergencyAlerts
            .FirstOrDefaultAsync(
                x => x.Id == id);
    }

    public async Task<EmergencyAlert?> CreateFromAssessmentAsync(
        Guid vulnerabilityAssessmentId)
    {
        return await _agent.CreateAlertAsync(
            vulnerabilityAssessmentId);
    }

    public async Task<EmergencyAlert?> UpdateStatusAsync(
        Guid id,
        string status)
    {
        if (string.IsNullOrWhiteSpace(status))
            throw new ArgumentException(
                "Status is required.",
                nameof(status)
            );

        var alert =
            await _context.EmergencyAlerts
                .FirstOrDefaultAsync(
                    x => x.Id == id);

        if (alert == null)
            return null;

        var normalizedStatus =
            status.Trim();

        alert.Status =
            normalizedStatus;

        alert.IsActive =
            !string.Equals(
                normalizedStatus,
                "Closed",
                StringComparison.OrdinalIgnoreCase
            );

        await _context.SaveChangesAsync();

        return alert;
    }


    public async Task<object?> SendMessageAndReportAsync(Guid alertId)
    {
        var alert = await _context.EmergencyAlerts
            .FirstOrDefaultAsync(x => x.Id == alertId);

        if (alert == null)
            return null;

        var prediction = await _context.RiskPredictions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == alert.RiskPredictionId);

        if (prediction == null)
            return null;

        var report = await _context.DisasterReports
            .AsNoTracking()
            .Where(x =>
                x.RiskPredictionId == prediction.Id &&
                x.ReporterUserId != Guid.Empty)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (report == null)
            return null;

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Id == report.ReporterUserId);

        if (user == null)
            return null;

        var notificationMessage =
            $"{alert.Message} " +
            $"Location: {alert.Location}. " +
            $"Severity: {alert.Severity}. " +
            $"Recommended actions: {alert.RecommendedActions}";

        _context.Notifications.Add(
            new Notification
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Title = alert.Title,
                Message = notificationMessage,
                Type = "EmergencyAlert",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

        await _context.SaveChangesAsync();

        var emailSent = false;

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            var emailBody =
                $"Hello {user.FullName},`r`n`r`n" +
                $"{alert.Message}`r`n`r`n" +
                "EMERGENCY REPORT`r`n" +
                "--------------------------------`r`n" +
                $"Disaster Type: {alert.DisasterType}`r`n" +
                $"Location: {alert.Location}`r`n" +
                $"Severity: {alert.Severity}`r`n" +
                $"Status: {alert.Status}`r`n" +
                $"Alert ID: {alert.Id}`r`n`r`n" +
                "RECOMMENDED ACTIONS`r`n" +
                $"{alert.RecommendedActions}`r`n`r`n" +
                "RESOURCE INFORMATION`r`n" +
                $"{alert.ResourceSummary}`r`n`r`n" +
                "Please follow the emergency instructions and stay safe.`r`n`r`n" +
                "ReliefNexus";

            emailSent = await _emailService.SendAsync(
                user.Email,
                $"ReliefNexus - {alert.Title}",
                emailBody);
        }

        return new
        {
            success = true,
            alertId = alert.Id,
            userId = user.Id,
            notificationSent = true,
            emailSent,
            recipientEmail = user.Email
        };
    }
    public async Task<bool> DeleteAsync(Guid id)
    {
        var alert = await _context.EmergencyAlerts
            .FirstOrDefaultAsync(x => x.Id == id);

        if (alert == null)
            return false;

        _context.EmergencyAlerts.Remove(alert);
        await _context.SaveChangesAsync();
        return true;
    }}


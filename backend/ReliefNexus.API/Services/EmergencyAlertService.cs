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

    public EmergencyAlertService(
        AppDbContext context,
        EarlyWarningCoordinationAgent agent)
    {
        _context = context;
        _agent = agent;
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

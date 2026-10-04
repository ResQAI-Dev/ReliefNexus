using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Services;

public sealed class VolunteerAssignmentService
    : IVolunteerAssignmentService
{
    private readonly AppDbContext _context;
    private readonly VolunteerAssignmentAgent _agent;

    public VolunteerAssignmentService(
        AppDbContext context,
        VolunteerAssignmentAgent agent)
    {
        _context = context;
        _agent = agent;
    }

    public async Task<VolunteerAssignmentRecommendationResponse?>
        RecommendAsync(Guid disasterReportId)
    {
        var report =
            await _context.DisasterReports
                .FirstOrDefaultAsync(
                    x => x.Id == disasterReportId);

        if (report == null)
            return null;

        return await _agent.RecommendAsync(report);
    }
}
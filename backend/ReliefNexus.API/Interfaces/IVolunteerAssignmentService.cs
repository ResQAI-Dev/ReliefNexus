using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IVolunteerAssignmentService
{
    Task<VolunteerAssignmentRecommendationResponse?>
        RecommendAsync(Guid disasterReportId);
}
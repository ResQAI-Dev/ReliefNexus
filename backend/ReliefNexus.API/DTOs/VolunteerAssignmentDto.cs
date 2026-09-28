namespace ReliefNexus.API.DTOs;

public sealed class VolunteerAssignmentRequest
{
    public Guid DisasterReportId { get; set; }
}


public sealed class VolunteerRecommendationDto
{
    public Guid VolunteerUserId { get; set; }

    public string VolunteerName { get; set; }
        = string.Empty;

    public string Email { get; set; }
        = string.Empty;

    public string District { get; set; }
        = string.Empty;

    public bool IsActive { get; set; }

    public int MatchScore { get; set; }

    public int CurrentWorkload { get; set; }

    public string Availability { get; set; }
        = string.Empty;

    public string MatchReason { get; set; }
        = string.Empty;
}


public sealed class VolunteerAssignmentRecommendationResponse
{
    public Guid DisasterReportId { get; set; }

    public string DisasterType { get; set; }
        = string.Empty;

    public string Location { get; set; }
        = string.Empty;

    public string Severity { get; set; }
        = string.Empty;

    public VolunteerRecommendationDto?
        RecommendedVolunteer { get; set; }

    public List<VolunteerRecommendationDto>
        Alternatives { get; set; }
        = new();

    public string AgentName { get; set; }
        = "Volunteer Assignment Agent";
}
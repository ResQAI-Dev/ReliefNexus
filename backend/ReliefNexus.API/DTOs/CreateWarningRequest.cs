namespace ReliefNexus.API.DTOs;

public class CreateWarningRequest
{
    public Guid DisasterEventId { get; set; }

    public Guid? RiskAssessmentId { get; set; }

    public Guid? ImpactAssessmentId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Guidance { get; set; } = string.Empty;

    public string Severity { get; set; } = "MEDIUM";

    public DateTime? ExpiresAt { get; set; }
}
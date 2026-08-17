namespace ReliefNexus.API.Models;

public class RiskAssessmentHistory
{
    public Guid Id { get; set; }

    public Guid RiskAssessmentId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string PreviousStatus { get; set; } = string.Empty;

    public string NewStatus { get; set; } = string.Empty;

    public Guid PerformedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public RiskAssessment? RiskAssessment { get; set; }
}
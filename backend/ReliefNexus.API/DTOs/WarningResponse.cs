namespace ReliefNexus.API.DTOs;

public class WarningResponse
{
    public Guid Id { get; set; }

    public Guid DisasterEventId { get; set; }

    public Guid? RiskAssessmentId { get; set; }

    public Guid? ImpactAssessmentId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Guidance { get; set; } = string.Empty;

    public string Severity { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public Guid CreatedById { get; set; }

    public Guid? ApprovedById { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime? PublishedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public string? CancellationReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
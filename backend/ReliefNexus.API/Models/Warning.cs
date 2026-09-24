namespace ReliefNexus.API.Models;

public class Warning
{
    public Guid Id { get; set; }

    // References to shared components
    public Guid DisasterEventId { get; set; }

    public Guid? RiskAssessmentId { get; set; }

    public Guid? ImpactAssessmentId { get; set; }

    // Warning content
    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Guidance { get; set; } = string.Empty;

    // Warning classification
    public string Severity { get; set; } = "MEDIUM";

    // Workflow state
    public string Status { get; set; } = "DRAFT";

    // Creator
    public Guid CreatedById { get; set; }

    // Approval information
    public Guid? ApprovedById { get; set; }

    public DateTime? ApprovedAt { get; set; }

    // Publication
    public DateTime? PublishedAt { get; set; }

    // Lifecycle
    public DateTime? ExpiresAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public string? CancellationReason { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
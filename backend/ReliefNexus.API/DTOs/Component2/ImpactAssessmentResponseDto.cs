namespace ReliefNexus.API.DTOs.Component2;

/// <summary>
/// Response DTO for ImpactAssessment records.
/// Includes the computed severity and affected-facilities JSON summary.
/// </summary>
public class ImpactAssessmentResponseDto
{
    public Guid Id { get; set; }

    public Guid DisasterEventId { get; set; }

    public Guid AffectedAreaId { get; set; }

    public int EstimatedPeopleAtRisk { get; set; }

    public int EstimatedVulnerableGroups { get; set; }

    /// <summary>"LOW" | "MEDIUM" | "HIGH" | "CRITICAL".</summary>
    public string ImpactSeverity { get; set; } = string.Empty;

    /// <summary>JSON array of impacted facility summaries.</summary>
    public string? AffectedFacilitiesSummary { get; set; }

    public Guid? WorkflowId { get; set; }

    public string GeneratedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

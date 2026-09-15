using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.DTOs.Component2;

/// <summary>
/// Request DTO for the core business operation: compute and persist an
/// impact assessment for a given disaster event and affected area.
/// </summary>
public class CalculateImpactRequestDto
{
    /// <summary>FK → DisasterEvents table (Component 1).</summary>
    [Required(ErrorMessage = "DisasterEventId is required.")]
    public Guid DisasterEventId { get; set; }

    /// <summary>FK → AffectedAreas table (Component 1).</summary>
    [Required(ErrorMessage = "AffectedAreaId is required.")]
    public Guid AffectedAreaId { get; set; }

    /// <summary>
    /// Hazard severity supplied by the calling system or agent.
    /// Allowed values: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL".
    /// Drives the population-exposure multiplier in the business rule.
    /// </summary>
    [Required(ErrorMessage = "HazardSeverity is required.")]
    [RegularExpression("^(LOW|MEDIUM|HIGH|CRITICAL)$",
        ErrorMessage = "HazardSeverity must be one of: LOW, MEDIUM, HIGH, CRITICAL.")]
    public string HazardSeverity { get; set; } = string.Empty;

    /// <summary>
    /// Optional: flood depth (metres) or blast radius (km) used for
    /// secondary exposure refinement. Null if not applicable.
    /// </summary>
    [Range(0.0, double.MaxValue, ErrorMessage = "FloodDepthOrRadius must be non-negative.")]
    public double? FloodDepthOrRadius { get; set; }

    /// <summary>
    /// Optional: correlate this assessment with an Agentic AI workflow.
    /// Null for manually triggered assessments.
    /// </summary>
    public Guid? WorkflowId { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.DTOs.Component2;

/// <summary>
/// Request DTO for creating a new population demographic snapshot.
/// All counts are aggregated – no PII is captured.
/// </summary>
public class CreatePopulationSnapshotDto
{
    /// <summary>FK → AffectedAreas table (Component 1).</summary>
    [Required(ErrorMessage = "AffectedAreaId is required.")]
    public Guid AffectedAreaId { get; set; }

    /// <summary>Total aggregated population count in the affected area.</summary>
    [Required(ErrorMessage = "TotalPopulation is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "TotalPopulation must be at least 1.")]
    public int TotalPopulation { get; set; }

    /// <summary>Aggregated count of children (typically age 0–14).</summary>
    [Range(0, int.MaxValue, ErrorMessage = "ChildrenCount must be non-negative.")]
    public int ChildrenCount { get; set; }

    /// <summary>Aggregated count of elderly individuals (typically age 65+).</summary>
    [Range(0, int.MaxValue, ErrorMessage = "ElderlyCount must be non-negative.")]
    public int ElderlyCount { get; set; }

    /// <summary>Aggregated count of individuals with registered disabilities.</summary>
    [Range(0, int.MaxValue, ErrorMessage = "DisabledCount must be non-negative.")]
    public int DisabledCount { get; set; }

    /// <summary>
    /// Origin of the demographic data (e.g., "Census 2023", "Local Authority Report").
    /// </summary>
    [MaxLength(100, ErrorMessage = "DataSource must not exceed 100 characters.")]
    public string? DataSource { get; set; }
}

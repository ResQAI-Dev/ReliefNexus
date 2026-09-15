namespace ReliefNexus.API.DTOs.Component2;

/// <summary>
/// Response DTO for PopulationRiskSnapshot records.
/// Returns aggregated demographic data only – no PII.
/// </summary>
public class PopulationSnapshotResponseDto
{
    public Guid Id { get; set; }

    public Guid AffectedAreaId { get; set; }

    public int TotalPopulation { get; set; }

    public int ChildrenCount { get; set; }

    public int ElderlyCount { get; set; }

    public int DisabledCount { get; set; }

    /// <summary>Computed: ChildrenCount + ElderlyCount + DisabledCount.</summary>
    public int TotalVulnerable { get; set; }

    /// <summary>Computed: TotalVulnerable / TotalPopulation (0.0 – 1.0).</summary>
    public double VulnerabilityRatio { get; set; }

    public DateTime SnapshotDate { get; set; }

    public string? DataSource { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

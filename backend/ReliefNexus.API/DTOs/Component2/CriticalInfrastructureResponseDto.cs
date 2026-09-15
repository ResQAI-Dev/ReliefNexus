namespace ReliefNexus.API.DTOs.Component2;

/// <summary>
/// Response DTO for CriticalInfrastructure records.
/// </summary>
public class CriticalInfrastructureResponseDto
{
    public Guid Id { get; set; }

    public Guid AffectedAreaId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public int? OperationalCapacity { get; set; }

    public bool IsEmergencyHub { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

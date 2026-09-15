using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.DTOs.Component2;

/// <summary>
/// Request DTO for registering a critical infrastructure facility.
/// </summary>
public class CreateCriticalInfrastructureDto
{
    /// <summary>FK → AffectedAreas table (Component 1).</summary>
    [Required(ErrorMessage = "AffectedAreaId is required.")]
    public Guid AffectedAreaId { get; set; }

    /// <summary>Human-readable facility name (e.g., "Civil Hospital Karachi").</summary>
    [Required(ErrorMessage = "Name is required.")]
    [MaxLength(150, ErrorMessage = "Name must not exceed 150 characters.")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Facility type: "Hospital", "School", "PowerStation", "WaterPlant",
    /// "Shelter", "FireStation", "PoliceStation", "Bridge", "Other".
    /// </summary>
    [Required(ErrorMessage = "Type is required.")]
    [MaxLength(50, ErrorMessage = "Type must not exceed 50 characters.")]
    public string Type { get; set; } = string.Empty;

    /// <summary>Latitude in decimal degrees (WGS-84).</summary>
    [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and 90.")]
    public double Latitude { get; set; }

    /// <summary>Longitude in decimal degrees (WGS-84).</summary>
    [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and 180.")]
    public double Longitude { get; set; }

    /// <summary>Normal operational capacity (bed count, student count, etc.).</summary>
    [Range(0, int.MaxValue, ErrorMessage = "OperationalCapacity must be non-negative.")]
    public int? OperationalCapacity { get; set; }

    /// <summary>Designate this facility as an emergency hub during disaster response.</summary>
    public bool IsEmergencyHub { get; set; } = false;
}

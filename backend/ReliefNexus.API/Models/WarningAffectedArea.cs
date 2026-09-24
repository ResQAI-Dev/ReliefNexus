namespace ReliefNexus.API.Models;

public class WarningAffectedArea
{
    public Guid Id { get; set; }

    // Reference to the affected area owned by another component.
    public Guid AffectedAreaId { get; set; }

    public Guid WarningId { get; set; }

    // Snapshot/display information.
    // The authoritative area data remains owned by the other component.
    public string AreaName { get; set; } = string.Empty;

    // Examples:
    // ALL
    // AFFECTED_USERS
    // FIELD_VOLUNTEERS
    // RELIEF_COORDINATORS
    public string TargetAudience { get; set; } = "ALL";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
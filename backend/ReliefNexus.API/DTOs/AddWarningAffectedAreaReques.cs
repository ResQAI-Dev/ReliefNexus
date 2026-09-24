namespace ReliefNexus.API.DTOs;

public class AddWarningAffectedAreaRequest
{
    public Guid AffectedAreaId { get; set; }

    public string AreaName { get; set; } = string.Empty;

    public string TargetAudience { get; set; } = "ALL";
}
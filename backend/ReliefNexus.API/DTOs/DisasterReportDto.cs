using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.DTOs;

public class DisasterReportDto
{
    public Guid Id { get; set; }

    public Guid ReporterUserId { get; set; }

    public string? ReporterName { get; set; }

    public string? ReporterEmail { get; set; }

    [Required]
    public string DisasterType { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Location { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public string Severity { get; set; } = "Medium";

    public string Status { get; set; } = "Submitted";

    // AI workflow connection
    public Guid? RiskPredictionId { get; set; }

    public Guid? AssignedVolunteerUserId { get; set; }

    public string? AssignedVolunteerName { get; set; }

    public DateTime? AssignedAt { get; set; }

    public string? FieldUpdateNotes { get; set; }

    public string? FieldSituation { get; set; }

    public double? FieldUpdateLatitude { get; set; }

    public double? FieldUpdateLongitude { get; set; }

    public DateTime? FieldUpdatedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

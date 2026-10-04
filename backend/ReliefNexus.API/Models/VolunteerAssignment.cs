using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.Models;

public class VolunteerAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DisasterReportId { get; set; }

    [Required]
    public Guid VolunteerUserId { get; set; }

    public int MatchScore { get; set; }

    public string AssignmentStatus { get; set; }
        = "Assigned";

    public string MatchReason { get; set; }
        = string.Empty;

    public DateTime AssignedAt { get; set; }
        = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}
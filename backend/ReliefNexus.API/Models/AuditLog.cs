using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.Models;

public class AuditLog
{
    [Key]
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? UserEmail { get; set; }

    public string? Role { get; set; }

    public string Status { get; set; } = "Success";

    public string Severity { get; set; } = "Normal";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
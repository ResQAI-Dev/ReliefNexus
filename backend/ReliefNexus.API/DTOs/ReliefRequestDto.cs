using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.DTOs;

public class ReliefRequestDto
{
    public Guid Id { get; set; }

    public Guid RequesterUserId { get; set; }

    public string? RequesterName { get; set; }

    public string? RequesterEmail { get; set; }

    [Required]
    public string RequestType { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Location { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public string Urgency { get; set; } = "Medium";

    public string Status { get; set; } = "Submitted";

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

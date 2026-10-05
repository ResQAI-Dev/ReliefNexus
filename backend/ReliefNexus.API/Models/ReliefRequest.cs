using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.Models;

public class ReliefRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RequesterUserId { get; set; }

    [Required]
    public string RequestType { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Location { get; set; } = string.Empty;

    [Column("RequestedQuantity")]
    public int Quantity { get; set; }

    [Column("Priority")]
    public string Urgency { get; set; } = "Medium";

    public string Status { get; set; } = "Submitted";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}




namespace ReliefNexus.API.Models;

public class Notification
{
    public Guid Id { get; set; }

    public Guid WarningId { get; set; }

    public Guid RecipientId { get; set; }

    public string Channel { get; set; } = "IN_APP";

    public string Status { get; set; } = "PENDING";

    public DateTime? SentAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    public DateTime? ReadAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
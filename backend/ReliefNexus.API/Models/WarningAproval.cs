namespace ReliefNexus.API.Models;

public class WarningApproval
{
    public Guid Id { get; set; }

    public Guid WarningId { get; set; }

    public Guid ReviewerId { get; set; }

    public string Decision { get; set; } = string.Empty;

    public string? Comments { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
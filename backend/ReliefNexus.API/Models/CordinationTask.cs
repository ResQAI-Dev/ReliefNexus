namespace ReliefNexus.API.Models;

public class CoordinationTask
{
    public Guid Id { get; set; }

    // Reference to the warning that triggered this coordination task
    public Guid WarningId { get; set; }

    // Reference to the preparedness action owned by Component 3.
    // We store the ID rather than creating a duplicate PreparednessAction entity.
    public Guid PreparednessActionId { get; set; }

    // Stakeholder/user responsible for carrying out the task
    public Guid? AssignedToId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "PENDING";

    public DateTime? DueAt { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
namespace ReliefNexus.API.DTOs;

public class CreateCoordinationTaskRequest
{
    public Guid WarningId { get; set; }

    public Guid PreparednessActionId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public Guid? AssignedToId { get; set; }

    public DateTime? DueAt { get; set; }
}
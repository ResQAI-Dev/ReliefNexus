namespace ReliefNexus.API.DTOs;

public class CreateNotificationRequest
{
    public Guid RecipientId { get; set; }

    public string Channel { get; set; } = "IN_APP";
}
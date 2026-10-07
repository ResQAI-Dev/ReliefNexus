using ReliefNexus.API.Models;

namespace ReliefNexus.API.Models;

public class ReliefResource
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ResourceType { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public int AvailableQuantity { get; set; }
    public int AllocatedQuantity { get; set; }
    public string Location { get; set; } = string.Empty;
    public string Status { get; set; } = "Available";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

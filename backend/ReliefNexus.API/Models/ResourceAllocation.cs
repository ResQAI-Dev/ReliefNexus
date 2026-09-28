namespace ReliefNexus.API.Models;

public class ResourceAllocation
{
    public Guid Id { get; set; } =
        Guid.NewGuid();

    public Guid VulnerabilityAssessmentId
    {
        get;
        set;
    }

    public Guid ResourceId
    {
        get;
        set;
    }

    public string ResourceType
    {
        get;
        set;
    } = string.Empty;

    public string ResourceName
    {
        get;
        set;
    } = string.Empty;

    public int RecommendedQuantity
    {
        get;
        set;
    }

    public string Priority
    {
        get;
        set;
    } = string.Empty;

    public string Location
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedAt
    {
        get;
        set;
    } = DateTime.UtcNow;
}
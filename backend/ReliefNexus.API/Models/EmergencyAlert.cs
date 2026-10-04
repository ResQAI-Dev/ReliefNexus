namespace ReliefNexus.API.Models;

public class EmergencyAlert
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RiskPredictionId { get; set; }

    public Guid VulnerabilityAssessmentId { get; set; }

    public string Title { get; set; } =
        string.Empty;

    public string Message { get; set; } =
        string.Empty;

    public string Location { get; set; } =
        string.Empty;

    public string DisasterType { get; set; } =
        string.Empty;

    public string Severity { get; set; } =
        string.Empty;

    public string Status { get; set; } =
        "Active";

    public string RecommendedActions { get; set; } =
        string.Empty;

    public string ResourceSummary { get; set; } =
        string.Empty;

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;

    public bool IsActive { get; set; } =
        true;
}
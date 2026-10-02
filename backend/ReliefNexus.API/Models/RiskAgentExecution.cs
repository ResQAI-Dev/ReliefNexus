namespace ReliefNexus.API.Models;

public class RiskAgentExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? RiskPredictionId { get; set; }

    public string AgentName { get; set; } =
        "Risk Prediction Agent";

    public string Status { get; set; } = "Started";

    public string InputSummary { get; set; } = string.Empty;

    public string OutputSummary { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; } =
        DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}

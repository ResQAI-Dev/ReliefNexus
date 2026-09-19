namespace ReliefNexus.API.Models;

public class RiskAgentExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? RiskPredictionId { get; set; }

    public string AgentName { get; set; } =
        "Risk Prediction Agent";

    public string Status { get; set; } =
        "Started";

    public string InputSummary { get; set; } =
        string.Empty;

    public string OutputSummary { get; set; } =
        string.Empty;

    public string WorkflowId { get; set; } =
        string.Empty;

    public string Objective { get; set; } =
        string.Empty;

    public string Plan { get; set; } =
        string.Empty;

    public string CurrentStep { get; set; } =
        string.Empty;

    public string CompletedSteps { get; set; } =
        string.Empty;

    public string ToolResults { get; set; } =
        string.Empty;

    public string ValidationResults { get; set; } =
        string.Empty;

    public string ApprovalStatus { get; set; } =
        "NotRequired";

    public string? ApprovalUser { get; set; }

    public DateTime? ApprovalTimestamp { get; set; }

    public string FinalOutcome { get; set; } =
        string.Empty;

    public string? ErrorMessage { get; set; }

    public DateTime StartedAt { get; set; } =
        DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}

namespace ReliefNexus.API.Models;

public class RiskPrediction
{
    public Guid Id { get; set; }

    public Guid RiskAssessmentId { get; set; }

    public string RiskLevel { get; set; } = string.Empty;

    public double RiskScore { get; set; }

    public string PredictionSummary { get; set; } = string.Empty;

    public DateTime PredictedAt { get; set; } = DateTime.UtcNow;

    public RiskAssessment? RiskAssessment { get; set; }
}
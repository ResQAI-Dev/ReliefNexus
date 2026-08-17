namespace ReliefNexus.API.DTOs;

public class RiskPredictionResponseDto
{
    public Guid RiskAssessmentId { get; set; }

    public string RiskLevel { get; set; } = string.Empty;

    public double RiskScore { get; set; }

    public string PredictionSummary { get; set; } = string.Empty;

    public DateTime PredictedAt { get; set; }
}
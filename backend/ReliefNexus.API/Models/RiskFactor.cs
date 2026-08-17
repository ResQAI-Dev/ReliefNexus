namespace ReliefNexus.API.Models;

public class RiskFactor
{
    public Guid Id { get; set; }

    public Guid RiskAssessmentId { get; set; }

    public string FactorType { get; set; } = string.Empty;

    public double FactorValue { get; set; }

    public double Weight { get; set; }

    public RiskAssessment? RiskAssessment { get; set; }
}
namespace ReliefNexus.API.Models;

public class RiskAssessment
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string DisasterType { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string Status { get; set; } = "Pending";

    public Guid CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? CreatedByUser { get; set; }

    public ICollection<RiskFactor> RiskFactors { get; set; }
        = new List<RiskFactor>();

    public RiskPrediction? RiskPrediction { get; set; }

    public ICollection<RiskAssessmentHistory> History { get; set; }
        = new List<RiskAssessmentHistory>();
}
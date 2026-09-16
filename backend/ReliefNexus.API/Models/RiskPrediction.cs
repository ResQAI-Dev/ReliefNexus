namespace ReliefNexus.API.Models;

public class RiskPrediction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Location { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public double Rainfall1h { get; set; }
    public double Rainfall3h { get; set; }
    public double Rainfall24h { get; set; }
    public double RiverLevel { get; set; }
    public double RiverFlow { get; set; }
    public double Temperature { get; set; }
    public double Humidity { get; set; }
    public double WindSpeed { get; set; }
    public double SoilMoisture { get; set; }
    public double Elevation { get; set; }
    public double PopulationDensity { get; set; }
    public int HistoricalFloodCount { get; set; }
    public double HistoricalSeverity { get; set; }
    public double DrainageCapacity { get; set; }
    public double ForecastRainfall { get; set; }

    public string DisasterType { get; set; } = string.Empty;
    public double RiskScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public double Confidence { get; set; }

    public string PredictionSource { get; set; } = "Risk Prediction Agent";
    public string ModelVersion { get; set; } = "v1.0";

    public bool RequiresHumanApproval { get; set; }
    public bool IsApproved { get; set; }

    public string ApprovalStatus { get; set; } = "NotRequired";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<RiskFactor> RiskFactors { get; set; } = new();
}

public class RiskFactor
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RiskPredictionId { get; set; }

    public string Factor { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Impact { get; set; } = string.Empty;
    public double Contribution { get; set; }

    public RiskPrediction? RiskPrediction { get; set; }
}

using System.Text.Json.Serialization;

namespace ReliefNexus.API.DTOs;

public class RiskPredictionDto
{
    public Guid? Id { get; set; }

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

    public List<DisasterRiskDto> DisasterRisks { get; set; } = new();

    public List<RiskFactorDto> RiskFactors { get; set; } = new();

    public List<string> Recommendations { get; set; } = new();

    public string PredictionSource { get; set; } = string.Empty;

    public string ModelVersion { get; set; } = string.Empty;

    public bool RequiresHumanApproval { get; set; }

    public bool IsApproved { get; set; }

    public string ApprovalStatus { get; set; } = "NotRequired";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Internal agent data.
    // These are not accepted from the client request.
    [JsonIgnore]
    public List<ExternalDisasterEventDto> ExternalEvents { get; set; } = new();

    [JsonIgnore]
    public bool WeatherDataAvailable { get; set; }

    [JsonIgnore]
    public string WeatherSource { get; set; } = string.Empty;
}

public class DisasterRiskDto
{
    public string DisasterType { get; set; } = string.Empty;

    public double? RiskScore { get; set; }

    public string RiskLevel { get; set; } = "DataUnavailable";

    public bool DataAvailable { get; set; }

    public string DataSource { get; set; } = string.Empty;
}

public class RiskFactorDto
{
    public string Factor { get; set; } = string.Empty;

    public double Value { get; set; }

    public string Impact { get; set; } = string.Empty;

    public double Contribution { get; set; }
}

public class ExternalDisasterEventDto
{
    public string EventType { get; set; } = string.Empty;

    public string EventId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string AlertLevel { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }
}

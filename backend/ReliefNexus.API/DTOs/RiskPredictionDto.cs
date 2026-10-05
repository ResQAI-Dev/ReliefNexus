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

    // Agent-only enrichment. Never accepted from the client.
    [JsonIgnore] public List<ExternalDisasterEventDto> ExternalEvents { get; set; } = new();
    [JsonIgnore] public bool WeatherDataAvailable { get; set; }
    [JsonIgnore] public string WeatherSource { get; set; } = string.Empty;
    [JsonIgnore] public bool SoilMoistureDataAvailable { get; set; }

    [JsonIgnore] public double Rainfall72h { get; set; }
    [JsonIgnore] public double ForecastRainfall24h { get; set; }
    [JsonIgnore] public double ReferenceEvapotranspiration24h { get; set; }
    [JsonIgnore] public double VapourPressureDeficit { get; set; }
    [JsonIgnore] public double PrecipitationProbability { get; set; }
    [JsonIgnore] public int WeatherCode { get; set; }
    [JsonIgnore] public double Temperature3hAverage { get; set; }
    [JsonIgnore] public double Humidity3hAverage { get; set; }
    [JsonIgnore] public double WindSpeed3hAverage { get; set; }

    [JsonIgnore] public int SriLankaRelevantAlertCount { get; set; }
    [JsonIgnore] public double SriLankaLandslideAlertScore { get; set; }
    [JsonIgnore] public double SriLankaFloodAlertScore { get; set; }
    [JsonIgnore] public double SriLankaWeatherAlertScore { get; set; }
    [JsonIgnore] public double SriLankaDroughtAlertScore { get; set; }
    [JsonIgnore] public double SriLankaObservedRainfall { get; set; }
    [JsonIgnore] public string OfficialAlertSummary { get; set; } = string.Empty;
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
    public double? Magnitude { get; set; }
    public double? DepthKm { get; set; }
}

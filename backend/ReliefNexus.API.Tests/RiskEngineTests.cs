using ReliefNexus.API.AI.Engines;
using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Tests;

public class RiskEngineTests
{
    [Fact]
    public void Calculate_WithFloodRainfall_ReturnsFloodRisk()
    {
        var engine = new RiskEngine();

        var input = new RiskPredictionDto
        {
            Location = "Colombo",
            DisasterType = "Flood",
            Rainfall1h = 40,
            Rainfall24h = 200,
            Rainfall72h = 300,
            ForecastRainfall24h = 150,
            RiverLevel = 4,
            SoilMoisture = 0.5,
            SriLankaFloodAlertScore = 0
        };

        var result = engine.Calculate(input);

        Assert.Equal("Flood", result.DisasterType);
        Assert.InRange(result.RiskScore, 0, 100);
        Assert.InRange(result.RiskScore, 0, 100);
        Assert.NotEqual("DataUnavailable", result.RiskLevel);
    }

    [Fact]
    public void Calculate_WithHighRisk_ReturnsHumanApprovalRequired()
    {
        var engine = new RiskEngine();

        var input = new RiskPredictionDto
        {
            Location = "Colombo",
            DisasterType = "Flood",
            Rainfall1h = 50,
            Rainfall24h = 250,
            Rainfall72h = 400,
            ForecastRainfall24h = 200,
            RiverLevel = 6,
            SoilMoisture = 0.6,
            SriLankaFloodAlertScore = 100
        };

        var result = engine.Calculate(input);

        Assert.True(result.RiskScore >= 75);
        Assert.True(result.RequiresHumanApproval);
        Assert.Equal("Pending", result.ApprovalStatus);
        Assert.False(result.IsApproved);
    }

    [Fact]
    public void Calculate_WithNoUsableData_ReturnsDataUnavailable()
    {
        var engine = new RiskEngine();

        var input = new RiskPredictionDto
        {
            Location = "Test Location",
            DisasterType = "Avalanche",
            WeatherDataAvailable = false
        };

        var result = engine.Calculate(input);

        Assert.Equal("DataUnavailable", result.DisasterType);
        Assert.Equal("DataUnavailable", result.RiskLevel);
        Assert.Equal(0, result.RiskScore);
        Assert.False(result.RequiresHumanApproval);
    }

    [Fact]
    public void Calculate_WithCycloneAlias_NormalizesToStormCyclone()
    {
        var engine = new RiskEngine();

        var input = new RiskPredictionDto
        {
            Location = "Colombo",
            DisasterType = "Cyclone",
            WeatherDataAvailable = true,
            WindSpeed = 100,
            Rainfall1h = 20,
            ForecastRainfall24h = 80,
            Humidity = 80
        };

        var result = engine.Calculate(input);

        Assert.Equal("Storm / Cyclone", result.DisasterType);
        Assert.InRange(result.RiskScore, 0, 100);
    }
}

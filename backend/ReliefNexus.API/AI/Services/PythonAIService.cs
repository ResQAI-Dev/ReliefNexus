using System.Net.Http.Json;
using System.Text.Json;
using ReliefNexus.API.AI.Models;
using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.AI.Services;

public class PythonAIService : IPythonAIService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PythonAIService> _logger;

    public PythonAIService(
        HttpClient httpClient,
        ILogger<PythonAIService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<PythonRiskAssessment?> AssessRiskAsync(
        RiskPredictionDto prediction,
        CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            location = prediction.Location ?? "",
            latitude = prediction.Latitude,
            longitude = prediction.Longitude,

            rainfall_1h = prediction.Rainfall1h,
            rainfall_24h = prediction.Rainfall24h,

            river_level = prediction.RiverLevel,

            historical_flood_count =
                prediction.HistoricalFloodCount,

            historical_severity =
                prediction.HistoricalSeverity,

            drainage_capacity =
                prediction.DrainageCapacity,

            forecast_rainfall =
                prediction.ForecastRainfall,

            disaster_type =
                prediction.DisasterType ?? "",

            additional_context = new
            {
                rainfall_3h = prediction.Rainfall3h,
                river_flow = prediction.RiverFlow,
                temperature = prediction.Temperature,
                humidity = prediction.Humidity,
                wind_speed = prediction.WindSpeed,
                soil_moisture = prediction.SoilMoisture,
                elevation = prediction.Elevation,
                population_density = prediction.PopulationDensity,

                weather_data_available =
                    prediction.WeatherDataAvailable,

                weather_source =
                    prediction.WeatherSource,

                external_events =
                    prediction.ExternalEvents,

                sri_lanka_relevant_alert_count =
                    prediction.SriLankaRelevantAlertCount,

                sri_lanka_landslide_alert_score =
                    prediction.SriLankaLandslideAlertScore,

                sri_lanka_flood_alert_score =
                    prediction.SriLankaFloodAlertScore,

                sri_lanka_weather_alert_score =
                    prediction.SriLankaWeatherAlertScore,

                sri_lanka_drought_alert_score =
                    prediction.SriLankaDroughtAlertScore,

                sri_lanka_observed_rainfall =
                    prediction.SriLankaObservedRainfall,

                official_alert_summary =
                    prediction.OfficialAlertSummary,

                existing_risk_score =
                    prediction.RiskScore,

                existing_risk_level =
                    prediction.RiskLevel,

                existing_confidence =
                    prediction.Confidence
            }
        };

        try
        {
            using var response =
                await _httpClient.PostAsJsonAsync(
                    "/ai/risk-assessment",
                    payload,
                    cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Python AI service returned HTTP {StatusCode}",
                    response.StatusCode);

                return null;
            }

            return await response.Content
                .ReadFromJsonAsync<PythonRiskAssessment>(
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    },
                    cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Python AI service unavailable.");

            return null;
        }
    }
}

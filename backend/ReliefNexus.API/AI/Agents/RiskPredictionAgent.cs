using ReliefNexus.API.AI.Engines;
using ReliefNexus.API.AI.Tools;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.AI.Agents;

public class RiskPredictionAgent
{
    private readonly RiskEngine _riskEngine;
    private readonly WeatherTool _weatherTool;
    private readonly DisasterDataTool _disasterDataTool;
    private readonly IAgentExecutionService _agentExecutionService;

    public RiskPredictionAgent(
        RiskEngine riskEngine,
        WeatherTool weatherTool,
        DisasterDataTool disasterDataTool,
        IAgentExecutionService agentExecutionService)
    {
        _riskEngine = riskEngine;
        _weatherTool = weatherTool;
        _disasterDataTool = disasterDataTool;
        _agentExecutionService = agentExecutionService;
    }

    public async Task<RiskPredictionDto> RunAsync(
        RiskPredictionDto request,
        Guid executionId)
    {
        var enriched = request;

        var completedSteps = new List<string>();

        try
        {
            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Collecting weather data",
                string.Join(" -> ", completedSteps),
                "WeatherTool: Started");

            if (request.Latitude.HasValue &&
                request.Longitude.HasValue)
            {
                var weather =
                    await _weatherTool.GetCurrentWeatherAsync(
                        request.Latitude.Value,
                        request.Longitude.Value);

                if (weather != null)
                {
                    enriched.Temperature =
                        weather.Temperature;

                    enriched.Humidity =
                        weather.Humidity;

                    enriched.WindSpeed =
                        weather.WindSpeed;

                    enriched.Rainfall1h =
                        weather.Precipitation;

                    enriched.Rainfall3h =
                        weather.Rainfall3h;

                    enriched.Rainfall24h =
                        weather.Rainfall24h;

                    enriched.ForecastRainfall =
                        weather.ForecastRainfall;

                    if (weather.SoilMoisture.HasValue)
                    {
                        enriched.SoilMoisture =
                            weather.SoilMoisture.Value;

                        enriched.SoilMoistureDataAvailable =
                            true;
                    }

                    enriched.WeatherDataAvailable =
                        true;

                    enriched.WeatherSource =
                        weather.Source;

                    completedSteps.Add(
                        "Weather data collected");
                }
                else
                {
                    completedSteps.Add(
                        "Weather data unavailable");
                }
            }
            else
            {
                completedSteps.Add(
                    "Weather skipped: coordinates unavailable");
            }

            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Collecting external disaster events",
                string.Join(" -> ", completedSteps),
                "WeatherTool: Completed; DisasterDataTool: Started");

            var externalEvents =
                await _disasterDataTool.GetRecentEventsAsync(
                    request.Latitude,
                    request.Longitude);

            enriched.ExternalEvents =
                externalEvents
                    .Select(x => new ExternalDisasterEventDto
                    {
                        EventType =
                            x.EventType,

                        EventId =
                            x.EventId,

                        Name =
                            x.Name,

                        AlertLevel =
                            x.AlertLevel,

                        Latitude =
                            x.Latitude,

                        Longitude =
                            x.Longitude,

                        Magnitude =
                            x.Magnitude,

                        DepthKm =
                            x.DepthKm
                    })
                    .ToList();

            completedSteps.Add(
                "External disaster data collected");

            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Calculating multi-hazard risk",
                string.Join(" -> ", completedSteps),
                "WeatherTool: Completed; DisasterDataTool: Completed; RiskEngine: Started");

            var result =
                _riskEngine.Calculate(enriched);

            completedSteps.Add(
                "Multi-hazard risk calculated");

            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Validating risk result",
                string.Join(" -> ", completedSteps),
                $"RiskEngine: Completed; RiskScore={result.RiskScore:F2}");

            ValidateResult(result);

            completedSteps.Add(
                "Risk result validated");

            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Workflow ready for persistence",
                string.Join(" -> ", completedSteps),
                $"Validation: Passed; RiskLevel={result.RiskLevel}");

            return result;
        }
        catch (Exception ex)
        {
            await _agentExecutionService.FailAsync(
                executionId,
                ex.Message);

            throw;
        }
    }

    private static void ValidateResult(
        RiskPredictionDto result)
    {
        if (result.RiskScore < 0 ||
            result.RiskScore > 100)
        {
            throw new InvalidOperationException(
                "Risk score must be between 0 and 100.");
        }

        var validLevels =
            new[]
            {
                "Low",
                "Medium",
                "High"
            };

        if (!validLevels.Contains(
                result.RiskLevel,
                StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Risk level is invalid.");
        }

        if (string.IsNullOrWhiteSpace(
                result.DisasterType))
        {
            throw new InvalidOperationException(
                "Disaster type is required.");
        }

        if (result.DisasterRisks == null)
        {
            throw new InvalidOperationException(
                "Disaster risk results are required.");
        }
    }
}

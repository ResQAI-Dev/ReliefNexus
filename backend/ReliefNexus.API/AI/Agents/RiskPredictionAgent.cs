using ReliefNexus.API.AI.Engines;
using ReliefNexus.API.AI.Tools;
using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.AI.Agents;

public class RiskPredictionAgent
{
    private readonly RiskEngine _riskEngine;
    private readonly WeatherTool _weatherTool;
    private readonly DisasterDataTool _disasterDataTool;

    public RiskPredictionAgent(
        RiskEngine riskEngine,
        WeatherTool weatherTool,
        DisasterDataTool disasterDataTool)
    {
        _riskEngine = riskEngine;
        _weatherTool = weatherTool;
        _disasterDataTool = disasterDataTool;
    }

    public async Task<RiskPredictionDto> RunAsync(
        RiskPredictionDto request)
    {
        var enriched = request;

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
            }
        }

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

        return _riskEngine.Calculate(
            enriched);
    }
}

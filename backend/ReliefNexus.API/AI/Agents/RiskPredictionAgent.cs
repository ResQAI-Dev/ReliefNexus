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
    private readonly SriLankaHazardDataTool _sriLankaHazardDataTool;

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
        _sriLankaHazardDataTool = new SriLankaHazardDataTool();
    }

    public async Task<RiskPredictionDto> RunAsync(
        RiskPredictionDto request,
        Guid executionId)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var enriched = request;
        var completedSteps = new List<string>();

        try
        {
            // ============================================================
            // STEP 1 - WEATHER DATA
            // ============================================================

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
                    enriched.Temperature = weather.Temperature;
                    enriched.Humidity = weather.Humidity;
                    enriched.WindSpeed = weather.WindSpeed;
                    enriched.Rainfall1h = weather.Precipitation;
                    enriched.Rainfall3h = weather.Rainfall3h;
                    enriched.Rainfall24h = weather.Rainfall24h;
                    enriched.Rainfall72h = weather.Rainfall72h;
                    enriched.ForecastRainfall = weather.ForecastRainfall;
                    enriched.ForecastRainfall24h = weather.ForecastRainfall24h;
                    enriched.ReferenceEvapotranspiration24h = weather.ReferenceEvapotranspiration24h;
                    enriched.VapourPressureDeficit = weather.VapourPressureDeficit;
                    enriched.PrecipitationProbability = weather.PrecipitationProbability;
                    enriched.WeatherCode = weather.WeatherCode;
                    enriched.Temperature3hAverage = weather.Temperature3hAverage;
                    enriched.Humidity3hAverage = weather.Humidity3hAverage;
                    enriched.WindSpeed3hAverage = weather.WindSpeed3hAverage;
                    enriched.Elevation = weather.Elevation;

                    if (weather.SoilMoisture.HasValue)
                    {
                        enriched.SoilMoisture = weather.SoilMoisture.Value;
                        enriched.SoilMoistureDataAvailable = true;
                    }

                    enriched.WeatherDataAvailable = true;
                    enriched.WeatherSource = weather.Source;

                    completedSteps.Add("Weather data collected");
                }
                else
                {
                    completedSteps.Add("Weather data unavailable");
                }
            }
            else
            {
                completedSteps.Add(
                    "Weather skipped: coordinates unavailable");
            }

            // ============================================================
            // STEP 2 - EXTERNAL DISASTER DATA
            // ============================================================

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
                externalEvents?
                    .Select(x => new ExternalDisasterEventDto
                    {
                        EventType = x.EventType,
                        EventId = x.EventId,
                        Name = x.Name,
                        AlertLevel = x.AlertLevel,
                        Latitude = x.Latitude,
                        Longitude = x.Longitude,
                        Magnitude = x.Magnitude,
                        DepthKm = x.DepthKm
                    })
                    .ToList()
                ?? new List<ExternalDisasterEventDto>();

            completedSteps.Add(
                "External disaster data collected");

            // ============================================================
            // STEP 3 - OFFICIAL SRI LANKA HAZARD EVIDENCE
            // ============================================================

            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Collecting official Sri Lanka hazard evidence",
                string.Join(" -> ", completedSteps),
                "RISE Sri Lanka: Started");

            var official = await _sriLankaHazardDataTool.GetEvidenceAsync(
                request.Location,
                request.Latitude,
                request.Longitude);

            enriched.SriLankaRelevantAlertCount = official.RelevantAlertCount;
            enriched.SriLankaLandslideAlertScore = official.LandslideAlertScore;
            enriched.SriLankaFloodAlertScore = official.FloodAlertScore;
            enriched.SriLankaWeatherAlertScore = official.WeatherAlertScore;
            enriched.SriLankaDroughtAlertScore = official.DroughtAlertScore;
            enriched.SriLankaObservedRainfall = official.MaxObservedRainfall;
            enriched.OfficialAlertSummary = string.Join(" || ", official.AlertSummaries.Take(5));

            if (official.LandslideAlertScore > 0)
            {
                enriched.ExternalEvents.Add(new ExternalDisasterEventDto
                {
                    EventType = "NBRO_LANDSLIDE_ALERT",
                    EventId = "RISE-NBRO",
                    Name = enriched.OfficialAlertSummary,
                    AlertLevel = AlertLevelFromScore(official.LandslideAlertScore),
                    Latitude = request.Latitude,
                    Longitude = request.Longitude
                });
            }

            if (official.FloodAlertScore > 0)
            {
                enriched.ExternalEvents.Add(new ExternalDisasterEventDto
                {
                    EventType = "SRI_LANKA_FLOOD_ALERT",
                    EventId = "RISE-FLOOD",
                    Name = enriched.OfficialAlertSummary,
                    AlertLevel = AlertLevelFromScore(official.FloodAlertScore),
                    Latitude = request.Latitude,
                    Longitude = request.Longitude
                });
            }

            if (official.WeatherAlertScore > 0)
            {
                enriched.ExternalEvents.Add(new ExternalDisasterEventDto
                {
                    EventType = "SRI_LANKA_WEATHER_ALERT",
                    EventId = "RISE-WEATHER",
                    Name = official.MeteorologicalText,
                    AlertLevel = AlertLevelFromScore(official.WeatherAlertScore),
                    Latitude = request.Latitude,
                    Longitude = request.Longitude
                });
            }

            completedSteps.Add(
                official.RelevantAlertCount > 0
                    ? $"Official Sri Lanka alerts found: {official.RelevantAlertCount}"
                    : "No location-matched official Sri Lanka alert found");

            // ============================================================
            // STEP 4 - RISK ENGINE
            // ============================================================

            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Calculating multi-hazard risk",
                string.Join(" -> ", completedSteps),
                "WeatherTool: Completed; DisasterDataTool: Completed; RiskEngine: Started");

            var result =
                _riskEngine.Calculate(enriched);

            // ============================================================
            // STEP 4 - RESOLVE AVAILABLE PRIMARY RISK
            // ============================================================

            result =
                ResolveAvailablePrimaryRisk(
                    result,
                    enriched);

            completedSteps.Add(
                "Multi-hazard risk calculated");

            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Validating risk result",
                string.Join(" -> ", completedSteps),
                $"RiskEngine: Completed; " +
                $"DisasterType={result.DisasterType}; " +
                $"RiskScore={result.RiskScore:F2}; " +
                $"RiskLevel={result.RiskLevel}");

            // ============================================================
            // STEP 5 - VALIDATION
            // ============================================================

            ValidateResult(result);

            completedSteps.Add(
                "Risk result validated");

            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Workflow ready for persistence",
                string.Join(" -> ", completedSteps),
                $"Validation: Passed; " +
                $"RiskLevel={result.RiskLevel}; " +
                $"RiskScore={result.RiskScore:F2}");

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

    private static string AlertLevelFromScore(double score)
    {
        return score >= 90 ? "Red" :
               score >= 70 ? "Orange" :
               score >= 45 ? "Yellow" :
               "Green";
    }

    // ================================================================
    // RESOLVE AVAILABLE PRIMARY RISK
    // ================================================================

    private RiskPredictionDto ResolveAvailablePrimaryRisk(
        RiskPredictionDto result,
        RiskPredictionDto originalRequest)
    {
        if (result == null)
        {
            throw new InvalidOperationException(
                "Risk prediction result is null.");
        }

        // RiskEngine calculates the complete multi-hazard portfolio.
        // Keep ALL hazards. Only select which one is PRIMARY.

        if (result.DisasterRisks == null || result.DisasterRisks.Count == 0)
        {
            var recalculated = _riskEngine.Calculate(originalRequest);
            result.DisasterRisks =
                recalculated.DisasterRisks ?? new List<DisasterRiskDto>();
        }

        var availableRisks =
            result.DisasterRisks
                .Where(r =>
                    r != null &&
                    r.DataAvailable &&
                    r.RiskScore >= 0 &&
                    r.RiskScore <= 100 &&
                    !string.IsNullOrWhiteSpace(r.DisasterType))
                .ToList();

        if (availableRisks.Count == 0)
        {
            result.DisasterType = "DataUnavailable";
            result.RiskScore = 0;
            result.RiskLevel = "DataUnavailable";
            return result;
        }

        // If the request/report specifies a disaster type,
        // make that disaster the PRIMARY risk when its data is available.
        var requestedType =
            NormalizeDisasterType(originalRequest.DisasterType);

        var primary = string.IsNullOrWhiteSpace(requestedType)
            ? null
            : availableRisks.FirstOrDefault(r =>
                string.Equals(
                    NormalizeDisasterType(r.DisasterType),
                    requestedType,
                    StringComparison.OrdinalIgnoreCase));

        // Standalone Risk Prediction has no requested disaster type,
        // so select the highest available risk automatically.
        primary ??= availableRisks
            .OrderByDescending(r => r.RiskScore!.Value)
            .First();

        var score = primary.RiskScore!.Value;

        result.DisasterType = primary.DisasterType;
        result.RiskScore = score;
        result.RiskLevel =
            NormalizeRiskLevel(primary.RiskLevel, score);

        if (string.IsNullOrWhiteSpace(result.Location))
        {
            result.Location = originalRequest.Location;
        }

        // IMPORTANT:
        // result.DisasterRisks remains the COMPLETE multi-hazard portfolio.
        return result;
    }
    // ================================================================
    // CHECK DATA UNAVAILABLE
    // ================================================================

    private static bool IsDataUnavailable(
        RiskPredictionDto result)
    {
        if (result == null)
        {
            return true;
        }

        var disasterType =
            (result.DisasterType ?? string.Empty).Trim();

        var riskLevel =
            (result.RiskLevel ?? string.Empty).Trim();

        return
            string.Equals(
                disasterType,
                "DataUnavailable",
                StringComparison.OrdinalIgnoreCase)
            ||
            string.Equals(
                riskLevel,
                "DataUnavailable",
                StringComparison.OrdinalIgnoreCase)
            ||
            string.Equals(
                disasterType.Replace(" ", ""),
                "DataUnavailable",
                StringComparison.OrdinalIgnoreCase)
            ||
            string.Equals(
                riskLevel.Replace(" ", ""),
                "DataUnavailable",
                StringComparison.OrdinalIgnoreCase);
    }

    // ================================================================
    // NORMALIZE RISK LEVEL
    // ================================================================

    private static string NormalizeRiskLevel(
        string? rawLevel,
        double score)
    {
        var level =
            (rawLevel ?? string.Empty)
                .Trim()
                .ToLowerInvariant();

        switch (level)
        {
            case "critical":
            case "critical risk":
                return "Critical";

            case "high":
            case "high risk":
                return "High";

            case "moderate":
            case "moderate risk":
            case "medium":
            case "medium risk":
                return "Moderate";

            case "low":
            case "low risk":
                return "Low";
        }

        return score switch
        {
            >= 75 => "Critical",
            >= 50 => "High",
            >= 25 => "Medium",
            _ => "Low"
        };
    }

    // ================================================================
    // VALIDATE RESULT
    // ================================================================

    private static void ValidateResult(
        RiskPredictionDto result)
    {
        if (result == null)
        {
            throw new InvalidOperationException(
                "Risk prediction result is null.");
        }

        if (double.IsNaN(result.RiskScore) ||
            double.IsInfinity(result.RiskScore) ||
            result.RiskScore < 0 ||
            result.RiskScore > 100)
        {
            throw new InvalidOperationException(
                "Risk score is invalid.");
        }

        if (double.IsNaN(result.Confidence) ||
            double.IsInfinity(result.Confidence) ||
            result.Confidence < 0 ||
            result.Confidence > 100)
        {
            throw new InvalidOperationException(
                "Confidence is invalid.");
        }

        if (string.IsNullOrWhiteSpace(result.Location))
        {
            throw new InvalidOperationException(
                "Location is required.");
        }

        var rawLevel =
            (result.RiskLevel ?? string.Empty).Trim();

        // DataUnavailable is valid only when there is genuinely
        // no usable disaster-risk data.
        if (string.Equals(
                rawLevel,
                "DataUnavailable",
                StringComparison.OrdinalIgnoreCase) ||
            string.Equals(
                rawLevel.Replace(" ", ""),
                "DataUnavailable",
                StringComparison.OrdinalIgnoreCase))
        {
            result.RiskLevel = "DataUnavailable";
            return;
        }

        result.RiskLevel =
            NormalizeRiskLevel(
                rawLevel,
                result.RiskScore);

        if (string.IsNullOrWhiteSpace(
                result.DisasterType))
        {
            throw new InvalidOperationException(
                "Disaster type is required.");
        }

        // Keep risk level consistent with the actual score.
        var expectedLevel =
            result.RiskScore >= 75
                ? "Critical"
                : result.RiskScore >= 50
                    ? "High"
                    : result.RiskScore >= 25
                        ? "Medium"
                        : "Low";

        if (!string.Equals(
                result.RiskLevel,
                expectedLevel,
                StringComparison.OrdinalIgnoreCase))
        {
            result.RiskLevel =
                expectedLevel;
        }
    }

    private static string NormalizeDisasterType(string? disasterType)
    {
        return disasterType?.Trim() switch
        {
            "Cyclone" => "Storm / Cyclone",
            "Storm" => "Storm / Cyclone",
            "Wildfire" => "Wildfire / Forest Fire",
            "Forest Fire" => "Wildfire / Forest Fire",
            "Cold Wave" => "Extreme Cold / Cold Wave",
            _ => disasterType?.Trim() ?? string.Empty
        };
    }
}



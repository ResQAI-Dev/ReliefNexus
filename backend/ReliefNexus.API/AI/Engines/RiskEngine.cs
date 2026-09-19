using ReliefNexus.API.AI.Tools;
using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.AI.Engines;

public class RiskEngine
{
    public RiskPredictionDto Calculate(
        RiskPredictionDto x)
    {
        var risks = new List<DisasterRiskDto>
        {
            CalculateFlood(x),
            CalculateLandslide(x),
            CalculateStorm(x),
            CalculateDrought(x),
            CalculateWildfire(x),
            CalculateEarthquake(x),
            CalculateTsunami(x),
            CalculateLightning(x),
            CalculateHeatwave(x),
            CalculateVolcanic(x),
            CalculateAvalanche(x),
            CalculateColdWave(x)
        };

        var availableRisks =
            risks
                .Where(x => x.DataAvailable &&
                            x.RiskScore.HasValue)
                .OrderByDescending(
                    x => x.RiskScore!.Value)
                .ToList();

        var primary =
            availableRisks.FirstOrDefault();

        if (primary == null)
        {
            return CreateNoDataResult(x, risks);
        }

        var primaryScore =
            primary.RiskScore!.Value;

        return new RiskPredictionDto
        {
            Location = x.Location,
            Latitude = x.Latitude,
            Longitude = x.Longitude,

            Rainfall1h = x.Rainfall1h,
            Rainfall3h = x.Rainfall3h,
            Rainfall24h = x.Rainfall24h,

            RiverLevel = x.RiverLevel,
            RiverFlow = x.RiverFlow,

            Temperature = x.Temperature,
            Humidity = x.Humidity,
            WindSpeed = x.WindSpeed,

            SoilMoisture = x.SoilMoisture,
            Elevation = x.Elevation,
            PopulationDensity =
                x.PopulationDensity,

            HistoricalFloodCount =
                x.HistoricalFloodCount,

            HistoricalSeverity =
                x.HistoricalSeverity,

            DrainageCapacity =
                x.DrainageCapacity,

            ForecastRainfall =
                x.ForecastRainfall,

            DisasterType =
                primary.DisasterType,

            RiskScore =
                Math.Round(
                    primaryScore,
                    2),

            RiskLevel =
                GetRiskLevel(primaryScore),

            Confidence =
                CalculateConfidence(
                    x,
                    primary),

            DisasterRisks =
                risks,

            RiskFactors =
                BuildRiskFactors(
                    x,
                    primary.DisasterType),

            Recommendations =
                BuildRecommendations(
                    primary.DisasterType,
                    GetRiskLevel(primaryScore)),

            PredictionSource =
                BuildPredictionSource(x),

            ModelVersion =
                "v3.0-RealData-MultiDisaster",

            RequiresHumanApproval =
                primaryScore >= 75,

            IsApproved = false,

            ApprovalStatus =
                primaryScore >= 75
                    ? "Pending"
                    : "NotRequired"
        };
    }

    // =====================================================
    // FLOOD
    // =====================================================

    private static DisasterRiskDto CalculateFlood(
        RiskPredictionDto x)
    {
        if (x.Rainfall24h <= 0 &&
            x.RiverLevel <= 0 &&
            x.HistoricalFloodCount <= 0 &&
            x.ForecastRainfall <= 0 &&
            x.SoilMoisture <= 0)
        {
            return UnavailableRisk(
                "Flood",
                "Insufficient flood data");
        }

        var score =
            Normalize(x.Rainfall24h, 250) * 35 +
            Normalize(x.RiverLevel, 6) * 30 +
            Normalize(x.HistoricalFloodCount, 10) * 15 +
            Normalize(x.ForecastRainfall, 200) * 10 +
            Normalize(x.SoilMoisture, 100) * 10;

        return AvailableRisk(
            "Flood",
            score,
            "Open-Meteo + River Gauge + GDACS");
    }

    // =====================================================
    // LANDSLIDE
    // =====================================================

    private static DisasterRiskDto CalculateLandslide(
        RiskPredictionDto x)
    {
        if (x.Rainfall24h <= 0 &&
            x.SoilMoisture <= 0 &&
            x.Elevation <= 0 &&
            x.ForecastRainfall <= 0)
        {
            return UnavailableRisk(
                "Landslide",
                "Insufficient landslide data");
        }

        var score =
            Normalize(x.Rainfall24h, 250) * 35 +
            Normalize(x.SoilMoisture, 100) * 30 +
            Normalize(x.Elevation, 100) * 15 +
            Normalize(x.ForecastRainfall, 200) * 20;

        return AvailableRisk(
            "Landslide",
            score,
            "Open-Meteo + Terrain Inputs");
    }

    // =====================================================
    // STORM / CYCLONE
    // =====================================================

    private static DisasterRiskDto CalculateStorm(
        RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable)
        {
            return UnavailableRisk(
                "Storm / Cyclone",
                "Open-Meteo");
        }

        var score =
            Normalize(x.WindSpeed, 120) * 50 +
            Normalize(x.Rainfall1h, 10) * 20 +
            Normalize(x.Humidity, 100) * 15 +
            Normalize(x.Rainfall24h, 250) * 15;

        return AvailableRisk(
            "Storm / Cyclone",
            score,
            "Open-Meteo");
    }

    // =====================================================
    // DROUGHT
    // =====================================================

    private static DisasterRiskDto CalculateDrought(
    RiskPredictionDto x)
{
    var hasRainfall =
        x.Rainfall24h >= 0;

    var hasForecast =
        x.ForecastRainfall >= 0;

    var hasTemperature =
        x.WeatherDataAvailable;

    var hasHumidity =
        x.WeatherDataAvailable;

    var hasSoilMoisture =
        x.SoilMoisture > 0;

    if (!hasRainfall &&
        !hasForecast &&
        !hasTemperature &&
        !hasHumidity &&
        !hasSoilMoisture)
    {
        return UnavailableRisk(
            "Drought",
            "Insufficient drought data");
    }

    var weightedScore = 0.0;
    var totalWeight = 0.0;

    if (hasRainfall)
    {
        weightedScore +=
            (1 - Normalize(x.Rainfall24h, 250)) * 30;
        totalWeight += 30;
    }

    if (hasForecast)
    {
        weightedScore +=
            (1 - Normalize(x.ForecastRainfall, 200)) * 20;
        totalWeight += 20;
    }

    if (hasTemperature)
    {
        weightedScore +=
            Normalize(x.Temperature, 45) * 20;
        totalWeight += 20;
    }

    if (hasHumidity)
    {
        weightedScore +=
            (1 - Normalize(x.Humidity, 100)) * 15;
        totalWeight += 15;
    }

    if (hasSoilMoisture)
    {
        weightedScore +=
            (1 - Normalize(x.SoilMoisture, 1.0)) * 15;
        totalWeight += 15;
    }

    var score =
        totalWeight > 0
            ? weightedScore / totalWeight * 100
            : 0;

    return AvailableRisk(
        "Drought",
        score,
        "Open-Meteo + Local Risk Inputs");
}
// =====================================================
    // WILDFIRE
    // =====================================================

    private static DisasterRiskDto CalculateWildfire(
        RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable)
        {
            return UnavailableRisk(
                "Wildfire / Forest Fire",
                "Open-Meteo");
        }

        var score =
            Math.Max(
                0,
                (x.Temperature - 30) / 15) * 30 +
            (1 - Normalize(x.Humidity, 100)) * 30 +
            (1 - Normalize(x.Rainfall1h, 10)) * 25 +
            Normalize(x.WindSpeed, 120) * 15;

        return AvailableRisk(
            "Wildfire / Forest Fire",
            score,
            "Open-Meteo");
    }

    // =====================================================
    // EARTHQUAKE - ACTUAL GDACS EVENTS
    // =====================================================

    private static DisasterRiskDto CalculateEarthquake(
    RiskPredictionDto x)
{
    var events =
        x.ExternalEvents
            .Where(e =>
                e.EventType.Equals(
                    "EQ",
                    StringComparison.OrdinalIgnoreCase))
            .Where(e =>
                e.Latitude.HasValue &&
                e.Longitude.HasValue)
            .ToList();

    if (events.Count == 0)
        return UnavailableRisk(
            "Earthquake",
            "USGS + GDACS");

    var nearest =
        GetNearestEvent(
            x,
            events);

    if (nearest == null ||
        !nearest.Latitude.HasValue ||
        !nearest.Longitude.HasValue)
    {
        return UnavailableRisk(
            "Earthquake",
            "USGS + GDACS");
    }

    var distance =
        CalculateDistanceKm(
            x.Latitude,
            x.Longitude,
            nearest.Latitude,
            nearest.Longitude);

    if (distance > 500)
    {
        return UnavailableRisk(
            "Earthquake",
            "No locally relevant earthquake event");
    }

    var distanceScore =
        distance <= 50 ? 90 :
        distance <= 100 ? 75 :
        distance <= 250 ? 55 :
        30;

    double magnitudeScore;

    if (nearest.Magnitude.HasValue)
    {
        var magnitude =
            nearest.Magnitude.Value;

        magnitudeScore =
            magnitude < 4.0 ? 20 :
            magnitude < 5.0 ? 40 :
            magnitude < 6.0 ? 60 :
            magnitude < 7.0 ? 80 :
            100;
    }
    else
    {
        magnitudeScore =
            string.Equals(
                nearest.AlertLevel,
                "Red",
                StringComparison.OrdinalIgnoreCase) ? 100 :
            string.Equals(
                nearest.AlertLevel,
                "Orange",
                StringComparison.OrdinalIgnoreCase) ? 75 :
            string.Equals(
                nearest.AlertLevel,
                "Green",
                StringComparison.OrdinalIgnoreCase) ? 40 :
            20;
    }

    var score =
        Math.Round(
            (distanceScore * 0.60) +
            (magnitudeScore * 0.40),
            2);

    var source =
        nearest.EventId.StartsWith(
            "USGS-",
            StringComparison.OrdinalIgnoreCase)
            ? "USGS"
            : "GDACS";

    return AvailableRisk(
        "Earthquake",
        score,
        source);
}
// =====================================================
// TSUNAMI - ACTUAL GDACS EVENTS
    // =====================================================

    private static DisasterRiskDto CalculateTsunami(
    RiskPredictionDto x)
{
    var events =
        x.ExternalEvents
            .Where(e =>
                e.EventType.Equals(
                    "TS",
                    StringComparison.OrdinalIgnoreCase))
            .Where(e =>
                e.Latitude.HasValue &&
                e.Longitude.HasValue)
            .ToList();

    if (events.Count == 0)
    {
        return UnavailableRisk(
            "Tsunami",
            "GDACS");
    }

    var nearest =
        GetNearestEvent(
            x,
            events);

    if (nearest == null ||
        !nearest.Latitude.HasValue ||
        !nearest.Longitude.HasValue)
    {
        return UnavailableRisk(
            "Tsunami",
            "GDACS");
    }

    var distance =
        CalculateDistanceKm(
            x.Latitude,
            x.Longitude,
            nearest.Latitude,
            nearest.Longitude);

    if (distance > 500)
    {
        return UnavailableRisk(
            "Tsunami",
            "No locally relevant GDACS tsunami event");
    }

    var distanceScore =
        distance <= 50 ? 100 :
        distance <= 100 ? 90 :
        distance <= 250 ? 75 :
        50;

    var alertScore =
        string.Equals(
            nearest.AlertLevel,
            "Red",
            StringComparison.OrdinalIgnoreCase) ? 100 :
        string.Equals(
            nearest.AlertLevel,
            "Orange",
            StringComparison.OrdinalIgnoreCase) ? 75 :
        string.Equals(
            nearest.AlertLevel,
            "Green",
            StringComparison.OrdinalIgnoreCase) ? 40 :
        20;

    var score =
        Math.Round(
            (distanceScore * 0.70) +
            (alertScore * 0.30),
            2);

    return AvailableRisk(
        "Tsunami",
        score,
        "GDACS");
}
// =====================================================
    // LIGHTNING
    // =====================================================

    private static DisasterRiskDto CalculateLightning(
        RiskPredictionDto x)
    {
        // Lightning requires actual short-term rainfall
        // or forecast rainfall data.
        if (x.Rainfall3h <= 0 &&
            x.ForecastRainfall <= 0)
        {
            return UnavailableRisk(
                "Lightning",
                "Insufficient Open-Meteo rainfall data");
        }

        var score =
            Normalize(x.Rainfall3h, 150) * 35 +
            Normalize(x.Humidity, 100) * 25 +
            Normalize(x.WindSpeed, 120) * 15 +
            Normalize(x.Temperature, 45) * 10 +
            Normalize(x.ForecastRainfall, 200) * 15;

        return AvailableRisk(
            "Lightning",
            score,
            "Open-Meteo");
    }

    // =====================================================
    // HEATWAVE
    // =====================================================

    private static DisasterRiskDto CalculateHeatwave(
        RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable)
        {
            return UnavailableRisk(
                "Heatwave",
                "Open-Meteo");
        }

        // A heatwave score should only increase when
        // temperature is actually above the heat threshold.
        var temperatureScore =
            Math.Max(
                0,
                (x.Temperature - 30) / 15);

        var score =
            temperatureScore * 70 +
            (1 - Normalize(x.Humidity, 100)) * 15 +
            (1 - Normalize(x.Rainfall1h, 10)) * 10 +
            Normalize(x.WindSpeed, 120) * 5;

        return AvailableRisk(
            "Heatwave",
            score,
            "Open-Meteo");
    }

    // =====================================================
    // VOLCANIC - ACTUAL GDACS EVENTS
    // =====================================================

    private static DisasterRiskDto CalculateVolcanic(
    RiskPredictionDto x)
{
    var events =
        x.ExternalEvents
            .Where(e =>
                e.EventType.Equals(
                    "VO",
                    StringComparison.OrdinalIgnoreCase))
            .Where(e =>
                e.Latitude.HasValue &&
                e.Longitude.HasValue)
            .ToList();

    if (events.Count == 0)
    {
        return UnavailableRisk(
            "Volcanic Eruption",
            "GDACS");
    }

    var nearest =
        GetNearestEvent(
            x,
            events);

    if (nearest == null ||
        !nearest.Latitude.HasValue ||
        !nearest.Longitude.HasValue)
    {
        return UnavailableRisk(
            "Volcanic Eruption",
            "GDACS");
    }

    var distance =
        CalculateDistanceKm(
            x.Latitude,
            x.Longitude,
            nearest.Latitude,
            nearest.Longitude);

    if (distance > 500)
    {
        return UnavailableRisk(
            "Volcanic Eruption",
            "No locally relevant GDACS volcanic event");
    }

    var distanceScore =
        distance <= 50 ? 100 :
        distance <= 100 ? 90 :
        distance <= 250 ? 75 :
        50;

    var alertScore =
        string.Equals(
            nearest.AlertLevel,
            "Red",
            StringComparison.OrdinalIgnoreCase) ? 100 :
        string.Equals(
            nearest.AlertLevel,
            "Orange",
            StringComparison.OrdinalIgnoreCase) ? 75 :
        string.Equals(
            nearest.AlertLevel,
            "Green",
            StringComparison.OrdinalIgnoreCase) ? 40 :
        20;

    var score =
        Math.Round(
            (distanceScore * 0.70) +
            (alertScore * 0.30),
            2);

    return AvailableRisk(
        "Volcanic Eruption",
        score,
        "GDACS");
}
// =====================================================
    // AVALANCHE
    // =====================================================

    private static DisasterRiskDto CalculateAvalanche(
        RiskPredictionDto x)
    {
        return UnavailableRisk(
            "Avalanche",
            "No real avalanche data source configured");
    }

    // =====================================================
    // EXTREME COLD
    // =====================================================

    private static DisasterRiskDto CalculateColdWave(
        RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable)
        {
            return UnavailableRisk(
                "Extreme Cold / Cold Wave",
                "Open-Meteo");
        }

        var score =
            x.Temperature <= 5 ? 90 :
            x.Temperature <= 10 ? 70 :
            x.Temperature <= 15 ? 40 :
            5;

        return AvailableRisk(
            "Extreme Cold / Cold Wave",
            score,
            "Open-Meteo");
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private static DisasterRiskDto AvailableRisk(
        string disasterType,
        double score,
        string source)
    {
        return new DisasterRiskDto
        {
            DisasterType = disasterType,
            RiskScore = Math.Round(
                Math.Clamp(score, 0, 100),
                2),
            RiskLevel = GetRiskLevel(
                Math.Clamp(score, 0, 100)),
            DataAvailable = true,
            DataSource = source
        };
    }

    private static DisasterRiskDto UnavailableRisk(
        string disasterType,
        string source)
    {
        return new DisasterRiskDto
        {
            DisasterType = disasterType,
            RiskScore = null,
            RiskLevel = "DataUnavailable",
            DataAvailable = false,
            DataSource = source
        };
    }

    private static RiskPredictionDto CreateNoDataResult(
        RiskPredictionDto x,
        List<DisasterRiskDto> risks)
    {
        return new RiskPredictionDto
        {
            Location = x.Location,
            Latitude = x.Latitude,
            Longitude = x.Longitude,

            Rainfall1h = x.Rainfall1h,
            Rainfall3h = x.Rainfall3h,
            Rainfall24h = x.Rainfall24h,

            RiverLevel = x.RiverLevel,
            RiverFlow = x.RiverFlow,

            Temperature = x.Temperature,
            Humidity = x.Humidity,
            WindSpeed = x.WindSpeed,

            SoilMoisture = x.SoilMoisture,
            Elevation = x.Elevation,
            PopulationDensity =
                x.PopulationDensity,

            HistoricalFloodCount =
                x.HistoricalFloodCount,

            HistoricalSeverity =
                x.HistoricalSeverity,

            DrainageCapacity =
                x.DrainageCapacity,

            ForecastRainfall =
                x.ForecastRainfall,

            DisasterType = "DataUnavailable",
            RiskScore = 0,
            RiskLevel = "DataUnavailable",
            Confidence = 0,
            DisasterRisks = risks,

            PredictionSource =
                BuildPredictionSource(x),

            ModelVersion =
                "v3.0-RealData-MultiDisaster",

            RequiresHumanApproval = false,
            IsApproved = false,
            ApprovalStatus = "NotRequired"
        };
    }

    private static double CalculateConfidence(
        RiskPredictionDto x,
        DisasterRiskDto primary)
    {
        var confidence = 70.0;

        if (x.WeatherDataAvailable)
            confidence += 10;

        if (x.ExternalEvents.Count > 0)
            confidence += 10;

        if (primary.DataAvailable)
            confidence += 5;

        if (x.Latitude.HasValue &&
            x.Longitude.HasValue)
            confidence += 5;

        return Math.Min(
            confidence,
            100);
    }

    private static string BuildPredictionSource(
        RiskPredictionDto x)
    {
        var sources = new List<string>();

        if (x.WeatherDataAvailable)
            sources.Add("Open-Meteo");

        if (x.ExternalEvents.Count > 0)
            sources.Add("GDACS");

        sources.Add("Risk Prediction Agent");

        return string.Join(
            " + ",
            sources);
    }

    private static List<RiskFactorDto> BuildRiskFactors(
        RiskPredictionDto x,
        string disasterType)
    {
        return disasterType switch
        {
            "Flood" => new()
            {
                new RiskFactorDto
                {
                    Factor = "24-hour Rainfall",
                    Value = x.Rainfall24h,
                    Impact =
                        GetImpact(
                            x.Rainfall24h,
                            150,
                            250),
                    Contribution =
                        Math.Round(
                            Normalize(
                                x.Rainfall24h,
                                250) * 35,
                            2)
                },

                new RiskFactorDto
                {
                    Factor = "River Level",
                    Value = x.RiverLevel,
                    Impact =
                        GetImpact(
                            x.RiverLevel,
                            3,
                            5),
                    Contribution =
                        Math.Round(
                            Normalize(
                                x.RiverLevel,
                                6) * 30,
                            2)
                },

                new RiskFactorDto
                {
                    Factor = "Historical Flood Count",
                    Value =
                        x.HistoricalFloodCount,
                    Impact =
                        GetImpact(
                            x.HistoricalFloodCount,
                            3,
                            6),
                    Contribution =
                        Math.Round(
                            Normalize(
                                x.HistoricalFloodCount,
                                10) * 15,
                            2)
                }
            },

            "Storm / Cyclone" => new()
            {
                new RiskFactorDto
                {
                    Factor = "Wind Speed",
                    Value = x.WindSpeed,
                    Impact =
                        GetImpact(
                            x.WindSpeed,
                            60,
                            100),
                    Contribution =
                        Math.Round(
                            Normalize(
                                x.WindSpeed,
                                120) * 50,
                            2)
                },

                new RiskFactorDto
                {
                    Factor = "24-hour Rainfall",
                    Value = x.Rainfall24h,
                    Impact =
                        GetImpact(
                            x.Rainfall24h,
                            150,
                            250),
                    Contribution =
                        Math.Round(
                            Normalize(
                                x.Rainfall24h,
                                250) * 20,
                            2)
                }
            },

            "Heatwave" => new()
            {
                new RiskFactorDto
                {
                    Factor = "Temperature",
                    Value = x.Temperature,
                    Impact =
                        GetImpact(
                            x.Temperature,
                            35,
                            40),
                    Contribution =
                        Math.Round(
                            Normalize(
                                x.Temperature,
                                45) * 65,
                            2)
                }
            },

            "Earthquake" => new()
            {
                new RiskFactorDto
                {
                    Factor = "GDACS Earthquake Events",
                    Value =
                        x.ExternalEvents.Count(e =>
                            e.EventType.Equals(
                                "EQ",
                                StringComparison.OrdinalIgnoreCase)),
                    Impact = "Real Event Feed",
                    Contribution =
                        Math.Min(
                            x.ExternalEvents.Count(e =>
                                e.EventType.Equals(
                                    "EQ",
                                    StringComparison.OrdinalIgnoreCase)) * 10,
                            100)
                }
            },

            "Tsunami" => new()
            {
                new RiskFactorDto
                {
                    Factor = "GDACS Tsunami Events",
                    Value =
                        x.ExternalEvents.Count(e =>
                            e.EventType.Equals(
                                "TS",
                                StringComparison.OrdinalIgnoreCase)),
                    Impact = "Real Event Feed",
                    Contribution =
                        100
                }
            },

            "Volcanic Eruption" => new()
            {
                new RiskFactorDto
                {
                    Factor = "GDACS Volcano Events",
                    Value =
                        x.ExternalEvents.Count(e =>
                            e.EventType.Equals(
                                "VO",
                                StringComparison.OrdinalIgnoreCase)),
                    Impact = "Real Event Feed",
                    Contribution =
                        100
                }
            },

            "Drought" => new()
            {
                new RiskFactorDto
                {
                    Factor = "24-hour Rainfall",
                    Value = x.Rainfall24h,
                    Impact = x.Rainfall24h <= 0 ? "No Data" : "Dryness Indicator",
                    Contribution = Math.Round(
                        (1 - Normalize(x.Rainfall24h, 250)) * 35, 2)
                },

                new RiskFactorDto
                {
                    Factor = "Forecast Rainfall",
                    Value = x.ForecastRainfall,
                    Impact = x.ForecastRainfall <= 0 ? "No Data" : "Dryness Indicator",
                    Contribution = Math.Round(
                        (1 - Normalize(x.ForecastRainfall, 200)) * 20, 2)
                },

                new RiskFactorDto
                {
                    Factor = "Temperature",
                    Value = x.Temperature,
                    Impact = "Heat Indicator",
                    Contribution = Math.Round(
                        Normalize(x.Temperature, 45) * 20, 2)
                },

                new RiskFactorDto
                {
                    Factor = "Humidity",
                    Value = x.Humidity,
                    Impact = "Moisture Indicator",
                    Contribution = Math.Round(
                        (1 - Normalize(x.Humidity, 100)) * 10, 2)
                },

                new RiskFactorDto
                {
                    Factor = "Soil Moisture",
                    Value = x.SoilMoisture,
                    Impact = x.SoilMoisture <= 0 ? "No Data" : "Dryness Indicator",
                    Contribution = Math.Round(
                        (1 - Normalize(x.SoilMoisture, 1.0)) * 15, 2)
                }
            },

            "Wildfire / Forest Fire" => new()
            {
                new RiskFactorDto
                {
                    Factor = "Temperature",
                    Value = x.Temperature,
                    Impact = x.Temperature <= 30
                        ? "Low"
                        : x.Temperature < 40
                            ? "High"
                            : "Very High",
                    Contribution = Math.Round(
                        Math.Max(
                            0,
                            (x.Temperature - 30) / 15) * 30,
                        2)
                },
                new RiskFactorDto
                {
                    Factor = "Humidity",
                    Value = x.Humidity,
                    Impact = x.Humidity <= 30
                        ? "Very Dry"
                        : x.Humidity <= 50
                            ? "Dry"
                            : "Moderate",
                    Contribution = Math.Round(
                        (1 - Normalize(x.Humidity, 100)) * 30,
                        2)
                },
                new RiskFactorDto
                {
                    Factor = "1-hour Rainfall",
                    Value = x.Rainfall1h,
                    Impact = x.Rainfall1h <= 0
                        ? "No Data"
                        : "Rainfall Indicator",
                    Contribution = Math.Round(
                        (1 - Normalize(x.Rainfall1h, 10)) * 25,
                        2)
                },
                new RiskFactorDto
                {
                    Factor = "Wind Speed",
                    Value = x.WindSpeed,
                    Impact = GetImpact(x.WindSpeed, 60, 100),
                    Contribution = Math.Round(
                        Normalize(x.WindSpeed, 120) * 15,
                        2)
                }
            },

            _ => new()
            {
                new RiskFactorDto
                {
                    Factor = "Available Environmental Data",
                    Value = 1,
                    Impact = "Available",
                    Contribution = 0
                }
            }
        };
    }

    private static List<string> BuildRecommendations(
        string disasterType,
        string riskLevel)
    {
        if (riskLevel == "Critical")
        {
            return disasterType switch
            {
                "Flood" => new()
                {
                    "Initiate emergency flood response",
                    "Prepare evacuation resources",
                    "Issue immediate flood warning"
                },

                "Landslide" => new()
                {
                    "Restrict access to unstable slopes",
                    "Prepare evacuation resources",
                    "Issue landslide warning"
                },

                "Storm / Cyclone" => new()
                {
                    "Activate severe weather response",
                    "Secure exposed infrastructure",
                    "Prepare evacuation resources"
                },

                "Earthquake" => new()
                {
                    "Activate earthquake response procedures",
                    "Assess structural safety",
                    "Prepare emergency resources"
                },

                "Tsunami" => new()
                {
                    "Follow official tsunami warnings",
                    "Move to designated safe areas",
                    "Activate emergency coordination"
                },

                "Wildfire / Forest Fire" => new()
                {
                    "Activate fire response readiness",
                    "Protect vulnerable areas",
                    "Prepare evacuation resources"
                },

                "Drought" => new()
                {
                    "Monitor water availability",
                    "Prepare water conservation measures",
                    "Review drought response readiness"
                },

                "Heatwave" => new()
                {
                    "Issue heat health guidance",
                    "Check vulnerable populations",
                    "Prepare cooling and hydration resources"
                },

                "Volcanic Eruption" => new()
                {
                    "Follow official volcanic warnings",
                    "Prepare evacuation resources",
                    "Monitor official emergency instructions"
                },

                _ => new()
                {
                    "Activate emergency response",
                    "Assess affected areas",
                    "Prepare emergency resources"
                }
            };
        }

        if (riskLevel == "High")
        {
            return new()
            {
                $"Increase monitoring for {disasterType}",
                "Prepare response resources",
                "Review emergency readiness"
            };
        }

        if (riskLevel == "Medium")
        {
            return new()
            {
                $"Continue monitoring for {disasterType}",
                "Review local preparedness"
            };
        }

        return new()
        {
            "Continue routine monitoring"
        };
    }

    private static string GetRiskLevel(
        double score)
    {
        return score >= 75
            ? "Critical"
            : score >= 50
                ? "High"
                : score >= 25
                    ? "Medium"
                    : "Low";
    }

    private static double Normalize(
        double value,
        double maximum)
    {
        if (maximum <= 0)
            return 0;

        return Math.Clamp(
            value / maximum,
            0,
            1);
    }

    private static string GetImpact(
        double value,
        double medium,
        double high)
    {
        if (value >= high)
            return "Very High";

        if (value >= medium)
            return "High";

        return "Moderate";
    }

    private static ExternalDisasterEventDto? GetNearestEvent(
        RiskPredictionDto prediction,
        List<ExternalDisasterEventDto> events)
    {
        if (!prediction.Latitude.HasValue ||
            !prediction.Longitude.HasValue)
        {
            return null;
        }

        return events
            .Where(e =>
                e.Latitude.HasValue &&
                e.Longitude.HasValue)
            .Select(e => new
            {
                Event = e,
                Distance =
                    CalculateDistanceKm(
                        prediction.Latitude,
                        prediction.Longitude,
                        e.Latitude,
                        e.Longitude)
            })
            .OrderBy(x => x.Distance)
            .Select(x => new ExternalDisasterEventDto {
                EventType =
                    x.Event.EventType,
                EventId =
                    x.Event.EventId,
                Name =
                    x.Event.Name,
                AlertLevel =
                    x.Event.AlertLevel,
                Latitude =
                    x.Event.Latitude,
                Longitude = x.Event.Longitude,
                Magnitude = x.Event.Magnitude,
                DepthKm = x.Event.DepthKm
            })
            .FirstOrDefault();
    }

    private static double CalculateDistanceKm(
        double? lat1,
        double? lon1,
        double? lat2,
        double? lon2)
    {
        if (!lat1.HasValue ||
            !lon1.HasValue ||
            !lat2.HasValue ||
            !lon2.HasValue)
        {
            return double.MaxValue;
        }

        const double earthRadiusKm =
            6371.0;

        var dLat =
            DegreesToRadians(
                lat2.Value - lat1.Value);

        var dLon =
            DegreesToRadians(
                lon2.Value - lon1.Value);

        var a =
            Math.Sin(dLat / 2) *
            Math.Sin(dLat / 2) +
            Math.Cos(
                DegreesToRadians(lat1.Value)) *
            Math.Cos(
                DegreesToRadians(lat2.Value)) *
            Math.Sin(dLon / 2) *
            Math.Sin(dLon / 2);

        var c =
            2 *
            Math.Atan2(
                Math.Sqrt(a),
                Math.Sqrt(1 - a));

        return earthRadiusKm * c;
    }

    private static double DegreesToRadians(
        double degrees)
    {
        return degrees *
               Math.PI /
               180.0;
    }
}









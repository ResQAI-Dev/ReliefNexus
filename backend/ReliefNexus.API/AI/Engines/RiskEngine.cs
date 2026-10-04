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
        var requestedDisasterType =
            NormalizeDisasterType(x.DisasterType);

        DisasterRiskDto? primary = null;

        // If the request specifies a disaster type, use that
        // disaster type only when real data is available.
        if (!string.IsNullOrWhiteSpace(requestedDisasterType))
        {
            primary = risks.FirstOrDefault(r =>
                string.Equals(
                    NormalizeDisasterType(r.DisasterType),
                    requestedDisasterType,
                    StringComparison.OrdinalIgnoreCase) &&
                r.DataAvailable &&
                r.RiskScore.HasValue);
        }

        // If no disaster type was specified, or the requested
        // disaster type has no available data, use the highest
        // available real disaster risk.
        if (primary == null)
        {
            primary = risks
                .Where(r =>
                    r.DataAvailable &&
                    r.RiskScore.HasValue)
                .OrderByDescending(r =>
                    r.RiskScore!.Value)
                .FirstOrDefault();
        }

        // Only return DataUnavailable when there is genuinely
        // no usable disaster-risk data at all.
        if (primary == null)
        {
            return CreateNoDataResult(x, risks);
        }

        var primaryScore =
            primary.RiskScore ?? 0;

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
                "v4.0-EvidenceFusion-MultiSource",

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

    private static DisasterRiskDto CalculateFlood(RiskPredictionDto x)
    {
        var parts = new List<(double score, double weight)>();
        if (x.Rainfall1h > 0) parts.Add((Normalize(x.Rainfall1h, 50) * 100, 15));
        if (x.Rainfall24h > 0) parts.Add((Normalize(x.Rainfall24h, 250) * 100, 25));
        if (x.Rainfall72h > 0) parts.Add((Normalize(x.Rainfall72h, 400) * 100, 15));
        if (x.ForecastRainfall24h > 0) parts.Add((Normalize(x.ForecastRainfall24h, 200) * 100, 15));
        if (x.RiverLevel > 0) parts.Add((Normalize(x.RiverLevel, 6) * 100, 20));
        if (x.SoilMoisture > 0) parts.Add((Normalize(x.SoilMoisture, 0.6) * 100, 10));
        if (parts.Count == 0 && x.SriLankaFloodAlertScore <= 0) return UnavailableRisk("Flood", "Insufficient flood observations");
        return AvailableRisk("Flood", FuseOfficialAlert(Weighted(parts), x.SriLankaFloodAlertScore, 0.25), BuildSource(x, "Flood"));
    }

    private static DisasterRiskDto CalculateLandslide(RiskPredictionDto x)
    {
        var parts = new List<(double score, double weight)>();
        if (x.Rainfall24h > 0) parts.Add((Normalize(x.Rainfall24h, 150) * 100, 20));
        if (x.Rainfall72h > 0) parts.Add((Normalize(x.Rainfall72h, 300) * 100, 25));
        if (x.ForecastRainfall24h > 0) parts.Add((Normalize(x.ForecastRainfall24h, 120) * 100, 20));
        if (x.SoilMoisture > 0) parts.Add((Normalize(x.SoilMoisture, 0.55) * 100, 15));
        if (x.Elevation > 0) parts.Add((Normalize(x.Elevation, 1200) * 100, 5));
        if (parts.Count == 0 && x.SriLankaLandslideAlertScore <= 0) return UnavailableRisk("Landslide", "Insufficient rainfall/terrain evidence");
        return AvailableRisk("Landslide", FuseOfficialAlert(Weighted(parts), x.SriLankaLandslideAlertScore, 0.35), BuildSource(x, "Landslide"));
    }

    private static DisasterRiskDto CalculateStorm(RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable && x.SriLankaWeatherAlertScore <= 0) return UnavailableRisk("Storm / Cyclone", "Weather and official warning data unavailable");
        var baseScore = Normalize(x.WindSpeed, 120) * 40 + Normalize(x.Rainfall1h, 25) * 20 + Normalize(x.ForecastRainfall24h, 100) * 20 + Normalize(x.Humidity, 100) * 20;
        return AvailableRisk("Storm / Cyclone", FuseOfficialAlert(baseScore, x.SriLankaWeatherAlertScore, 0.30), BuildSource(x, "Storm"));
    }

    private static DisasterRiskDto CalculateDrought(RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable) return UnavailableRisk("Drought", "Open-Meteo weather data unavailable");
        var rainfall72Stress = 1 - Normalize(x.Rainfall72h, 120);
        var forecastStress = 1 - Normalize(x.ForecastRainfall24h, 80);
        var soilStress = x.SoilMoisture > 0 ? 1 - Normalize(x.SoilMoisture, 0.45) : 0.5;
        var etDemand = Normalize(x.ReferenceEvapotranspiration24h, 6);
        var vpdStress = Normalize(x.VapourPressureDeficit, 2.0);
        var heatStress = Math.Clamp((x.Temperature3hAverage - 25) / 12.0, 0, 1);
        var humidityStress = 1 - Normalize(x.Humidity3hAverage > 0 ? x.Humidity3hAverage : x.Humidity, 100);
        var baseScore = rainfall72Stress * 25 + forecastStress * 20 + soilStress * 20 + etDemand * 15 + vpdStress * 10 + heatStress * 5 + humidityStress * 5;
        return AvailableRisk("Drought", FuseOfficialAlert(baseScore, x.SriLankaDroughtAlertScore, 0.20), BuildSource(x, "Drought"));
    }

    private static DisasterRiskDto CalculateWildfire(RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable) return UnavailableRisk("Wildfire / Forest Fire", "Open-Meteo weather data unavailable");
        var heat = Math.Clamp((x.Temperature - 25) / 15.0, 0, 1);
        var humidityDryness = 1 - Normalize(x.Humidity, 100);
        var rainfallDryness = 1 - Normalize(x.Rainfall72h, 120);
        var etDemand = Normalize(x.ReferenceEvapotranspiration24h, 6);
        var vpd = Normalize(x.VapourPressureDeficit, 2);
        var wind = Normalize(x.WindSpeed, 100);
        var score = heat * 20 + humidityDryness * 20 + rainfallDryness * 20 + etDemand * 15 + vpd * 15 + wind * 10;
        return AvailableRisk("Wildfire / Forest Fire", score, BuildSource(x, "Wildfire"));
    }

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

    private static DisasterRiskDto CalculateLightning(RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable) return UnavailableRisk("Lightning", "Open-Meteo weather data unavailable");
        var rainfall = Normalize(x.Rainfall3h, 50);
        var forecast = Normalize(x.ForecastRainfall24h, 100);
        var humidity = Normalize(x.Humidity, 100);
        var wind = Normalize(x.WindSpeed, 100);
        var thunderstormCode = x.WeatherCode is 95 or 96 or 99 ? 1.0 : 0.0;
        var score = rainfall * 25 + forecast * 15 + humidity * 15 + wind * 10 + thunderstormCode * 35;
        return AvailableRisk("Lightning", score, BuildSource(x, "Lightning"));
    }

    private static DisasterRiskDto CalculateHeatwave(RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable) return UnavailableRisk("Heatwave", "Open-Meteo weather data unavailable");
        var temp = Math.Clamp((Math.Max(x.Temperature, x.Temperature3hAverage) - 30) / 10.0, 0, 1);
        var humidity = 1 - Normalize(x.Humidity, 100);
        var rainfall = 1 - Normalize(x.Rainfall24h, 80);
        var persistence = Math.Clamp((x.Temperature3hAverage - 28) / 8.0, 0, 1);
        var score = temp * 55 + humidity * 15 + rainfall * 10 + persistence * 20;
        return AvailableRisk("Heatwave", score, BuildSource(x, "Heatwave"));
    }

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

    private static DisasterRiskDto CalculateColdWave(RiskPredictionDto x)
    {
        if (!x.WeatherDataAvailable) return UnavailableRisk("Extreme Cold / Cold Wave", "Open-Meteo weather data unavailable");
        var temp = Math.Min(x.Temperature, x.Temperature3hAverage > 0 ? x.Temperature3hAverage : x.Temperature);
        var score = temp <= 5 ? 95 : temp <= 10 ? 75 : temp <= 15 ? 45 : temp <= 20 ? 15 : 0;
        return AvailableRisk("Extreme Cold / Cold Wave", score, BuildSource(x, "Cold Wave"));
    }

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
                "v4.0-EvidenceFusion-MultiSource",

            RequiresHumanApproval = false,
            IsApproved = false,
            ApprovalStatus = "NotRequired"
        };
    }

    private static double CalculateConfidence(RiskPredictionDto x, DisasterRiskDto primary)
    {
        var score = 35.0;
        if (x.Latitude.HasValue && x.Longitude.HasValue) score += 10;
        if (x.WeatherDataAvailable) score += 20;
        if (x.Rainfall72h > 0 || x.ForecastRainfall24h > 0) score += 10;
        if (x.SoilMoistureDataAvailable) score += 5;
        if (x.ExternalEvents.Count > 0) score += 10;
        if (x.SriLankaRelevantAlertCount > 0) score += 10;
        if (primary.DataAvailable) score += 5;
        return Math.Clamp(score, 0, 100);
    }

    private static string BuildPredictionSource(RiskPredictionDto x)
    {
        var sources = new List<string>();
        if (x.WeatherDataAvailable) sources.Add("Open-Meteo");
        if (x.SriLankaRelevantAlertCount > 0) sources.Add("RISE Sri Lanka");
        if (x.ExternalEvents.Any(e => !e.EventType.StartsWith("SRI_LANKA_", StringComparison.OrdinalIgnoreCase) && !e.EventType.StartsWith("NBRO_", StringComparison.OrdinalIgnoreCase))) sources.Add("GDACS");
        sources.Add("Risk Prediction Agent");
        return string.Join(" + ", sources.Distinct());
    }

    private static List<RiskFactorDto> BuildRiskFactors(
        RiskPredictionDto x,
        string disasterType)
    {
        double C(double value, double weight) => Math.Round(value * weight, 2);
        double Dry(double value, double max) => 1 - Normalize(Math.Max(0, value), max);

        return disasterType switch
        {
            "Flood" => new()
            {
                Factor("1h rainfall", x.Rainfall1h, C(Normalize(x.Rainfall1h, 50), 15), "Short-term intensity"),
                Factor("24h rainfall", x.Rainfall24h, C(Normalize(x.Rainfall24h, 250), 25), "Accumulation"),
                Factor("72h rainfall", x.Rainfall72h, C(Normalize(x.Rainfall72h, 400), 15), "Antecedent wetness"),
                Factor("24h forecast rainfall", x.ForecastRainfall24h, C(Normalize(x.ForecastRainfall24h, 200), 15), "Forecast load"),
                Factor("River level", x.RiverLevel, C(Normalize(x.RiverLevel, 6), 20), "River condition"),
                Factor("Official flood alert", x.SriLankaFloodAlertScore, x.SriLankaFloodAlertScore, "RISE Sri Lanka")
            },
            "Landslide" => new()
            {
                Factor("24h rainfall", x.Rainfall24h, C(Normalize(x.Rainfall24h, 150), 20), "Trigger rainfall"),
                Factor("72h rainfall", x.Rainfall72h, C(Normalize(x.Rainfall72h, 300), 25), "Antecedent rainfall"),
                Factor("24h forecast rainfall", x.ForecastRainfall24h, C(Normalize(x.ForecastRainfall24h, 120), 20), "Expected additional loading"),
                Factor("Soil moisture", x.SoilMoisture, C(Normalize(x.SoilMoisture, 0.55), 15), "Ground wetness"),
                Factor("Elevation", x.Elevation, C(Normalize(x.Elevation, 1200), 5), "Terrain proxy"),
                Factor("Official NBRO/RISE alert", x.SriLankaLandslideAlertScore, x.SriLankaLandslideAlertScore, "Official warning evidence")
            },
            "Drought" => new()
            {
                Factor("72h rainfall deficit", Dry(x.Rainfall72h, 120), Math.Round(Dry(x.Rainfall72h, 120) * 25, 2), "Multi-day dryness"),
                Factor("24h forecast rainfall deficit", Dry(x.ForecastRainfall24h, 80), Math.Round(Dry(x.ForecastRainfall24h, 80) * 20, 2), "Near-term relief"),
                Factor("Soil moisture deficit", x.SoilMoisture > 0 ? Dry(x.SoilMoisture, 0.45) : 0.5, Math.Round((x.SoilMoisture > 0 ? Dry(x.SoilMoisture, 0.45) : 0.5) * 20, 2), "Root-zone water availability"),
                Factor("ET0 water demand", x.ReferenceEvapotranspiration24h, Math.Round(Normalize(x.ReferenceEvapotranspiration24h, 6) * 15, 2), "Atmospheric water demand"),
                Factor("Vapour pressure deficit", x.VapourPressureDeficit, Math.Round(Normalize(x.VapourPressureDeficit, 2) * 10, 2), "Atmospheric dryness"),
                Factor("Heat stress", x.Temperature3hAverage, Math.Round(Math.Clamp((x.Temperature3hAverage - 25) / 12.0, 0, 1) * 5, 2), "3h temperature stress"),
                Factor("Humidity dryness", x.Humidity3hAverage > 0 ? x.Humidity3hAverage : x.Humidity, Math.Round((1 - Normalize(x.Humidity3hAverage > 0 ? x.Humidity3hAverage : x.Humidity, 100)) * 5, 2), "Low-humidity stress"),
                Factor("Official drought alert", x.SriLankaDroughtAlertScore, x.SriLankaDroughtAlertScore, "Official warning evidence")
            },
            "Storm / Cyclone" => new()
            {
                Factor("Wind speed", x.WindSpeed, C(Normalize(x.WindSpeed, 120), 40), "Wind hazard"),
                Factor("1h rainfall", x.Rainfall1h, C(Normalize(x.Rainfall1h, 25), 20), "Short-term precipitation"),
                Factor("24h forecast rainfall", x.ForecastRainfall24h, C(Normalize(x.ForecastRainfall24h, 100), 20), "Forecast precipitation"),
                Factor("Humidity", x.Humidity, C(Normalize(x.Humidity, 100), 20), "Atmospheric moisture"),
                Factor("Official weather alert", x.SriLankaWeatherAlertScore, x.SriLankaWeatherAlertScore, "Official warning evidence")
            },
            "Wildfire / Forest Fire" => new()
            {
                Factor("Heat stress", x.Temperature, Math.Round(Math.Clamp((x.Temperature - 25) / 15.0, 0, 1) * 20, 2), "Temperature"),
                Factor("Humidity dryness", x.Humidity, Math.Round((1 - Normalize(x.Humidity, 100)) * 20, 2), "Dry air"),
                Factor("72h rainfall dryness", x.Rainfall72h, Math.Round(Dry(x.Rainfall72h, 120) * 20, 2), "Recent rainfall deficit"),
                Factor("ET0 demand", x.ReferenceEvapotranspiration24h, Math.Round(Normalize(x.ReferenceEvapotranspiration24h, 6) * 15, 2), "Evaporative demand"),
                Factor("VPD", x.VapourPressureDeficit, Math.Round(Normalize(x.VapourPressureDeficit, 2) * 15, 2), "Atmospheric dryness")
            },
            "Lightning" => new()
            {
                Factor("3h rainfall", x.Rainfall3h, Math.Round(Normalize(x.Rainfall3h, 50) * 25, 2), "Convective precipitation"),
                Factor("24h forecast rainfall", x.ForecastRainfall24h, Math.Round(Normalize(x.ForecastRainfall24h, 100) * 15, 2), "Forecast convection"),
                Factor("Humidity", x.Humidity, Math.Round(Normalize(x.Humidity, 100) * 15, 2), "Moisture"),
                Factor("Weather code", x.WeatherCode, x.WeatherCode is 95 or 96 or 99 ? 35 : 0, "Thunderstorm code evidence")
            },
            "Heatwave" => new()
            {
                Factor("Peak temperature stress", x.Temperature, Math.Round(Math.Clamp((x.Temperature - 30) / 10.0, 0, 1) * 55, 2), "Temperature"),
                Factor("Humidity dryness", x.Humidity, Math.Round((1 - Normalize(x.Humidity, 100)) * 15, 2), "Dry-air stress"),
                Factor("Rainfall deficit", x.Rainfall24h, Math.Round((1 - Normalize(x.Rainfall24h, 80)) * 10, 2), "Cooling by precipitation"),
                Factor("3h persistence", x.Temperature3hAverage, Math.Round(Math.Clamp((x.Temperature3hAverage - 28) / 8.0, 0, 1) * 20, 2), "Recent heat persistence")
            },
            "Earthquake" => new()
            {
                Factor("Relevant GDACS events", x.ExternalEvents.Count(e => e.EventType.Equals("EQ", StringComparison.OrdinalIgnoreCase)), 100, "External event feed")
            },
            "Tsunami" => new()
            {
                Factor("Relevant tsunami events", x.ExternalEvents.Count(e => e.EventType.Equals("TS", StringComparison.OrdinalIgnoreCase)), 100, "External event feed")
            },
            "Volcanic Eruption" => new()
            {
                Factor("Relevant volcanic events", x.ExternalEvents.Count(e => e.EventType.Equals("VO", StringComparison.OrdinalIgnoreCase)), 100, "External event feed")
            },
            "Extreme Cold / Cold Wave" => new()
            {
                Factor("Temperature", x.Temperature, x.Temperature <= 5 ? 95 : x.Temperature <= 10 ? 75 : x.Temperature <= 15 ? 45 : x.Temperature <= 20 ? 15 : 0, "Cold stress")
            },
            _ => new()
            {
                Factor("Available environmental evidence", 1, 0, "Multi-source")
            }
        };
    }

    private static RiskFactorDto Factor(string name, double value, double contribution, string impact)
    {
        return new RiskFactorDto
        {
            Factor = name,
            Value = Math.Round(value, 3),
            Contribution = Math.Round(contribution, 2),
            Impact = impact
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

    private static double Weighted(List<(double score, double weight)> parts)
    {
        var weight = parts.Sum(x => x.weight);
        return weight <= 0 ? 0 : parts.Sum(x => x.score * x.weight) / weight;
    }

    private static double FuseOfficialAlert(double baseScore, double alertScore, double alertWeight)
    {
        if (alertScore <= 0)
            return Math.Clamp(baseScore, 0, 100);

        var fused =
            baseScore <= 0
                ? alertScore
                : baseScore * (1 - alertWeight) + alertScore * alertWeight;

        // Official alert levels are evidence overrides, not arbitrary
        // multipliers. A verified red/orange/yellow warning establishes a
        // minimum readiness floor while preserving the local sensor score.
        if (alertScore >= 90) fused = Math.Max(fused, 80);
        else if (alertScore >= 70) fused = Math.Max(fused, 60);
        else if (alertScore >= 45) fused = Math.Max(fused, 40);

        return Math.Clamp(fused, 0, 100);
    }

    private static string BuildSource(RiskPredictionDto x, string hazard)
    {
        var parts = new List<string>();
        if (x.WeatherDataAvailable) parts.Add("Open-Meteo");
        if (x.SriLankaRelevantAlertCount > 0) parts.Add("RISE Sri Lanka");
        if (x.ExternalEvents.Any(e => e.EventType.Equals("EQ", StringComparison.OrdinalIgnoreCase) || e.EventType.Equals("TS", StringComparison.OrdinalIgnoreCase) || e.EventType.Equals("VO", StringComparison.OrdinalIgnoreCase))) parts.Add("GDACS");
        return parts.Count == 0 ? "Risk Prediction Agent" : string.Join(" + ", parts.Distinct());
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

    private static string NormalizeDisasterType(
        string? disasterType)
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











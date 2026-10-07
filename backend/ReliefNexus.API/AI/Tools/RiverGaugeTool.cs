using System.Globalization;
using System.Text.Json;

namespace ReliefNexus.API.AI.Tools;

public sealed class RiverGaugeTool
{
    private const string GaugeLayerUrl =
        "https://services3.arcgis.com/J7ZFXmR8rSmQ3FGf/arcgis/rest/services/gauges_2_view/FeatureServer/0";

    private const double MaxDistanceKm = 50.0;

    private readonly HttpClient _httpClient;
    private readonly ILogger<RiverGaugeTool> _logger;

    public RiverGaugeTool(
        HttpClient httpClient,
        ILogger<RiverGaugeTool> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _httpClient.Timeout =
            TimeSpan.FromSeconds(30);

        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.TryAddWithoutValidation(
                "User-Agent",
                "ReliefNexus/1.0");
        }
    }

    // ============================================================
    // GET NEAREST LIVE RIVER GAUGE
    // ============================================================

    public async Task<RiverGaugeReading?> GetNearestGaugeAsync(
        double latitude,
        double longitude)
    {
        try
        {
            if (!IsValidCoordinate(
                    latitude,
                    longitude))
            {
                _logger.LogWarning(
                    "[RIVER] Invalid coordinates: {Latitude}, {Longitude}",
                    latitude,
                    longitude);

                return null;
            }

            var queryUrl =
                GaugeLayerUrl +
                "/query" +
                "?where=1%3D1" +
                "&outFields=*" +
                "&returnGeometry=true" +
                "&resultRecordCount=2000" +
                "&f=json";

            _logger.LogInformation(
                "[RIVER] Querying official gauges_2_view for {Latitude}, {Longitude}",
                latitude,
                longitude);

            using var response =
                await _httpClient.GetAsync(queryUrl);

            var body =
                await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "[RIVER] HTTP {StatusCode}: {Body}",
                    (int)response.StatusCode,
                    Shorten(body));

                return null;
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                _logger.LogWarning(
                    "[RIVER] Empty ArcGIS response.");

                return null;
            }

            using var document =
                JsonDocument.Parse(body);

            var root =
                document.RootElement;

            if (root.TryGetProperty(
                    "error",
                    out var errorElement))
            {
                _logger.LogWarning(
                    "[RIVER] ArcGIS error: {Error}",
                    errorElement);

                return null;
            }

            if (!root.TryGetProperty(
                    "features",
                    out var features) ||
                features.ValueKind !=
                    JsonValueKind.Array)
            {
                _logger.LogWarning(
                    "[RIVER] No gauge features returned.");

                return null;
            }

            _logger.LogInformation(
                "[RIVER] Gauge records returned: {Count}",
                features.GetArrayLength());

            RiverGaugeReading? nearest = null;

            foreach (var feature in
                     features.EnumerateArray())
            {
                if (!feature.TryGetProperty(
                        "attributes",
                        out var attributes))
                {
                    continue;
                }

                // ------------------------------------------------
                // REAL CURRENT WATER LEVEL
                // ------------------------------------------------

                var waterLevel =
                    GetFirstAvailableDouble(
                        attributes,
                        "water_level",
                        "waterlevel",
                        "WaterLevel",
                        "RiverLevel",
                        "river_level",
                        "level");

                // No actual live level -> skip.
                if (!waterLevel.HasValue)
                {
                    continue;
                }

                // ------------------------------------------------
                // GAUGE COORDINATES
                // ------------------------------------------------

                if (!TryGetCoordinates(
                        feature,
                        attributes,
                        out var gaugeLatitude,
                        out var gaugeLongitude))
                {
                    continue;
                }

                // ------------------------------------------------
                // STATION
                // ------------------------------------------------

                var station =
                    GetFirstAvailableString(
                        attributes,
                        "station_name",
                        "station",
                        "StationName",
                        "Station",
                        "gauge",
                        "Gauge",
                        "name");

                if (string.IsNullOrWhiteSpace(station))
                {
                    station = "Unknown Gauge";
                }

                // ------------------------------------------------
                // BASIN
                // ------------------------------------------------

                var basin =
                    GetFirstAvailableString(
                        attributes,
                        "basin",
                        "Basin");

                // ------------------------------------------------
                // UNIT
                // ------------------------------------------------

                var unit =
                    GetFirstAvailableString(
                        attributes,
                        "Unit",
                        "unit",
                        "water_level_unit");

                // ------------------------------------------------
                // CONVERT FT -> METRE
                // ------------------------------------------------

                var levelMeters =
                    waterLevel.Value;

                if (unit.Contains(
                        "ft",
                        StringComparison.OrdinalIgnoreCase))
                {
                    levelMeters *= 0.3048;
                }

                // ------------------------------------------------
                // OPTIONAL FLOW
                // ------------------------------------------------

                var flow =
                    GetFirstAvailableDouble(
                        attributes,
                        "flow",
                        "river_flow",
                        "RiverFlow",
                        "discharge",
                        "Discharge",
                        "flow_cms",
                        "discharge_cms");

                // ------------------------------------------------
                // DISTANCE
                // ------------------------------------------------

                var distanceKm =
                    CalculateDistanceKm(
                        latitude,
                        longitude,
                        gaugeLatitude,
                        gaugeLongitude);

                if (distanceKm >
                    MaxDistanceKm)
                {
                    continue;
                }

                var candidate =
                    new RiverGaugeReading
                    {
                        StationName =
                            station.Trim(),

                        Basin =
                            basin.Trim(),

                        RiverLevel =
                            levelMeters,

                        RiverFlow =
                            flow,

                        GaugeLatitude =
                            gaugeLatitude,

                        GaugeLongitude =
                            gaugeLongitude,

                        DistanceKm =
                            distanceKm,

                        Source =
                            "Sri Lanka DMC gauges_2_view"
                    };

                _logger.LogInformation(
                    "[RIVER] Candidate | " +
                    "Station={Station} | " +
                    "Level={Level:F2} m | " +
                    "Flow={Flow} | " +
                    "Distance={Distance:F2} km | " +
                    "Basin={Basin}",
                    candidate.StationName,
                    candidate.RiverLevel,
                    candidate.RiverFlow?.ToString(
                        CultureInfo.InvariantCulture)
                        ?? "Unavailable",
                    candidate.DistanceKm,
                    candidate.Basin);

                if (nearest == null ||
                    candidate.DistanceKm <
                    nearest.DistanceKm)
                {
                    nearest =
                        candidate;
                }
            }

            if (nearest == null)
            {
                _logger.LogWarning(
                    "[RIVER] No live gauge found within {Distance} km.",
                    MaxDistanceKm);

                return null;
            }

            _logger.LogInformation(
                "[RIVER] SELECTED GAUGE | " +
                "Station={Station} | " +
                "Level={Level:F2} m | " +
                "Flow={Flow} | " +
                "Distance={Distance:F2} km | " +
                "Basin={Basin}",
                nearest.StationName,
                nearest.RiverLevel,
                nearest.RiverFlow?.ToString(
                    CultureInfo.InvariantCulture)
                    ?? "Unavailable",
                nearest.DistanceKm,
                nearest.Basin);

            return nearest;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(
                ex,
                "[RIVER] Request timed out.");

            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(
                ex,
                "[RIVER] HTTP request failed.");

            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(
                ex,
                "[RIVER] Invalid JSON response.");

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "[RIVER] Unexpected error.");

            return null;
        }
    }

    // ============================================================
    // COORDINATES
    // ============================================================

    private static bool TryGetCoordinates(
        JsonElement feature,
        JsonElement attributes,
        out double latitude,
        out double longitude)
    {
        latitude = 0;
        longitude = 0;

        // Try ArcGIS geometry first.
        if (feature.TryGetProperty(
                "geometry",
                out var geometry) &&
            geometry.ValueKind ==
                JsonValueKind.Object)
        {
            if (geometry.TryGetProperty(
                    "x",
                    out var xElement) &&
                geometry.TryGetProperty(
                    "y",
                    out var yElement) &&
                TryGetDouble(
                    xElement,
                    out var x) &&
                TryGetDouble(
                    yElement,
                    out var y))
            {
                longitude = x;
                latitude = y;

                if (IsValidCoordinate(
                        latitude,
                        longitude))
                {
                    return true;
                }
            }
        }

        // Fallback to latitude/longitude attributes.
        var lat =
            GetFirstAvailableDouble(
                attributes,
                "latitude",
                "lat");

        var lon =
            GetFirstAvailableDouble(
                attributes,
                "longitude",
                "lon",
                "lng");

        if (lat.HasValue &&
            lon.HasValue &&
            IsValidCoordinate(
                lat.Value,
                lon.Value))
        {
            latitude =
                lat.Value;

            longitude =
                lon.Value;

            return true;
        }

        return false;
    }

    // ============================================================
    // NUMBER HELPERS
    // ============================================================

    private static double? GetFirstAvailableDouble(
        JsonElement attributes,
        params string[] names)
    {
        foreach (var name in names)
        {
            var value =
                GetDouble(
                    attributes,
                    name);

            if (value.HasValue)
            {
                return value;
            }
        }

        return null;
    }

    private static double? GetDouble(
        JsonElement attributes,
        string name)
    {
        foreach (var property in
                 attributes.EnumerateObject())
        {
            if (!property.Name.Equals(
                    name,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (TryGetDouble(
                    property.Value,
                    out var value))
            {
                return value;
            }
        }

        return null;
    }

    // ------------------------------------------------------------
    // THIS WAS THE MISSING METHOD
    // ------------------------------------------------------------

    private static bool TryGetDouble(
        JsonElement element,
        out double value)
    {
        if (element.ValueKind ==
                JsonValueKind.Number &&
            element.TryGetDouble(
                out value))
        {
            return true;
        }

        if (element.ValueKind ==
                JsonValueKind.String &&
            double.TryParse(
                element.GetString(),
                NumberStyles.Any,
                CultureInfo.InvariantCulture,
                out value))
        {
            return true;
        }

        value = 0;
        return false;
    }

    // ============================================================
    // STRING HELPERS
    // ============================================================

    private static string GetFirstAvailableString(
        JsonElement attributes,
        params string[] names)
    {
        foreach (var name in names)
        {
            var value =
                GetString(
                    attributes,
                    name);

            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return string.Empty;
    }

    private static string GetString(
        JsonElement attributes,
        string name)
    {
        foreach (var property in
                 attributes.EnumerateObject())
        {
            if (!property.Name.Equals(
                    name,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return property.Value.ValueKind ==
                   JsonValueKind.String
                ? property.Value.GetString() ?? ""
                : property.Value.ToString();
        }

        return "";
    }

    // ============================================================
    // DISTANCE
    // ============================================================

    private static double CalculateDistanceKm(
        double lat1,
        double lon1,
        double lat2,
        double lon2)
    {
        const double earthRadiusKm =
            6371.0;

        var dLat =
            DegreesToRadians(
                lat2 - lat1);

        var dLon =
            DegreesToRadians(
                lon2 - lon1);

        var a =
            Math.Sin(dLat / 2) *
            Math.Sin(dLat / 2) +
            Math.Cos(
                DegreesToRadians(lat1)) *
            Math.Cos(
                DegreesToRadians(lat2)) *
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

    // ============================================================
    // VALIDATION
    // ============================================================

    private static bool IsValidCoordinate(
        double latitude,
        double longitude)
    {
        return latitude >= -90 &&
               latitude <= 90 &&
               longitude >= -180 &&
               longitude <= 180;
    }

    private static string Shorten(
        string value)
    {
        const int max = 500;

        if (string.IsNullOrEmpty(value))
        {
            return "";
        }

        return value.Length <= max
            ? value
            : value[..max];
    }
}

// ================================================================
// RESULT MODEL
// ================================================================

public sealed class RiverGaugeReading
{
    public string StationName { get; set; } = "";

    public string Basin { get; set; } = "";

    public double? RiverLevel { get; set; }

    public double? RiverFlow { get; set; }

    public double GaugeLatitude { get; set; }

    public double GaugeLongitude { get; set; }

    public double DistanceKm { get; set; }

    public string Source { get; set; } = "";
}

using System.Globalization;
using System.Text.Json;

namespace ReliefNexus.API.AI.Tools;

public sealed class DrainageDataTool
{
    private const string ArcGisRivers =
        "https://services3.arcgis.com/J7ZFXmR8rSmQ3FGf/arcgis/rest/services/rivers/FeatureServer/0";

    private readonly HttpClient _httpClient;
    private readonly ILogger<DrainageDataTool> _logger;

    public DrainageDataTool(
        HttpClient httpClient,
        ILogger<DrainageDataTool> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _httpClient.Timeout =
            TimeSpan.FromSeconds(40);

        _httpClient.DefaultRequestHeaders
            .TryAddWithoutValidation(
                "User-Agent",
                "ReliefNexus/1.0");
    }

    public async Task<double?> GetDrainageIndicatorAsync(
        double latitude,
        double longitude)
    {
        var arcgis =
            await GetArcGisIndicatorAsync(
                latitude,
                longitude);

        if (arcgis.HasValue)
        {
            return arcgis.Value;
        }

        return await GetOverpassIndicatorAsync(
            latitude,
            longitude);
    }

    // ============================================================
    // ARCGIS RIVER NETWORK
    // ============================================================

    private async Task<double?> GetArcGisIndicatorAsync(
        double latitude,
        double longitude)
    {
        try
        {
            var lat =
                latitude.ToString(
                    CultureInfo.InvariantCulture);

            var lon =
                longitude.ToString(
                    CultureInfo.InvariantCulture);

            var url =
                ArcGisRivers +
                "/query" +
                "?geometry=" +
                Uri.EscapeDataString(
                    $"{lon},{lat}") +
                "&geometryType=esriGeometryPoint" +
                "&inSR=4326" +
                "&spatialRel=esriSpatialRelIntersects" +
                "&distance=5000" +
                "&units=esriSRUnit_Meter" +
                "&outFields=*" +
                "&returnGeometry=true" +
                "&f=json";

            _logger.LogInformation(
                "[DRAINAGE] Querying ArcGIS rivers.");

            using var response =
                await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var body =
                await response.Content
                    .ReadAsStringAsync();

            using var doc =
                JsonDocument.Parse(body);

            var root =
                doc.RootElement;

            if (!root.TryGetProperty(
                    "features",
                    out var features) ||
                features.ValueKind !=
                    JsonValueKind.Array)
            {
                return null;
            }

            double totalLengthKm = 0;
            var featureCount = 0;

            foreach (var feature
                     in features.EnumerateArray())
            {
                if (!feature.TryGetProperty(
                        "geometry",
                        out var geometry))
                {
                    continue;
                }

                if (!geometry.TryGetProperty(
                        "paths",
                        out var paths) ||
                    paths.ValueKind !=
                        JsonValueKind.Array)
                {
                    continue;
                }

                foreach (var path
                         in paths.EnumerateArray())
                {
                    if (path.ValueKind !=
                        JsonValueKind.Array)
                    {
                        continue;
                    }

                    double? previousLat = null;
                    double? previousLon = null;

                    foreach (var point
                             in path.EnumerateArray())
                    {
                        if (point.ValueKind !=
                            JsonValueKind.Array ||
                            point.GetArrayLength() < 2)
                        {
                            continue;
                        }

                        if (!TryDouble(
                                point[0],
                                out var pointLon) ||
                            !TryDouble(
                                point[1],
                                out var pointLat))
                        {
                            continue;
                        }

                        if (previousLat.HasValue &&
                            previousLon.HasValue)
                        {
                            totalLengthKm +=
                                DistanceKm(
                                    previousLat.Value,
                                    previousLon.Value,
                                    pointLat,
                                    pointLon);
                        }

                        previousLat =
                            pointLat;

                        previousLon =
                            pointLon;
                    }
                }

                featureCount++;
            }

            if (featureCount == 0 ||
                totalLengthKm <= 0)
            {
                return null;
            }

            // 0-100 GIS drainage-network indicator.
            // 10 weighted km in the search zone = 100.
            var indicator =
                Math.Clamp(
                    (totalLengthKm * 1.5 / 10.0) *
                    100.0,
                    0.0,
                    100.0);

            _logger.LogInformation(
                "[DRAINAGE] ArcGIS SUCCESS: " +
                "Features={Features}, " +
                "Length={Length:F3} km, " +
                "Indicator={Indicator:F2}",
                featureCount,
                totalLengthKm,
                indicator);

            return Math.Round(
                indicator,
                2);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "[DRAINAGE] ArcGIS query failed.");

            return null;
        }
    }

    // ============================================================
    // OSM FALLBACK
    // ============================================================

    private async Task<double?> GetOverpassIndicatorAsync(
        double latitude,
        double longitude)
    {
        try
        {
            const int radius = 1500;

            var lat =
                latitude.ToString(
                    CultureInfo.InvariantCulture);

            var lon =
                longitude.ToString(
                    CultureInfo.InvariantCulture);

            var query =
                $"""
                [out:json][timeout:20];
                (
                  way(around:{radius},{lat},{lon})[waterway=drain];
                  way(around:{radius},{lat},{lon})[waterway=ditch];
                  way(around:{radius},{lat},{lon})[waterway=canal];
                  way(around:{radius},{lat},{lon})[waterway=stream];
                  way(around:{radius},{lat},{lon})[waterway=river];
                  way(around:{radius},{lat},{lon})[waterway=culvert];
                );
                out tags geom;
                """;

            var endpoints =
                new[]
                {
                    "https://overpass-api.de/api/interpreter",
                    "https://overpass.kumi.systems/api/interpreter",
                    "https://overpass.private.coffee/api/interpreter"
                };

            foreach (var endpoint
                     in endpoints)
            {
                try
                {
                    using var content =
                        new FormUrlEncodedContent(
                            new Dictionary<string, string>
                            {
                                ["data"] = query
                            });

                    using var response =
                        await _httpClient.PostAsync(
                            endpoint,
                            content);

                    if (!response.IsSuccessStatusCode)
                    {
                        continue;
                    }

                    var body =
                        await response.Content
                            .ReadAsStringAsync();

                    using var doc =
                        JsonDocument.Parse(body);

                    var root =
                        doc.RootElement;

                    if (!root.TryGetProperty(
                            "elements",
                            out var elements))
                    {
                        continue;
                    }

                    double weightedKm = 0;
                    var count = 0;

                    foreach (var element
                             in elements.EnumerateArray())
                    {
                        if (!element.TryGetProperty(
                                "tags",
                                out var tags) ||
                            !tags.TryGetProperty(
                                "waterway",
                                out var waterwayElement))
                        {
                            continue;
                        }

                        var waterway =
                            waterwayElement.GetString()?
                                .ToLowerInvariant();

                        var lengthKm =
                            GetGeometryLengthKm(
                                element);

                        if (lengthKm <= 0)
                        {
                            continue;
                        }

                        var weight =
                            waterway switch
                            {
                                "drain" => 1.00,
                                "ditch" => 0.75,
                                "culvert" => 0.75,
                                "canal" => 1.25,
                                "stream" => 1.00,
                                "river" => 1.50,
                                _ => 0.50
                            };

                        weightedKm +=
                            lengthKm * weight;

                        count++;
                    }

                    if (count == 0)
                    {
                        continue;
                    }

                    var indicator =
                        Math.Clamp(
                            (weightedKm / 10.0) *
                            100.0,
                            0.0,
                            100.0);

                    _logger.LogInformation(
                        "[DRAINAGE] OSM SUCCESS: " +
                        "Features={Features}, " +
                        "WeightedLength={Length:F3}, " +
                        "Indicator={Indicator:F2}",
                        count,
                        weightedKm,
                        indicator);

                    return Math.Round(
                        indicator,
                        2);
                }
                catch
                {
                    // Try next Overpass server.
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "[DRAINAGE] OSM fallback failed.");
        }

        return null;
    }

    private static double GetGeometryLengthKm(
        JsonElement element)
    {
        if (!element.TryGetProperty(
                "geometry",
                out var geometry) ||
            geometry.ValueKind !=
                JsonValueKind.Array)
        {
            return 0;
        }

        double total = 0;

        double? previousLat = null;
        double? previousLon = null;

        foreach (var point
                 in geometry.EnumerateArray())
        {
            if (!point.TryGetProperty(
                    "lat",
                    out var latElement) ||
                !point.TryGetProperty(
                    "lon",
                    out var lonElement) ||
                !TryDouble(
                    latElement,
                    out var lat) ||
                !TryDouble(
                    lonElement,
                    out var lon))
            {
                continue;
            }

            if (previousLat.HasValue &&
                previousLon.HasValue)
            {
                total +=
                    DistanceKm(
                        previousLat.Value,
                        previousLon.Value,
                        lat,
                        lon);
            }

            previousLat = lat;
            previousLon = lon;
        }

        return total;
    }

    private static bool TryDouble(
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

    private static double DistanceKm(
        double lat1,
        double lon1,
        double lat2,
        double lon2)
    {
        const double radius = 6371.0;

        var dLat =
            (lat2 - lat1) *
            Math.PI /
            180.0;

        var dLon =
            (lon2 - lon1) *
            Math.PI /
            180.0;

        var a =
            Math.Sin(dLat / 2) *
            Math.Sin(dLat / 2) +
            Math.Cos(
                lat1 * Math.PI / 180.0) *
            Math.Cos(
                lat2 * Math.PI / 180.0) *
            Math.Sin(dLon / 2) *
            Math.Sin(dLon / 2);

        return radius *
            2 *
            Math.Atan2(
                Math.Sqrt(a),
                Math.Sqrt(1 - a));
    }
}

using System.Globalization;
using System.Text.Json;

namespace ReliefNexus.API.AI.Tools;

public sealed class HistoricalDisasterTool
{
    private const string Endpoint =
        "https://www.gdacs.org/gdacsapi/api/Events/geteventlist/SEARCH";

    private readonly HttpClient _httpClient;
    private readonly ILogger<HistoricalDisasterTool> _logger;

    public HistoricalDisasterTool(
        HttpClient httpClient,
        ILogger<HistoricalDisasterTool> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _httpClient.Timeout =
            TimeSpan.FromSeconds(30);

        _httpClient.DefaultRequestHeaders
            .TryAddWithoutValidation(
                "User-Agent",
                "ReliefNexus/1.0");

        _httpClient.DefaultRequestHeaders
            .TryAddWithoutValidation(
                "Accept",
                "application/json");
    }

    public async Task<HistoricalFloodResult>
        GetHistoricalFloodDataAsync(
            double latitude,
            double longitude)
    {
        try
        {
            var toDate =
                DateTime.UtcNow.Date;

            var fromDate =
                toDate.AddMonths(-6);

            var url =
                Endpoint +
                "?eventlist=FL" +
                $"&fromdate={fromDate:yyyy-MM-dd}" +
                $"&todate={toDate:yyyy-MM-dd}" +
                "&alertlevel=reg;orange;green" +
                "&pagesize=100" +
                "&pagenumber=1";

            _logger.LogInformation(
                "[HISTORY] Querying GDACS flood history.");

            using var response =
                await _httpClient.GetAsync(url);

            var body =
                await response.Content
                    .ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "[HISTORY] HTTP {Status}: {Body}",
                    (int)response.StatusCode,
                    body);

                return new HistoricalFloodResult();
            }

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
                return new HistoricalFloodResult();
            }

            const double radiusKm = 100.0;

            var count = 0;
            var highestSeverity = 0.0;

            foreach (var feature
                     in features.EnumerateArray())
            {
                if (!TryGetPoint(
                        feature,
                        out var eventLat,
                        out var eventLon))
                {
                    continue;
                }

                var distance =
                    DistanceKm(
                        latitude,
                        longitude,
                        eventLat,
                        eventLon);

                if (distance > radiusKm)
                {
                    continue;
                }

                count++;

                var alert =
                    GetAlertLevel(feature);

                var severity =
                    alert switch
                    {
                        "red" => 100.0,
                        "orange" => 75.0,
                        "green" => 50.0,
                        "reg" => 50.0,
                        _ => 25.0
                    };

                highestSeverity =
                    Math.Max(
                        highestSeverity,
                        severity);
            }

            _logger.LogInformation(
                "[HISTORY] SUCCESS: " +
                "Floods={Count}, Severity={Severity}",
                count,
                highestSeverity);

            return new HistoricalFloodResult
            {
                FloodCount = count,
                Severity = highestSeverity,
                Source =
                    "GDACS Flood Events - Last 6 Months"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "[HISTORY] Failed.");

            return new HistoricalFloodResult();
        }
    }

    private static bool TryGetPoint(
        JsonElement feature,
        out double latitude,
        out double longitude)
    {
        latitude = 0;
        longitude = 0;

        if (feature.TryGetProperty(
                "geometry",
                out var geometry) &&
            geometry.ValueKind ==
                JsonValueKind.Object &&
            geometry.TryGetProperty(
                "coordinates",
                out var coordinates) &&
            coordinates.ValueKind ==
                JsonValueKind.Array &&
            coordinates.GetArrayLength() >= 2)
        {
            if (TryDouble(
                    coordinates[0],
                    out var lon) &&
                TryDouble(
                    coordinates[1],
                    out var lat))
            {
                latitude = lat;
                longitude = lon;

                return true;
            }
        }

        if (feature.TryGetProperty(
                "properties",
                out var properties))
        {
            var lat =
                FindDouble(
                    properties,
                    "latitude",
                    "lat");

            var lon =
                FindDouble(
                    properties,
                    "longitude",
                    "lon",
                    "lng");

            if (lat.HasValue &&
                lon.HasValue)
            {
                latitude = lat.Value;
                longitude = lon.Value;

                return true;
            }
        }

        return false;
    }

    private static string GetAlertLevel(
        JsonElement feature)
    {
        if (!feature.TryGetProperty(
                "properties",
                out var properties))
        {
            return "";
        }

        foreach (var property
                 in properties.EnumerateObject())
        {
            if (property.Name.Equals(
                    "alertlevel",
                    StringComparison.OrdinalIgnoreCase))
            {
                return property.Value
                    .ToString()
                    .Trim()
                    .ToLowerInvariant();
            }
        }

        return "";
    }

    private static double? FindDouble(
        JsonElement element,
        params string[] names)
    {
        foreach (var property
                 in element.EnumerateObject())
        {
            foreach (var name in names)
            {
                if (property.Name.Equals(
                        name,
                        StringComparison.OrdinalIgnoreCase) &&
                    TryDouble(
                        property.Value,
                        out var value))
                {
                    return value;
                }
            }
        }

        return null;
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

public sealed class HistoricalFloodResult
{
    public int FloodCount { get; set; }

    public double Severity { get; set; }

    public string Source { get; set; } = "";
}

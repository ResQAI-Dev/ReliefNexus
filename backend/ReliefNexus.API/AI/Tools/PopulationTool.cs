using System.Globalization;
using System.Text.Json;

namespace ReliefNexus.API.AI.Tools;

public sealed class PopulationTool
{
    private const string Endpoint =
        "https://api.worldpop.org/v1/services/stats";

    private const string TaskEndpoint =
        "https://api.worldpop.org/v1/tasks/";

    private readonly HttpClient _httpClient;
    private readonly ILogger<PopulationTool> _logger;

    public PopulationTool(
        HttpClient httpClient,
        ILogger<PopulationTool> logger)
    {
        _httpClient = httpClient;

        _logger = logger;

        _httpClient.Timeout =
            TimeSpan.FromSeconds(90);

        if (!_httpClient.DefaultRequestHeaders.Contains(
                "User-Agent"))
        {
            _httpClient.DefaultRequestHeaders
                .TryAddWithoutValidation(
                    "User-Agent",
                    "ReliefNexus/1.0");
        }
    }

    public async Task<double?> GetPopulationDensityAsync(
        double latitude,
        double longitude)
    {
        try
        {
            const double halfSizeDegrees =
                0.005;

            var west =
                longitude - halfSizeDegrees;

            var east =
                longitude + halfSizeDegrees;

            var south =
                latitude - halfSizeDegrees;

            var north =
                latitude + halfSizeDegrees;

            var polygon =
                new[]
                {
                    new[]
                    {
                        west,
                        south
                    },
                    new[]
                    {
                        east,
                        south
                    },
                    new[]
                    {
                        east,
                        north
                    },
                    new[]
                    {
                        west,
                        north
                    },
                    new[]
                    {
                        west,
                        south
                    }
                };

            var geoJson =
                JsonSerializer.Serialize(
                    new
                    {
                        type = "FeatureCollection",
                        features = new[]
                        {
                            new
                            {
                                type = "Feature",
                                properties = new { },
                                geometry = new
                                {
                                    type = "Polygon",
                                    coordinates =
                                        new[] { polygon }
                                }
                            }
                        }
                    });

            var url =
                Endpoint +
                "?dataset=wpgppop" +
                "&year=2020" +
                "&runasync=false" +
                "&geojson=" +
                Uri.EscapeDataString(
                    geoJson);

            _logger.LogInformation(
                "[POPULATION] WorldPop request started: {Latitude}, {Longitude}",
                latitude,
                longitude);

            using var response =
                await _httpClient.GetAsync(url);

            var body =
                await response.Content
                    .ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "[POPULATION] HTTP {StatusCode}: {Body}",
                    (int)response.StatusCode,
                    body);

                return null;
            }

            using var document =
                JsonDocument.Parse(body);

            var root =
                document.RootElement;

            // ----------------------------------------------------
            // DIRECT RESULT
            // ----------------------------------------------------

            if (TryGetTotalPopulation(
                    root,
                    out var directPopulation))
            {
                return ConvertToDensity(
                    directPopulation,
                    latitude,
                    west,
                    east,
                    south,
                    north);
            }

            // ----------------------------------------------------
            // ASYNC RESULT
            // ----------------------------------------------------

            if (root.TryGetProperty(
                    "taskid",
                    out var taskElement))
            {
                var taskId =
                    taskElement.GetString();

                if (!string.IsNullOrWhiteSpace(
                        taskId))
                {
                    _logger.LogInformation(
                        "[POPULATION] WorldPop task: {TaskId}",
                        taskId);

                    var result =
                        await PollTaskAsync(
                            taskId);

                    if (result.HasValue)
                    {
                        return ConvertToDensity(
                            result.Value,
                            latitude,
                            west,
                            east,
                            south,
                            north);
                    }
                }
            }

            _logger.LogWarning(
                "[POPULATION] WorldPop returned no population.");

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "[POPULATION] WorldPop failed.");

            return null;
        }
    }

    private async Task<double?> PollTaskAsync(
        string taskId)
    {
        const int maxAttempts = 20;

        for (var attempt = 1;
             attempt <= maxAttempts;
             attempt++)
        {
            await Task.Delay(
                TimeSpan.FromSeconds(2));

            try
            {
                var url =
                    TaskEndpoint +
                    Uri.EscapeDataString(
                        taskId);

                using var response =
                    await _httpClient.GetAsync(url);

                var body =
                    await response.Content
                        .ReadAsStringAsync();

                if (!response.IsSuccessStatusCode ||
                    string.IsNullOrWhiteSpace(body))
                {
                    continue;
                }

                using var document =
                    JsonDocument.Parse(body);

                var root =
                    document.RootElement;

                if (TryGetTotalPopulation(
                        root,
                        out var population))
                {
                    _logger.LogInformation(
                        "[POPULATION] Task completed on attempt {Attempt}.",
                        attempt);

                    return population;
                }

                if (root.TryGetProperty(
                        "status",
                        out var statusElement))
                {
                    var status =
                        statusElement.ToString();

                    _logger.LogInformation(
                        "[POPULATION] Attempt {Attempt}/{Max}: {Status}",
                        attempt,
                        maxAttempts,
                        status);

                    if (status.Equals(
                            "failed",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return null;
                    }
                }
            }
            catch
            {
                // Continue polling.
            }
        }

        _logger.LogWarning(
            "[POPULATION] Polling limit reached.");

        return null;
    }

    private static bool TryGetTotalPopulation(
        JsonElement root,
        out double totalPopulation)
    {
        totalPopulation = 0;

        if (!root.TryGetProperty(
                "data",
                out var data) ||
            data.ValueKind !=
                JsonValueKind.Object)
        {
            return false;
        }

        if (!data.TryGetProperty(
                "total_population",
                out var element))
        {
            return false;
        }

        if (element.ValueKind ==
                JsonValueKind.Number &&
            element.TryGetDouble(
                out totalPopulation))
        {
            return totalPopulation >= 0;
        }

        if (element.ValueKind ==
                JsonValueKind.String &&
            double.TryParse(
                element.GetString(),
                NumberStyles.Any,
                CultureInfo.InvariantCulture,
                out totalPopulation))
        {
            return totalPopulation >= 0;
        }

        return false;
    }

    private static double CalculateDistanceKm(
        double lat1,
        double lon1,
        double lat2,
        double lon2)
    {
        const double earthRadiusKm =
            6371.0;

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

        return earthRadiusKm *
               2 *
               Math.Atan2(
                   Math.Sqrt(a),
                   Math.Sqrt(1 - a));
    }

    private static double? ConvertToDensity(
        double totalPopulation,
        double latitude,
        double west,
        double east,
        double south,
        double north)
    {
        var widthKm =
            CalculateDistanceKm(
                latitude,
                west,
                latitude,
                east);

        var heightKm =
            CalculateDistanceKm(
                south,
                (west + east) / 2.0,
                north,
                (west + east) / 2.0);

        var areaKm2 =
            widthKm * heightKm;

        if (areaKm2 <= 0)
        {
            return null;
        }

        var density =
            totalPopulation /
            areaKm2;

        return Math.Round(
            density,
            2);
    }
}

using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReliefNexus.API.AI.Tools;

public sealed class PopulationTool
{
    private const string WorldPopApi =
        "https://api.worldpop.org/v2";

    private const int DataYear = 2020;
    private const string Resolution = "100m";

    private readonly HttpClient _httpClient;
    private readonly ILogger<PopulationTool> _logger;

    public PopulationTool(
        HttpClient httpClient,
        ILogger<PopulationTool> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _httpClient.Timeout = TimeSpan.FromSeconds(90);

        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.TryAddWithoutValidation(
                "User-Agent",
                "ReliefNexus/1.0");
        }
    }

    public async Task<double?> GetPopulationDensityAsync(
        double latitude,
        double longitude)
    {
        if (!IsValidCoordinate(latitude, longitude))
        {
            _logger.LogWarning(
                "[WORLDPOP] Invalid coordinates {Latitude}, {Longitude}",
                latitude,
                longitude);

            return null;
        }

        /*
         * Agent 02 needs population density for the selected disaster
         * exposure area.
         *
         * WorldPop v2 returns:
         * - total_population
         * - area_km2
         * - population_density
         *
         * We query a 1 km x 1 km area first. If no usable value is
         * returned, progressively larger areas are requested.
         */
        double[] halfSizeKm =
        {
            0.5,
            1.5,
            3.0
        };

        foreach (var halfSizeKmValue in halfSizeKm)
        {
            try
            {
                var result = await QueryWorldPopAsync(
                    latitude,
                    longitude,
                    halfSizeKmValue);

                if (result != null &&
                    result.Density > 0)
                {
                    _logger.LogInformation(
                        "[WORLDPOP] SUCCESS Density={Density:F2}/km2 Total={Total:F2} Area={Area:F2}km2 Window={Window}km",
                        result.Density,
                        result.TotalPopulation,
                        result.AreaKm2,
                        halfSizeKmValue * 2);

                    return Math.Round(
                        result.Density,
                        2);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "[WORLDPOP] Query failed for window {Window}km.",
                    halfSizeKmValue * 2);
            }
        }

        _logger.LogWarning(
            "[WORLDPOP] No usable population density returned for {Latitude}, {Longitude}.",
            latitude,
            longitude);

        return null;
    }

    private async Task<PopulationResult?> QueryWorldPopAsync(
        double latitude,
        double longitude,
        double halfSizeKm)
    {
        var latDelta =
            halfSizeKm / 111.32;

        var cosLatitude =
            Math.Max(
                0.1,
                Math.Cos(
                    latitude *
                    Math.PI /
                    180.0));

        var lonDelta =
            halfSizeKm /
            (111.32 * cosLatitude);

        var west = longitude - lonDelta;
        var east = longitude + lonDelta;
        var south = latitude - latDelta;
        var north = latitude + latDelta;

        var polygon = new
        {
            type = "Polygon",
            coordinates = new[]
            {
                new[]
                {
                    new[] { west, south },
                    new[] { east, south },
                    new[] { east, north },
                    new[] { west, north },
                    new[] { west, south }
                }
            }
        };

        var request = new
        {
            geojson = polygon,
            year = DataYear,
            resolution = Resolution
        };

        var json =
            JsonSerializer.Serialize(request);

        using var content =
            new StringContent(
                json,
                System.Text.Encoding.UTF8,
                "application/json");

        _logger.LogInformation(
            "[WORLDPOP] POST population query for {Latitude}, {Longitude}, window={Window}km",
            latitude,
            longitude,
            halfSizeKm * 2);

        using var response =
            await _httpClient.PostAsync(
                $"{WorldPopApi}/population",
                content);

        var responseBody =
            await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "[WORLDPOP] HTTP {Status}: {Body}",
                (int)response.StatusCode,
                Shorten(responseBody));

            return null;
        }

        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return null;
        }

        var submit =
            JsonSerializer.Deserialize<WorldPopSubmitResponse>(
                responseBody,
                JsonOptions);

        if (submit == null ||
            string.IsNullOrWhiteSpace(
                submit.TaskId))
        {
            _logger.LogWarning(
                "[WORLDPOP] No task_id returned: {Body}",
                Shorten(responseBody));

            return null;
        }

        return await PollTaskAsync(
            submit.TaskId);
    }

    private async Task<PopulationResult?> PollTaskAsync(
        string taskId)
    {
        const int maxAttempts = 30;

        for (var attempt = 1;
             attempt <= maxAttempts;
             attempt++)
        {
            await Task.Delay(
                TimeSpan.FromSeconds(2));

            try
            {
                using var response =
                    await _httpClient.GetAsync(
                        $"{WorldPopApi}/tasks/{Uri.EscapeDataString(taskId)}");

                var body =
                    await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode ||
                    string.IsNullOrWhiteSpace(body))
                {
                    continue;
                }

                var result =
                    JsonSerializer.Deserialize<WorldPopTaskResponse>(
                        body,
                        JsonOptions);

                if (result == null)
                {
                    continue;
                }

                _logger.LogInformation(
                    "[WORLDPOP] Task {TaskId} attempt {Attempt}/{Max}: status={Status}, progress={Progress}",
                    taskId,
                    attempt,
                    maxAttempts,
                    result.Status,
                    result.Progress);

                if (string.Equals(
                        result.Status,
                        "success",
                        StringComparison.OrdinalIgnoreCase))
                {
                    if (result.Result == null)
                    {
                        return null;
                    }

                    var density =
                        result.Result.PopulationDensity;

                    var total =
                        result.Result.TotalPopulation;

                    var area =
                        result.Result.AreaKm2;

                    /*
                     * Prefer WorldPop's own population_density.
                     * If absent, calculate it from total / area.
                     */
                    if (density <= 0 &&
                        total > 0 &&
                        area > 0)
                    {
                        density =
                            total / area;
                    }

                    if (density <= 0)
                    {
                        return null;
                    }

                    return new PopulationResult(
                        density,
                        total,
                        area);
                }

                if (string.Equals(
                        result.Status,
                        "failure",
                        StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning(
                        "[WORLDPOP] Task failed: {Error}",
                        result.Error);

                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "[WORLDPOP] Polling attempt {Attempt} failed.",
                    attempt);
            }
        }

        _logger.LogWarning(
            "[WORLDPOP] Task {TaskId} did not finish within polling limit.",
            taskId);

        return null;
    }

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
            return string.Empty;
        }

        return value.Length <= max
            ? value
            : value[..max];
    }

    private static readonly JsonSerializerOptions JsonOptions =
        new()
        {
            PropertyNameCaseInsensitive = true
        };

    private sealed record PopulationResult(
        double Density,
        double TotalPopulation,
        double AreaKm2);

    private sealed class WorldPopSubmitResponse
    {
        [JsonPropertyName("task_id")]
        public string? TaskId { get; set; }
    }

    private sealed class WorldPopTaskResponse
    {
        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("progress")]
        public double Progress { get; set; }

        [JsonPropertyName("result")]
        public WorldPopResult? Result { get; set; }

        [JsonPropertyName("error")]
        public JsonElement? ErrorElement { get; set; }

        [JsonIgnore]
        public string Error =>
            ErrorElement?.ToString() ?? string.Empty;
    }

    private sealed class WorldPopResult
    {
        [JsonPropertyName("total_population")]
        public double TotalPopulation { get; set; }

        [JsonPropertyName("area_km2")]
        public double AreaKm2 { get; set; }

        [JsonPropertyName("population_density")]
        public double PopulationDensity { get; set; }

        [JsonPropertyName("data_year")]
        public int DataYear { get; set; }

        [JsonPropertyName("data_source")]
        public string? DataSource { get; set; }
    }
}

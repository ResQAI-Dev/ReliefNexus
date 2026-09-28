using System.Text.Json;

namespace ReliefNexus.API.AI.Tools;

/// <summary>
/// Reads the public RISE Sri Lanka readiness APIs.
/// The parser is intentionally tolerant of small response-schema changes.
/// Empty/unavailable responses are treated as unknown, never as zero risk.
/// </summary>
public sealed class SriLankaHazardDataTool
{
    private static readonly HttpClient Http = new()
    {
        Timeout = TimeSpan.FromSeconds(8)
    };

    private const string BaseUrl = "https://risesrilanka.org";

    public async Task<SriLankaHazardEvidence> GetEvidenceAsync(
        string? location,
        double? latitude,
        double? longitude,
        CancellationToken cancellationToken = default)
    {
        var evidence = new SriLankaHazardEvidence();

        var alertsTask = GetJsonAsync("/api/alerts", cancellationToken);
        var meteoTask = GetJsonAsync("/api/meteo", cancellationToken);
        var weatherTask = GetJsonAsync("/api/weather", cancellationToken);
        var rainfallTask = GetJsonAsync("/api/rainfall", cancellationToken);

        await Task.WhenAll(alertsTask, meteoTask, weatherTask, rainfallTask);

        var locationText = location?.Trim() ?? string.Empty;

        if (alertsTask.Result != null)
        {
            evidence.AlertsAvailable = true;
            ParseAlerts(
                alertsTask.Result.RootElement,
                locationText,
                latitude,
                longitude,
                evidence);
        }

        if (meteoTask.Result != null)
        {
            evidence.MeteorologicalFeedAvailable = true;
            evidence.MeteorologicalText = ExtractUsefulText(
                meteoTask.Result.RootElement,
                1200);
        }

        if (weatherTask.Result != null)
        {
            evidence.DistrictWeatherAvailable = true;
            evidence.DistrictWeatherText = ExtractUsefulText(
                weatherTask.Result.RootElement,
                1200);
        }

        if (rainfallTask.Result != null)
        {
            evidence.RainfallFeedAvailable = true;
            ParseRainfall(
                rainfallTask.Result.RootElement,
                locationText,
                latitude,
                longitude,
                evidence);
        }

        return evidence;
    }

    private static async Task<JsonDocument?> GetJsonAsync(
        string path,
        CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                BaseUrl + path);

            request.Headers.UserAgent.ParseAdd(
                "ReliefNexus/1.0 disaster-readiness-agent");

            using var response = await Http.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
                return null;

            await using var stream =
                await response.Content.ReadAsStreamAsync(cancellationToken);

            return await JsonDocument.ParseAsync(
                stream,
                cancellationToken: cancellationToken);
        }
        catch
        {
            return null;
        }
    }

    private static void ParseAlerts(
        JsonElement root,
        string location,
        double? latitude,
        double? longitude,
        SriLankaHazardEvidence evidence)
    {
        foreach (var item in EnumerateObjects(root))
        {
            var text = Flatten(item).ToLowerInvariant();

            if (!LooksLocationRelevant(
                    text,
                    location,
                    latitude,
                    longitude))
            {
                continue;
            }

            var hazard = DetectHazard(text);
            var level = DetectAlertLevel(text);

            if (hazard == null && level == null)
                continue;

            evidence.RelevantAlertCount++;

            var numericLevel = level switch
            {
                "red" => 100,
                "orange" => 75,
                "yellow" => 50,
                "green" => 20,
                _ => 40
            };

            if (hazard == "landslide")
                evidence.LandslideAlertScore = Math.Max(
                    evidence.LandslideAlertScore,
                    numericLevel);

            if (hazard == "flood")
                evidence.FloodAlertScore = Math.Max(
                    evidence.FloodAlertScore,
                    numericLevel);

            if (hazard == "storm" || hazard == "weather")
                evidence.WeatherAlertScore = Math.Max(
                    evidence.WeatherAlertScore,
                    numericLevel);

            if (hazard == "drought")
                evidence.DroughtAlertScore = Math.Max(
                    evidence.DroughtAlertScore,
                    numericLevel);

            var summary = BuildAlertSummary(item, hazard, level);
            if (!string.IsNullOrWhiteSpace(summary) &&
                !evidence.AlertSummaries.Contains(summary))
            {
                evidence.AlertSummaries.Add(summary);
            }
        }
    }

    private static void ParseRainfall(
        JsonElement root,
        string location,
        double? latitude,
        double? longitude,
        SriLankaHazardEvidence evidence)
    {
        var candidates = new List<double>();

        foreach (var item in EnumerateObjects(root))
        {
            var text = Flatten(item).ToLowerInvariant();

            if (!LooksLocationRelevant(
                    text,
                    location,
                    latitude,
                    longitude))
            {
                continue;
            }

            foreach (var property in item.EnumerateObject())
            {
                if (!property.Name.Contains("rain", StringComparison.OrdinalIgnoreCase) &&
                    !property.Name.Contains("precip", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (property.Value.ValueKind == JsonValueKind.Number &&
                    property.Value.TryGetDouble(out var value) &&
                    value >= 0 && value <= 1000)
                {
                    candidates.Add(value);
                }
            }
        }

        if (candidates.Count > 0)
        {
            evidence.MaxObservedRainfall = candidates.Max();
            evidence.AverageObservedRainfall = candidates.Average();
        }
    }

    private static string? DetectHazard(string text)
    {
        if (ContainsAny(text, "landslide", "land slide", "mudslide"))
            return "landslide";
        if (ContainsAny(text, "flood", "flash flood"))
            return "flood";
        if (ContainsAny(text, "drought", "dry spell"))
            return "drought";
        if (ContainsAny(text, "cyclone", "storm", "strong wind", "heavy rain"))
            return "storm";
        if (ContainsAny(text, "weather", "showers", "rainfall"))
            return "weather";
        return null;
    }

    private static string? DetectAlertLevel(string text)
    {
        if (ContainsAny(text, "level 3", "red alert", "red warning", "red"))
            return "red";
        if (ContainsAny(text, "level 2", "orange alert", "orange warning", "orange"))
            return "orange";
        if (ContainsAny(text, "level 1", "yellow alert", "yellow warning", "yellow"))
            return "yellow";
        if (ContainsAny(text, "green alert", "green warning", "green"))
            return "green";
        return null;
    }

    private static bool LooksLocationRelevant(
        string text,
        string location,
        double? latitude,
        double? longitude)
    {
        if (!string.IsNullOrWhiteSpace(location) &&
            text.Contains(location.ToLowerInvariant()))
        {
            return true;
        }

        // RISE responses can be district-wide. If no location string is
        // present in the record, don't assume it is local.
        if (latitude.HasValue && longitude.HasValue)
        {
            var lat = latitude.Value.ToString("0.####");
            var lon = longitude.Value.ToString("0.####");
            return text.Contains(lat) && text.Contains(lon);
        }

        return false;
    }

    private static string BuildAlertSummary(
        JsonElement item,
        string? hazard,
        string? level)
    {
        var title = FirstString(
            item,
            "title",
            "name",
            "headline",
            "message",
            "description",
            "body");

        var district = FirstString(
            item,
            "district",
            "location",
            "area",
            "region");

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(title))
            parts.Add(title!);
        if (!string.IsNullOrWhiteSpace(district))
            parts.Add(district!);
        if (!string.IsNullOrWhiteSpace(hazard))
            parts.Add(hazard!);
        if (!string.IsNullOrWhiteSpace(level))
            parts.Add(level!);

        return string.Join(" | ", parts);
    }

    private static string? FirstString(
        JsonElement item,
        params string[] names)
    {
        foreach (var name in names)
        {
            foreach (var property in item.EnumerateObject())
            {
                if (!property.Name.Equals(
                        name,
                        StringComparison.OrdinalIgnoreCase))
                    continue;

                if (property.Value.ValueKind == JsonValueKind.String)
                    return property.Value.GetString();
            }
        }

        return null;
    }

    private static IEnumerable<JsonElement> EnumerateObjects(
        JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            yield return element;

            foreach (var property in element.EnumerateObject())
            {
                foreach (var child in EnumerateObjects(property.Value))
                    yield return child;
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in element.EnumerateArray())
            {
                foreach (var nested in EnumerateObjects(child))
                    yield return nested;
            }
        }
    }

    private static string Flatten(JsonElement element)
    {
        var parts = new List<string>();
        FlattenInto(element, parts, 0);
        return string.Join(" ", parts);
    }

    private static void FlattenInto(
        JsonElement element,
        List<string> parts,
        int depth)
    {
        if (depth > 4)
            return;

        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                parts.Add(property.Name);
                FlattenInto(property.Value, parts, depth + 1);
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in element.EnumerateArray())
                FlattenInto(child, parts, depth + 1);
        }
        else if (element.ValueKind == JsonValueKind.String)
        {
            parts.Add(element.GetString() ?? string.Empty);
        }
        else if (element.ValueKind == JsonValueKind.Number ||
                 element.ValueKind == JsonValueKind.True ||
                 element.ValueKind == JsonValueKind.False)
        {
            parts.Add(element.ToString());
        }
    }

    private static string ExtractUsefulText(
        JsonElement root,
        int maxLength)
    {
        var text = Flatten(root);
        return text.Length <= maxLength
            ? text
            : text[..maxLength];
    }

    private static bool ContainsAny(
        string text,
        params string[] values)
        => values.Any(text.Contains);
}

public sealed class SriLankaHazardEvidence
{
    public bool AlertsAvailable { get; set; }
    public bool MeteorologicalFeedAvailable { get; set; }
    public bool DistrictWeatherAvailable { get; set; }
    public bool RainfallFeedAvailable { get; set; }

    public int RelevantAlertCount { get; set; }
    public double LandslideAlertScore { get; set; }
    public double FloodAlertScore { get; set; }
    public double WeatherAlertScore { get; set; }
    public double DroughtAlertScore { get; set; }

    public double MaxObservedRainfall { get; set; }
    public double AverageObservedRainfall { get; set; }

    public string MeteorologicalText { get; set; } = string.Empty;
    public string DistrictWeatherText { get; set; } = string.Empty;
    public List<string> AlertSummaries { get; set; } = new();
}

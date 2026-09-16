using System.Text.Json;

namespace ReliefNexus.API.AI.Tools;

public class DisasterDataTool
{
    private readonly HttpClient _httpClient;

    public DisasterDataTool(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<DisasterEvent>> GetRecentEventsAsync()
    {
        var url =
            "https://www.gdacs.org/gdacsapi/api/Events/geteventlist/" +
            "SEARCH?eventlist=EQ;TS;FL;TC;VO;DR;WF";

        try
        {
            using var response =
                await _httpClient.GetAsync(url);

            response.EnsureSuccessStatusCode();

            await using var stream =
                await response.Content.ReadAsStreamAsync();

            using var document =
                await JsonDocument.ParseAsync(stream);

            var events = new List<DisasterEvent>();

            if (!document.RootElement.TryGetProperty(
                    "features",
                    out var features))
            {
                return events;
            }

            foreach (var feature in features.EnumerateArray())
            {
                var properties =
                    feature.TryGetProperty(
                        "properties",
                        out var propertiesElement)
                        ? propertiesElement
                        : default;

                var geometry =
                    feature.TryGetProperty(
                        "geometry",
                        out var geometryElement)
                        ? geometryElement
                        : default;

                var eventType =
                    properties.ValueKind != JsonValueKind.Undefined &&
                    properties.TryGetProperty(
                        "eventtype",
                        out var eventTypeElement)
                        ? eventTypeElement.GetString()
                        : null;

                var eventId =
                    properties.ValueKind != JsonValueKind.Undefined &&
                    properties.TryGetProperty(
                        "eventid",
                        out var eventIdElement)
                        ? eventIdElement.ToString()
                        : null;

                var alertLevel =
                    properties.ValueKind != JsonValueKind.Undefined &&
                    properties.TryGetProperty(
                        "alertlevel",
                        out var alertElement)
                        ? alertElement.GetString()
                        : null;

                var name =
                    properties.ValueKind != JsonValueKind.Undefined &&
                    properties.TryGetProperty(
                        "name",
                        out var nameElement)
                        ? nameElement.GetString()
                        : null;

                double? latitude = null;
                double? longitude = null;

                if (geometry.ValueKind != JsonValueKind.Undefined &&
                    geometry.TryGetProperty(
                        "coordinates",
                        out var coordinates) &&
                    coordinates.ValueKind == JsonValueKind.Array &&
                    coordinates.GetArrayLength() >= 2)
                {
                    try
                    {
                        longitude =
                            coordinates[0].GetDouble();

                        latitude =
                            coordinates[1].GetDouble();
                    }
                    catch
                    {
                        latitude = null;
                        longitude = null;
                    }
                }

                events.Add(
                    new DisasterEvent
                    {
                        EventType =
                            eventType ?? string.Empty,

                        EventId =
                            eventId ?? string.Empty,

                        Name =
                            name ?? string.Empty,

                        AlertLevel =
                            alertLevel ?? string.Empty,

                        Latitude =
                            latitude,

                        Longitude =
                            longitude
                    });
            }

            return events;
        }
        catch
        {
            return new List<DisasterEvent>();
        }
    }
}

public class DisasterEvent
{
    public string EventType { get; set; } = string.Empty;

    public string EventId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string AlertLevel { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }
}

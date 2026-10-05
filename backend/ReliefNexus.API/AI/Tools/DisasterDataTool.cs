using System.Text.Json;

namespace ReliefNexus.API.AI.Tools;

public class DisasterDataTool
{
    private readonly HttpClient _httpClient;

    public DisasterDataTool(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<DisasterEvent>> GetRecentEventsAsync(
        double? latitude = null,
        double? longitude = null)
    {
        var events = new List<DisasterEvent>();

        // =====================================================
        // GDACS EVENTS
        // =====================================================

        var gdacsUrl =
            "https://www.gdacs.org/gdacsapi/api/Events/geteventlist/" +
            "SEARCH?eventlist=EQ;TS;FL;TC;VO;DR;WF";

        try
        {
            using var response =
                await _httpClient.GetAsync(gdacsUrl);

            response.EnsureSuccessStatusCode();

            await using var stream =
                await response.Content.ReadAsStreamAsync();

            using var document =
                await JsonDocument.ParseAsync(stream);

            if (document.RootElement.TryGetProperty(
                    "features",
                    out var features))
            {
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

                    double? eventLatitude = null;
                    double? eventLongitude = null;

                    if (geometry.ValueKind != JsonValueKind.Undefined &&
                        geometry.TryGetProperty(
                            "coordinates",
                            out var coordinates) &&
                        coordinates.ValueKind == JsonValueKind.Array &&
                        coordinates.GetArrayLength() >= 2)
                    {
                        try
                        {
                            eventLongitude =
                                coordinates[0].GetDouble();

                            eventLatitude =
                                coordinates[1].GetDouble();
                        }
                        catch
                        {
                            eventLatitude = null;
                            eventLongitude = null;
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
                                eventLatitude,

                            Longitude =
                                eventLongitude
                        });
                }
            }
        }
        catch
        {
            // GDACS failure does not stop USGS processing.
        }

        // =====================================================
        // USGS EARTHQUAKE EVENTS
        // =====================================================

        if (latitude.HasValue &&
            longitude.HasValue)
        {
            var startTime =
                DateTime.UtcNow.AddDays(-30)
                    .ToString("yyyy-MM-ddTHH:mm:ss");

            var endTime =
                DateTime.UtcNow
                    .ToString("yyyy-MM-ddTHH:mm:ss");

            var usgsUrl =
                "https://earthquake.usgs.gov/fdsnws/event/1/query" +
                "?format=geojson" +
                $"&latitude={latitude.Value}" +
                $"&longitude={longitude.Value}" +
                "&maxradiuskm=500" +
                "&eventtype=earthquake" +
                $"&starttime={Uri.EscapeDataString(startTime)}" +
                $"&endtime={Uri.EscapeDataString(endTime)}" +
                "&orderby=magnitude" +
                "&limit=50";

            try
            {
                using var response =
                    await _httpClient.GetAsync(usgsUrl);

                response.EnsureSuccessStatusCode();

                await using var stream =
                    await response.Content.ReadAsStreamAsync();

                using var document =
                    await JsonDocument.ParseAsync(stream);

                if (document.RootElement.TryGetProperty(
                        "features",
                        out var features))
                {
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

                        double? magnitude = null;

                        if (properties.ValueKind !=
                                JsonValueKind.Undefined &&
                            properties.TryGetProperty(
                                "mag",
                                out var magnitudeElement) &&
                            magnitudeElement.ValueKind ==
                                JsonValueKind.Number)
                        {
                            magnitude =
                                magnitudeElement.GetDouble();
                        }

                        var place =
                            properties.ValueKind !=
                                JsonValueKind.Undefined &&
                            properties.TryGetProperty(
                                "place",
                                out var placeElement)
                                ? placeElement.GetString()
                                : null;

                        var eventId =
                            feature.TryGetProperty(
                                "id",
                                out var idElement)
                                ? idElement.GetString()
                                : null;

                        double? eventLatitude = null;
                        double? eventLongitude = null;
                        double? depthKm = null;

                        if (geometry.ValueKind !=
                                JsonValueKind.Undefined &&
                            geometry.TryGetProperty(
                                "coordinates",
                                out var coordinates) &&
                            coordinates.ValueKind ==
                                JsonValueKind.Array &&
                            coordinates.GetArrayLength() >= 3)
                        {
                            try
                            {
                                eventLongitude =
                                    coordinates[0].GetDouble();

                                eventLatitude =
                                    coordinates[1].GetDouble();

                                depthKm =
                                    coordinates[2].GetDouble();
                            }
                            catch
                            {
                                eventLatitude = null;
                                eventLongitude = null;
                                depthKm = null;
                            }
                        }

                        events.Add(
                            new DisasterEvent
                            {
                                EventType = "EQ",

                                EventId =
                                    "USGS-" +
                                    (eventId ??
                                     Guid.NewGuid().ToString()),

                                Name =
                                    place ??
                                    "USGS Earthquake",

                                AlertLevel =
                                    string.Empty,

                                Latitude =
                                    eventLatitude,

                                Longitude =
                                    eventLongitude,

                                Magnitude =
                                    magnitude,

                                DepthKm =
                                    depthKm
                            });
                    }
                }
            }
            catch
            {
                // USGS failure does not stop GDACS results.
            }
        }

        return events;
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

    public double? Magnitude { get; set; }

    public double? DepthKm { get; set; }
}
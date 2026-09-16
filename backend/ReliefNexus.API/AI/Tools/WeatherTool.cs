using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReliefNexus.API.AI.Tools;

public class WeatherTool
{
    private readonly HttpClient _httpClient;

    public WeatherTool(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<WeatherData?> GetCurrentWeatherAsync(
        double latitude,
        double longitude)
    {
        var url =
            $"https://api.open-meteo.com/v1/forecast" +
            $"?latitude={latitude}" +
            $"&longitude={longitude}" +
            $"&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m" +
            $"&temperature_unit=celsius" +
            $"&wind_speed_unit=kmh" +
            $"&precipitation_unit=mm" +
            $"&timezone=auto";

        try
        {
            using var response =
                await _httpClient.GetAsync(url);

            response.EnsureSuccessStatusCode();

            await using var stream =
                await response.Content.ReadAsStreamAsync();

            var data =
                await JsonSerializer.DeserializeAsync<OpenMeteoResponse>(
                    stream);

            if (data?.Current == null)
                return null;

            return new WeatherData
            {
                Latitude = latitude,
                Longitude = longitude,
                Temperature =
                    data.Current.Temperature2m,
                Humidity =
                    data.Current.RelativeHumidity2m,
                Precipitation =
                    data.Current.Precipitation,
                WindSpeed =
                    data.Current.WindSpeed10m,
                Source = "Open-Meteo",
                RetrievedAt = DateTime.UtcNow
            };
        }
        catch
        {
            return null;
        }
    }

    private class OpenMeteoResponse
    {
        [JsonPropertyName("current")]
        public CurrentWeather? Current { get; set; }
    }

    private class CurrentWeather
    {
        [JsonPropertyName("temperature_2m")]
        public double Temperature2m { get; set; }

        [JsonPropertyName("relative_humidity_2m")]
        public double RelativeHumidity2m { get; set; }

        [JsonPropertyName("precipitation")]
        public double Precipitation { get; set; }

        [JsonPropertyName("wind_speed_10m")]
        public double WindSpeed10m { get; set; }
    }
}

public class WeatherData
{
    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double Temperature { get; set; }

    public double Humidity { get; set; }

    public double Precipitation { get; set; }

    public double WindSpeed { get; set; }

    public string Source { get; set; } = "Open-Meteo";

    public DateTime RetrievedAt { get; set; }
}

using System.Net.Http.Json;
using System.Text.Json.Serialization;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Services;

public class WeatherService : IWeatherService
{
    private readonly HttpClient _httpClient;

    public WeatherService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<WeatherDataDto?> GetCurrentWeatherAsync(
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
            var response =
                await _httpClient.GetAsync(url);

            response.EnsureSuccessStatusCode();

            var data =
                await response.Content
                    .ReadFromJsonAsync<OpenMeteoResponse>();

            if (data?.Current == null)
                return null;

            return new WeatherDataDto
            {
                Latitude = latitude,
                Longitude = longitude,
                Temperature = data.Current.Temperature2m,
                Humidity = data.Current.RelativeHumidity2m,
                Precipitation = data.Current.Precipitation,
                WindSpeed = data.Current.WindSpeed10m,
                RetrievedAt = DateTime.UtcNow,
                Source = "Open-Meteo"
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

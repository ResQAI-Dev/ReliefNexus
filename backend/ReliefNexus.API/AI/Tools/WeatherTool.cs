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
            $"&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_to_1cm" +
            $"&past_hours=24" +
            $"&forecast_hours=6" +
            $"&temperature_unit=celsius" +
            $"&wind_speed_unit=kmh" +
            $"&precipitation_unit=mm" +
            $"&timezone=UTC";

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

            if (data?.Current == null ||
                data.Hourly == null ||
                data.Hourly.Time == null)
            {
                return null;
            }

            // --------------------------------------------------
            // Past 3 hours rainfall
            // --------------------------------------------------

            var past3Rainfall =
                GetPastRainfall(
                    data.Hourly,
                    3);

            // --------------------------------------------------
            // Past 24 hours rainfall
            // --------------------------------------------------

            var past24Rainfall =
                GetPastRainfall(
                    data.Hourly,
                    24);

            // --------------------------------------------------
            // Forecast rainfall
            // Next 6 hours
            // --------------------------------------------------

            var forecastRainfall =
                GetForecastRainfall(
                    data.Hourly);

            // --------------------------------------------------
            // Recent weather averages
            // --------------------------------------------------

            var recentTemperatures =
                GetPastValues(
                    data.Hourly.Temperature2m,
                    3);

            var recentHumidity =
                GetPastValues(
                    data.Hourly.RelativeHumidity2m,
                    3);

            var recentWind =
                GetPastValues(
                    data.Hourly.WindSpeed10m,
                    3);

            // --------------------------------------------------
            // Real soil moisture
            // Open-Meteo: m³/m³
            // --------------------------------------------------

            var soilMoisture =
                GetCurrentSoilMoisture(
                    data.Hourly);

            return new WeatherData
            {
                Latitude = latitude,

                Longitude = longitude,

                // Current weather
                Temperature =
                    data.Current.Temperature2m,

                Humidity =
                    data.Current.RelativeHumidity2m,

                Precipitation =
                    data.Current.Precipitation,

                WindSpeed =
                    data.Current.WindSpeed10m,

                // Rainfall
                Rainfall3h =
                    past3Rainfall,

                Rainfall24h =
                    past24Rainfall,

                // Forecast
                ForecastRainfall =
                    forecastRainfall,

                // Soil moisture
                SoilMoisture =
                    soilMoisture,

                // Recent averages
                Temperature3hAverage =
                    CalculateAverage(
                        recentTemperatures),

                Humidity3hAverage =
                    CalculateAverage(
                        recentHumidity),

                WindSpeed3hAverage =
                    CalculateAverage(
                        recentWind),

                Source =
                    "Open-Meteo",

                RetrievedAt =
                    DateTime.UtcNow
            };
        }
        catch
        {
            return null;
        }
    }

    private static double GetPastRainfall(
        HourlyWeather hourly,
        int hours)
    {
        if (hourly.Time == null ||
            hourly.Precipitation == null)
        {
            return 0;
        }

        var now =
            DateTime.UtcNow;

        var values =
            hourly.Time
                .Select((time, index) => new
                {
                    Time = time,

                    Value =
                        index <
                        hourly.Precipitation.Count
                            ? hourly.Precipitation[index]
                            : 0
                })
                .Where(x =>
                    x.Time <= now &&
                    x.Time >
                        now.AddHours(-hours))
                .Select(x => x.Value);

        return Math.Round(
            values.Sum(),
            2);
    }

    private static double GetForecastRainfall(
        HourlyWeather hourly)
    {
        if (hourly.Time == null ||
            hourly.Precipitation == null)
        {
            return 0;
        }

        var now =
            DateTime.UtcNow;

        var values =
            hourly.Time
                .Select((time, index) => new
                {
                    Time = time,

                    Value =
                        index <
                        hourly.Precipitation.Count
                            ? hourly.Precipitation[index]
                            : 0
                })
                .Where(x =>
                    x.Time > now &&
                    x.Time <=
                        now.AddHours(6))
                .Select(x => x.Value);

        return Math.Round(
            values.Sum(),
            2);
    }

    private static double? GetCurrentSoilMoisture(
        HourlyWeather hourly)
    {
        if (hourly.Time == null ||
            hourly.SoilMoisture0To1cm == null)
        {
            return null;
        }

        var now =
            DateTime.UtcNow;

        var latest =
            hourly.Time
                .Select((time, index) => new
                {
                    Time = time,

                    Value =
                        index <
                        hourly.SoilMoisture0To1cm.Count
                            ? hourly.SoilMoisture0To1cm[index]
                            : (double?)null
                })
                .Where(x =>
                    x.Time <= now &&
                    x.Value.HasValue)
                .OrderByDescending(x => x.Time)
                .FirstOrDefault();

        return latest?.Value;
    }

    private static List<double> GetPastValues(
        List<double>? values,
        int hours)
    {
        if (values == null ||
            values.Count == 0)
        {
            return [];
        }

        return values
            .TakeLast(
                Math.Min(
                    hours,
                    values.Count))
            .ToList();
    }

    private static double CalculateAverage(
        IEnumerable<double> values)
    {
        var list =
            values.ToList();

        return list.Count == 0
            ? 0
            : Math.Round(
                list.Average(),
                2);
    }

    private class OpenMeteoResponse
    {
        [JsonPropertyName("current")]
        public CurrentWeather? Current { get; set; }

        [JsonPropertyName("hourly")]
        public HourlyWeather? Hourly { get; set; }
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

    private class HourlyWeather
    {
        [JsonPropertyName("time")]
        public List<DateTime>? Time { get; set; }

        [JsonPropertyName("temperature_2m")]
        public List<double>? Temperature2m { get; set; }

        [JsonPropertyName("relative_humidity_2m")]
        public List<double>? RelativeHumidity2m { get; set; }

        [JsonPropertyName("precipitation")]
        public List<double>? Precipitation { get; set; }

        [JsonPropertyName("wind_speed_10m")]
        public List<double>? WindSpeed10m { get; set; }

        [JsonPropertyName("soil_moisture_0_to_1cm")]
        public List<double>? SoilMoisture0To1cm { get; set; }
    }
}

public class WeatherData
{
    public double Latitude { get; set; }

    public double Longitude { get; set; }

    // Current
    public double Temperature { get; set; }

    public double Humidity { get; set; }

    public double Precipitation { get; set; }

    public double WindSpeed { get; set; }

    // Past 3 hours
    public double Rainfall3h { get; set; }

    // Past 24 hours
    public double Rainfall24h { get; set; }

    // Next 6 hours
    public double ForecastRainfall { get; set; }

    // Real Open-Meteo soil moisture
    // Unit: m³/m³
    public double? SoilMoisture { get; set; }

    // Recent averages
    public double Temperature3hAverage { get; set; }

    public double Humidity3hAverage { get; set; }

    public double WindSpeed3hAverage { get; set; }

    public string Source { get; set; } =
        "Open-Meteo";

    public DateTime RetrievedAt { get; set; }
}

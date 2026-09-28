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
            "https://api.open-meteo.com/v1/forecast" +
            $"?latitude={latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}" +
            $"&longitude={longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}" +
            "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,vapour_pressure_deficit" +
            "&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_to_10cm,et0_fao_evapotranspiration,vapour_pressure_deficit,precipitation_probability,weather_code" +
            "&past_hours=72" +
            "&forecast_hours=24" +
            "&temperature_unit=celsius" +
            "&wind_speed_unit=kmh" +
            "&precipitation_unit=mm" +
            "&timezone=UTC";

        try
        {
            using var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync();
            var data = await JsonSerializer.DeserializeAsync<OpenMeteoResponse>(stream);

            if (data?.Current == null || data.Hourly?.Time == null)
                return null;

            var past3 = GetPastRainfall(data.Hourly, 3);
            var past24 = GetPastRainfall(data.Hourly, 24);
            var past72 = GetPastRainfall(data.Hourly, 72);
            var forecast24 = GetForecastRainfall(data.Hourly, 24);
            var et024 = GetForecastOrPastSum(data.Hourly.Et0FaoEvapotranspiration, data.Hourly.Time, 24, true);
            var recentTemps = GetPastValues(data.Hourly.Temperature2m, data.Hourly.Time, 3);
            var recentHumidity = GetPastValues(data.Hourly.RelativeHumidity2m, data.Hourly.Time, 3);
            var recentWind = GetPastValues(data.Hourly.WindSpeed10m, data.Hourly.Time, 3);
            var recentVpd = GetCurrentOrRecent(data.Hourly.VapourPressureDeficit, data.Hourly.Time);
            var currentSoil = GetCurrentSoilMoisture(data.Hourly);
            var precipitationProbability = GetMaxFuture(data.Hourly.PrecipitationProbability, data.Hourly.Time, 24);
            var weatherCode = GetCurrentWeatherCode(data.Hourly);

            return new WeatherData
            {
                Latitude = latitude,
                Elevation = data.Elevation,
                Longitude = longitude,
                Temperature = data.Current.Temperature2m,
                Humidity = data.Current.RelativeHumidity2m,
                Precipitation = data.Current.Precipitation,
                WindSpeed = data.Current.WindSpeed10m,
                Rainfall3h = past3,
                Rainfall24h = past24,
                Rainfall72h = past72,
                ForecastRainfall = GetForecastRainfall(data.Hourly, 6),
                ForecastRainfall24h = forecast24,
                SoilMoisture = currentSoil,
                Temperature3hAverage = CalculateAverage(recentTemps),
                Humidity3hAverage = CalculateAverage(recentHumidity),
                WindSpeed3hAverage = CalculateAverage(recentWind),
                ReferenceEvapotranspiration24h = et024,
                VapourPressureDeficit = recentVpd,
                PrecipitationProbability = precipitationProbability,
                WeatherCode = weatherCode,
                Source = "Open-Meteo",
                RetrievedAt = DateTime.UtcNow
            };
        }
        catch
        {
            return null;
        }
    }

    private static double GetPastRainfall(HourlyWeather hourly, int hours)
        => SumWindow(hourly.Precipitation, hourly.Time, hours, past: true);

    private static double GetForecastRainfall(HourlyWeather hourly, int hours)
        => SumWindow(hourly.Precipitation, hourly.Time, hours, past: false);

    private static double SumWindow(List<double>? values, List<DateTime>? times, int hours, bool past)
    {
        if (values == null || times == null) return 0;
        var now = DateTime.UtcNow;
        var start = past ? now.AddHours(-hours) : now;
        var end = past ? now : now.AddHours(hours);

        return Math.Round(times.Select((t, i) => new { t, v = i < values.Count ? values[i] : 0 })
            .Where(x => x.t >= start && x.t <= end)
            .Sum(x => Math.Max(0, x.v)), 2);
    }

    private static List<double> GetPastValues(List<double>? values, List<DateTime>? times, int hours)
    {
        if (values == null || times == null) return new();
        var now = DateTime.UtcNow;
        return times.Select((t, i) => new { t, v = i < values.Count ? values[i] : 0 })
            .Where(x => x.t <= now && x.t > now.AddHours(-hours))
            .Select(x => x.v)
            .ToList();
    }

    private static double GetForecastOrPastSum(List<double>? values, List<DateTime>? times, int hours, bool past)
        => SumWindow(values, times, hours, past);

    private static double GetCurrentOrRecent(List<double>? values, List<DateTime>? times)
    {
        if (values == null || times == null) return 0;
        var now = DateTime.UtcNow;
        var candidate = times.Select((t, i) => new { t, v = i < values.Count ? values[i] : 0 })
            .Where(x => x.t <= now)
            .OrderByDescending(x => x.t)
            .FirstOrDefault();
        return candidate?.v ?? 0;
    }

    private static double GetMaxFuture(List<double>? values, List<DateTime>? times, int hours)
    {
        if (values == null || times == null) return 0;
        var now = DateTime.UtcNow;
        var max = times.Select((t, i) => new { t, v = i < values.Count ? values[i] : 0 })
            .Where(x => x.t >= now && x.t <= now.AddHours(hours))
            .Select(x => x.v)
            .DefaultIfEmpty(0)
            .Max();
        return Math.Clamp(max, 0, 100);
    }

    private static int GetCurrentWeatherCode(HourlyWeather hourly)
    {
        if (hourly.WeatherCode == null || hourly.Time == null) return 0;
        var now = DateTime.UtcNow;
        var item = hourly.Time.Select((t, i) => new { t, v = i < hourly.WeatherCode.Count ? hourly.WeatherCode[i] : 0 })
            .Where(x => x.t <= now)
            .OrderByDescending(x => x.t)
            .FirstOrDefault();
        return item?.v ?? 0;
    }

    private static double? GetCurrentSoilMoisture(HourlyWeather hourly)
    {
        if (hourly.SoilMoisture0To10cm == null || hourly.Time == null) return null;
        var now = DateTime.UtcNow;
        var item = hourly.Time.Select((t, i) => new { t, v = i < hourly.SoilMoisture0To10cm.Count ? hourly.SoilMoisture0To10cm[i] : 0 })
            .Where(x => x.t <= now)
            .OrderByDescending(x => x.t)
            .FirstOrDefault();
        return item?.v;
    }

    private static double CalculateAverage(IEnumerable<double> values)
    {
        var list = values.ToList();
        return list.Count == 0 ? 0 : Math.Round(list.Average(), 2);
    }

    private sealed class OpenMeteoResponse
    {
        [JsonPropertyName("elevation")] public double Elevation { get; set; }
        [JsonPropertyName("current")] public CurrentWeather? Current { get; set; }
        [JsonPropertyName("hourly")] public HourlyWeather? Hourly { get; set; }
    }

    private sealed class CurrentWeather
    {
        [JsonPropertyName("temperature_2m")] public double Temperature2m { get; set; }
        [JsonPropertyName("relative_humidity_2m")] public double RelativeHumidity2m { get; set; }
        [JsonPropertyName("precipitation")] public double Precipitation { get; set; }
        [JsonPropertyName("wind_speed_10m")] public double WindSpeed10m { get; set; }
        [JsonPropertyName("vapour_pressure_deficit")] public double VapourPressureDeficit { get; set; }
    }

    private sealed class HourlyWeather
    {
        [JsonPropertyName("time")] public List<DateTime>? Time { get; set; }
        [JsonPropertyName("temperature_2m")] public List<double>? Temperature2m { get; set; }
        [JsonPropertyName("relative_humidity_2m")] public List<double>? RelativeHumidity2m { get; set; }
        [JsonPropertyName("precipitation")] public List<double>? Precipitation { get; set; }
        [JsonPropertyName("wind_speed_10m")] public List<double>? WindSpeed10m { get; set; }
        [JsonPropertyName("soil_moisture_0_to_10cm")] public List<double>? SoilMoisture0To10cm { get; set; }
        [JsonPropertyName("et0_fao_evapotranspiration")] public List<double>? Et0FaoEvapotranspiration { get; set; }
        [JsonPropertyName("vapour_pressure_deficit")] public List<double>? VapourPressureDeficit { get; set; }
        [JsonPropertyName("precipitation_probability")] public List<double>? PrecipitationProbability { get; set; }
        [JsonPropertyName("weather_code")] public List<int>? WeatherCode { get; set; }
    }
}

public class WeatherData
{
    public double Latitude { get; set; }
    public double Elevation { get; set; }
    public double Longitude { get; set; }
    public double Temperature { get; set; }
    public double Humidity { get; set; }
    public double Precipitation { get; set; }
    public double WindSpeed { get; set; }
    public double Rainfall3h { get; set; }
    public double Rainfall24h { get; set; }
    public double Rainfall72h { get; set; }
    public double ForecastRainfall { get; set; }
    public double ForecastRainfall24h { get; set; }
    public double? SoilMoisture { get; set; }
    public double Temperature3hAverage { get; set; }
    public double Humidity3hAverage { get; set; }
    public double WindSpeed3hAverage { get; set; }
    public double ReferenceEvapotranspiration24h { get; set; }
    public double VapourPressureDeficit { get; set; }
    public double PrecipitationProbability { get; set; }
    public int WeatherCode { get; set; }
    public string Source { get; set; } = "Open-Meteo";
    public DateTime RetrievedAt { get; set; }
}

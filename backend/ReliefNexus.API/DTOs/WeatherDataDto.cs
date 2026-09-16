namespace ReliefNexus.API.DTOs;

public class WeatherDataDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public double Temperature { get; set; }
    public double Humidity { get; set; }
    public double Precipitation { get; set; }
    public double WindSpeed { get; set; }

    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;

    public string Source { get; set; } = "Open-Meteo";
}

using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IWeatherService
{
    Task<WeatherDataDto?> GetCurrentWeatherAsync(
        double latitude,
        double longitude);
}

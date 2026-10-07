using System.Net.Http.Json;
using System.Text.Json;

namespace ReliefNexus.API.AI.Services;

public class PythonEarlyWarningService : IPythonEarlyWarningService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PythonEarlyWarningService> _logger;

    public PythonEarlyWarningService(
        HttpClient httpClient,
        ILogger<PythonEarlyWarningService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<JsonElement?> CoordinateAsync(
        object payload,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                "/ai/early-warning",
                payload,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Python Agent 04 returned HTTP {StatusCode}",
                    response.StatusCode);

                return null;
            }

            return await response.Content
                .ReadFromJsonAsync<JsonElement>(
                    cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Python Agent 04 unavailable.");

            return null;
        }
    }
}

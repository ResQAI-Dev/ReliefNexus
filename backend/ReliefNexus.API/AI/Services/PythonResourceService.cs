using System.Net.Http.Json;
using System.Text.Json;

namespace ReliefNexus.API.AI.Services;

public class PythonResourceService : IPythonResourceService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PythonResourceService> _logger;

    public PythonResourceService(
        HttpClient httpClient,
        ILogger<PythonResourceService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<JsonElement?> OptimizeAsync(
        object payload,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                "/ai/resource-optimization",
                payload,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Python Agent 03 returned HTTP {StatusCode}",
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
                "Python Agent 03 unavailable.");

            return null;
        }
    }
}

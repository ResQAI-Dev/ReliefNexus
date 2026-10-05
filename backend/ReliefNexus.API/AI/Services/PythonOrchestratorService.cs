using System.Net.Http.Json;
using System.Text.Json;

namespace ReliefNexus.API.AI.Services;

public class PythonOrchestratorService : IPythonOrchestratorService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PythonOrchestratorService> _logger;

    public PythonOrchestratorService(
        HttpClient httpClient,
        ILogger<PythonOrchestratorService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public Task<JsonElement?> OrchestrateAsync(
        object payload,
        CancellationToken cancellationToken = default) =>
        PostAsync("/ai/orchestrate", payload, cancellationToken);

    public Task<JsonElement?> SimulateAsync(
        object payload,
        CancellationToken cancellationToken = default) =>
        PostAsync("/ai/simulate", payload, cancellationToken);

    private async Task<JsonElement?> PostAsync(
        string path,
        object payload,
        CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _httpClient.PostAsJsonAsync(
                path,
                payload,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Python orchestrator returned HTTP {StatusCode} for {Path}",
                    response.StatusCode,
                    path);
                return null;
            }

            return await response.Content.ReadFromJsonAsync<JsonElement>(
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Python orchestrator unavailable for {Path}",
                path);
            return null;
        }
    }
}

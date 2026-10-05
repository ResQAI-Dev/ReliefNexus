using System.Text.Json;

namespace ReliefNexus.API.AI.Services;

public interface IPythonOrchestratorService
{
    Task<JsonElement?> OrchestrateAsync(
        object payload,
        CancellationToken cancellationToken = default);

    Task<JsonElement?> SimulateAsync(
        object payload,
        CancellationToken cancellationToken = default);
}

using System.Text.Json;

namespace ReliefNexus.API.AI.Services;

public interface IPythonResourceService
{
    Task<JsonElement?> OptimizeAsync(
        object payload,
        CancellationToken cancellationToken = default);
}

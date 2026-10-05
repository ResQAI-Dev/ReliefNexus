using System.Text.Json;

namespace ReliefNexus.API.AI.Services;

public interface IPythonEarlyWarningService
{
    Task<JsonElement?> CoordinateAsync(
        object payload,
        CancellationToken cancellationToken = default);
}

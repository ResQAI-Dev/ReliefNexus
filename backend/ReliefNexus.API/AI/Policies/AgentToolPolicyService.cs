using Microsoft.Extensions.Logging;

namespace ReliefNexus.API.AI.Policies;

public interface IAgentToolPolicyService
{
    bool IsAllowed(
        string agentName,
        string toolName);

    void EnsureAllowed(
        string agentName,
        string toolName);

    IReadOnlySet<string> GetAllowedTools(
        string agentName);
}

public sealed class AgentToolPolicyService
    : IAgentToolPolicyService
{
    private readonly ILogger<AgentToolPolicyService> _logger;

    public AgentToolPolicyService(
        ILogger<AgentToolPolicyService> logger)
    {
        _logger = logger;
    }

    public bool IsAllowed(
        string agentName,
        string toolName)
    {
        return AgentToolPolicies.IsAllowed(
            agentName,
            toolName);
    }

    public IReadOnlySet<string> GetAllowedTools(
        string agentName)
    {
        return AgentToolPolicies.GetAllowedTools(
            agentName);
    }

    public void EnsureAllowed(
        string agentName,
        string toolName)
    {
        if (IsAllowed(agentName, toolName))
        {
            _logger.LogDebug(
                "AI tool allowed. Agent={Agent}, Tool={Tool}",
                agentName,
                toolName);

            return;
        }

        _logger.LogWarning(
            "AI tool denied. Agent={Agent}, Tool={Tool}",
            agentName,
            toolName);

        throw new InvalidOperationException(
            $"Tool '{toolName}' is not allowed for agent '{agentName}'.");
    }
}

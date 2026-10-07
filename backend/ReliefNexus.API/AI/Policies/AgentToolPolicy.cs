using System;
using System.Collections.Generic;

namespace ReliefNexus.API.AI.Policies;

public static class AgentToolPolicies
{
    public const string RiskPrediction =
        "RiskPredictionAgent";

    public const string VulnerabilityImpact =
        "VulnerabilityImpactAgent";

    public const string ResourceOptimization =
        "ResourceOptimizationAgent";

    public const string EarlyWarningCoordination =
        "EarlyWarningCoordinationAgent";

    public const string VolunteerAssignment =
        "VolunteerAssignmentAgent";

    private static readonly Dictionary<string, HashSet<string>> Policies =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [RiskPrediction] = new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "WeatherTool",
                "DisasterDataTool",
                "SriLankaHazardDataTool",
                "RiskEngine"
            },

            [VulnerabilityImpact] = new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "PopulationTool",
                "PythonVulnerabilityService",
                "PostgreSQL"
            },

            [ResourceOptimization] = new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "PythonResourceService",
                "PostgreSQL"
            },

            [EarlyWarningCoordination] = new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "PythonEarlyWarningService",
                "PostgreSQL"
            },

            [VolunteerAssignment] = new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "PostgreSQL"
            }
        };

    public static bool IsAllowed(
        string agentName,
        string toolName)
    {
        if (string.IsNullOrWhiteSpace(agentName) ||
            string.IsNullOrWhiteSpace(toolName))
        {
            return false;
        }

        return Policies.TryGetValue(
                   agentName,
                   out var allowedTools)
               && allowedTools.Contains(toolName);
    }

    public static IReadOnlySet<string> GetAllowedTools(
        string agentName)
    {
        if (Policies.TryGetValue(
                agentName,
                out var allowedTools))
        {
            return allowedTools;
        }

        return new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);
    }
}

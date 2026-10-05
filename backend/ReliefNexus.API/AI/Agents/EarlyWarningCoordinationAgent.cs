using ReliefNexus.API.AI.Policies;
using ReliefNexus.API.AI.Services;
using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.AI.Agents;

public class EarlyWarningCoordinationAgent
{
    private readonly AppDbContext _context;
    private readonly IAgentExecutionService _agentExecutionService;
    private readonly IAgentToolPolicyService _agentToolPolicy;

    private readonly IPythonEarlyWarningService _pythonEarlyWarningService;
    public EarlyWarningCoordinationAgent(
        AppDbContext context,
        IAgentExecutionService agentExecutionService,
        IPythonEarlyWarningService pythonEarlyWarningService,
        IAgentToolPolicyService agentToolPolicy)
    {
        _agentToolPolicy = agentToolPolicy;
        _context = context;
        _agentExecutionService = agentExecutionService;
        _pythonEarlyWarningService = pythonEarlyWarningService;
    }

    public async Task<EmergencyAlert?> CreateAlertAsync(
        Guid vulnerabilityAssessmentId,
        Guid? existingExecutionId = null)
    {
        var assessment =
            await _context.VulnerabilityAssessments
                .FirstOrDefaultAsync(
                    x => x.Id == vulnerabilityAssessmentId);

        if (assessment == null)
            return null;

        RiskAgentExecution? execution;

        if (existingExecutionId.HasValue)
        {
            execution =
                await _context.RiskAgentExecutions
                    .FirstOrDefaultAsync(
                        x => x.Id == existingExecutionId.Value);

            if (execution == null)
                return null;

            if (execution.AgentName !=
                "Early Warning & Coordination Agent")
                return null;

            if (execution.ApprovalStatus != "Approved")
                return null;

            execution.CurrentStep =
                "Approved - Agent 04 execution resumed";

            execution.Status = "Running";

            await _context.SaveChangesAsync();
        }
        else
        {
            execution =
                await _agentExecutionService.StartAsync(
                    $"VulnerabilityAssessmentId={assessment.Id}; " +
                    $"RiskPredictionId={assessment.RiskPredictionId}; " +
                    $"Location={assessment.Location}; " +
                    $"DisasterType={assessment.DisasterType}; " +
                    $"RiskScore={assessment.RiskScore:F2}; " +
                    $"RiskLevel={assessment.RiskLevel}; " +
                    $"VulnerabilityScore={assessment.VulnerabilityScore:F2}; " +
                    $"VulnerabilityLevel={assessment.VulnerabilityLevel}; " +
                    $"ImpactScore={assessment.ImpactScore:F2}; " +
                    $"ImpactLevel={assessment.ImpactLevel}; " +
                    $"AffectedPopulation={assessment.AffectedPopulation}",

                    "Create and coordinate an early warning emergency alert " +
                    "using the validated Agent 01 risk prediction, Agent 02 " +
                    "vulnerability and impact assessment, and Agent 03 resource allocation.",

                    "1. Load vulnerability assessment; " +
                    "2. Check existing emergency alert; " +
                    "3. Load Agent 03 resource allocations; " +
                    "4. Determine severity; " +
                    "5. Build warning message and coordination actions; " +
                    "6. Persist emergency alert; " +
                    "7. Validate alert output.",

                    "Early Warning & Coordination Agent"
                );
        }

        var completedSteps = new List<string>();

        try
        {
            // =========================================================
            // STEP 1 - LOAD ASSESSMENT
            // =========================================================

            await _agentExecutionService.UpdateStepAsync(
                execution.Id,
                "Loading vulnerability and impact assessment",
                string.Join(" -> ", completedSteps),
                $"AssessmentId={assessment.Id}; " +
                $"RiskPredictionId={assessment.RiskPredictionId}"
            );

            completedSteps.Add(
                "Vulnerability and impact assessment loaded"
            );

            // =========================================================
            // STEP 2 - CHECK EXISTING ALERT
            // =========================================================

            await _agentExecutionService.UpdateStepAsync(
                execution.Id,
                "Checking existing emergency alert",
                string.Join(" -> ", completedSteps),
                $"VulnerabilityAssessmentId={vulnerabilityAssessmentId}"
            );

            var existingAlert =
                await _context.EmergencyAlerts
                    .FirstOrDefaultAsync(
                        x =>
                            x.VulnerabilityAssessmentId ==
                            vulnerabilityAssessmentId
                    );

            if (existingAlert != null)
            {
                completedSteps.Add(
                    "Existing emergency alert found"
                );

                await _agentExecutionService.CompleteAsync(
                    execution.Id,
                    assessment.RiskPredictionId,
                    $"Existing emergency alert reused. " +
                    $"AlertId={existingAlert.Id}; " +
                    $"Severity={existingAlert.Severity}; " +
                    $"Status={existingAlert.Status}",

                    "Existing alert found and validated.",

                    "Agent 04 completed using the existing emergency alert.",

                    "NotRequired"
                );

                return existingAlert;
            }

            completedSteps.Add(
                "No existing emergency alert found"
            );

            // =========================================================
            // STEP 3 - LOAD AGENT 03 RESOURCE ALLOCATIONS
            // =========================================================

            await _agentExecutionService.UpdateStepAsync(
                execution.Id,
                "Loading Agent 03 resource allocations",
                string.Join(" -> ", completedSteps),
                $"VulnerabilityAssessmentId={vulnerabilityAssessmentId}"
            );

            var allocations =
                await _context.ResourceAllocations
                    .Where(
                        x =>
                            x.VulnerabilityAssessmentId ==
                            vulnerabilityAssessmentId
                    )
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

            completedSteps.Add(
                $"Agent 03 resource allocations loaded: {allocations.Count}"
            );

            // =========================================================
            // STEP 4 - DETERMINE SEVERITY
            // =========================================================

            await _agentExecutionService.UpdateStepAsync(
                execution.Id,
                "Determining emergency severity",
                string.Join(" -> ", completedSteps),
                $"RiskScore={assessment.RiskScore:F2}; " +
                $"VulnerabilityScore={assessment.VulnerabilityScore:F2}; " +
                $"ImpactScore={assessment.ImpactScore:F2}; " +
                $"AffectedPopulation={assessment.AffectedPopulation}"
            );

            var severityScore =
                CalculateSeverityScore(
                    assessment.RiskScore,
                    assessment.VulnerabilityScore,
                    assessment.ImpactScore,
                    assessment.AffectedPopulation
                );

            var severity =
                DetermineSeverity(
                    severityScore,
                    assessment.RiskLevel,
                    assessment.VulnerabilityLevel,
                    assessment.ImpactLevel
                );

            completedSteps.Add(
                $"Emergency severity determined: {severity} ({severityScore:F1})"
            );

            // =========================================================
            // STEP 5 - BUILD WARNING + COORDINATION ACTIONS
            // =========================================================

            await _agentExecutionService.UpdateStepAsync(
                execution.Id,
                "Building warning and coordination actions",
                string.Join(" -> ", completedSteps),
                $"Severity={severity}; " +
                $"AllocationCount={allocations.Count}"
            );

            var title =
                BuildAlertTitle(
                    assessment.DisasterType,
                    assessment.Location,
                    severity
                );

            var message =
                BuildWarningMessage(
                    assessment,
                    severity
                );

            var recommendedActions =
                BuildRecommendedActions(
                    assessment,
                    severity,
                    allocations
                );

            var resourceSummary =
                BuildResourceSummary(
                    allocations
                );

            completedSteps.Add(
                "Warning message and coordination actions prepared"
            );

            _agentToolPolicy.EnsureAllowed(


                AgentToolPolicies.EarlyWarningCoordination,


                "PythonEarlyWarningService");


            var pythonEarlyWarningAnalysis =
                await _pythonEarlyWarningService.CoordinateAsync(
                new
                {
                    location = assessment.Location,
                    disaster_type = assessment.DisasterType,
                    severity_score = severityScore,
                    vulnerability_score = assessment.VulnerabilityScore,
                    impact_score = assessment.ImpactScore,
                    allocations = allocations.Select(x => new
                    {
                        resource_id = x.ResourceId,
                        resource_type = x.ResourceType,
                        resource_name = x.ResourceName,
                        recommended_quantity = x.RecommendedQuantity,
                        priority = x.Priority,
                        location = x.Location,
                        created_at = x.CreatedAt
                    }).ToList()
                });
            // =========================================================
            // STEP 6 - PERSIST EMERGENCY ALERT
            // =========================================================

            
        if (pythonEarlyWarningAnalysis.HasValue &&
            pythonEarlyWarningAnalysis.Value.TryGetProperty("usage", out var usage))
        {
            var inputTokens =
                usage.TryGetProperty("inputTokens", out var input)
                    ? input.GetInt32()
                    : 0;

            var outputTokens =
                usage.TryGetProperty("outputTokens", out var output)
                    ? output.GetInt32()
                    : 0;

            var totalTokens =
                usage.TryGetProperty("totalTokens", out var total)
                    ? total.GetInt32()
                    : 0;

            var modelName =
                usage.TryGetProperty("model", out var model)
                    ? model.GetString() ?? string.Empty
                    : string.Empty;

            await _agentExecutionService.RecordUsageAsync(
                execution.Id,
                inputTokens,
                outputTokens,
                totalTokens,
                modelName);
        }
await _agentExecutionService.UpdateStepAsync(
                execution.Id,
                "Persisting emergency alert",
                string.Join(" -> ", completedSteps),
                $"Title={title}; " +
                $"Severity={severity}; " +
                $"Status=Active"
            );

            var alert = new EmergencyAlert
            {
                Id = Guid.NewGuid(),

                RiskPredictionId =
                    assessment.RiskPredictionId,

                VulnerabilityAssessmentId =
                    assessment.Id,

                Title =
                    title,

                Message =
                    message,

                Location =
                    assessment.Location,

                DisasterType =
                    assessment.DisasterType,

                Severity =
                    severity,

                Status =
                    "Active",

                RecommendedActions =
                    recommendedActions,

                ResourceSummary =
                    resourceSummary,

                CreatedAt =
                    DateTime.UtcNow,

                IsActive =
                    true
            };

            _context.EmergencyAlerts.Add(alert);

            await _context.SaveChangesAsync();

            completedSteps.Add(
                $"Emergency alert persisted: {alert.Id}"
            );

            // =========================================================
            // STEP 7 - VALIDATE OUTPUT
            // =========================================================

            await _agentExecutionService.UpdateStepAsync(
                execution.Id,
                "Validating emergency alert output",
                string.Join(" -> ", completedSteps),
                $"AlertId={alert.Id}; " +
                $"Severity={alert.Severity}; " +
                $"Status={alert.Status}"
            );

            var validationErrors =
                ValidateAlert(
                    alert,
                    assessment
                );

            if (validationErrors.Count > 0)
            {
                var validationMessage =
                    string.Join(
                        "; ",
                        validationErrors
                    );

                await _agentExecutionService.FailAsync(
                    execution.Id,
                    validationMessage
                );

                throw new InvalidOperationException(
                    $"Agent 04 validation failed: {validationMessage}"
                );
            }

            completedSteps.Add(
                "Emergency alert output validated successfully"
            );

            var outputSummary =
                $"Emergency alert created successfully. " +
                $"AlertId={alert.Id}; " +
                $"Severity={alert.Severity}; " +
                $"Location={alert.Location}; " +
                $"DisasterType={alert.DisasterType}; " +
                $"ResourceAllocations={allocations.Count}"
            ;

            var validationResults =
                "PASS: Risk prediction linked; " +
                "PASS: Vulnerability assessment linked; " +
                "PASS: Severity calculated; " +
                "PASS: Warning message generated; " +
                "PASS: Coordination actions generated; " +
                "PASS: Emergency alert persisted; " +
                "PASS: Alert output validated.";

            await _agentExecutionService.CompleteAsync(
                execution.Id,
                assessment.RiskPredictionId,
                outputSummary,
                validationResults,
                "Agent 04 Early Warning & Coordination completed successfully.",
                "NotRequired"
            );

            return alert;
        }
        catch (Exception ex)
        {
            try
            {
                await _agentExecutionService.FailAsync(
                    execution.Id,
                    $"Agent 04 failed: {ex.Message}"
                );
            }
            catch
            {
                // Do not hide the original exception.
            }

            throw;
        }
    }

    // =============================================================
    // SEVERITY CALCULATION
    // =============================================================

    private static double CalculateSeverityScore(
        double riskScore,
        double vulnerabilityScore,
        double impactScore,
        int affectedPopulation)
    {
        var risk =
            Clamp(riskScore);

        var vulnerability =
            Clamp(vulnerabilityScore);

        var impact =
            Clamp(impactScore);

        var populationFactor =
            affectedPopulation <= 0
                ? 10
                : affectedPopulation >= 10000
                    ? 100
                    : affectedPopulation >= 5000
                        ? 80
                        : affectedPopulation >= 1000
                            ? 60
                            : affectedPopulation >= 500
                                ? 40
                                : 20;

        return Math.Round(
            (
                risk * 0.40 +
                vulnerability * 0.25 +
                impact * 0.25 +
                populationFactor * 0.10
            ),
            1
        );
    }

    private static string DetermineSeverity(
        double severityScore,
        string? riskLevel,
        string? vulnerabilityLevel,
        string? impactLevel)
    {
        if (
            severityScore >= 75 ||
            IsLevel(riskLevel, "Critical") ||
            IsLevel(vulnerabilityLevel, "Critical") ||
            IsLevel(impactLevel, "Critical")
        )
        {
            return "Critical";
        }

        if (
            severityScore >= 55 ||
            IsLevel(riskLevel, "High") ||
            IsLevel(vulnerabilityLevel, "High") ||
            IsLevel(impactLevel, "High")
        )
        {
            return "High";
        }

        if (
            severityScore >= 30 ||
            IsLevel(riskLevel, "Medium") ||
            IsLevel(vulnerabilityLevel, "Medium") ||
            IsLevel(impactLevel, "Medium")
        )
        {
            return "Medium";
        }

        return "Low";
    }

    private static bool IsLevel(
        string? value,
        string expected)
    {
        return string.Equals(
            value?.Trim(),
            expected,
            StringComparison.OrdinalIgnoreCase
        );
    }

    private static double Clamp(double value)
    {
        if (double.IsNaN(value) ||
            double.IsInfinity(value))
        {
            return 0;
        }

        return Math.Max(
            0,
            Math.Min(100, value)
        );
    }

    // =============================================================
    // ALERT TITLE
    // =============================================================

    private static string BuildAlertTitle(
        string disasterType,
        string location,
        string severity)
    {
        var disaster =
            string.IsNullOrWhiteSpace(disasterType)
                ? "Disaster"
                : disasterType.Trim();

        var place =
            string.IsNullOrWhiteSpace(location)
                ? "Affected Area"
                : location.Trim();

        return
            $"{severity} {disaster} Early Warning - {place}";
    }

    // =============================================================
    // WARNING MESSAGE
    // =============================================================

    private static string BuildWarningMessage(
        VulnerabilityAssessment assessment,
        string severity)
    {
        var disaster =
            string.IsNullOrWhiteSpace(
                assessment.DisasterType)
                ? "disaster"
                : assessment.DisasterType;

        var location =
            string.IsNullOrWhiteSpace(
                assessment.Location)
                ? "the affected area"
                : assessment.Location;

        var population =
            Math.Max(
                assessment.AffectedPopulation,
                0
            );

        return
            $"{severity} early warning issued for {disaster} " +
            $"risk in {location}. " +
            $"The assessment indicates a risk score of " +
            $"{assessment.RiskScore:F1}, vulnerability score of " +
            $"{assessment.VulnerabilityScore:F1}, and impact score of " +
            $"{assessment.ImpactScore:F1}. " +
            $"Estimated affected population: {population:N0}. " +
            $"Response teams should follow the recommended coordination " +
            $"actions and monitor the situation closely.";
    }

    // =============================================================
    // RECOMMENDED ACTIONS
    // =============================================================

    private static string BuildRecommendedActions(
        VulnerabilityAssessment assessment,
        string severity,
        List<ResourceAllocation> allocations)
    {
        var actions =
            new List<string>();

        actions.Add(
            $"Issue {severity.ToLowerInvariant()} early warning " +
            $"for {assessment.Location}."
        );

        actions.Add(
            $"Coordinate disaster response teams for " +
            $"{assessment.DisasterType}."
        );

        actions.Add(
            "Monitor updated risk, vulnerability and impact indicators."
        );

        if (assessment.AffectedPopulation > 0)
        {
            actions.Add(
                $"Prepare response support for approximately " +
                $"{assessment.AffectedPopulation:N0} affected people."
            );
        }

        if (allocations.Count > 0)
        {
            actions.Add(
                $"Coordinate the {allocations.Count} Agent 03 " +
                $"resource allocation record(s)."
            );
        }
        else
        {
            actions.Add(
                "No Agent 03 resource allocation is currently linked; " +
                "check available relief resources."
            );
        }

        if (
            string.Equals(
                severity,
                "Critical",
                StringComparison.OrdinalIgnoreCase)
        )
        {
            actions.Add(
                "Escalate immediately to the responsible emergency " +
                "coordination authority."
            );
        }
        else if (
            string.Equals(
                severity,
                "High",
                StringComparison.OrdinalIgnoreCase)
        )
        {
            actions.Add(
                "Notify the responsible emergency response team " +
                "and maintain active coordination."
            );
        }
        else
        {
            actions.Add(
                "Continue preparedness and situation monitoring."
            );
        }

        return string.Join(
            " | ",
            actions
        );
    }

    // =============================================================
    // RESOURCE SUMMARY
    // =============================================================

    private static string BuildResourceSummary(
        List<ResourceAllocation> allocations)
    {
        if (allocations.Count == 0)
        {
            return
                "No Agent 03 resource allocations are currently linked " +
                "to this vulnerability assessment.";
        }

        var totalQuantity =
            allocations.Sum(
                x =>
                    Math.Max(
                        x.RecommendedQuantity,
                        0
                    )
            );

        var grouped =
            allocations
                .GroupBy(
                    x =>
                        string.IsNullOrWhiteSpace(
                            x.ResourceType)
                            ? "Other"
                            : x.ResourceType
                )
                .Select(
                    group =>
                        $"{group.Key}: " +
                        $"{group.Sum(x => Math.Max(x.RecommendedQuantity, 0))} units"
                );

        return
            $"Allocation records: {allocations.Count}; " +
            $"Total recommended quantity: {totalQuantity}; " +
            $"Breakdown: {string.Join(", ", grouped)}";
    }

    // =============================================================
    // VALIDATION
    // =============================================================

    private static List<string> ValidateAlert(
        EmergencyAlert alert,
        VulnerabilityAssessment assessment)
    {
        var errors =
            new List<string>();

        if (alert.Id == Guid.Empty)
            errors.Add("Alert ID is missing.");

        if (
            alert.RiskPredictionId !=
            assessment.RiskPredictionId)
        {
            errors.Add(
                "Risk prediction link is invalid."
            );
        }

        if (
            alert.VulnerabilityAssessmentId !=
            assessment.Id)
        {
            errors.Add(
                "Vulnerability assessment link is invalid."
            );
        }

        if (string.IsNullOrWhiteSpace(alert.Title))
            errors.Add("Alert title is empty.");

        if (string.IsNullOrWhiteSpace(alert.Message))
            errors.Add("Alert message is empty.");

        if (string.IsNullOrWhiteSpace(alert.Location))
            errors.Add("Alert location is empty.");

        if (string.IsNullOrWhiteSpace(alert.DisasterType))
            errors.Add("Disaster type is empty.");

        if (string.IsNullOrWhiteSpace(alert.Severity))
            errors.Add("Severity is empty.");

        if (string.IsNullOrWhiteSpace(alert.Status))
            errors.Add("Alert status is empty.");

        if (string.IsNullOrWhiteSpace(
                alert.RecommendedActions))
        {
            errors.Add(
                "Recommended actions are empty."
            );
        }

        if (string.IsNullOrWhiteSpace(
                alert.ResourceSummary))
        {
            errors.Add(
                "Resource summary is empty."
            );
        }

        if (!alert.IsActive)
        {
            errors.Add(
                "New emergency alert must be active."
            );
        }

        return errors;
    }
}












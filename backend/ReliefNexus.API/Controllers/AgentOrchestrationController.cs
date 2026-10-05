using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.AI.Services;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Data;
using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/ai/orchestrator")]
[Authorize(Policy = "Permission:AI Agent Monitoring")]
public sealed class AgentOrchestrationController : ControllerBase
{
    private readonly IPythonOrchestratorService _orchestrator;
    private readonly IRiskPredictionService _riskPredictionService;
    private readonly IAgentExecutionService _agentExecutionService;
    private readonly VulnerabilityImpactAgent _vulnerabilityAgent;
    private readonly ResourceOptimizationAgent _resourceAgent;
    private readonly EarlyWarningCoordinationAgent _warningAgent;
    private readonly VolunteerAssignmentAgent _volunteerAgent;
    private readonly IDisasterReportService _disasterReportService;
    private readonly AppDbContext _context;

    public AgentOrchestrationController(
        IPythonOrchestratorService orchestrator,
        IRiskPredictionService riskPredictionService,
        IAgentExecutionService agentExecutionService,
        VulnerabilityImpactAgent vulnerabilityAgent,
        ResourceOptimizationAgent resourceAgent,
        EarlyWarningCoordinationAgent warningAgent,
        VolunteerAssignmentAgent volunteerAgent,
        IDisasterReportService disasterReportService,
        AppDbContext context)
    {
        _orchestrator = orchestrator;
        _riskPredictionService = riskPredictionService;
        _agentExecutionService = agentExecutionService;
        _vulnerabilityAgent = vulnerabilityAgent;
        _resourceAgent = resourceAgent;
        _warningAgent = warningAgent;
        _volunteerAgent = volunteerAgent;
        _disasterReportService = disasterReportService;
        _context = context;
    }

    public sealed record OrchestrateRequest(
        string Prompt,
        RiskPredictionDto? RiskInput = null,
        Guid? DisasterReportId = null,
        bool ExecuteAgents = true,
        int MaxReplans = 2,
        string ExecutionMode = "backend_execution");

    public sealed record SimulationRequest(
        string Prompt,
        Dictionary<string, object>? State = null,
        Dictionary<string, double>? Changes = null);

    private Guid? GetCurrentUserId()
    {
        var value =
            User.FindFirstValue("sub")
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(value, out var id) ? id : null;
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run(
        [FromBody] OrchestrateRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
            return BadRequest(new { message = "Prompt is required." });

        if (request.Prompt.Length > 4000)
            return BadRequest(new { message = "Prompt is too long." });

        // Python is the planning/reasoning layer. It does NOT mutate the
        // production database or execute duplicate local agent copies here.
        var planResult = await _orchestrator.OrchestrateAsync(
            new
            {
                prompt = request.Prompt,
                state = new
                {
                    risk_input = request.RiskInput
                },
                execute_agents = false,
                max_replans = Math.Clamp(request.MaxReplans, 0, 3),
                execution_mode = request.ExecutionMode
            },
            cancellationToken);

        if (planResult is null)
        {
            return StatusCode(503, new
            {
                message = "AI orchestration service is unavailable."
            });
        }

        if (!request.ExecuteAgents)
            return Ok(planResult.Value);

        var orchestrationResult = planResult.Value;

        if (request.RiskInput is null ||
            !request.RiskInput.Latitude.HasValue ||
            !request.RiskInput.Longitude.HasValue)
        {
            return BadRequest(new
            {
                message = "Real agent execution requires RiskInput latitude and longitude.",
                next_step = "Provide RiskInput with location, latitude and longitude. The system will not invent coordinates."
            });
        }

        var plan = ExtractPlan(orchestrationResult);

        // The backend owns real agent execution. Python only plans and
        // recommends the sequence.
        var trace = new List<object>();
        var decisions = new List<string>();
        var sharedState = new Dictionary<string, object?>();

Guid? riskPredictionId = null;
        Guid? vulnerabilityAssessmentId = null;

        var completedAgents = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

        var replanCount = 0;
        var maxReplans = Math.Clamp(request.MaxReplans, 0, 3);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var step = plan
                .OrderBy(x => x.Step)
                .FirstOrDefault(x => !completedAgents.Contains(x.Agent));

            if (step is null)
                break;

            // Mark the selected agent as completed before execution.
            // This prevents a skipped/continued step from looping forever.
            completedAgents.Add(step.Agent);

            switch (step.Agent)
            {
                case "Risk Prediction Agent":
                {
                    var userId = GetCurrentUserId();
                    if (userId == null)
                        return Unauthorized();

                    var input = request.RiskInput!;
                    var execution = await _agentExecutionService.StartAsync(
                        $"Orchestrated prompt={request.Prompt}; Location={input.Location}; Latitude={input.Latitude}; Longitude={input.Longitude}",
                        "Execute the authoritative Risk Prediction Agent as the first step of the supervised disaster workflow.",
                        "Collect evidence -> calculate risk -> validate -> persist RiskPrediction.",
                        "Risk Prediction Agent");

                    try
                    {
                        var result = await _riskPredictionService.CreateAsync(
                            userId.Value,
                            input,
                            execution.Id);

                        if (!result.Id.HasValue)
                            throw new InvalidOperationException("Risk prediction did not return an ID.");

                        riskPredictionId = result.Id.Value;

                        await _agentExecutionService.CompleteAsync(
                            execution.Id,
                            riskPredictionId.Value,
                            $"DisasterType={result.DisasterType}; RiskScore={result.RiskScore:F2}; RiskLevel={result.RiskLevel}; Confidence={result.Confidence:F2}",
                            "Deterministic risk result and persistence validation completed.",
                            result.RiskScore >= 75
                                ? "Risk prediction completed; human approval required."
                                : "Risk prediction completed successfully.",
                            result.RiskScore >= 75 ? "Pending" : "NotRequired");

                        trace.Add(new
                        {
                            step = step.Step,
                            agent = step.Agent,
                            status = "completed",
                            risk_prediction_id = riskPredictionId,
                            risk_score = result.RiskScore,
                            risk_level = result.RiskLevel,
                            confidence = result.Confidence
                        });
                        // ============================================================
                        // SHARED STATE SYNC
                        // REAL AGENT 01 -> PYTHON SUPERVISOR
                        // ============================================================

                        sharedState["location"] = input.Location;
                        sharedState["hazard"] = result.DisasterType;

                        sharedState["risk_input"] = new
                        {
                            location = input.Location,
                            latitude = input.Latitude,
                            longitude = input.Longitude,
                            disaster_type = input.DisasterType
                        };

                        sharedState["risk"] = new
                        {
                            status = "completed",
                            risk_prediction_id = result.Id,
                            risk_score = result.RiskScore,
                            risk_level = result.RiskLevel,
                            confidence = result.Confidence,
                            disaster_type = result.DisasterType
                        };

                        // Send the REAL backend observation to Python.
                        // Python only replans here; it does NOT execute agents.
                        JsonElement? syncedPlanResult = null;

                        if (replanCount < maxReplans)
                        {
                            replanCount++;

                            syncedPlanResult =
                                await _orchestrator.OrchestrateAsync(
                                    new
                                    {
                                        prompt = request.Prompt,
                                        state = sharedState,
                                        execute_agents = false,
                                        max_replans = 0
                                    },
                                    cancellationToken);
                        }

                        if (syncedPlanResult.HasValue)
                        {
                            decisions.Add(
                                "Real Agent 01 result synchronized with Python Supervisor.");

                            var syncedPlan = ExtractPlan(syncedPlanResult.Value);

                            if (syncedPlan.Count > 0)
                            {
                                plan = syncedPlan;

                                decisions.Add(
                                    "State-aware Python plan applied to remaining backend execution.");
                            }

                            decisions.Add(
                                $"Python Supervisor generated a state-aware plan with {syncedPlan.Count} step(s).");
                        }
                        else
                        {
                            decisions.Add(
                                "Python Supervisor synchronization was unavailable; backend execution continued safely.");
                        }
                    }
                    catch (Exception ex)
                    {
                        await _agentExecutionService.FailAsync(execution.Id, ex.Message);
                        decisions.Add("Risk Prediction failed; downstream execution stopped safely.");
                        return Ok(new
                        {
                            workflow_id = GetWorkflowId(orchestrationResult),
                            status = "failed",
                            plan = plan,
                            trace,
                            decisions,
                            validation = new { valid = false, errors = new[] { ex.Message } },
                            approval = new { required = false, status = "NotRequired" }
                        });
                    }

                    break;
                }

                case "Vulnerability & Impact Agent":
                {
                    if (!riskPredictionId.HasValue)
                    {
                        decisions.Add("Vulnerability step skipped because RiskPredictionId is unavailable.");
                        continue;
                    }

                    var assessment = await _vulnerabilityAgent.AssessAsync(
                        riskPredictionId.Value);

                    if (assessment == null)
                    {
                        decisions.Add("Vulnerability assessment failed; workflow stopped safely.");
                        return Ok(new
                        {
                            workflow_id = GetWorkflowId(orchestrationResult),
                            status = "needs_review",
                            plan,
                            trace,
                            decisions,
                            validation = new { valid = false, errors = new[] { "Vulnerability assessment unavailable." } },
                            approval = new { required = false, status = "NotRequired" }
                        });
                    }

                    vulnerabilityAssessmentId = assessment.Id;

                    trace.Add(new
                    {
                        step = step.Step,
                        agent = step.Agent,
                        status = "completed",
                        vulnerability_assessment_id = assessment.Id,
                        vulnerability_score = assessment.VulnerabilityScore,
                        impact_score = assessment.ImpactScore,
                        severity_level = assessment.VulnerabilityLevel
                    });
                    // ============================================================
                    // SHARED STATE SYNC
                    // REAL AGENT 02 -> PYTHON SUPERVISOR
                    // ============================================================

                    sharedState["vulnerability"] = new
                    {
                        status = "completed",
                        vulnerability_assessment_id = assessment.Id,
                        vulnerability_score = assessment.VulnerabilityScore,
                        impact_score = assessment.ImpactScore,
                        severity_level = assessment.VulnerabilityLevel
                    };

                    // Give the REAL Agent 02 observation back to Python.
                    // Python only replans; it does NOT execute duplicate agents.
                    JsonElement? vulnerabilitySyncResult = null;

                    if (replanCount < maxReplans)
                    {
                        replanCount++;

                        vulnerabilitySyncResult =
                            await _orchestrator.OrchestrateAsync(
                                new
                                {
                                    prompt = request.Prompt,
                                    state = sharedState,
                                    execute_agents = false,
                                    max_replans = 0,
                                    execution_mode = "backend_execution"
                                },
                                cancellationToken);
                    }

                    if (vulnerabilitySyncResult.HasValue)
                    {
                        var vulnerabilityPlan =
                            ExtractPlan(vulnerabilitySyncResult.Value);

                        if (vulnerabilityPlan.Count > 0)
                        {
                            plan = vulnerabilityPlan;

                            decisions.Add(
                                "Real Agent 02 result synchronized with Python Supervisor.");

                            decisions.Add(
                                "Vulnerability-aware Python plan applied to remaining backend execution.");
                        }
                    }
                    else
                    {
                        decisions.Add(
                            "Python Supervisor synchronization after Agent 02 was unavailable; backend execution continued safely.");
                    }

                    break;
                }

                case "Resource Optimization Agent":
                {
                    if (!vulnerabilityAssessmentId.HasValue)
                    {
                        decisions.Add("Resource step skipped because VulnerabilityAssessmentId is unavailable.");
                        continue;
                    }

                    var demand = await _resourceAgent.GetDemandAssessmentAsync(
                        vulnerabilityAssessmentId.Value);

                    trace.Add(new
                    {
                        step = step.Step,
                        agent = step.Agent,
                        status = demand?.Priority is "High" or "Critical"
                            ? "completed"
                            : "not_eligible",
                        vulnerability_assessment_id = vulnerabilityAssessmentId,
                        priority = demand?.Priority,
                        severity_index = demand?.SeverityIndex,
                        resource_count = demand?.Resources.Count ?? 0
                    });

                    if (demand?.Priority is "Low" or "Medium")
                    {
                        decisions.Add("Resource optimization is not eligible for the current priority.");
                    }

                    // ============================================================
                    // SHARED STATE SYNC
                    // REAL AGENT 03 -> PYTHON SUPERVISOR
                    // ============================================================

                    sharedState["resource"] = new
                    {
                        status = demand == null
                            ? "unavailable"
                            : "completed",
                        priority = demand?.Priority,
                        severity_index = demand?.SeverityIndex,
                        resource_count = demand?.Resources.Count ?? 0,
                        recommendations = demand?.Resources
                            .Select(x => new
                            {
                                resource_id = x.ResourceId,
                                resource_type = x.ResourceType,
                                resource_name = x.ResourceName,
                                recommended_quantity = x.RequiredQuantity,
                                priority = x.CoverageStatus,
                                location = x.Location
                            })
                            .ToList()
                    };

                    if (replanCount < maxReplans)
                    {
                        replanCount++;

                        var resourceSyncResult =
                            await _orchestrator.OrchestrateAsync(
                                new
                                {
                                    prompt = request.Prompt,
                                    state = sharedState,
                                    execute_agents = false,
                                    max_replans = 0,
                                    execution_mode = "backend_execution"
                                },
                                cancellationToken);

                        if (resourceSyncResult.HasValue)
                        {
                            var resourcePlan =
                                ExtractPlan(resourceSyncResult.Value);

                            if (resourcePlan.Count > 0)
                            {
                                plan = resourcePlan;

                                decisions.Add(
                                    "Real Agent 03 result synchronized with Python Supervisor.");

                                decisions.Add(
                                    "Resource-aware Python plan applied to remaining backend execution.");
                            }
                        }
                        else
                        {
                            decisions.Add(
                                "Python Supervisor synchronization after Agent 03 was unavailable; backend execution continued safely.");
                        }
                    }
                    else
                    {
                        decisions.Add(
                            "Maximum Python replans reached; no further dynamic replanning will occur.");
                    }

                    break;
                }

                case "Early Warning & Coordination Agent":
{
    var approvalExecution =
        await _agentExecutionService.StartAsync(
            $"Workflow: {GetWorkflowId(orchestrationResult)}; " +
            $"RiskPredictionId: {riskPredictionId}; " +
            $"VulnerabilityAssessmentId: {vulnerabilityAssessmentId}; " +
            $"Location: {request.RiskInput!.Location}; " +
            $"Hazard: {request.RiskInput!.DisasterType}",
            "Prepare and activate emergency warning for the assessed disaster.",
            "Human approval required before creating or activating an emergency alert.",
            "Early Warning & Coordination Agent");

    approvalExecution.RiskPredictionId = riskPredictionId;
    approvalExecution.CurrentStep = "Awaiting human approval";
    approvalExecution.Status = "AwaitingApproval";
    approvalExecution.ApprovalStatus = "Pending";

    await _context.SaveChangesAsync();

    trace.Add(new
    {
        step = step.Step,
        agent = step.Agent,
        status = "awaiting_approval",
        approval_required = true,
        action_blocked = true,
        execution_id = approvalExecution.Id,
        approval_status = approvalExecution.ApprovalStatus,
        reason = "Pre-action human approval is required before creating or activating an emergency alert."
    });

    decisions.Add(
        "Agent 04 blocked before real-world action; human approval is required.");

    continue;

                    /*
                    if (!vulnerabilityAssessmentId.HasValue)
                    {
                        decisions.Add("Warning step skipped because VulnerabilityAssessmentId is unavailable.");
                        continue;
                    }

                    var alert = await _warningAgent.CreateAlertAsync(
                        vulnerabilityAssessmentId.Value);

                    trace.Add(new
                    {
                        step = step.Step,
                        agent = step.Agent,
                        status = alert == null ? "failed" : "completed",
                        emergency_alert_id = alert?.Id,
                        approval_required = true
                    });

                    decisions.Add(
                        alert == null
                            ? "Early warning generation failed."
                            : "Early warning recommendation persisted; real-world action remains governed by approval.");
                    break;
                    */
                }

                case "Volunteer Assignment Agent":
{
    var approvalExecution =
        await _agentExecutionService.StartAsync(
            $"Workflow: {GetWorkflowId(orchestrationResult)}; Location: {request.RiskInput!.Location}; Hazard: {request.RiskInput!.DisasterType}",
            "Prepare and execute volunteer assignment for the assessed disaster.",
            "Human approval required before assigning volunteers.",
            "Volunteer Assignment Agent");

    approvalExecution.CurrentStep = "Awaiting human approval";
    approvalExecution.Status = "AwaitingApproval";

    await _context.SaveChangesAsync();

    trace.Add(new
    {
        step = step.Step,
        agent = step.Agent,
        status = "awaiting_approval",
        approval_required = true,
        action_blocked = true,
        execution_id = approvalExecution.Id,
        approval_status = approvalExecution.ApprovalStatus,
        reason = "Pre-action human approval is required before volunteer assignment."
    });

    decisions.Add(
        "Agent 05 blocked before assignment; human approval is required.");

    continue;

                    /*
                    if (!request.DisasterReportId.HasValue)
                    {
                        trace.Add(new
                        {
                            step = step.Step,
                            agent = step.Agent,
                            status = "planned_only",
                            approval_required = true
                        });
                        decisions.Add("Volunteer assignment requires a DisasterReportId and authorized human approval.");
                        continue;
                    }

                    var report = await _context.DisasterReports
                        .FirstOrDefaultAsync(
                            x => x.Id == request.DisasterReportId.Value,
                            cancellationToken);

                    if (report == null)
                    {
                        decisions.Add("Volunteer assignment skipped because the requested disaster report was not found.");
                        continue;
                    }

                    var recommendation = await _volunteerAgent.RecommendAsync(report);

                    trace.Add(new
                    {
                        step = step.Step,
                        agent = step.Agent,
                        status = "planned_only",
                        recommendation,
                        approval_required = true
                    });

                    decisions.Add("Volunteer recommendation generated; assignment remains a human-authorized backend action.");
                    break;
                    */
                }
            }
        }

        var validationErrors = new List<string>();

        if (trace.Count == 0)
            validationErrors.Add("No executable agent step completed.");

        var riskTrace = trace
            .OfType<object>()
            .ToList();

        var requiresApproval =
            plan.Any(x => x.ApprovalRequired);

        return Ok(new
        {
            workflow_id = GetWorkflowId(orchestrationResult),
            status = validationErrors.Count == 0 ? "completed" : "needs_review",
            intent = GetProperty(orchestrationResult, "intent"),
            plan,
            trace,
            decisions,
            validation = new
            {
                valid = validationErrors.Count == 0,
                errors = validationErrors
            },
            approval = new
            {
                required = requiresApproval,
                status = requiresApproval ? "Pending" : "NotRequired",
                note = "AI planning never bypasses backend authorization or human approval."
            },
            replans = replanCount,
            real_agent_execution = true,
            python_planning = planResult
        });
    }

    [HttpPost("simulate")]
    public async Task<IActionResult> Simulate(
        [FromBody] SimulationRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
            return BadRequest(new { message = "Prompt is required." });

        var result = await _orchestrator.SimulateAsync(
            new
            {
                prompt = request.Prompt,
                state = request.State ?? new(),
                changes = request.Changes ?? new()
            },
            cancellationToken);

        if (result is null)
            return StatusCode(503, new
            {
                message = "AI orchestration service is unavailable."
            });

        return Ok(result);
    }

    private static string GetWorkflowId(JsonElement result)
    {
        return result.TryGetProperty("workflow_id", out var value)
            ? value.GetString() ?? Guid.NewGuid().ToString()
            : Guid.NewGuid().ToString();
    }

    private static JsonElement? GetProperty(JsonElement result, string property)
    {
        return result.TryGetProperty(property, out var value)
            ? value
            : null;
    }

    private static List<PlanStep> ExtractPlan(JsonElement result)
    {
        var output = new List<PlanStep>();

        if (!result.TryGetProperty("plan", out var plan) ||
            plan.ValueKind != JsonValueKind.Array)
        {
            return output;
        }

        foreach (var item in plan.EnumerateArray())
        {
            if (!item.TryGetProperty("agent", out var agentElement))
                continue;

            output.Add(new PlanStep(
                item.TryGetProperty("step", out var step) ? step.GetInt32() : output.Count + 1,
                agentElement.GetString() ?? string.Empty,
                item.TryGetProperty("objective", out var objective)
                    ? objective.GetString() ?? string.Empty
                    : string.Empty,
                item.TryGetProperty("approval_required", out var approval)
                    && approval.GetBoolean()));
        }

        return output;
    }

    private sealed record PlanStep(
        int Step,
        string Agent,
        string Objective,
        bool ApprovalRequired);
}
















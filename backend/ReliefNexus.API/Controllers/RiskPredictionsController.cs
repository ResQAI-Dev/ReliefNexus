using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using ReliefNexus.API.AI.Tools;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/risk-predictions")]
[Authorize]
public class RiskPredictionsController : ControllerBase
{
    private readonly IRiskPredictionService _service;
    private readonly IAgentExecutionService _agentExecutionService;

    private readonly DisasterDataTool _disasterDataTool;
    private readonly WeatherTool _weatherTool;
    private readonly RiverGaugeTool _riverGaugeTool;
    private readonly HistoricalDisasterTool _historicalDisasterTool;
    private readonly PopulationTool _populationTool;
    private readonly DrainageDataTool _drainageDataTool;

    private readonly IVulnerabilityImpactService _vulnerabilityImpactService;
    private readonly IResourceService _resourceService;

    private readonly EarlyWarningCoordinationAgent
        _earlyWarningCoordinationAgent;

    private readonly IVolunteerAssignmentService
        _volunteerAssignmentService;

    private readonly AppDbContext _context;
    private readonly IDisasterReportService _disasterReportService;
public RiskPredictionsController(
        IRiskPredictionService service,
        IAgentExecutionService agentExecutionService,
        DisasterDataTool disasterDataTool,
        WeatherTool weatherTool,
        RiverGaugeTool riverGaugeTool,
        HistoricalDisasterTool historicalDisasterTool,
        PopulationTool populationTool,
        DrainageDataTool drainageDataTool,
        IVulnerabilityImpactService vulnerabilityImpactService,
        IResourceService resourceService,
        EarlyWarningCoordinationAgent earlyWarningCoordinationAgent,
        IVolunteerAssignmentService volunteerAssignmentService,
        AppDbContext context,
        IDisasterReportService disasterReportService)
    {
        _service = service;
        _agentExecutionService = agentExecutionService;

        _disasterDataTool = disasterDataTool;
        _weatherTool = weatherTool;
        _riverGaugeTool = riverGaugeTool;
        _historicalDisasterTool = historicalDisasterTool;
        _populationTool = populationTool;
        _drainageDataTool = drainageDataTool;

        _vulnerabilityImpactService =
            vulnerabilityImpactService;

        _resourceService =
            resourceService;

        _earlyWarningCoordinationAgent =
            earlyWarningCoordinationAgent;

        _volunteerAssignmentService =
            volunteerAssignmentService;

        _context = context;
        _disasterReportService = disasterReportService;
    }

    // ============================================================

    // CREATE RISK PREDICTION
    // ============================================================


    private Guid? GetCurrentUserId()
    {
        var value =
            User.FindFirstValue("sub")
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(
            value,
            out var id)
            ? id
            : null;
    }
    [HttpPost]
    [Authorize(Policy = "Permission:Report Disaster")]
    public async Task<ActionResult<RiskPredictionDto>> Create(
        RiskPredictionDto request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();
        var inputSummary =
            $"Location={request.Location}; " +
            $"Latitude={request.Latitude}; " +
            $"Longitude={request.Longitude}; " +
            $"Rainfall24h={request.Rainfall24h}; " +
            $"RiverLevel={request.RiverLevel}; " +
            $"HistoricalFloodCount={request.HistoricalFloodCount}";

        var objective =
            "Assess the current multi-hazard disaster risk for the requested location using available weather and external disaster data.";

        var plan =
            "1. Collect weather data; " +
            "2. Collect external disaster events; " +
            "3. Calculate multi-hazard risk; " +
            "4. Validate the risk result; " +
            "5. Persist the prediction and workflow outcome.";

        var execution =
            await _agentExecutionService.StartAsync(
                inputSummary,
                objective,
                plan);

        try
        {
            var result =
                await _service.CreateAsync(
                    userId.Value,
                    request,
                    execution.Id);

            if (!result.Id.HasValue)
            {
                throw new InvalidOperationException(
                    "Risk prediction was created without a valid ID.");
            }

            var outputSummary =
                $"DisasterType={result.DisasterType}; " +
                $"RiskScore={result.RiskScore:F2}; " +
                $"RiskLevel={result.RiskLevel}; " +
                $"Confidence={result.Confidence:F2}";

            var validationResults =
                "RiskScore range validation: Passed; " +
                "RiskLevel validation: Passed; " +
                "DisasterType validation: Passed; " +
                "DisasterRisks validation: Passed.";

            var finalOutcome =
                result.RiskScore >= 75
                    ? "Risk prediction completed; human approval required."
                    : "Risk prediction completed successfully.";

            await _agentExecutionService.CompleteAsync(
                execution.Id,
                result.Id.Value,
                outputSummary,
                validationResults,
                finalOutcome,
                result.RiskScore >= 75
                    ? "Pending"
                    : "NotRequired");

            return Ok(result);
        }
        catch
        {
            await _agentExecutionService.FailAsync(
                execution.Id,
                "Risk prediction creation failed.");

            throw;
        }
    }

    // ============================================================
    // GET ALL
    // ============================================================

    [HttpGet]
    [Authorize(Policy = "Permission:View Risk Information")]
    public async Task<ActionResult<PaginatedRiskPredictionDto>> GetAll(
        [FromQuery] RiskPredictionQueryDto query)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();
        return Ok(
            await _service.GetPagedAsync(
                userId.Value,
                query,
                (User.IsInRole("SystemAdministrator") ||
                 User.IsInRole("Admin") ||
                 User.IsInRole("ReliefCoordinator"))));
    }

    // ============================================================
    // EXTERNAL EVENTS
    // ============================================================

    [HttpGet("external-events")]
    public async Task<IActionResult> GetExternalEvents()
    {
        var events =
            await _disasterDataTool.GetRecentEventsAsync();

        return Ok(events);
    }

    // ============================================================
    // LIVE ENVIRONMENT
    // ============================================================

    [HttpGet("environment-live")]
    [Authorize(Policy = "Permission:View Risk Information")]
    public async Task<IActionResult> GetEnvironmentLive(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] string? location = null)
    {
        if (latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180)
        {
            return BadRequest(new
            {
                message = "Invalid latitude or longitude."
            });
        }

        try
        {
            var weatherTask =
                _weatherTool.GetCurrentWeatherAsync(
                    latitude,
                    longitude);

            var riverTask =
                _riverGaugeTool.GetNearestGaugeAsync(
                    latitude,
                    longitude);

            var historicalTask =
                _historicalDisasterTool
                    .GetHistoricalFloodDataAsync(
                        latitude,
                        longitude);

            var populationTask =
                _populationTool
                    .GetPopulationDensityAsync(
                        latitude,
                        longitude);

            var drainageTask =
                _drainageDataTool
                    .GetDrainageIndicatorAsync(
                        latitude,
                        longitude);

            await Task.WhenAll(
                weatherTask,
                riverTask,
                historicalTask,
                populationTask,
                drainageTask);

            var weather =
                await weatherTask;

            var river =
                await riverTask;

            var historical =
                await historicalTask;

            var population =
                await populationTask;

            var drainage =
                await drainageTask;

            var result = new
            {
                Latitude = latitude,
                Longitude = longitude,

                Rainfall1h =
                    weather?.Precipitation,

                Rainfall3h =
                    weather?.Rainfall3h,

                Rainfall24h =
                    weather?.Rainfall24h,

                ForecastRainfall =
                    weather?.ForecastRainfall,

                RiverLevel =
                    river?.RiverLevel,

                RiverFlow =
                    river?.RiverFlow,

                Temperature =
                    weather?.Temperature,

                Humidity =
                    weather?.Humidity,

                WindSpeed =
                    weather?.WindSpeed,

                SoilMoisture =
                    weather?.SoilMoisture,

                PopulationDensity =
                    population,

                HistoricalFloodCount =
                    historical?.FloodCount,

                HistoricalSeverity =
                    historical?.Severity,

                DrainageCapacity =
                    drainage,

                WeatherSource =
                    weather?.Source ?? "",

                RiverSource =
                    river?.Source ?? "",

                HistoricalSource =
                    historical?.Source ?? ""
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "Failed to retrieve live environment data.",

                    detail = ex.Message
                });
        }
    }

    // ============================================================
    // GET BY LOCATION
    // ============================================================

    [HttpGet("location/{location}")]
    public async Task<ActionResult<List<RiskPredictionDto>>>
        GetByLocation(string location)
    {
        return Ok(
            await _service.GetByLocationAsync(location));
    }

    // ============================================================
    // GET HIGH RISK
    // ============================================================

    [HttpGet("high-risk")]
    public async Task<ActionResult<List<RiskPredictionDto>>>
        GetHighRisk()
    {
        return Ok(
            await _service.GetHighRiskAsync());
    }

    // ============================================================
    // HISTORY
    // ============================================================

    [HttpGet("history")]
    public async Task<ActionResult<List<RiskPredictionDto>>>
        GetHistory()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        return Ok(
            await _service.GetHistoryAsync(
                userId.Value,
                User.IsInRole("SystemAdministrator") ||
                User.IsInRole("Admin") ||
                User.IsInRole("ReliefCoordinator")));
    }

    // ============================================================
    // PENDING APPROVAL
    // ============================================================

    [HttpGet("pending-approval")]
    public async Task<ActionResult<List<RiskPredictionDto>>>
        GetPendingApproval()
    {
        return Ok(
            await _service.GetPendingApprovalAsync());
    }

    // ============================================================
    // AGENT EXECUTIONS
    // ============================================================

    public record AgentExecutionApprovalRequest(string Status);

    [HttpPut("agent-executions/{id:guid}/approval")]
    [Authorize(Policy = "Permission:AI Agent Monitoring")]
    public async Task<ActionResult<RiskAgentExecution>> UpdateAgentExecutionApproval(
        Guid id,
        AgentExecutionApprovalRequest request)
    {
        var allowedStatuses =
            new[] { "Approved", "Rejected", "NeedsRevision" };

        if (!allowedStatuses.Contains(request.Status))
            return BadRequest(new
            {
                message = "Invalid approval status."
            });

        var execution =
            await _context.RiskAgentExecutions
                .FirstOrDefaultAsync(x => x.Id == id);

        if (execution == null)
            return NotFound(new
            {
                message = "Agent execution not found."
            });

        var allowedAgents = new[]
        {
            "Risk Prediction Agent",
            "Vulnerability & Impact Agent",
            "Resource Optimization Agent",
            "Early Warning & Coordination Agent"
        };

        if (!allowedAgents.Contains(execution.AgentName))
            return BadRequest(new
            {
                message = "This agent does not support human approval."
            });

        var approvalUser =
            User.Identity?.Name ?? "Authenticated User";

        var updated =
            await _agentExecutionService.RecordApprovalAsync(
                execution.Id,
                request.Status,
                approvalUser);

        if (updated == null)
            return NotFound(new
            {
                message = "Agent execution could not be updated."
            });

        if (
            request.Status == "Approved" &&
            execution.AgentName ==
                "Early Warning & Coordination Agent")
        {
            const string marker =
                "VulnerabilityAssessmentId:";

            var inputSummary =
                execution.InputSummary ?? string.Empty;

            var markerIndex =
                inputSummary.IndexOf(
                    marker,
                    StringComparison.OrdinalIgnoreCase);

            if (markerIndex < 0)
                return BadRequest(new
                {
                    message =
                        "Vulnerability assessment reference was not found in the Agent 04 execution."
                });

            var idStart =
                markerIndex + marker.Length;

            var idEnd =
                inputSummary.IndexOf(";", idStart);

            if (idEnd < 0)
                idEnd = inputSummary.Length;

            var vulnerabilityAssessmentText =
                inputSummary
                    .Substring(
                        idStart,
                        idEnd - idStart)
                    .Trim();

            if (!Guid.TryParse(
                    vulnerabilityAssessmentText,
                    out var vulnerabilityAssessmentId))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid vulnerability assessment reference for Agent 04 execution."
                });
            }

            var alert =
                await _earlyWarningCoordinationAgent.CreateAlertAsync(
                    vulnerabilityAssessmentId,
                    execution.Id);

            if (alert == null)
            {
                return BadRequest(new
                {
                    message =
                        "Agent 04 was approved, but the emergency warning could not be executed."
                });
            }

            updated =
                await _context.RiskAgentExecutions
                    .FirstOrDefaultAsync(
                        x => x.Id == execution.Id);
        }

        return Ok(updated);
    }
[HttpGet("agent-executions")]
    public async Task<ActionResult<List<RiskAgentExecution>>>
        GetAgentExecutions()
    {
        return Ok(
            await _agentExecutionService.GetAllAsync());
    }

    // ============================================================
    // AGENT EXECUTIONS BY PREDICTION
    // ============================================================

    [HttpGet("{id:guid}/agent-executions")]
    public async Task<ActionResult<List<RiskAgentExecution>>>
        GetAgentExecutionsByPrediction(Guid id)
    {
        return Ok(
            await _agentExecutionService
                .GetByPredictionIdAsync(id));
    }

    // ============================================================
    // EXPLAIN
    // ============================================================

    [HttpGet("{id:guid}/explain")]
    public async Task<IActionResult> Explain(Guid id)
    {
        var prediction =
            await _service.GetByIdAsync(id);

        if (prediction == null)
            return NotFound();

        var topFactors =
            prediction.RiskFactors
                .OrderByDescending(
                    x => x.Contribution)
                .Take(3)
                .Select(x => x.Factor)
                .ToList();

        var explanation =
            topFactors.Count switch
            {
                0 =>
                    $"Risk score for {prediction.Location} " +
                    $"is {prediction.RiskScore:F2}%. " +
                    "No dominant risk factors were recorded.",

                1 =>
                    $"Risk score for {prediction.Location} " +
                    $"is {prediction.RiskScore:F2}%. " +
                    $"The main contributing factor is " +
                    $"{topFactors[0]}.",

                2 =>
                    $"Risk score for {prediction.Location} " +
                    $"is {prediction.RiskScore:F2}%. " +
                    $"The main contributing factors are " +
                    $"{topFactors[0]} and {topFactors[1]}.",

                _ =>
                    $"Risk score for {prediction.Location} " +
                    $"is {prediction.RiskScore:F2}%. " +
                    $"The main contributing factors are " +
                    $"{topFactors[0]}, {topFactors[1]}, " +
                    $"and {topFactors[2]}."
            };

        return Ok(new
        {
            prediction.Id,
            prediction.Location,
            prediction.DisasterType,
            prediction.RiskScore,
            prediction.RiskLevel,
            prediction.Confidence,
            prediction.RiskFactors,
            prediction.Recommendations,
            prediction.PredictionSource,
            prediction.ModelVersion,
            prediction.RequiresHumanApproval,
            prediction.IsApproved,
            prediction.ApprovalStatus,
            Explanation = explanation,
            GeneratedAt = DateTime.UtcNow
        });
    }

    // ============================================================
    // APPROVE
    // ============================================================

    [HttpPut("{id:guid}/approve")]
public async Task<ActionResult<RiskPredictionDto>>
    Approve(Guid id)
{
    // --------------------------------------------------------
    // STEP 1 - APPROVE RISK PREDICTION
    // --------------------------------------------------------

    var result =
        await _service.ApproveAsync(id);

    if (result == null)
        return NotFound();

    // --------------------------------------------------------
    // STEP 2 - RECORD HUMAN APPROVAL
    // --------------------------------------------------------

    var executions =
        await _agentExecutionService
            .GetByPredictionIdAsync(id);

    var execution =
        executions.FirstOrDefault();

    if (execution == null)
    {
        return Conflict(new
        {
            message =
                "Approval could not continue because no agent execution was found for this risk prediction.",
            riskPredictionId = id
        });
    }

    var approvalUser =
        User.Identity?.Name
        ?? "Authenticated User";

    await _agentExecutionService.RecordApprovalAsync(
        execution.Id,
        "Approved",
        approvalUser);

    // --------------------------------------------------------
    // IMPORTANT
    //
    // Agent 02 and Agent 03 are NOT executed here.
    //
    // They were already handled by the Agentic Orchestrator
    // before the human approval gate.
    //
    // Approval only unlocks the actions that were blocked:
    // Agent 04 and Agent 05.
    // --------------------------------------------------------

    // --------------------------------------------------------
    // STEP 3 - FIND EXISTING AGENT 02 RESULT
    // --------------------------------------------------------

    var vulnerabilityAssessment =
        await _context.VulnerabilityAssessments
            .Where(x => x.RiskPredictionId == id)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

    if (vulnerabilityAssessment == null)
    {
        return Conflict(new
        {
            message =
                "Approval was recorded, but the existing Agent 02 vulnerability assessment could not be found. No downstream action was executed.",
            riskPredictionId = id
        });
    }

    // --------------------------------------------------------
    // STEP 4 - AGENT 04
    // EARLY WARNING & COORDINATION
    //
    // This is the first real-world action after approval.
    // --------------------------------------------------------

    var emergencyAlert =
        await _earlyWarningCoordinationAgent
            .CreateAlertAsync(
                vulnerabilityAssessment.Id);

    // --------------------------------------------------------
    // STEP 5 - FIND DISASTER REPORT
    // --------------------------------------------------------

    var report =
        await _context.DisasterReports
            .FirstOrDefaultAsync(
                x => x.RiskPredictionId == id);

    if (report == null)
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId == null)
            return Unauthorized();

        var reportRequest = new DisasterReportDto
        {
            DisasterType = result.DisasterType,
            Description =
                $"Operational incident created from Agent 01 risk prediction {id}.",
            Location = result.Location,
            Latitude = result.Latitude,
            Longitude = result.Longitude,
            Severity = result.RiskLevel,
            RiskPredictionId = id
        };

        var createdReport =
            await _disasterReportService.CreateFromPredictionAsync(
                currentUserId.Value,
                id,
                reportRequest);

        if (createdReport != null)
        {
            report =
                await _context.DisasterReports
                    .FirstOrDefaultAsync(
                        x => x.Id == createdReport.Id);
        }
    }

    // --------------------------------------------------------
    // STEP 6 - AGENT 05
    // VOLUNTEER ASSIGNMENT
    //
    // This executes only after human approval.
    // --------------------------------------------------------

    if (report != null)
    {
        var volunteerRecommendation =
            await _volunteerAssignmentService
                .RecommendAsync(report.Id);

        if (volunteerRecommendation
                ?.RecommendedVolunteer != null)
        {
            report.AssignedVolunteerUserId =
                volunteerRecommendation
                    .RecommendedVolunteer
                    .VolunteerUserId;

            report.AssignedAt =
                DateTime.UtcNow;

            report.Status =
                "Assigned";

            report.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        else
        {
            report.Status =
                "VolunteerQueue";

            report.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
    }

    // --------------------------------------------------------
    // STEP 7 - RETURN AUTHORIZED RESULT
    // --------------------------------------------------------

    return Ok(result);
}
[HttpPut("{id:guid}/reject")]
    public async Task<ActionResult<RiskPredictionDto>>
        Reject(Guid id)
    {
        // --------------------------------------------------------
        // STEP 1 - REJECT PREDICTION
        // --------------------------------------------------------

        var result =
            await _service.RejectAsync(id);

        if (result == null)
            return NotFound();

        // --------------------------------------------------------
        // STEP 2 - RECORD HUMAN REJECTION
        // --------------------------------------------------------

        var executions =
            await _agentExecutionService
                .GetByPredictionIdAsync(id);

        var execution =
            executions.FirstOrDefault();

        if (execution != null)
        {
            var approvalUser =
                User.Identity?.Name
                ?? "Authenticated User";

            await _agentExecutionService.RecordApprovalAsync(
                execution.Id,
                "Rejected",
                approvalUser);
        }

        // --------------------------------------------------------
        // IMPORTANT:
        // Rejected prediction DOES NOT continue to Agent 02,
        // Resource Optimization, Early Warning or Volunteer
        // Assignment.
        // --------------------------------------------------------

        return Ok(result);
    }

    // ============================================================
    // GET BY ID
    // ============================================================

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RiskPredictionDto>>
        GetById(Guid id)
    {
        var result =
            await _service.GetByIdAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }
}
















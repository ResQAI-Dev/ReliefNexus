using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.AI.Tools;
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

    public RiskPredictionsController(
        IRiskPredictionService service,
        IAgentExecutionService agentExecutionService,
        DisasterDataTool disasterDataTool)
    {
        _service = service;
        _agentExecutionService = agentExecutionService;
        _disasterDataTool = disasterDataTool;
    }

    [HttpPost]
    public async Task<ActionResult<RiskPredictionDto>> Create(
        RiskPredictionDto request)
    {
        var inputSummary =
            $"Location={request.Location}; " +
            $"Latitude={request.Latitude}; " +
            $"Longitude={request.Longitude}; " +
            $"Rainfall24h={request.Rainfall24h}; " +
            $"RiverLevel={request.RiverLevel}; " +
            $"HistoricalFloodCount={request.HistoricalFloodCount}";

        var execution =
            await _agentExecutionService.StartAsync(inputSummary);

        try
        {
            var result = await _service.CreateAsync(request);

            var outputSummary =
                $"DisasterType={result.DisasterType}; " +
                $"RiskScore={result.RiskScore:F2}; " +
                $"RiskLevel={result.RiskLevel}; " +
                $"Confidence={result.Confidence:F2}";

            await _agentExecutionService.CompleteAsync(
                execution.Id,
                result.Id!.Value,
                outputSummary);

            return Ok(result);
        }
        catch
        {
            throw;
        }
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedRiskPredictionDto>> GetAll(
        [FromQuery] RiskPredictionQueryDto query)
    {
        return Ok(await _service.GetPagedAsync(query));
    }

    [HttpGet("external-events")]
    public async Task<IActionResult> GetExternalEvents()
    {
        var events =
            await _disasterDataTool.GetRecentEventsAsync();

        return Ok(events);
    }

    [HttpGet("location/{location}")]
    public async Task<ActionResult<List<RiskPredictionDto>>> GetByLocation(
        string location)
    {
        return Ok(await _service.GetByLocationAsync(location));
    }

    [HttpGet("high-risk")]
    public async Task<ActionResult<List<RiskPredictionDto>>> GetHighRisk()
    {
        return Ok(await _service.GetHighRiskAsync());
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<RiskPredictionDto>>> GetHistory()
    {
        return Ok(await _service.GetHistoryAsync());
    }

    [HttpGet("pending-approval")]
    public async Task<ActionResult<List<RiskPredictionDto>>>
        GetPendingApproval()
    {
        return Ok(await _service.GetPendingApprovalAsync());
    }

    [HttpGet("agent-executions")]
    public async Task<ActionResult<List<RiskAgentExecution>>>
        GetAgentExecutions()
    {
        return Ok(await _agentExecutionService.GetAllAsync());
    }

    [HttpGet("{id:guid}/agent-executions")]
    public async Task<ActionResult<List<RiskAgentExecution>>>
        GetAgentExecutionsByPrediction(Guid id)
    {
        return Ok(
            await _agentExecutionService
                .GetByPredictionIdAsync(id));
    }

    [HttpGet("{id:guid}/explain")]
    public async Task<IActionResult> Explain(Guid id)
    {
        var prediction =
            await _service.GetByIdAsync(id);

        if (prediction == null)
            return NotFound();

        var topFactors =
            prediction.RiskFactors
                .OrderByDescending(x => x.Contribution)
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

    [HttpPut("{id:guid}/approve")]
    public async Task<ActionResult<RiskPredictionDto>>
        Approve(Guid id)
    {
        var result = await _service.ApproveAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPut("{id:guid}/reject")]
    public async Task<ActionResult<RiskPredictionDto>>
        Reject(Guid id)
    {
        var result = await _service.RejectAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RiskPredictionDto>>
        GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }
}

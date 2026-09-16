using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/risk-predictions")]
[Authorize]
public class RiskPredictionsController : ControllerBase
{
    private readonly IRiskPredictionService _service;
    private readonly IWeatherService _weatherService;

    public RiskPredictionsController(
        IRiskPredictionService service,
        IWeatherService weatherService)
    {
        _service = service;
        _weatherService = weatherService;
    }

    [HttpPost]
    public async Task<ActionResult<RiskPredictionDto>> Create(
        RiskPredictionDto request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedRiskPredictionDto>> GetAll(
        [FromQuery] RiskPredictionQueryDto query)
    {
        return Ok(await _service.GetPagedAsync(query));
    }

    [HttpGet("weather/{latitude}/{longitude}")]
    public async Task<ActionResult<WeatherDataDto>> GetWeather(
        double latitude,
        double longitude)
    {
        var weather = await _weatherService
            .GetCurrentWeatherAsync(latitude, longitude);

        if (weather == null)
            return BadRequest("Unable to retrieve weather data.");

        return Ok(weather);
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
    public async Task<ActionResult<List<RiskPredictionDto>>> GetPendingApproval()
    {
        return Ok(await _service.GetPendingApprovalAsync());
    }

    [HttpPut("{id:guid}/approve")]
    public async Task<ActionResult<RiskPredictionDto>> Approve(Guid id)
    {
        var result = await _service.ApproveAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPut("{id:guid}/reject")]
    public async Task<ActionResult<RiskPredictionDto>> Reject(Guid id)
    {
        var result = await _service.RejectAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RiskPredictionDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }
}

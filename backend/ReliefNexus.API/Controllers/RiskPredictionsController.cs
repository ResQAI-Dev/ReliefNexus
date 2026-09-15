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

    public RiskPredictionsController(IRiskPredictionService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<RiskPredictionDto>> Create(
        RiskPredictionDto request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<RiskPredictionDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
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

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RiskPredictionDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }
}

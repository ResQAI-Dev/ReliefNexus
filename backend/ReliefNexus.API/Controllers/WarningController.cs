using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/warnings")]
[Authorize]
public class WarningsController : ControllerBase
{
    private readonly IWarningService _warningService;

    public WarningsController(IWarningService warningService)
    {
        _warningService = warningService;
    }

    [HttpPost]
    public async Task<ActionResult<WarningResponse>> Create(
    [FromBody] CreateWarningRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var warning = await _warningService.CreateAsync(
            request,
            userId);

        return CreatedAtAction(
            nameof(GetById),
            new { id = warning.Id },
            warning);
    }

    [HttpGet]
    public async Task<ActionResult<List<WarningResponse>>> GetAll()
    {
        var warnings = await _warningService.GetAllAsync();

        return Ok(warnings);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WarningResponse>> GetById(Guid id)
    {
        var warning = await _warningService.GetByIdAsync(id);

        if (warning == null)
        {
            return NotFound(new
            {
                message = "Warning not found."
            });
        }

        return Ok(warning);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<WarningResponse>> Update(
        Guid id,
        [FromBody] UpdateWarningRequest request)
    {
        var warning = await _warningService.UpdateAsync(
            id,
            request);

        if (warning == null)
        {
            return NotFound(new
            {
                message = "Warning not found."
            });
        }

        return Ok(warning);
    }
}
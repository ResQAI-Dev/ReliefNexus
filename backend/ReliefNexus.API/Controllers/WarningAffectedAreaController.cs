using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/warnings/{warningId:guid}/affected-areas")]
[Authorize]
public class WarningAffectedAreasController : ControllerBase
{
    private readonly IWarningAffectedAreaService _service;

    public WarningAffectedAreasController(
        IWarningAffectedAreaService service)
    {
        _service = service;
    }

    [HttpPost]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> Add(
        Guid warningId,
        [FromBody] AddWarningAffectedAreaRequest request)
    {
        var target = await _service.AddAsync(
            warningId,
            request);

        if (target == null)
        {
            return BadRequest(new
            {
                message =
                    "Warning or affected area target is invalid, " +
                    "or the area is already targeted."
            });
        }

        return Ok(target);
    }

    [HttpGet]
    public async Task<IActionResult> Get(Guid warningId)
    {
        var targets = await _service
            .GetByWarningIdAsync(warningId);

        return Ok(targets);
    }

    [HttpDelete("{affectedAreaId:guid}")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> Remove(
        Guid warningId,
        Guid affectedAreaId)
    {
        var success = await _service.RemoveAsync(
            warningId,
            affectedAreaId);

        if (!success)
        {
            return NotFound(new
            {
                message = "Affected area target not found."
            });
        }

        return Ok(new
        {
            message = "Affected area removed from warning successfully."
        });
    }
}
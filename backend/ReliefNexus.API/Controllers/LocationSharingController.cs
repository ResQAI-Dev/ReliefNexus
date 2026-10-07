using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/location-sharing")]
[Authorize]
public class LocationSharingController : ControllerBase
{
    private readonly ILocationSharingService _service;

    public LocationSharingController(
        ILocationSharingService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "SystemAdministrator")]
    public async Task<ActionResult<List<LocationShareDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("my")]
    public async Task<ActionResult<List<LocationShareDto>>> GetMy()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        return Ok(await _service.GetMyAsync(userId.Value));
    }

    [HttpPost]
    public async Task<ActionResult<LocationShareDto>> Create(
        LocationShareDto request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Location))
            return BadRequest("Location is required.");

        var result = await _service.CreateAsync(
            userId.Value,
            request);

        return Ok(result);
    }

    [HttpPut("{id:guid}/stop")]
    public async Task<ActionResult<LocationShareDto>> Stop(Guid id)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        var isAdministrator =
            User.IsInRole("SystemAdministrator");

        var result = await _service.StopAsync(
            id,
            userId.Value,
            isAdministrator);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    private Guid? GetCurrentUserId()
    {
        var value = User.FindFirstValue(
            JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(value, out var id)
            ? id
            : null;
    }
}

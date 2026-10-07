using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/relief-requests")]
[Authorize]
public class ReliefRequestsController : ControllerBase
{
    private readonly IReliefRequestService _service;

    public ReliefRequestsController(IReliefRequestService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "SystemAdministrator,ReliefCoordinator")]
    public async Task<ActionResult<List<ReliefRequestDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("my")]
    public async Task<ActionResult<List<ReliefRequestDto>>> GetMy()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        return Ok(await _service.GetMyAsync(userId.Value));
    }

    [HttpPost]
    public async Task<ActionResult<ReliefRequestDto>> Create(
        ReliefRequestDto request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.RequestType))
            return BadRequest("Request type is required.");

        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest("Description is required.");

        if (string.IsNullOrWhiteSpace(request.Location))
            return BadRequest("Location is required.");

        if (request.Quantity < 0)
            return BadRequest("Quantity cannot be negative.");

        var result = await _service.CreateAsync(
            userId.Value,
            request);

        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "SystemAdministrator,ReliefCoordinator")]
    public async Task<ActionResult<ReliefRequestDto>> UpdateStatus(
        Guid id,
        [FromBody] string status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return BadRequest("Status is required.");

        var result = await _service.UpdateStatusAsync(id, status);

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

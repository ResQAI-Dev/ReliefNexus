using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/disaster-reports")]
[Authorize]
public class DisasterReportsController : ControllerBase
{
    private readonly IDisasterReportService _service;

    public DisasterReportsController(
        IDisasterReportService service)
    {
        _service = service;
    }

    // ---------------------------------------------------------------------
    // ADMIN / COORDINATOR: ALL REPORTS
    // ---------------------------------------------------------------------
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<DisasterReportDto>>> GetAll()
    {
        return Ok(
            await _service.GetAllAsync());
    }

    // ---------------------------------------------------------------------
    // FIELD VOLUNTEER: REPORTS ASSIGNED TO THE CURRENT LOGGED-IN USER
    // ---------------------------------------------------------------------
    [HttpGet("assigned-to-me")]
    [Authorize(Roles = "FieldVolunteer")]
    public async Task<ActionResult<List<DisasterReportDto>>> GetAssignedToMe()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        return Ok(
            await _service.GetAssignedReportsAsync(
                userId.Value));
    }

    // ---------------------------------------------------------------------
    // REPORTER: REPORTS CREATED BY THE CURRENT USER
    // ---------------------------------------------------------------------
    [HttpGet("my")]
    public async Task<ActionResult<List<DisasterReportDto>>> GetMy()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        return Ok(
            await _service.GetMyReportsAsync(
                userId.Value));
    }

    // ---------------------------------------------------------------------
    // COMMUNITY / USER SUBMITTED DISASTER REPORT
    // ---------------------------------------------------------------------
    [HttpPost]
    [Authorize(Policy = "Permission:Report Disaster")]
    public async Task<ActionResult<DisasterReportDto>> Create(
        [FromBody] DisasterReportDto request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.DisasterType))
            return BadRequest("Disaster type is required.");

        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest("Description is required.");

        if (string.IsNullOrWhiteSpace(request.Location))
            return BadRequest("Location is required.");

        var result = await _service.CreateAsync(
            userId.Value,
            request);

        return Ok(result);
    }

    // ---------------------------------------------------------------------
    // AGENT 01 -> OPERATIONAL INCIDENT
    //
    // This does NOT run Agent 01 again.
    // It creates an operational DisasterReport linked to the already
    // existing RiskPrediction so the same 8-step workflow can continue.
    // ---------------------------------------------------------------------
    [HttpPost("from-prediction/{predictionId:guid}")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<DisasterReportDto>> CreateFromPrediction(
        Guid predictionId,
        [FromBody] DisasterReportDto request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.DisasterType))
            return BadRequest("Disaster type is required.");

        if (string.IsNullOrWhiteSpace(request.Location))
            return BadRequest("Location is required.");

        request.RiskPredictionId = predictionId;

        var result = await _service.CreateFromPredictionAsync(
            userId.Value,
            predictionId,
            request);

        if (result == null)
        {
            return NotFound(
                "The requested risk prediction could not be linked to an operational incident.");
        }

        return Ok(result);
    }

    // ---------------------------------------------------------------------
    // ADMIN / COORDINATOR: STEP 1 REVIEW
    // ---------------------------------------------------------------------
    [HttpPatch("{id:guid}/review")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<DisasterReportDto>> Review(Guid id)
    {
        var result = await _service.ReviewAsync(id);

        return result == null
            ? NotFound()
            : Ok(result);
    }

    // ---------------------------------------------------------------------
    // ADMIN / COORDINATOR: VERIFY
    // ---------------------------------------------------------------------
    [HttpPatch("{id:guid}/verify")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<DisasterReportDto>> Verify(Guid id)
    {
        var result = await _service.VerifyAsync(id);

        return result == null
            ? NotFound()
            : Ok(result);
    }

    // ---------------------------------------------------------------------
    // ADMIN / COORDINATOR: STEP 6 VOLUNTEER ASSIGNMENT
    // ---------------------------------------------------------------------
    [HttpPatch("{id:guid}/assign")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<DisasterReportDto>> AssignVolunteer(
        Guid id,
        [FromBody] AssignVolunteerRequest request)
    {
        if (request.VolunteerUserId == Guid.Empty)
            return BadRequest(
                "Volunteer user id is required.");

        var result = await _service.AssignVolunteerAsync(
            id,
            request.VolunteerUserId);

        if (result == null)
        {
            return BadRequest(
                "Report or approved Field Volunteer was not found.");
        }

        return Ok(result);
    }

    // ---------------------------------------------------------------------
    // ADMIN / COORDINATOR: FINAL RESOLUTION
    // ---------------------------------------------------------------------
    [HttpPatch("{id:guid}/resolve")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<DisasterReportDto>> Resolve(Guid id)
    {
        var result = await _service.ResolveAsync(id);

        return result == null
            ? NotFound()
            : Ok(result);
    }

    // ---------------------------------------------------------------------
    // ADMIN / COORDINATOR: REJECT
    // ---------------------------------------------------------------------
    [HttpPatch("{id:guid}/reject")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<DisasterReportDto>> Reject(Guid id)
    {
        var result = await _service.RejectAsync(id);

        return result == null
            ? NotFound()
            : Ok(result);
    }

    // ---------------------------------------------------------------------
    // FIELD VOLUNTEER: STEP 7 START
    // ---------------------------------------------------------------------
    [HttpPatch("{id:guid}/field-start")]
    [Authorize(Roles = "FieldVolunteer")]
    public async Task<ActionResult<DisasterReportDto>> FieldStart(Guid id)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        var result = await _service.FieldStartAsync(
            id,
            userId.Value);

        return result == null
            ? BadRequest(
                "This report is not assigned to you.")
            : Ok(result);
    }

    // ---------------------------------------------------------------------
    // FIELD VOLUNTEER: STEP 7 FIELD UPDATE
    // ---------------------------------------------------------------------
    [HttpPatch("{id:guid}/field-update")]
    [Authorize(Roles = "FieldVolunteer")]
    public async Task<ActionResult<DisasterReportDto>> FieldUpdate(
        Guid id,
        [FromBody] ReliefNexus.API.DTOs.FieldUpdateRequest request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        var result = await _service.FieldUpdateAsync(
            id,
            userId.Value,
            request);

        return result == null
            ? BadRequest(
                "This report is not assigned to you.")
            : Ok(result);
    }

    // ---------------------------------------------------------------------
    // FIELD VOLUNTEER: STEP 7 COMPLETE
    // ---------------------------------------------------------------------
    [HttpPatch("{id:guid}/field-complete")]
    [Authorize(Roles = "FieldVolunteer")]
    public async Task<ActionResult<DisasterReportDto>> FieldComplete(Guid id)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        var result = await _service.FieldCompleteAsync(
            id,
            userId.Value);

        return result == null
            ? BadRequest(
                "This report is not assigned to you.")
            : Ok(result);
    }

    // ---------------------------------------------------------------------
    // SYSTEM ADMIN: DIRECT STATUS UPDATE
    // ---------------------------------------------------------------------
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "SystemAdministrator")]
    public async Task<ActionResult<DisasterReportDto>> UpdateStatus(
        Guid id,
        [FromBody] string status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return BadRequest("Status is required.");

        var result = await _service.UpdateStatusAsync(
            id,
            status);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

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
}

public sealed class AssignVolunteerRequest
{
    public Guid VolunteerUserId { get; set; }
}


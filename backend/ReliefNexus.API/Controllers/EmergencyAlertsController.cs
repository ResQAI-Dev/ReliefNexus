using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/emergency-alerts")]
[Authorize]
public class EmergencyAlertsController : ControllerBase
{
    private readonly IEmergencyAlertService _service;
    private readonly AppDbContext _context;

    public EmergencyAlertsController(
        IEmergencyAlertService service,
        AppDbContext context)
    {
        _service = service;
        _context = context;
    }

    // ------------------------------------------------------------
    // GET ACTIVE ALERTS
    //
    // System Administrator / Relief Coordinator / Field Volunteer:
    //   -> all active alerts
    //
    // Affected User:
    //   -> only alerts linked to that user's RiskPrediction records
    //
    // This prevents User A's alert from appearing to User B while
    // keeping the exact same stored alert shared with its owner.
    // ------------------------------------------------------------
    [HttpGet]
    public async Task<ActionResult<List<EmergencyAlert>>> GetAll()
    {
        if (CanViewAllAlerts())
        {
            return Ok(
                await _context.EmergencyAlerts
                    .AsNoTracking()
                    .Where(x => x.IsActive)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync());
        }

        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new
            {
                message = "Authenticated user id was not found."
            });

        var alerts = await
            (from alert in _context.EmergencyAlerts.AsNoTracking()
             join prediction in _context.RiskPredictions.AsNoTracking()
                 on alert.RiskPredictionId equals prediction.Id
             where
                 alert.IsActive &&
                 prediction.UserId == userId
             orderby alert.CreatedAt descending
             select alert)
            .ToListAsync();

        return Ok(alerts);
    }

    // ------------------------------------------------------------
    // GET ONE ALERT
    // Uses the exact same ownership rule as GET ALL.
    // ------------------------------------------------------------
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EmergencyAlert>> GetById(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest(new
            {
                message = "Alert id is required."
            });

        var query =
            _context.EmergencyAlerts
                .AsNoTracking()
                .Where(x => x.Id == id);

        if (!CanViewAllAlerts())
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized(new
                {
                    message = "Authenticated user id was not found."
                });

            query =
                from alert in query
                join prediction in _context.RiskPredictions.AsNoTracking()
                    on alert.RiskPredictionId equals prediction.Id
                where prediction.UserId == userId
                select alert;
        }

        var alertResult =
            await query.FirstOrDefaultAsync();

        if (alertResult == null)
            return NotFound(new
            {
                message = "Emergency alert not found."
            });

        return Ok(alertResult);
    }

    // ------------------------------------------------------------
    // CREATE ALERT FROM AGENT 02 ASSESSMENT
    // Only operational/admin roles can generate the shared alert.
    //
    // The alert keeps the assessment's RiskPredictionId, so the
    // affected user who owns that prediction receives this same alert.
    // ------------------------------------------------------------
    [HttpPost("assessment/{vulnerabilityAssessmentId:guid}")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<EmergencyAlert>> CreateFromAssessment(
        Guid vulnerabilityAssessmentId)
    {
        try
        {
            var alert =
                await _service.CreateFromAssessmentAsync(
                    vulnerabilityAssessmentId);

            if (alert == null)
                return NotFound(new
                {
                    message = "Vulnerability assessment not found."
                });

            return Ok(alert);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "Unable to create emergency alert.",
                    detail = ex.Message
                });
        }
    }

    // ------------------------------------------------------------
    // UPDATE STATUS
    // ------------------------------------------------------------

    [HttpPost("{id:guid}/send-report")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<object>> SendMessageAndReport(Guid id)
    {
        var result =
            await _service.SendMessageAndReportAsync(id);

        if (result == null)
        {
            return NotFound(
                new
                {
                    message =
                        "Emergency alert or affected user was not found."
                });
        }

        return Ok(result);
    }
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<ActionResult<EmergencyAlert>> UpdateStatus(
        Guid id,
        [FromBody] UpdateEmergencyAlertStatusRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(new
            {
                message = "Status is required."
            });
        }

        var alert =
            await _service.UpdateStatusAsync(
                id,
                request.Status);

        if (alert == null)
            return NotFound(new
            {
                message = "Emergency alert not found."
            });

        return Ok(alert);
    }

    // ------------------------------------------------------------
    // DELETE
    // ------------------------------------------------------------
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest(new
            {
                message = "Alert id is required."
            });

        var deleted = await _service.DeleteAsync(id);

        if (!deleted)
            return NotFound(new
            {
                message = "Emergency alert not found."
            });

        return NoContent();
    }

    private bool CanViewAllAlerts()
    {
        return User.IsInRole("SystemAdministrator") ||
               User.IsInRole("ReliefCoordinator") ||
               User.IsInRole("FieldVolunteer");
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var rawUserId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        return Guid.TryParse(rawUserId, out userId);
    }
}

public sealed record UpdateEmergencyAlertStatusRequest(string Status);


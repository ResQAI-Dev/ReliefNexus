using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.Interfaces;
using System.Security.Claims;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/warnings")]
[Authorize]
public class WarningApprovalsController : ControllerBase
{
    private readonly IWarningApprovalService _approvalService;

    public WarningApprovalsController(
        IWarningApprovalService approvalService)
    {
        _approvalService = approvalService;
    }

    [HttpPost("{id:guid}/submit")]
    [Authorize(Roles = "FieldVolunteer,ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> Submit(Guid id)
    {
        var success = await _approvalService.SubmitAsync(id);

        if (!success)
        {
            return BadRequest(new
            {
                message = "Warning cannot be submitted for approval."
            });
        }

        return Ok(new
        {
            message = "Warning submitted for approval."
        });
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "SystemAdministrator")]
    public async Task<IActionResult> Approve(
        Guid id,
        [FromBody] ApprovalDecisionRequest request)
    {
        var reviewerId = GetCurrentUserId();

        if (reviewerId == null)
            return Unauthorized();

        var success = await _approvalService.ApproveAsync(
            id,
            reviewerId.Value,
            request.Comments);

        if (!success)
        {
            return BadRequest(new
            {
                message = "Warning cannot be approved."
            });
        }

        return Ok(new
        {
            message = "Warning approved successfully."
        });
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "SystemAdministrator")]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] ApprovalDecisionRequest request)
    {
        var reviewerId = GetCurrentUserId();

        if (reviewerId == null)
            return Unauthorized();

        var success = await _approvalService.RejectAsync(
            id,
            reviewerId.Value,
            request.Comments);

        if (!success)
        {
            return BadRequest(new
            {
                message = "Warning cannot be rejected."
            });
        }

        return Ok(new
        {
            message = "Warning rejected successfully."
        });
    }

    [HttpPost("{id:guid}/request-revision")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> RequestRevision(
        Guid id,
        [FromBody] ApprovalDecisionRequest request)
    {
        var reviewerId = GetCurrentUserId();

        if (reviewerId == null)
            return Unauthorized();

        var success = await _approvalService.RequestRevisionAsync(
            id,
            reviewerId.Value,
            request.Comments);

        if (!success)
        {
            return BadRequest(new
            {
                message = "Warning cannot be sent for revision."
            });
        }

        return Ok(new
        {
            message = "Warning sent back for revision."
        });
    }

    private Guid? GetCurrentUserId()
    {
        var value = User.FindFirst(
            ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(value, out var id)
            ? id
            : null;
    }
}

public class ApprovalDecisionRequest
{
    public string? Comments { get; set; }
}
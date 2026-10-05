using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/volunteer-assignment")]
[Authorize]
public sealed class VolunteerAssignmentController
    : ControllerBase
{
    private readonly IVolunteerAssignmentService _service;

    public VolunteerAssignmentController(
        IVolunteerAssignmentService service)
    {
        _service = service;
    }


    // =========================================================
    // GET RECOMMENDED VOLUNTEER
    // =========================================================

    [HttpPost("recommend")]
    [Authorize(
        Roles =
            "ReliefCoordinator,SystemAdministrator")]
    public async Task<
        ActionResult<
            VolunteerAssignmentRecommendationResponse>>
        Recommend(
            [FromBody]
            VolunteerAssignmentRequest request)
    {
        if (request.DisasterReportId ==
            Guid.Empty)
        {
            return BadRequest(
                "Disaster report id is required.");
        }


        var result =
            await _service.RecommendAsync(
                request.DisasterReportId);


        if (result == null)
        {
            return NotFound(
                "Disaster report was not found.");
        }


        return Ok(result);
    }
}
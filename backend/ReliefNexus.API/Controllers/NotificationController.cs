using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/warnings/{warningId:guid}/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(
        INotificationService notificationService)
    { 
        _notificationService = notificationService;
    }

    [HttpPost]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> Create(
        Guid warningId,
        [FromBody] CreateNotificationRequest request)
    {
        var notification = await _notificationService.CreateAsync(
            warningId,
            request);

        if (notification == null)
        {
            return BadRequest(new
            {
                message = "Warning or recipient not found."
            });
        }

        return Ok(notification);
    }

    [HttpGet]
    public async Task<IActionResult> GetByWarningId(
        Guid warningId)
    {
        var notifications =
            await _notificationService.GetByWarningIdAsync(warningId);

        return Ok(notifications);
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "SystemAdministrator")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(
        IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var logs = await _auditLogService.GetAllAsync();

        return Ok(logs);
    }
}
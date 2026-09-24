using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/coordination-tasks")]
[Authorize]
public class CoordinationTasksController : ControllerBase
{
    private readonly ICoordinationTaskService _taskService;

    public CoordinationTasksController(
        ICoordinationTaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpPost]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> Create(
        [FromBody] CreateCoordinationTaskRequest request)
    {
        var task = await _taskService.CreateAsync(request);

        if (task == null)
        {
            return BadRequest(new
            {
                message = "Warning or assigned stakeholder not found."
            });
        }

        return Ok(task);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tasks = await _taskService.GetAllAsync();

        return Ok(tasks);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var task = await _taskService.GetByIdAsync(id);

        if (task == null)
        {
            return NotFound(new
            {
                message = "Coordination task not found."
            });
        }

        return Ok(task);
    }

    [HttpPost("{id:guid}/assign")]
    [Authorize(Roles = "ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> Assign(
        Guid id,
        [FromBody] AssignCoordinationTaskRequest request)
    {
        var success = await _taskService.AssignAsync(
            id,
            request.AssignedToId);

        if (!success)
        {
            return BadRequest(new
            {
                message = "Coordination task cannot be assigned."
            });
        }

        return Ok(new
        {
            message = "Coordination task assigned successfully."
        });
    }

    [HttpPost("{id:guid}/status")]
    [Authorize(Roles = "FieldVolunteer,ReliefCoordinator,SystemAdministrator")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateCoordinationTaskStatusRequest request)
    {
        var success = await _taskService.UpdateStatusAsync(
            id,
            request.Status);

        if (!success)
        {
            return BadRequest(new
            {
                message = "Invalid coordination task status transition."
            });
        }

        return Ok(new
        {
            message = "Coordination task status updated successfully."
        });
    }
}
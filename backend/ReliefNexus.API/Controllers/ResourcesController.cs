using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs.ResourceOptimization;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/resource-optimization")]
[Authorize]
public class ResourceOptimizationController : ControllerBase
{
    private readonly IResourceService _service;
    private readonly AppDbContext _context;

    public ResourceOptimizationController(IResourceService service, AppDbContext context)
    {
        _service = service;
        _context = context;
    }

    // ============================================================
    // LIVE RELIEF RESOURCE INVENTORY
    // ============================================================

    [HttpGet("resources")]
    public async Task<ActionResult<List<ReliefResource>>> GetResources()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("resources/{id:guid}")]
    public async Task<ActionResult<ReliefResource>> GetResource(Guid id)
    {
        var resource = await _service.GetByIdAsync(id);
        return resource == null ? NotFound() : Ok(resource);
    }

    [HttpPost("resources")]
    public async Task<ActionResult<ReliefResource>> CreateResource(
        [FromBody] ReliefResource resource)
    {
        try
        {
            var created = await _service.CreateAsync(resource);
            return CreatedAtAction(nameof(GetResource), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("resources/{id:guid}")]
    public async Task<ActionResult<ReliefResource>> UpdateResource(
        Guid id,
        [FromBody] ReliefResource resource)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, resource);
            return updated == null ? NotFound() : Ok(updated);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("resources/{id:guid}")]
    public async Task<IActionResult> DeleteResource(Guid id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ============================================================
    // ALLOCATION REQUESTS / EXISTING ALLOCATIONS
    // ============================================================

    [HttpGet("allocations")]
    public async Task<ActionResult<List<ResourceAllocationDto>>> GetAllAllocations()
    {
        var allocations = await _service.GetAllAllocationsAsync();
        return Ok(await ToDto(allocations));
    }

    [HttpGet("allocations/{id:guid}")]
    public async Task<ActionResult<ResourceAllocationDto>> GetAllocation(Guid id)
    {
        var allocation = await _service.GetAllocationByIdAsync(id);
        return allocation == null ? NotFound() : Ok(await ToDto(allocation));
    }

    [HttpPost("allocations")]
    public async Task<ActionResult<ResourceAllocationDto>> CreateAllocation(
        [FromBody] ResourceAllocation allocation)
    {
        try
        {
            var created = await _service.CreateAllocationAsync(allocation);
            return CreatedAtAction(
                nameof(GetAllocation),
                new { id = created.Id },
                ToDto(created));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("allocations/{id:guid}")]
    public async Task<ActionResult<ResourceAllocationDto>> UpdateAllocation(
        Guid id,
        [FromBody] ResourceAllocation allocation)
    {
        try
        {
            var updated = await _service.UpdateAllocationAsync(id, allocation);
            return updated == null ? NotFound() : Ok(await ToDto(updated));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("allocations/{id:guid}")]
    public async Task<IActionResult> DeleteAllocation(Guid id)
    {
        try
        {
            var deleted = await _service.DeleteAllocationAsync(id);
            return deleted ? NoContent() : NotFound();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ============================================================
    // AGENT 03  READ-ONLY DEMAND ANALYSIS
    // ============================================================

    [HttpGet("{vulnerabilityAssessmentId:guid}/demand")]
    public async Task<ActionResult<ResourceDemandAssessmentDto>> GetDemand(
        Guid vulnerabilityAssessmentId)
    {
        if (vulnerabilityAssessmentId == Guid.Empty)
            return BadRequest(new { message = "Vulnerability assessment id is required." });

        var demand = await _service.GetDemandAssessmentAsync(vulnerabilityAssessmentId);
        return demand == null
            ? NotFound(new { message = "No vulnerability assessment was found for the supplied id." })
            : Ok(demand);
    }

    // ============================================================
    // AGENT 03  ACTUAL OPTIMIZATION / ALLOCATION MUTATION
    // ============================================================

    [HttpPost("{vulnerabilityAssessmentId:guid}/optimize")]
    public async Task<ActionResult<List<ResourceAllocationDto>>> Optimize(
        Guid vulnerabilityAssessmentId)
    {
        if (vulnerabilityAssessmentId == Guid.Empty)
            return BadRequest(new { message = "Vulnerability assessment id is required." });

        try
        {
            var allocations = await _service.OptimizeAsync(vulnerabilityAssessmentId);

            if (allocations == null || allocations.Count == 0)
            {
                return NotFound(new
                {
                    message = "No resource allocations could be generated for the specified vulnerability assessment."
                });
            }

            return Ok(await ToDto(allocations));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ============================================================
    // ASSESSMENT-SCOPED ALLOCATIONS  READ ONLY
    // IMPORTANT: this GET NEVER runs Agent 03 again.
    // ============================================================

    [HttpGet("{vulnerabilityAssessmentId:guid}")]
    public async Task<ActionResult<List<ResourceAllocationDto>>> GetByAssessment(
        Guid vulnerabilityAssessmentId)
    {
        if (vulnerabilityAssessmentId == Guid.Empty)
            return BadRequest(new { message = "Vulnerability assessment id is required." });

        var allocations = await _service.GetExistingAllocationsAsync(vulnerabilityAssessmentId);
        return Ok(await ToDto(allocations));
    }

    private async Task<ResourceAllocationDto> ToDto(ResourceAllocation allocation)
    {
        var resource = await _context.ReliefResources.AsNoTracking().FirstOrDefaultAsync(x => x.Id == allocation.ResourceId);
        var available = resource?.AvailableQuantity ?? 0;
        var recommended = allocation.RecommendedQuantity;
        var allocated = Math.Min(recommended, available);
        var remaining = Math.Max(available - allocated, 0);
        var gap = Math.Max(recommended - available, 0);
        return new ResourceAllocationDto
        {
            Id = allocation.Id,
            VulnerabilityAssessmentId = allocation.VulnerabilityAssessmentId,
            ResourceId = allocation.ResourceId,
            ResourceType = resource?.ResourceType ?? allocation.ResourceType,
            ResourceName = resource?.ResourceName ?? allocation.ResourceName,
            RecommendedQuantity = recommended,
            Priority = allocation.Priority,
            Location = resource?.Location ?? allocation.Location,
            CreatedAt = allocation.CreatedAt,
            AvailableQuantity = available,
            AllocatedQuantity = allocated,
            RemainingQuantity = remaining,
            GapQuantity = gap,
            Status = resource?.Status ?? "Unknown"
        };
    }

    private async Task<List<ResourceAllocationDto>> ToDto(IEnumerable<ResourceAllocation> allocations)
    {
        var result = new List<ResourceAllocationDto>();
        foreach (var allocation in allocations)
        {
            result.Add(await ToDto(allocation));
        }
        return result;
    }
}



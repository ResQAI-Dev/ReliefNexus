using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs.ResourceOptimization;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class ResourceService : IResourceService
{
    private readonly AppDbContext _context;
    private readonly ResourceOptimizationAgent _optimizationAgent;

    public ResourceService(
        AppDbContext context,
        ResourceOptimizationAgent optimizationAgent)
    {
        _context = context;
        _optimizationAgent = optimizationAgent;
    }

    // ============================================================
    // AGENT 03 DEMAND ASSESSMENT
    // ============================================================

    public async Task<ResourceDemandAssessmentDto?> GetDemandAssessmentAsync(
        Guid vulnerabilityAssessmentId)
    {
        return await _optimizationAgent.GetDemandAssessmentAsync(
            vulnerabilityAssessmentId);
    }

    // ============================================================
    // AGENT 03 EXECUTION
    // ============================================================

    public async Task<List<ResourceAllocation>> OptimizeAsync(
        Guid vulnerabilityAssessmentId)
    {
        return await _optimizationAgent.OptimizeAsync(
            vulnerabilityAssessmentId);
    }

    // ============================================================
    // READ-ONLY ALLOCATION LOOKUPS
    // ============================================================

    public async Task<List<ResourceAllocation>>
        GetExistingAllocationsAsync()
    {
        return await GetAllAllocationsAsync();
    }

    public async Task<List<ResourceAllocation>>
        GetExistingAllocationsAsync(
            Guid vulnerabilityAssessmentId)
    {
        return await _context.ResourceAllocations
            .AsNoTracking()
            .Where(x => x.VulnerabilityAssessmentId == vulnerabilityAssessmentId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ResourceAllocation>>
        GetAllAllocationsAsync()
    {
        return await _context.ResourceAllocations
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<ResourceAllocation?> GetAllocationByIdAsync(Guid id)
    {
        return await _context.ResourceAllocations
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    // ============================================================
    // MANUAL ALLOCATION CRUD
    // Keeps ReliefResources.AllocatedQuantity synchronized.
    // ============================================================

    public async Task<ResourceAllocation> CreateAllocationAsync(
        ResourceAllocation allocation)
    {
        if (allocation.VulnerabilityAssessmentId == Guid.Empty)
            throw new InvalidOperationException("Vulnerability assessment id is required.");

        if (allocation.ResourceId == Guid.Empty)
            throw new InvalidOperationException("Resource id is required.");

        if (allocation.RecommendedQuantity <= 0)
            throw new InvalidOperationException("Recommended quantity must be greater than zero.");

        var resource = await _context.ReliefResources
            .FirstOrDefaultAsync(x => x.Id == allocation.ResourceId);

        if (resource == null)
            throw new KeyNotFoundException("The selected relief resource was not found.");

        var remaining = resource.AvailableQuantity - resource.AllocatedQuantity;

        if (allocation.RecommendedQuantity > remaining)
            throw new InvalidOperationException(
                $"Only {Math.Max(remaining, 0)} units are available for the selected resource.");

        allocation.Id = Guid.NewGuid();
        allocation.CreatedAt = DateTime.UtcNow;
        allocation.ResourceType = resource.ResourceType;
        allocation.ResourceName = resource.ResourceName;
        allocation.Location = string.IsNullOrWhiteSpace(allocation.Location)
            ? resource.Location
            : allocation.Location;

        resource.AllocatedQuantity += allocation.RecommendedQuantity;
        resource.Status = resource.AllocatedQuantity >= resource.AvailableQuantity
            ? "Allocated"
            : "Available";

        _context.ResourceAllocations.Add(allocation);
        await _context.SaveChangesAsync();

        return allocation;
    }

    public async Task<ResourceAllocation?> UpdateAllocationAsync(
        Guid id,
        ResourceAllocation allocation)
    {
        if (allocation.RecommendedQuantity <= 0)
            throw new InvalidOperationException("Recommended quantity must be greater than zero.");

        var existing = await _context.ResourceAllocations
            .FirstOrDefaultAsync(x => x.Id == id);

        if (existing == null)
            return null;

        var newResourceId = allocation.ResourceId == Guid.Empty
            ? existing.ResourceId
            : allocation.ResourceId;

        var newResource = await _context.ReliefResources
            .FirstOrDefaultAsync(x => x.Id == newResourceId);

        if (newResource == null)
            throw new KeyNotFoundException("The selected relief resource was not found.");

        var oldResource = existing.ResourceId == newResource.Id
            ? newResource
            : await _context.ReliefResources
                .FirstOrDefaultAsync(x => x.Id == existing.ResourceId);

        if (oldResource == null)
            throw new KeyNotFoundException("The previously allocated resource was not found.");

        if (oldResource.Id == newResource.Id)
        {
            var remainingAfterReturningOld =
                newResource.AvailableQuantity -
                newResource.AllocatedQuantity +
                existing.RecommendedQuantity;

            if (allocation.RecommendedQuantity > remainingAfterReturningOld)
            {
                throw new InvalidOperationException(
                    $"Only {Math.Max(remainingAfterReturningOld, 0)} units are available for the updated allocation.");
            }

            newResource.AllocatedQuantity =
                newResource.AllocatedQuantity -
                existing.RecommendedQuantity +
                allocation.RecommendedQuantity;
        }
        else
        {
            var newRemaining =
                newResource.AvailableQuantity -
                newResource.AllocatedQuantity;

            if (allocation.RecommendedQuantity > newRemaining)
            {
                throw new InvalidOperationException(
                    $"Only {Math.Max(newRemaining, 0)} units are available for the new resource.");
            }

            oldResource.AllocatedQuantity =
                Math.Max(
                    0,
                    oldResource.AllocatedQuantity -
                    existing.RecommendedQuantity);

            newResource.AllocatedQuantity +=
                allocation.RecommendedQuantity;

            oldResource.Status =
                oldResource.AllocatedQuantity >= oldResource.AvailableQuantity
                    ? "Allocated"
                    : oldResource.AvailableQuantity > 0
                        ? "Available"
                        : "Unavailable";
        }

        existing.VulnerabilityAssessmentId =
            allocation.VulnerabilityAssessmentId == Guid.Empty
                ? existing.VulnerabilityAssessmentId
                : allocation.VulnerabilityAssessmentId;

        existing.ResourceId = newResource.Id;
        existing.ResourceType = newResource.ResourceType;
        existing.ResourceName = newResource.ResourceName;
        existing.RecommendedQuantity = allocation.RecommendedQuantity;
        existing.Priority = string.IsNullOrWhiteSpace(allocation.Priority)
            ? existing.Priority
            : allocation.Priority;
        existing.Location = string.IsNullOrWhiteSpace(allocation.Location)
            ? newResource.Location
            : allocation.Location;

        newResource.Status =
            newResource.AllocatedQuantity >= newResource.AvailableQuantity
                ? "Allocated"
                : newResource.AvailableQuantity > 0
                    ? "Available"
                    : "Unavailable";

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAllocationAsync(Guid id)
    {
        var allocation = await _context.ResourceAllocations
            .FirstOrDefaultAsync(x => x.Id == id);

        if (allocation == null)
            return false;

        var resource = await _context.ReliefResources
            .FirstOrDefaultAsync(x => x.Id == allocation.ResourceId);

        if (resource != null)
        {
            resource.AllocatedQuantity =
                Math.Max(
                    0,
                    resource.AllocatedQuantity -
                    allocation.RecommendedQuantity);

            resource.Status =
                resource.AllocatedQuantity >= resource.AvailableQuantity
                    ? "Allocated"
                    : resource.AvailableQuantity > 0
                        ? "Available"
                        : "Unavailable";
        }

        _context.ResourceAllocations.Remove(allocation);
        await _context.SaveChangesAsync();

        return true;
    }

    // ============================================================
    // REAL DATABASE INVENTORY
    // ============================================================

    public async Task<List<ReliefResource>> GetAllAsync()
    {
        return await _context.ReliefResources
            .AsNoTracking()
            .OrderBy(x => x.Location)
            .ThenBy(x => x.ResourceType)
            .ThenBy(x => x.ResourceName)
            .ToListAsync();
    }

    public async Task<ReliefResource?> GetByIdAsync(Guid id)
    {
        return await _context.ReliefResources
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<ReliefResource> CreateAsync(ReliefResource resource)
    {
        resource.Id = Guid.NewGuid();
        resource.AllocatedQuantity = 0;
        resource.CreatedAt = DateTime.UtcNow;

        resource.Status =
            resource.AvailableQuantity > 0
                ? "Available"
                : "Unavailable";

        _context.ReliefResources.Add(resource);
        await _context.SaveChangesAsync();

        return resource;
    }

    public async Task<ReliefResource?> UpdateAsync(
        Guid id,
        ReliefResource resource)
    {
        var existing =
            await _context.ReliefResources
                .FirstOrDefaultAsync(x => x.Id == id);

        if (existing == null)
            return null;

        existing.ResourceType = resource.ResourceType;
        existing.ResourceName = resource.ResourceName;
        existing.AvailableQuantity = resource.AvailableQuantity;
        existing.Location = resource.Location;

        if (existing.AllocatedQuantity >
            existing.AvailableQuantity)
        {
            existing.AllocatedQuantity =
                existing.AvailableQuantity;
        }

        existing.Status =
            existing.AllocatedQuantity >=
            existing.AvailableQuantity
                ? "Allocated"
                : existing.AvailableQuantity > 0
                    ? "Available"
                    : "Unavailable";

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var resource =
            await _context.ReliefResources
                .FirstOrDefaultAsync(x => x.Id == id);

        if (resource == null)
            return false;

        _context.ReliefResources.Remove(resource);
        await _context.SaveChangesAsync();

        return true;
    }
}


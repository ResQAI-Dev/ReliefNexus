using ReliefNexus.API.DTOs.ResourceOptimization;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface IResourceService
{
    // Live inventory
    Task<List<ReliefResource>> GetAllAsync();
    Task<ReliefResource?> GetByIdAsync(Guid id);
    Task<ReliefResource> CreateAsync(ReliefResource resource);
    Task<ReliefResource?> UpdateAsync(Guid id, ReliefResource resource);
    Task<bool> DeleteAsync(Guid id);

    // Agent 03 demand / optimization
    Task<ResourceDemandAssessmentDto?> GetDemandAssessmentAsync(Guid vulnerabilityAssessmentId);
    Task<List<ResourceAllocation>> OptimizeAsync(Guid vulnerabilityAssessmentId);

    // Allocation CRUD / history
    Task<List<ResourceAllocation>> GetExistingAllocationsAsync();
    Task<List<ResourceAllocation>> GetExistingAllocationsAsync(Guid vulnerabilityAssessmentId);
    Task<List<ResourceAllocation>> GetAllAllocationsAsync();
    Task<ResourceAllocation?> GetAllocationByIdAsync(Guid id);
    Task<ResourceAllocation> CreateAllocationAsync(ResourceAllocation allocation);
    Task<ResourceAllocation?> UpdateAllocationAsync(Guid id, ResourceAllocation allocation);
    Task<bool> DeleteAllocationAsync(Guid id);
}

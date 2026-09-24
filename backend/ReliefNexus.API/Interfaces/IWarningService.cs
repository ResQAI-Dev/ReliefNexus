using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IWarningService
{
    Task<WarningResponse> CreateAsync(
        CreateWarningRequest request,
        Guid createdById);

    Task<WarningResponse?> GetByIdAsync(Guid id);

    Task<List<WarningResponse>> GetAllAsync();

    Task<WarningResponse?> UpdateAsync(
        Guid id,
        UpdateWarningRequest request);
}
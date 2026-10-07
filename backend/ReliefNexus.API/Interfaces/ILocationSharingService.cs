using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface ILocationSharingService
{
    Task<List<LocationShareDto>> GetAllAsync();
    Task<List<LocationShareDto>> GetMyAsync(Guid userId);
    Task<LocationShareDto?> CreateAsync(Guid userId, LocationShareDto request);
    Task<LocationShareDto?> StopAsync(
        Guid id,
        Guid userId,
        bool isAdministrator);
}

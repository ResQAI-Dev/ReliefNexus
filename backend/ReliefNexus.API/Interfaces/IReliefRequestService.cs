using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IReliefRequestService
{
    Task<List<ReliefRequestDto>> GetAllAsync();
    Task<List<ReliefRequestDto>> GetMyAsync(Guid userId);
    Task<ReliefRequestDto?> CreateAsync(Guid userId, ReliefRequestDto request);
    Task<ReliefRequestDto?> UpdateStatusAsync(Guid id, string status);
}

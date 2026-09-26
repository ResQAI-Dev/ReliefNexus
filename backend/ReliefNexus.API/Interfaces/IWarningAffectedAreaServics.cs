using ReliefNexus.API.DTOs;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface IWarningAffectedAreaService
{
    Task<WarningAffectedArea?> AddAsync(
        Guid warningId,
        AddWarningAffectedAreaRequest request);

    Task<List<WarningAffectedArea>> GetByWarningIdAsync(
        Guid warningId);

    Task<bool> RemoveAsync(
        Guid warningId,
        Guid affectedAreaId);
}
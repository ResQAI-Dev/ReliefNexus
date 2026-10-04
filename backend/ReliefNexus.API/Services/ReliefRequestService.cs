using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class ReliefRequestService : IReliefRequestService
{
    private readonly AppDbContext _context;

    public ReliefRequestService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReliefRequestDto>> GetAllAsync()
    {
        return await (
            from request in _context.ReliefRequests
            join user in _context.Users
                on request.RequesterUserId equals user.Id
            orderby request.CreatedAt descending
            select new ReliefRequestDto
            {
                Id = request.Id,
                RequesterUserId = request.RequesterUserId,
                RequesterName = user.FullName,
                RequesterEmail = user.Email,
                RequestType = request.RequestType,
                Description = request.Description,
                Location = request.Location,
                Quantity = request.Quantity,
                Urgency = request.Urgency,
                Status = request.Status,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt
            }
        ).ToListAsync();
    }

    public async Task<List<ReliefRequestDto>> GetMyAsync(Guid userId)
    {
        return await _context.ReliefRequests
            .Where(x => x.RequesterUserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ReliefRequestDto
            {
                Id = x.Id,
                RequesterUserId = x.RequesterUserId,
                RequestType = x.RequestType,
                Description = x.Description,
                Location = x.Location,
                Quantity = x.Quantity,
                Urgency = x.Urgency,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<ReliefRequestDto?> CreateAsync(
        Guid userId,
        ReliefRequestDto request)
    {
        var entity = new ReliefRequest
        {
            RequesterUserId = userId,
            RequestType = request.RequestType.Trim(),
            Description = request.Description.Trim(),
            Location = request.Location.Trim(),
            Quantity = Math.Max(0, request.Quantity),
            Urgency = string.IsNullOrWhiteSpace(request.Urgency)
                ? "Medium"
                : request.Urgency.Trim(),
            Status = "Submitted",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ReliefRequests.Add(entity);
        await _context.SaveChangesAsync();

        return Map(entity);
    }

    public async Task<ReliefRequestDto?> UpdateStatusAsync(
        Guid id,
        string status)
    {
        var entity = await _context.ReliefRequests
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
            return null;

        entity.Status = status.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Map(entity);
    }

    private static ReliefRequestDto Map(ReliefRequest entity)
    {
        return new ReliefRequestDto
        {
            Id = entity.Id,
            RequesterUserId = entity.RequesterUserId,
            RequestType = entity.RequestType,
            Description = entity.Description,
            Location = entity.Location,
            Quantity = entity.Quantity,
            Urgency = entity.Urgency,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}

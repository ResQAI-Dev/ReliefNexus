using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class LocationSharingService : ILocationSharingService
{
    private readonly AppDbContext _context;

    public LocationSharingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<LocationShareDto>> GetAllAsync()
    {
        return await (
            from share in _context.LocationShares
            join user in _context.Users
                on share.UserId equals user.Id
            orderby share.CreatedAt descending
            select new LocationShareDto
            {
                Id = share.Id,
                UserId = share.UserId,
                UserName = user.FullName,
                UserEmail = user.Email,
                Role = user.Role,
                Location = share.Location,
                Latitude = share.Latitude,
                Longitude = share.Longitude,
                Status = share.Status,
                CreatedAt = share.CreatedAt,
                UpdatedAt = share.UpdatedAt
            }
        ).ToListAsync();
    }

    public async Task<List<LocationShareDto>> GetMyAsync(Guid userId)
    {
        return await (
            from share in _context.LocationShares
            where share.UserId == userId
            orderby share.CreatedAt descending
            select new LocationShareDto
            {
                Id = share.Id,
                UserId = share.UserId,
                Location = share.Location,
                Latitude = share.Latitude,
                Longitude = share.Longitude,
                Status = share.Status,
                CreatedAt = share.CreatedAt,
                UpdatedAt = share.UpdatedAt
            }
        ).ToListAsync();
    }

    public async Task<LocationShareDto?> CreateAsync(
        Guid userId,
        LocationShareDto request)
    {
        var entity = new LocationShare
        {
            UserId = userId,
            Location = request.Location.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LocationShares.Add(entity);
        await _context.SaveChangesAsync();

        return Map(entity);
    }

    public async Task<LocationShareDto?> StopAsync(
        Guid id,
        Guid userId,
        bool isAdministrator)
    {
        var entity = await _context.LocationShares
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
            return null;

        if (!isAdministrator && entity.UserId != userId)
            return null;

        entity.Status = "Stopped";
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Map(entity);
    }

    private static LocationShareDto Map(LocationShare entity)
    {
        return new LocationShareDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            Location = entity.Location,
            Latitude = entity.Latitude,
            Longitude = entity.Longitude,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}


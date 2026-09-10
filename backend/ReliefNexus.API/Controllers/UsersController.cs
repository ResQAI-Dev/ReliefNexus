using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly AppDbContext _context;

    public UsersController(
        IUserService userService,
        AppDbContext context)
    {
        _userService = userService;
        _context = context;
    }

    // =========================================================
    // CREATE USER
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpPost]
    public async Task<IActionResult> CreateUser(UserDto userDto)
    {
        try
        {
            var user = new User
            {
                FullName = userDto.FullName,
                Email = userDto.Email,
                PasswordHash = userDto.Password ?? string.Empty,
                Role = string.IsNullOrWhiteSpace(userDto.Role)
                    ? "AffectedUser"
                    : userDto.Role,
                RoleRequestStatus = "Approved",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var createdUser =
                await _userService.CreateUserAsync(user);

            return Ok(MapToDto(createdUser));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // GET ALL USERS
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userService.GetUsersAsync();

        var response = users
            .Select(MapToDto)
            .ToList();

        return Ok(response);
    }

    // =========================================================
    // GET USER BY ID
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found"
            });
        }

        return Ok(MapToDto(user));
    }

    // =========================================================
    // GET PENDING ROLE REQUESTS
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpGet("pending-role-requests")]
    public async Task<IActionResult> GetPendingRoleRequests()
    {
        var users = await _context.Users
            .AsNoTracking()
            .Where(u => u.RoleRequestStatus == "Pending")
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var response = users
            .Select(MapToDto)
            .ToList();

        return Ok(response);
    }

    // =========================================================
    // APPROVE ROLE REQUEST
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpPut("{id:guid}/approve-role")]
    public async Task<IActionResult> ApproveRole(Guid id)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found"
            });
        }

        if (user.RoleRequestStatus != "Pending")
        {
            return BadRequest(new
            {
                message = "This role request has already been processed"
            });
        }

        user.RoleRequestStatus = "Approved";
        user.IsActive = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Role request approved successfully",
            user = MapToDto(user)
        });
    }

    // =========================================================
    // REJECT ROLE REQUEST
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpPut("{id:guid}/reject-role")]
    public async Task<IActionResult> RejectRole(Guid id)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found"
            });
        }

        if (user.RoleRequestStatus != "Pending")
        {
            return BadRequest(new
            {
                message = "This role request has already been processed"
            });
        }

        user.RoleRequestStatus = "Rejected";
        user.IsActive = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Role request rejected successfully",
            user = MapToDto(user)
        });
    }

    // =========================================================
    // UPDATE USER
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUser(
        Guid id,
        UserDto userDto)
    {
        try
        {
            var user = new User
            {
                FullName = userDto.FullName,
                Email = userDto.Email,
                PasswordHash = userDto.Password ?? string.Empty,
                Role = userDto.Role,
                IsActive = userDto.IsActive
            };

            var updatedUser =
                await _userService.UpdateUserAsync(id, user);

            if (updatedUser == null)
            {
                return NotFound(new
                {
                    message = "User not found"
                });
            }

            return Ok(MapToDto(updatedUser));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // DELETE USER
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var deleted =
            await _userService.DeleteUserAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "User not found"
            });
        }

        return Ok(new
        {
            message = "User deleted successfully"
        });
    }

    // =========================================================
    // MAP USER → DTO
    // =========================================================

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Password = null
        };
    }
}
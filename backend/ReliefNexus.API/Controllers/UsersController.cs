using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Helpers;
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

    // ======================================================
    // CREATE USER
    // ======================================================

    [Authorize(Roles = RoleConstants.SystemAdministrator)]
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
                    ? RoleConstants.AffectedUser
                    : userDto.Role,
                RoleRequestStatus = "Approved",
                IsActive = true
            };

            var createdUser = await _userService.CreateUserAsync(user);

            return Ok(MapToDto(createdUser));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    // ======================================================
    // GET ALL USERS
    // ======================================================

    [Authorize(Roles = RoleConstants.SystemAdministrator)]
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userService.GetUsersAsync();

        var response = users
            .Select(MapToDto)
            .ToList();

        return Ok(response);
    }

    // ======================================================
    // GET PENDING ROLE REQUESTS
    // ======================================================

    [Authorize(Roles = RoleConstants.SystemAdministrator)]
    [HttpGet("pending-role-requests")]
    public async Task<IActionResult> GetPendingRoleRequests()
    {
        var requests = await _context.Users
            .Where(u => u.RoleRequestStatus == "Pending")
            .OrderBy(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Role,
                u.RoleRequestStatus,
                u.IsActive,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    // ======================================================
    // APPROVE ROLE REQUEST
    // ======================================================

    [Authorize(Roles = RoleConstants.SystemAdministrator)]
    [HttpPut("{id}/approve-role")]
    public async Task<IActionResult> ApproveRole(Guid id)
    {
        var user = await _context.Users.FindAsync(id);

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
                message = "This role request is not pending."
            });
        }

        if (!RoleConstants.AllRoles.Contains(user.Role))
        {
            return BadRequest(new
            {
                message = "Invalid role request."
            });
        }

        user.RoleRequestStatus = "Approved";
        user.IsActive = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Role request approved successfully.",
            userId = user.Id,
            role = user.Role,
            status = user.RoleRequestStatus,
            isActive = user.IsActive
        });
    }

    // ======================================================
    // REJECT ROLE REQUEST
    // ======================================================

    [Authorize(Roles = RoleConstants.SystemAdministrator)]
    [HttpPut("{id}/reject-role")]
    public async Task<IActionResult> RejectRole(Guid id)
    {
        var user = await _context.Users.FindAsync(id);

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
                message = "This role request is not pending."
            });
        }

        user.RoleRequestStatus = "Rejected";
        user.IsActive = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Role request rejected successfully.",
            userId = user.Id,
            role = user.Role,
            status = user.RoleRequestStatus,
            isActive = user.IsActive
        });
    }

    // ======================================================
    // UPDATE USER
    // ======================================================

    [Authorize(Roles = RoleConstants.SystemAdministrator)]
    [HttpPut("{id}")]
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

    // ======================================================
    // DELETE USER
    // ======================================================

    [Authorize(Roles = RoleConstants.SystemAdministrator)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var deleted = await _userService.DeleteUserAsync(id);

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

    // ======================================================
    // MAP USER TO DTO
    // ======================================================

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

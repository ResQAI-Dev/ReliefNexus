using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // ======================================================
    // CREATE USER
    // Anyone can register
    // ======================================================

    [HttpPost]
    public async Task<IActionResult> CreateUser(
        CreateUserDto userDto)
    {
        try
        {
            var user = new User
            {
                FullName = userDto.FullName,
                Email = userDto.Email,
                PasswordHash = userDto.Password,
                Role = "User",
                IsActive = true
            };

            var createdUser =
                await _userService.CreateUserAsync(user);

            var response = new UserResponseDto
            {
                Id = createdUser.Id,
                FullName = createdUser.FullName,
                Email = createdUser.Email,
                Role = createdUser.Role,
                IsActive = createdUser.IsActive,
                CreatedAt = createdUser.CreatedAt
            };

            return Ok(response);
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
    // GET ALL USERS
    // Only Admin can view users
    // ======================================================

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users =
            await _userService.GetUsersAsync();

        var response = users
            .Select(user => new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            })
            .ToList();

        return Ok(response);
    }

    // ======================================================
    // UPDATE USER
    // Only Admin can update users
    // ======================================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(
        Guid id,
        UpdateUserDto userDto)
    {
        try
        {
            var user = new User
            {
                FullName = userDto.FullName,
                Email = userDto.Email,
                PasswordHash = userDto.Password,
                Role = userDto.Role,
                IsActive = userDto.IsActive
            };

            var updatedUser =
                await _userService.UpdateUserAsync(
                    id,
                    user
                );

            // User not found
            if (updatedUser == null)
            {
                return NotFound(new
                {
                    message = "User not found"
                });
            }

            var response = new UserResponseDto
            {
                Id = updatedUser.Id,
                FullName = updatedUser.FullName,
                Email = updatedUser.Email,
                Role = updatedUser.Role,
                IsActive = updatedUser.IsActive,
                CreatedAt = updatedUser.CreatedAt
            };

            return Ok(response);
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
    // Only Admin can delete users
    // ======================================================

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(
        Guid id)
    {
        var deleted =
            await _userService.DeleteUserAsync(id);

        // User not found
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
}
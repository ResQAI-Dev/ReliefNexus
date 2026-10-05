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
    private readonly IAuditLogService _auditLogService;

    public UsersController(
        IUserService userService,
        AppDbContext context,
        IAuditLogService auditLogService)
    {
        _userService = userService;
        _context = context;
        _auditLogService = auditLogService;
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
                Permissions = userDto.Permissions ?? new List<string>(),
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

        var rolePermissions = await _context.Users
            .Where(u =>
                u.Role == user.Role &&
                u.Id != user.Id &&
                u.Permissions.Any())
            .Select(u => u.Permissions)
            .FirstOrDefaultAsync();

        if (rolePermissions != null)
        {
            user.Permissions = rolePermissions.ToList();
        }

        await _context.SaveChangesAsync();

        // Audit logging must not make a successful role approval look like a failed request.
        // Support both standard ASP.NET NameIdentifier and JWT "sub" claims.
        var currentUserIdValue =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        Guid? currentUserId =
            Guid.TryParse(currentUserIdValue, out var parsedCurrentUserId)
                ? parsedCurrentUserId
                : null;

        try
        {
            await _auditLogService.CreateAsync(
                currentUserId,
                "ROLE_REQUEST_APPROVED",
                $"Approved role request for {user.FullName} ({user.Email}).",
                User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value,
                User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value,
                "Success",
                "Normal");
        }
        catch (Exception auditEx)
        {
            // The role change has already been committed. Do not return an API
            // failure merely because audit logging is unavailable.
            Console.Error.WriteLine(
                $"ROLE_REQUEST_APPROVED audit log failed: {auditEx.Message}");
        }

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

        // Audit logging must not make a successful role rejection look like a failed request.
        // Support both standard ASP.NET NameIdentifier and JWT "sub" claims.
        var currentUserIdValue =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        Guid? currentUserId =
            Guid.TryParse(currentUserIdValue, out var parsedCurrentUserId)
                ? parsedCurrentUserId
                : null;

        try
        {
            await _auditLogService.CreateAsync(
                currentUserId,
                "ROLE_REQUEST_REJECTED",
                $"Rejected role request for {user.FullName} ({user.Email}).",
                User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value,
                User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value,
                "Success",
                "Normal");
        }
        catch (Exception auditEx)
        {
            // The role change has already been committed. Do not return an API
            // failure merely because audit logging is unavailable.
            Console.Error.WriteLine(
                $"ROLE_REQUEST_REJECTED audit log failed: {auditEx.Message}");
        }

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
                IsActive = userDto.IsActive,
                Permissions = userDto.Permissions ?? new List<string>()
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
    // UPDATE ROLE PERMISSIONS
    // =========================================================

    [Authorize(Roles = "SystemAdministrator")]
    [HttpPut("~/api/permissions/role")]
    public async Task<IActionResult> UpdateRolePermissions(UserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Role))
        {
            return BadRequest(new
            {
                message = "Role is required"
            });
        }

        var users = await _context.Users
            .Where(u => u.Role == dto.Role)
            .ToListAsync();

        foreach (var user in users)
        {
            user.Permissions = dto.Permissions ?? new List<string>();
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Permissions updated for {dto.Role}",
            role = dto.Role,
            permissions = dto.Permissions,
            affectedUsers = users.Count
        });
    }

    // =========================================================
    // GET CURRENT USER PROFILE
    // =========================================================

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (!Guid.TryParse(userId, out var id))
        {
            return Unauthorized(new { message = "Authenticated user id was not found." });
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(MapToDto(user));
    }

    // =========================================================
    // UPDATE CURRENT USER PROFILE
    // =========================================================

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateProfileRequest request)
    {
        var userId =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (!Guid.TryParse(userId, out var id))
        {
            return Unauthorized(new { message = "Authenticated user id was not found." });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Full name and email address are required."
            });
        }

        var email = request.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users.AnyAsync(u =>
            u.Id != user.Id &&
            u.Email.ToLower() == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "That email address is already in use."
            });
        }

        user.FullName = request.FullName.Trim();
        user.Email = email;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(user));
    }

    // =========================================================
    // UPLOAD PROFILE IMAGE
    // =========================================================

    [Authorize]
    [HttpPost("me/profile-image")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadMyProfileImage(IFormFile image)
    {
        var userId =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (!Guid.TryParse(userId, out var id))
        {
            return Unauthorized(new { message = "Authenticated user id was not found." });
        }

        if (image == null || image.Length == 0)
        {
            return BadRequest(new { message = "Please select an image." });
        }

        if (image.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "Profile image must be 5 MB or smaller." });
        }

        var allowedTypes = new Dictionary<string, string>
        {
            ["image/jpeg"] = ".jpg",
            ["image/png"] = ".png",
            ["image/webp"] = ".webp",
            ["image/gif"] = ".gif"
        };

        if (!allowedTypes.TryGetValue(image.ContentType, out var extension))
        {
            return BadRequest(new
            {
                message = "Only JPG, PNG, WEBP and GIF images are supported."
            });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var webRoot = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot");

        var uploadDirectory = Path.Combine(
            webRoot,
            "uploads",
            "profiles");

        Directory.CreateDirectory(uploadDirectory);

        var fileName =
            $"{user.Id:N}-{Guid.NewGuid():N}{extension}";

        var filePath = Path.Combine(
            uploadDirectory,
            fileName);

        await using (var stream = new FileStream(
            filePath,
            FileMode.CreateNew))
        {
            await image.CopyToAsync(stream);
        }

        user.ProfileImageUrl =
            $"{Request.Scheme}://{Request.Host}/uploads/profiles/{fileName}";

        await _context.SaveChangesAsync();

        return Ok(MapToDto(user));
    }

    // =========================================================
    // DELETE PROFILE IMAGE
    // =========================================================

    [Authorize]
    [HttpDelete("me/profile-image")]
    public async Task<IActionResult> DeleteMyProfileImage()
    {
        var userId =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (!Guid.TryParse(userId, out var id))
        {
            return Unauthorized(new { message = "Authenticated user id was not found." });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.ProfileImageUrl = null;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(user));
    }

    public sealed class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
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
    // MAP USER ? DTO
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
        Permissions = user.Permissions ?? new List<string>(),
        CreatedAt = user.CreatedAt,
        Password = null,

        PhoneNumber = user.PhoneNumber,
        DateOfBirth = user.DateOfBirth,
        Gender = user.Gender,
        Address = user.Address,
        District = user.District,
        EmergencyContactName = user.EmergencyContactName,
        EmergencyContactPhone = user.EmergencyContactPhone,
        ProfileImageUrl = user.ProfileImageUrl
    };
}
}






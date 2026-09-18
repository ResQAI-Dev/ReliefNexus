using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Helpers;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ReliefNexus.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthDto?> LoginAsync(AuthDto dto)
    {
        var email = dto.Email?.Trim().ToLower();

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return null;
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == email);

        if (user == null ||
            !user.IsActive ||
            user.RoleRequestStatus != "Approved")
        {
            return null;
        }

        var validPassword = BCrypt.Net.BCrypt.Verify(
            dto.Password,
            user.PasswordHash);

        if (!validPassword)
            return null;

        var token = GenerateJwtToken(user);

        return new AuthDto
        {
            AccessToken = token,
            Role = user.Role,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            }
        };
    }

    public async Task<AuthDto?> RegisterAsync(AuthDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password) ||
            string.IsNullOrWhiteSpace(dto.Role))
        {
            return null;
        }

        var email = dto.Email.Trim().ToLower();
        var requestedRole = dto.Role.Trim();

        if (!RoleConstants.AllRoles.Contains(requestedRole))
        {
            throw new InvalidOperationException(
                "Invalid role. Please select a valid role.");
        }

        var exists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email);

        if (exists)
        {
            throw new InvalidOperationException(
                "Email already exists");
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = requestedRole,
            RoleRequestStatus = "Pending",
            IsActive = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new AuthDto
        {
            Role = user.Role,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            }
        };
    }

    public async Task<AuthDto?> RefreshAsync(string refreshToken)
    {
        await Task.CompletedTask;
        return null;
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(
                JwtRegisteredClaimNames.Sub,
                user.Id.ToString()),

            new Claim(
                JwtRegisteredClaimNames.Email,
                user.Email),

            new Claim(
                ClaimTypes.Name,
                user.FullName),

            new Claim(
                ClaimTypes.Role,
                user.Role)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"]!));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var expiryMinutes = Convert.ToDouble(
            _configuration["Jwt:ExpiryMinutes"]);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}

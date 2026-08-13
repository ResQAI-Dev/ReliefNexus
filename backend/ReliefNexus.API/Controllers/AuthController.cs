using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;

    public AuthController(
        IUserService userService,
        IConfiguration configuration)
    {
        _userService = userService;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        var user = await _userService.LoginAsync(
            loginDto.Email,
            loginDto.Password
        );

        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password"
            });
        }

        var token = GenerateJwtToken(user);

        var response = new LoginResponseDto
        {
            Token = token,

            User = new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            }
        };

        return Ok(response);
    }

    private string GenerateJwtToken(Models.User user)
    {
        var claims = new[]
        {
            new Claim(
                JwtRegisteredClaimNames.Sub,
                user.Id.ToString()
            ),

            new Claim(
                JwtRegisteredClaimNames.Email,
                user.Email
            ),

            new Claim(
                ClaimTypes.Name,
                user.FullName
            ),

            new Claim(
                ClaimTypes.Role,
                user.Role
            )
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"]!
            )
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var expiryMinutes = Convert.ToDouble(
            _configuration["Jwt:ExpiryMinutes"]
        );

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}
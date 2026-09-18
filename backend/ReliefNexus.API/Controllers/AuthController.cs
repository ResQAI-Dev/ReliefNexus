using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // REGISTER
    [HttpPost("register")]
    public async Task<ActionResult<AuthDto>> Register(
        [FromBody] AuthDto dto)
    {
        try
        {
            var response = await _authService.RegisterAsync(dto);

            if (response == null)
                return BadRequest(new
                {
                    message = "Invalid registration data"
                });

            return StatusCode(
                StatusCodes.Status201Created,
                response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

    // LOGIN
    [HttpPost("login")]
    public async Task<ActionResult<AuthDto>> Login(
        [FromBody] AuthDto dto)
    {
        var response = await _authService.LoginAsync(dto);

        if (response == null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password"
            });
        }

        return Ok(response);
    }

    // REFRESH TOKEN
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthDto>> Refresh(
        [FromBody] AuthDto dto)
    {
        var response = await _authService.RefreshAsync(
            dto.RefreshToken ?? string.Empty);

        if (response == null)
        {
            return Unauthorized(new
            {
                message = "Invalid refresh token"
            });
        }

        return Ok(response);
    }
}

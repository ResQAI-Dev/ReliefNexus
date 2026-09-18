using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Interfaces;

public interface IAuthService
{
    Task<AuthDto?> LoginAsync(AuthDto dto);

    Task<AuthDto?> RegisterAsync(AuthDto dto);

    Task<AuthDto?> RefreshAsync(string refreshToken);
}

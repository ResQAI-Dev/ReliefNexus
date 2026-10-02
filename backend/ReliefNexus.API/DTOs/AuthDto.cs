namespace ReliefNexus.API.DTOs;

public class AuthDto
{
    public string? FullName { get; set; }

    public string? Email { get; set; }

    public string? Password { get; set; }

    public string? RefreshToken { get; set; }

    public string? AccessToken { get; set; }

    public string? Role { get; set; }

    public UserDto? User { get; set; }
}

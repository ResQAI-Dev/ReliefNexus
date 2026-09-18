namespace ReliefNexus.API.DTOs;

public class AuthDto
{
    public string? FullName { get; set; }

    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? District { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }

    public string? Password { get; set; }

    public string? RefreshToken { get; set; }

    public string? AccessToken { get; set; }

    public string? Role { get; set; }

    public UserDto? User { get; set; }
}


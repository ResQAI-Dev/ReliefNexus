namespace ReliefNexus.API.DTOs;

public class UserDto
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Password { get; set; }

    public string Role { get; set; } = "User";

    public bool IsActive { get; set; }

    public List<string> Permissions { get; set; } = new();

    public DateTime CreatedAt { get; set; }

    // Profile Information
    public string? PhoneNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? Address { get; set; }

    public string? District { get; set; }

    // Emergency Contact
    public string? EmergencyContactName { get; set; }

    public string? EmergencyContactPhone { get; set; }

    // Profile Image
    public string? ProfileImageUrl { get; set; }
}
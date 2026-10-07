using ReliefNexus.API.Helpers;

namespace ReliefNexus.API.Models;

public class User
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = RoleConstants.AffectedUser;

    public string RoleRequestStatus { get; set; } = "Pending";

    public bool IsActive { get; set; } = false;

    public List<string> Permissions { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? PhoneNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? Address { get; set; }

    public string? District { get; set; }

    public string? EmergencyContactName { get; set; }

    public string? EmergencyContactPhone { get; set; }

    public string? ProfileImageUrl { get; set; }
}

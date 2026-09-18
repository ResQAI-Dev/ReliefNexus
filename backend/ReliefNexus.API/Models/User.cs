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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

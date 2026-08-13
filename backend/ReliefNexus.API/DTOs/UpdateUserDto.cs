using System.ComponentModel.DataAnnotations;

namespace ReliefNexus.API.DTOs;

public class UpdateUserDto
{
    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = "User";

    public bool IsActive { get; set; } = true;
}
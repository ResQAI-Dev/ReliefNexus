namespace ReliefNexus.API.DTOs;

public class UpdateWarningRequest
{
    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Guidance { get; set; } = string.Empty;

    public string Severity { get; set; } = "MEDIUM";

    public DateTime? ExpiresAt { get; set; }
}
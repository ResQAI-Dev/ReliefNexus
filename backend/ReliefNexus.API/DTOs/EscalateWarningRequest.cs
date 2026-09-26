namespace ReliefNexus.API.DTOs;

public class EscalateWarningRequest
{
    public string NewSeverity { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
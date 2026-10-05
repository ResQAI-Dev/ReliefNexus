namespace ReliefNexus.API.DTOs;

public sealed class FieldUpdateRequest
{
    public string? Notes { get; set; }

    public string? Situation { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }
}

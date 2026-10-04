namespace ReliefNexus.API.DTOs;

public class RiskPredictionQueryDto
{
    public string? Search { get; set; }
    public string? Location { get; set; }
    public string? RiskLevel { get; set; }
    public string? DisasterType { get; set; }

    public double? MinRiskScore { get; set; }
    public double? MaxRiskScore { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    public string SortBy { get; set; } = "createdAt";
    public string SortOrder { get; set; } = "desc";
}

public class PaginatedRiskPredictionDto
{
    public List<RiskPredictionDto> Items { get; set; } = new();

    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

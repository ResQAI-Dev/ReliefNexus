using System.Text.Json.Serialization;

namespace ReliefNexus.API.AI.Models;

public class PythonRiskAssessment
{
    [JsonPropertyName("agent")]
    public string Agent { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("risk_score")]
    public double RiskScore { get; set; }

    [JsonPropertyName("risk_level")]
    public string RiskLevel { get; set; } = string.Empty;

    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [JsonPropertyName("primary_hazard")]
    public string PrimaryHazard { get; set; } = string.Empty;

    [JsonPropertyName("hazards")]
    public List<string> Hazards { get; set; } = new();

    [JsonPropertyName("risk_factors")]
    public List<string> RiskFactors { get; set; } = new();

    [JsonPropertyName("missing_data")]
    public List<string> MissingData { get; set; } = new();

    [JsonPropertyName("reasoning")]
    public string Reasoning { get; set; } = string.Empty;

    [JsonPropertyName("recommended_next_step")]
    public string RecommendedNextStep { get; set; } = string.Empty;

    [JsonPropertyName("validation")]
    public PythonValidationResult Validation { get; set; } = new();

    [JsonPropertyName("usage")]
    public PythonUsageResult Usage { get; set; } = new();
}

public class PythonValidationResult
{
    [JsonPropertyName("score_valid")]
    public bool ScoreValid { get; set; }

    [JsonPropertyName("confidence_valid")]
    public bool ConfidenceValid { get; set; }

    [JsonPropertyName("evidence_grounded")]
    public bool EvidenceGrounded { get; set; }
}

public class PythonUsageResult
{
    [JsonPropertyName("inputTokens")]
    public int InputTokens { get; set; }

    [JsonPropertyName("outputTokens")]
    public int OutputTokens { get; set; }

    [JsonPropertyName("totalTokens")]
    public int TotalTokens { get; set; }

    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;
}

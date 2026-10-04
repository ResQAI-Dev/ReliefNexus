using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;
using ReliefNexus.API.AI.Services;

namespace ReliefNexus.API.Services;

public class RiskPredictionService : IRiskPredictionService
{
    private readonly AppDbContext _context;
    private readonly RiskPredictionAgent _agent;
    private readonly IPythonAIService _pythonAIService;
    private readonly IAgentExecutionService _agentExecutionService;

    public RiskPredictionService(
        AppDbContext context,
        RiskPredictionAgent agent,
        IPythonAIService pythonAIService,
        IAgentExecutionService agentExecutionService)
    {
        _context = context;
        _agent = agent;
        _pythonAIService = pythonAIService;
        _agentExecutionService = agentExecutionService;
    }

    public async Task<RiskPredictionDto> CreateAsync(
        Guid userId,
        RiskPredictionDto request,
        Guid executionId)
    {
        var agentResult =
            await _agent.RunAsync(request, executionId);

        var aiAssessment =
            await _pythonAIService.AssessRiskAsync(agentResult);

        if (aiAssessment != null)
        {
            await _agentExecutionService.UpdateStepAsync(
                executionId,
                "Python AI assessment completed",
                "WeatherTool -> DisasterDataTool -> RiskEngine -> Validation -> Python AI",
                $"Gemini model={aiAssessment.Usage.Model}; " +
                $"InputTokens={aiAssessment.Usage.InputTokens}; " +
                $"OutputTokens={aiAssessment.Usage.OutputTokens}; " +
                $"TotalTokens={aiAssessment.Usage.TotalTokens}");

            await _agentExecutionService.RecordUsageAsync(
                executionId,
                aiAssessment.Usage.InputTokens,
                aiAssessment.Usage.OutputTokens,
                aiAssessment.Usage.TotalTokens,
                aiAssessment.Usage.Model);
        }

        if (aiAssessment != null &&
            aiAssessment.Status.Equals(
                "completed",
                StringComparison.OrdinalIgnoreCase) &&
            aiAssessment.Validation.ScoreValid &&
            aiAssessment.Validation.ConfidenceValid &&
            aiAssessment.Validation.EvidenceGrounded)
        {
            agentResult.RiskScore =
                aiAssessment.RiskScore;

            agentResult.RiskLevel =
                aiAssessment.RiskLevel;

            agentResult.Confidence =
                aiAssessment.Confidence * 100.0;

            if (!string.IsNullOrWhiteSpace(
                    aiAssessment.PrimaryHazard))
            {
                agentResult.DisasterType =
                    aiAssessment.PrimaryHazard;
            }

            agentResult.PredictionSource =
                "ReliefNexus AI Agent + Gemini";

            agentResult.ModelVersion =
                "Gemini AI Risk Agent";

            if (!string.IsNullOrWhiteSpace(
                    aiAssessment.Reasoning))
            {
                agentResult.OfficialAlertSummary =
                    string.IsNullOrWhiteSpace(
                        agentResult.OfficialAlertSummary)
                        ? aiAssessment.Reasoning
                        : agentResult.OfficialAlertSummary;
            }
        }
        var prediction = new RiskPrediction
        {
            UserId = userId,

            Location = agentResult.Location,
            Latitude = agentResult.Latitude,
            Longitude = agentResult.Longitude,

            Rainfall1h =
                agentResult.Rainfall1h,

            Rainfall3h =
                agentResult.Rainfall3h,

            Rainfall24h =
                agentResult.Rainfall24h,

            RiverLevel =
                agentResult.RiverLevel,

            RiverFlow =
                agentResult.RiverFlow,

            Temperature =
                agentResult.Temperature,

            Humidity =
                agentResult.Humidity,

            WindSpeed =
                agentResult.WindSpeed,

            SoilMoisture =
                agentResult.SoilMoisture,

            Elevation =
                agentResult.Elevation,

            PopulationDensity =
                agentResult.PopulationDensity,

            HistoricalFloodCount =
                agentResult.HistoricalFloodCount,

            HistoricalSeverity =
                agentResult.HistoricalSeverity,

            DrainageCapacity =
                agentResult.DrainageCapacity,

            ForecastRainfall =
                agentResult.ForecastRainfall,

            DisasterType =
                agentResult.DisasterType,

            RiskScore =
                agentResult.RiskScore,

            RiskLevel =
                agentResult.RiskLevel,

            Confidence =
                agentResult.Confidence,

            PredictionSource =
                agentResult.PredictionSource,

            ModelVersion =
                agentResult.ModelVersion,

            RequiresHumanApproval = agentResult.RiskScore >= 75,

            IsApproved = false,

            ApprovalStatus = agentResult.RiskScore >= 75 ? "Pending" : "NotRequired",

            CreatedAt =
                DateTime.UtcNow,

            RiskFactors =
                agentResult.RiskFactors
                    .Select(x => new RiskFactor
                    {
                        Factor = x.Factor,
                        Value = x.Value,
                        Impact = x.Impact,
                        Contribution =
                            x.Contribution
                    })
                    .ToList()
        };

        _context.RiskPredictions.Add(
            prediction);

        await _context.SaveChangesAsync();

        var response =
            MapToDto(prediction);

        response.DisasterRisks =
            agentResult.DisasterRisks;

        return response;
    }

    public async Task<List<RiskPredictionDto>>
        GetAllAsync()
    {
        var predictions =
            await _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();

        return predictions
            .Select(MapToDto)
            .ToList();
    }
    public async Task<RiskPredictionDto?> GetByIdAsync(Guid id)
    {
        var prediction =
            await _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .FirstOrDefaultAsync(x => x.Id == id);

        if (prediction == null)
            return null;

        var response = MapToDto(prediction);

        // Rebuild Agent 01 multi-disaster results
        // using the actual stored prediction inputs.
        var agentInput = new RiskPredictionDto
        {
            Location = prediction.Location,
            Latitude = prediction.Latitude,
            Longitude = prediction.Longitude,

            Rainfall1h = prediction.Rainfall1h,
            Rainfall3h = prediction.Rainfall3h,
            Rainfall24h = prediction.Rainfall24h,

            RiverLevel = prediction.RiverLevel,
            RiverFlow = prediction.RiverFlow,

            Temperature = prediction.Temperature,
            Humidity = prediction.Humidity,
            WindSpeed = prediction.WindSpeed,

            SoilMoisture = prediction.SoilMoisture,
            Elevation = prediction.Elevation,
            PopulationDensity = prediction.PopulationDensity,

            HistoricalFloodCount =
                prediction.HistoricalFloodCount,

            HistoricalSeverity =
                prediction.HistoricalSeverity,

            DrainageCapacity =
                prediction.DrainageCapacity,

            ForecastRainfall =
                prediction.ForecastRainfall
        };

        var agentResult =
            await _agent.RunAsync(
                agentInput,
                Guid.NewGuid());

        response.DisasterRisks =
            agentResult.DisasterRisks;

        return response;
    }


    public async Task<List<RiskPredictionDto>>
        GetByLocationAsync(
            string location)
    {
        if (string.IsNullOrWhiteSpace(location))
            return new();

        var normalized =
            location.Trim().ToLower();

        var predictions =
            await _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .Where(x =>
                    x.Location.ToLower()
                        == normalized)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();

        return predictions
            .Select(MapToDto)
            .ToList();
    }

    public async Task<List<RiskPredictionDto>>
        GetHighRiskAsync()
    {
        var predictions =
            await _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .Where(x =>
                    x.RiskLevel == "High" ||
                    x.RiskLevel == "Critical")
                .OrderByDescending(
                    x => x.RiskScore)
                .ThenByDescending(
                    x => x.CreatedAt)
                .ToListAsync();

        return predictions
            .Select(MapToDto)
            .ToList();
    }

    public async Task<PaginatedRiskPredictionDto>
        GetPagedAsync(
            Guid userId,
            RiskPredictionQueryDto query,
            bool isAdministrator)
    {
        query.Page =
            Math.Max(
                1,
                query.Page);

        query.PageSize =
            Math.Clamp(
                query.PageSize,
                1,
                100);

        var predictions =
            _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .AsQueryable();

        if (!isAdministrator)
        {
            predictions =
                predictions.Where(x => x.UserId == userId);
        }

        if (!string.IsNullOrWhiteSpace(
                query.Search))
        {
            var search =
                query.Search
                    .Trim()
                    .ToLower();

            predictions =
                predictions.Where(x =>
                    x.Location
                        .ToLower()
                        .Contains(search) ||

                    x.DisasterType
                        .ToLower()
                        .Contains(search) ||

                    x.RiskLevel
                        .ToLower()
                        .Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(
                query.Location))
        {
            var location =
                query.Location
                    .Trim()
                    .ToLower();

            predictions =
                predictions.Where(x =>
                    x.Location
                        .ToLower()
                        .Contains(location));
        }

        if (!string.IsNullOrWhiteSpace(
                query.RiskLevel))
        {
            var level =
                query.RiskLevel
                    .Trim()
                    .ToLower();

            predictions =
                predictions.Where(x =>
                    x.RiskLevel
                        .ToLower()
                        == level);
        }

        if (!string.IsNullOrWhiteSpace(
                query.DisasterType))
        {
            var type =
                query.DisasterType
                    .Trim()
                    .ToLower();

            predictions =
                predictions.Where(x =>
                    x.DisasterType
                        .ToLower()
                        == type);
        }

        if (query.MinRiskScore.HasValue)
        {
            predictions =
                predictions.Where(x =>
                    x.RiskScore >=
                    query.MinRiskScore.Value);
        }

        if (query.MaxRiskScore.HasValue)
        {
            predictions =
                predictions.Where(x =>
                    x.RiskScore <=
                    query.MaxRiskScore.Value);
        }

        var totalItems =
            await predictions.CountAsync();

        var sortBy =
            (query.SortBy ?? "createdAt")
                .Trim()
                .ToLower();

        var descending =
            (query.SortOrder ?? "desc")
                .Trim()
                .ToLower() == "desc";

        predictions =
            sortBy switch
            {
                "riskscore" =>
                    descending
                        ? predictions.OrderByDescending(
                            x => x.RiskScore)
                        : predictions.OrderBy(
                            x => x.RiskScore),

                "confidence" =>
                    descending
                        ? predictions.OrderByDescending(
                            x => x.Confidence)
                        : predictions.OrderBy(
                            x => x.Confidence),

                "location" =>
                    descending
                        ? predictions.OrderByDescending(
                            x => x.Location)
                        : predictions.OrderBy(
                            x => x.Location),

                "risklevel" =>
                    descending
                        ? predictions.OrderByDescending(
                            x => x.RiskLevel)
                        : predictions.OrderBy(
                            x => x.RiskLevel),

                _ =>
                    descending
                        ? predictions.OrderByDescending(
                            x => x.CreatedAt)
                        : predictions.OrderBy(
                            x => x.CreatedAt)
            };

        var items =
            await predictions
                .Skip(
                    (query.Page - 1) *
                    query.PageSize)
                .Take(
                    query.PageSize)
                .ToListAsync();

        var totalPages =
            (int)Math.Ceiling(
                totalItems /
                (double)query.PageSize);

        return new PaginatedRiskPredictionDto
        {
            Items =
                items.Select(MapToDto).ToList(),

            Page =
                query.Page,

            PageSize =
                query.PageSize,

            TotalItems =
                totalItems,

            TotalPages =
                totalPages
        };
    }


    public async Task<List<RiskPredictionDto>>
        GetHistoryAsync(
            Guid userId)
    {
        var predictions =
            await _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .Where(x => x.UserId == userId)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();

        return predictions
            .Select(MapToDto)
            .ToList();
    }
    public async Task<List<RiskPredictionDto>>
        GetHistoryAsync(
            Guid userId,
            bool includeAll)
    {
        var query =
            _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .AsQueryable();

        if (!includeAll)
        {
            query = query.Where(
                x => x.UserId == userId);
        }

        var predictions =
            await query
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();

        return predictions
            .Select(MapToDto)
            .ToList();
    }
    public async Task<List<RiskPredictionDto>>
        GetPendingApprovalAsync()
    {
        var predictions =
            await _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .Where(x =>
                    x.RequiresHumanApproval &&
                    !x.IsApproved &&
                    x.ApprovalStatus == "Pending")
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();

        return predictions
            .Select(MapToDto)
            .ToList();
    }

    public async Task<RiskPredictionDto?>
        ApproveAsync(Guid id)
    {
        var prediction =
            await _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .FirstOrDefaultAsync(
                    x => x.Id == id);

        if (prediction == null)
            return null;

        prediction.IsApproved = true;
        prediction.RequiresHumanApproval = true;
        prediction.ApprovalStatus =
            "Approved";

        var volunteers =
            await _context.Users
                .Where(u =>
                    u.Role == "FieldVolunteer" &&
                    u.IsActive)
                .ToListAsync();

        foreach (var volunteer in volunteers)
        {
            _context.Notifications.Add(
                new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = volunteer.Id,
                    Title = "Approved Disaster Risk",
                    Message =
                        $"{prediction.RiskLevel} risk identified at {prediction.Location}. " +
                        $"Disaster type: {prediction.DisasterType}. " +
                        "Please review the situation and respond if required.",
                    Type = "ApprovedRisk",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
        }

        await _context.SaveChangesAsync();

        return MapToDto(prediction);
    }
    public async Task<RiskPredictionDto?>
        RejectAsync(Guid id)
    {
        var prediction =
            await _context.RiskPredictions
                .Include(x => x.RiskFactors)
                .FirstOrDefaultAsync(
                    x => x.Id == id);

        if (prediction == null)
            return null;

        prediction.IsApproved = false;
        prediction.RequiresHumanApproval = false;
        prediction.ApprovalStatus =
            "Rejected";

        await _context.SaveChangesAsync();

        return MapToDto(prediction);
    }

    private static RiskPredictionDto MapToDto(
        RiskPrediction prediction)
    {
        var recommendations =
            prediction.RiskLevel switch
            {
                "Critical" => new List<string>
                {
                    "Initiate emergency response",
                    "Prepare evacuation resources",
                    "Issue immediate warning"
                },

                "High" => new List<string>
                {
                    "Prepare response resources",
                    "Monitor risk conditions",
                    "Review evacuation readiness"
                },

                "Medium" => new List<string>
                {
                    "Monitor environmental conditions",
                    "Prepare essential resources"
                },

                _ => new List<string>
                {
                    "Continue routine monitoring"
                }
            };

        return new RiskPredictionDto
        {
            Id = prediction.Id,

            Location = prediction.Location,
            Latitude = prediction.Latitude,
            Longitude = prediction.Longitude,

            Rainfall1h =
                prediction.Rainfall1h,

            Rainfall3h =
                prediction.Rainfall3h,

            Rainfall24h =
                prediction.Rainfall24h,

            RiverLevel =
                prediction.RiverLevel,

            RiverFlow =
                prediction.RiverFlow,

            Temperature =
                prediction.Temperature,

            Humidity =
                prediction.Humidity,

            WindSpeed =
                prediction.WindSpeed,

            SoilMoisture =
                prediction.SoilMoisture,

            Elevation =
                prediction.Elevation,

            PopulationDensity =
                prediction.PopulationDensity,

            HistoricalFloodCount =
                prediction.HistoricalFloodCount,

            HistoricalSeverity =
                prediction.HistoricalSeverity,

            DrainageCapacity =
                prediction.DrainageCapacity,

            ForecastRainfall =
                prediction.ForecastRainfall,

            DisasterType =
                prediction.DisasterType,

            RiskScore =
                prediction.RiskScore,

            RiskLevel =
                prediction.RiskLevel,

            Confidence =
                prediction.Confidence,

            RiskFactors =
                prediction.RiskFactors
                    .Select(x => new RiskFactorDto
                    {
                        Factor =
                            x.Factor,

                        Value =
                            x.Value,

                        Impact =
                            x.Impact,

                        Contribution =
                            x.Contribution
                    })
                    .ToList(),

            Recommendations =
                recommendations,

            PredictionSource =
                prediction.PredictionSource,

            ModelVersion =
                prediction.ModelVersion,

            RequiresHumanApproval =
                prediction.RequiresHumanApproval,

            IsApproved =
                prediction.IsApproved,

            ApprovalStatus =
                prediction.ApprovalStatus,

            CreatedAt =
                prediction.CreatedAt
        };
    }
}



























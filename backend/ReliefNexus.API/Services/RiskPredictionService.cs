using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class RiskPredictionService : IRiskPredictionService
{
    private readonly AppDbContext _context;
    private readonly IWeatherService _weatherService;

    public RiskPredictionService(
        AppDbContext context,
        IWeatherService weatherService)
    {
        _context = context;
        _weatherService = weatherService;
    }

    public async Task<RiskPredictionDto> CreateAsync(RiskPredictionDto request)
    {
        // Fetch live weather data when coordinates are available.
        if (request.Latitude.HasValue && request.Longitude.HasValue)
        {
            var weather = await _weatherService.GetCurrentWeatherAsync(
                request.Latitude.Value,
                request.Longitude.Value);

            if (weather != null)
            {
                request.Temperature = weather.Temperature;
                request.Humidity = weather.Humidity;
                request.WindSpeed = weather.WindSpeed;

                // Current precipitation is used as the latest 1-hour rainfall input.
                request.Rainfall1h = weather.Precipitation;

                // Keep manually supplied Rainfall24h because current precipitation
                // is not the same as accumulated 24-hour rainfall.
                request.ForecastRainfall = Math.Max(
                    request.ForecastRainfall,
                    weather.Precipitation);
            }
        }

        var riskScore = CalculateRiskScore(request);

        var riskLevel = riskScore >= 75
            ? "Critical"
            : riskScore >= 50
                ? "High"
                : riskScore >= 25
                    ? "Medium"
                    : "Low";

        var confidence = CalculateConfidence(request);

        var prediction = new RiskPrediction
        {
            Location = request.Location,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Rainfall1h = request.Rainfall1h,
            Rainfall3h = request.Rainfall3h,
            Rainfall24h = request.Rainfall24h,
            RiverLevel = request.RiverLevel,
            RiverFlow = request.RiverFlow,
            Temperature = request.Temperature,
            Humidity = request.Humidity,
            WindSpeed = request.WindSpeed,
            SoilMoisture = request.SoilMoisture,
            Elevation = request.Elevation,
            PopulationDensity = request.PopulationDensity,
            HistoricalFloodCount = request.HistoricalFloodCount,
            HistoricalSeverity = request.HistoricalSeverity,
            DrainageCapacity = request.DrainageCapacity,
            ForecastRainfall = request.ForecastRainfall,

            DisasterType = "Flood",
            RiskScore = Math.Round(riskScore, 2),
            RiskLevel = riskLevel,
            Confidence = Math.Round(confidence, 2),

            PredictionSource = "Risk Prediction Agent + Open-Meteo",
            ModelVersion = "v1.0",

            RequiresHumanApproval = riskLevel == "Critical",
            IsApproved = false,
            ApprovalStatus = riskLevel == "Critical" ? "Pending" : "NotRequired",

            CreatedAt = DateTime.UtcNow
        };

        prediction.RiskFactors = new List<RiskFactor>
        {
            new RiskFactor
            {
                Factor = "24-hour Rainfall",
                Value = request.Rainfall24h,
                Impact = GetImpact(request.Rainfall24h, 150, 250),
                Contribution = Math.Round(
                    (request.Rainfall24h / 250) * 25, 2)
            },
            new RiskFactor
            {
                Factor = "River Level",
                Value = request.RiverLevel,
                Impact = GetImpact(request.RiverLevel, 3, 5),
                Contribution = Math.Round(
                    (request.RiverLevel / 6) * 25, 2)
            },
            new RiskFactor
            {
                Factor = "Historical Flood Count",
                Value = request.HistoricalFloodCount,
                Impact = GetImpact(
                    request.HistoricalFloodCount, 3, 6),
                Contribution = Math.Round(
                    (request.HistoricalFloodCount / 10.0) * 15, 2)
            }
        };

        _context.RiskPredictions.Add(prediction);

        await _context.SaveChangesAsync();

        return MapToDto(prediction);
    }

    public async Task<List<RiskPredictionDto>> GetAllAsync()
    {
        var predictions = await _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return predictions.Select(MapToDto).ToList();
    }

    public async Task<PaginatedRiskPredictionDto> GetPagedAsync(
        RiskPredictionQueryDto query)
    {
        query.Page = Math.Max(1, query.Page);
        query.PageSize = Math.Clamp(query.PageSize, 1, 100);

        var predictions = _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();

            predictions = predictions.Where(x =>
                x.Location.ToLower().Contains(search) ||
                x.DisasterType.ToLower().Contains(search) ||
                x.RiskLevel.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.Location))
        {
            var location = query.Location.Trim().ToLower();

            predictions = predictions.Where(x =>
                x.Location.ToLower().Contains(location));
        }

        if (!string.IsNullOrWhiteSpace(query.RiskLevel))
        {
            var riskLevel = query.RiskLevel.Trim().ToLower();

            predictions = predictions.Where(x =>
                x.RiskLevel.ToLower() == riskLevel);
        }

        if (!string.IsNullOrWhiteSpace(query.DisasterType))
        {
            var disasterType = query.DisasterType.Trim().ToLower();

            predictions = predictions.Where(x =>
                x.DisasterType.ToLower() == disasterType);
        }

        if (query.MinRiskScore.HasValue)
        {
            predictions = predictions.Where(x =>
                x.RiskScore >= query.MinRiskScore.Value);
        }

        if (query.MaxRiskScore.HasValue)
        {
            predictions = predictions.Where(x =>
                x.RiskScore <= query.MaxRiskScore.Value);
        }

        var totalItems = await predictions.CountAsync();

        var sortBy = query.SortBy.Trim().ToLower();
        var descending =
            query.SortOrder.Trim().ToLower() == "desc";

        predictions = sortBy switch
        {
            "riskscore" => descending
                ? predictions.OrderByDescending(x => x.RiskScore)
                : predictions.OrderBy(x => x.RiskScore),

            "confidence" => descending
                ? predictions.OrderByDescending(x => x.Confidence)
                : predictions.OrderBy(x => x.Confidence),

            "location" => descending
                ? predictions.OrderByDescending(x => x.Location)
                : predictions.OrderBy(x => x.Location),

            "risklevel" => descending
                ? predictions.OrderByDescending(x => x.RiskLevel)
                : predictions.OrderBy(x => x.RiskLevel),

            "disastertype" => descending
                ? predictions.OrderByDescending(x => x.DisasterType)
                : predictions.OrderBy(x => x.DisasterType),

            "createdat" or _ => descending
                ? predictions.OrderByDescending(x => x.CreatedAt)
                : predictions.OrderBy(x => x.CreatedAt)
        };

        var items = await predictions
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var totalPages =
            (int)Math.Ceiling(
                totalItems / (double)query.PageSize);

        return new PaginatedRiskPredictionDto
        {
            Items = items.Select(MapToDto).ToList(),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }

    public async Task<RiskPredictionDto?> GetByIdAsync(Guid id)
    {
        var prediction = await _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .FirstOrDefaultAsync(x => x.Id == id);

        return prediction == null
            ? null
            : MapToDto(prediction);
    }

    public async Task<List<RiskPredictionDto>> GetByLocationAsync(
        string location)
    {
        if (string.IsNullOrWhiteSpace(location))
            return new List<RiskPredictionDto>();

        var normalizedLocation = location.Trim().ToLower();

        var predictions = await _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .Where(x =>
                x.Location.ToLower() == normalizedLocation)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return predictions.Select(MapToDto).ToList();
    }

    public async Task<List<RiskPredictionDto>> GetHistoryAsync()
    {
        var predictions = await _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return predictions.Select(MapToDto).ToList();
    }

    public async Task<List<RiskPredictionDto>> GetPendingApprovalAsync()
    {
        var predictions = await _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .Where(x => x.RequiresHumanApproval &&
                        !x.IsApproved &&
                        x.ApprovalStatus == "Pending")
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return predictions.Select(MapToDto).ToList();
    }

    public async Task<RiskPredictionDto?> ApproveAsync(Guid id)
    {
        var prediction = await _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (prediction == null)
            return null;

        prediction.IsApproved = true;
        prediction.RequiresHumanApproval = true;
        prediction.ApprovalStatus = "Approved";

        await _context.SaveChangesAsync();

        return MapToDto(prediction);
    }

    public async Task<RiskPredictionDto?> RejectAsync(Guid id)
    {
        var prediction = await _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (prediction == null)
            return null;

        prediction.IsApproved = false;
        prediction.RequiresHumanApproval = false;
        prediction.ApprovalStatus = "Rejected";

        await _context.SaveChangesAsync();

        return MapToDto(prediction);
    }

    public async Task<List<RiskPredictionDto>> GetHighRiskAsync()
    {
        var predictions = await _context.RiskPredictions
            .Include(x => x.RiskFactors)
            .Where(x =>
                x.RiskLevel == "High" ||
                x.RiskLevel == "Critical")
            .OrderByDescending(x => x.RiskScore)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync();

        return predictions.Select(MapToDto).ToList();
    }

    private static double CalculateRiskScore(
        RiskPredictionDto request)
    {
        var rainfall =
            Math.Clamp(
                (request.Rainfall24h / 250.0) * 25, 0, 25);

        var river =
            Math.Clamp(
                (request.RiverLevel / 6.0) * 25, 0, 25);

        var history =
            Math.Clamp(
                (request.HistoricalFloodCount / 10.0) * 15,
                0, 15);

        var forecast =
            Math.Clamp(
                (request.ForecastRainfall / 200.0) * 15,
                0, 15);

        var soil =
            Math.Clamp(
                (request.SoilMoisture / 100.0) * 10,
                0, 10);

        var elevationFactor =
            request.Elevation <= 0
                ? 5
                : Math.Clamp(
                    (1 - (request.Elevation / 100.0)) * 5,
                    0, 5);

        var population =
            Math.Clamp(
                (request.PopulationDensity / 10000.0) * 5,
                0, 5);

        return rainfall +
               river +
               history +
               forecast +
               soil +
               elevationFactor +
               population;
    }

    private static double CalculateConfidence(
        RiskPredictionDto request)
    {
        var completeness = 0;

        if (!string.IsNullOrWhiteSpace(request.Location))
            completeness++;

        if (request.Rainfall24h >= 0)
            completeness++;

        if (request.RiverLevel >= 0)
            completeness++;

        if (request.HistoricalFloodCount >= 0)
            completeness++;

        if (request.ForecastRainfall >= 0)
            completeness++;

        return 70 + (completeness / 5.0) * 25;
    }

    private static string GetImpact(
        double value,
        double medium,
        double high)
    {
        if (value >= high)
            return "Very High";

        if (value >= medium)
            return "High";

        return "Moderate";
    }

    private static RiskPredictionDto MapToDto(
        RiskPrediction prediction)
    {
        var recommendations = prediction.RiskLevel switch
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
                "Monitor river conditions",
                "Review evacuation readiness"
            },

            "Medium" => new List<string>
            {
                "Monitor weather conditions",
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
            HistoricalFloodCount = prediction.HistoricalFloodCount,
            HistoricalSeverity = prediction.HistoricalSeverity,
            DrainageCapacity = prediction.DrainageCapacity,
            ForecastRainfall = prediction.ForecastRainfall,

            DisasterType = prediction.DisasterType,
            RiskScore = prediction.RiskScore,
            RiskLevel = prediction.RiskLevel,
            Confidence = prediction.Confidence,

            RiskFactors = prediction.RiskFactors
                .Select(x => new RiskFactorDto
                {
                    Factor = x.Factor,
                    Value = x.Value,
                    Impact = x.Impact,
                    Contribution = x.Contribution
                })
                .ToList(),

            Recommendations = recommendations,

            PredictionSource = prediction.PredictionSource,
            ModelVersion = prediction.ModelVersion,

            RequiresHumanApproval =
                prediction.RequiresHumanApproval,

            IsApproved = prediction.IsApproved,

            CreatedAt = prediction.CreatedAt
        };
    }
}



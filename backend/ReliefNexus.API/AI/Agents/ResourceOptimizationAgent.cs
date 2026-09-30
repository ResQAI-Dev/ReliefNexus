using ReliefNexus.API.AI.Services;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.Models;
using ReliefNexus.API.DTOs.ResourceOptimization;

namespace ReliefNexus.API.AI.Agents;

/// <summary>
/// Agent 03 - Resource Demand Prediction & Optimization.
///
/// Demand is predicted from the Agent 02 assessment first.
/// The prediction never depends on whether inventory exists.
/// Real ReliefResources inventory is then matched against the prediction.
/// Missing inventory is represented as Available = 0 and becomes a real gap.
/// Only OptimizeAsync changes inventory/allocation data.
/// </summary>
public class ResourceOptimizationAgent
{
    private readonly AppDbContext _context;
    private readonly IPythonResourceService _pythonResourceService;

    public ResourceOptimizationAgent(
        AppDbContext context,
        IPythonResourceService pythonResourceService)
    {
        _pythonResourceService = pythonResourceService;
        _context = context;
    }

    public async Task<ResourceDemandAssessmentDto?> GetDemandAssessmentAsync(
        Guid vulnerabilityAssessmentId)
    {
        var assessment = await _context.VulnerabilityAssessments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == vulnerabilityAssessmentId);

        if (assessment == null)
            return null;

        var severity = CalculateSeverity(
            assessment.RiskScore,
            assessment.VulnerabilityScore,
            assessment.ImpactScore);

        var priority = GetPriority(severity);

        // Agent 03 is restricted to High/Critical Agent 01 risk assessments.
        // Lower-priority assessments are intentionally not resource-optimized.
        if (!IsAgent03EligiblePriority(priority))
            return null;

        var severityMultiplier = GetSeverityMultiplier(severity);
        var priorityMultiplier = GetPriorityMultiplier(priority);

        var affected = Math.Max(0, assessment.AffectedPopulation);
        var populationBlocks = Math.Max(1, (int)Math.Ceiling(affected / 100d));

        var priorityAffected = (int)Math.Ceiling(
            affected * GetPriorityPopulationShare(severity));

        var preferred = GetPreferredCategories(assessment.DisasterType);

        // Read the complete real inventory.
        // Status is not used to hide records. Remaining stock is quantity-based.
        var inventory = await _context.ReliefResources
            .AsNoTracking()
            .OrderBy(x => x.Location)
            .ThenBy(x => x.ResourceType)
            .ThenBy(x => x.ResourceName)
            .ToListAsync();

        var inventoryByCategory = inventory
            .GroupBy(x => NormalizeCategory(x.ResourceType, x.ResourceName))
            .ToDictionary(
                g => g.Key,
                g => g
                    .OrderByDescending(GetRemainingQuantity)
                    .ThenBy(x =>
                        IsLocalLocation(x.Location, assessment.Location) ? 0 : 1)
                    .ThenBy(x => x.ResourceName)
                    .ToList(),
                StringComparer.OrdinalIgnoreCase);

        var lines = new List<ResourceDemandLineDto>();

        // ------------------------------------------------------------
        // PREDICTION FIRST
        // ------------------------------------------------------------
        // Every disaster-relevant category gets a predicted requirement,
        // even when there is no corresponding DB inventory row.
        foreach (var category in preferred)
        {
            var required = CalculatePredictedDemand(
                affected,
                populationBlocks,
                severity,
                priority,
                category,
                assessment.DisasterType);

            inventoryByCategory.TryGetValue(category, out var matches);
            matches ??= new List<ReliefResource>();

            var available = matches.Sum(GetRemainingQuantity);
            var allocatable = Math.Min(required, available);
            var gap = Math.Max(0, required - allocatable);

            var primary = matches.FirstOrDefault();

            var coverage = allocatable >= required
                ? "Fully Coverable"
                : allocatable > 0
                    ? "Partially Coverable"
                    : "No Inventory";

            lines.Add(new ResourceDemandLineDto
            {
                // Guid.Empty means there is no real DB resource for this
                // predicted category. It must never be allocated.
                ResourceId = primary?.Id ?? Guid.Empty,
                ResourceType = GetDisplayResourceType(category),
                ResourceName = GetDisplayResourceName(category),
                Location = matches.Count == 0
                    ? "No inventory"
                    : BuildInventoryLocationLabel(
                        matches,
                        assessment.Location),
                RequiredQuantity = required,
                AvailableQuantity = available,
                AllocatableQuantity = allocatable,
                GapQuantity = gap,
                CoverageStatus = coverage,
            });
        }

        // Show other real DB resources too, but do not predict/allocate them
        // unless their category is relevant to the selected disaster.
        foreach (var resource in inventory)
        {
            var category = NormalizeCategory(
                resource.ResourceType,
                resource.ResourceName);

            if (preferred.Contains(category))
                continue;

            lines.Add(new ResourceDemandLineDto
            {
                ResourceId = resource.Id,
                ResourceType = resource.ResourceType,
                ResourceName = resource.ResourceName,
                Location = resource.Location,
                RequiredQuantity = 0,
                AvailableQuantity = GetRemainingQuantity(resource),
                AllocatableQuantity = 0,
                GapQuantity = 0,
                CoverageStatus = "Not Required",
            });
        }

        var pythonResourceAnalysis = await _pythonResourceService.OptimizeAsync(
            new
            {
                location = assessment.Location,
                disaster_type = assessment.DisasterType,
                severity_index = severity,
                priority = priority,
                affected_population = affected,
                resources = lines.Select(x => new
                {
                    resource_id = x.ResourceId,
                    resource_name = x.ResourceName,
                    location = x.Location,
                    required_quantity = x.RequiredQuantity,
                    available_quantity = x.AvailableQuantity,
                    gap_quantity = x.GapQuantity,
                    coverage_status = x.CoverageStatus
                }).ToList()
            });
        return new ResourceDemandAssessmentDto
        {
            VulnerabilityAssessmentId = assessment.Id,
            Location = assessment.Location,
            DisasterType = assessment.DisasterType,
            AffectedPopulation = affected,
            PriorityAffectedPopulation = priorityAffected,
            RiskScore = Math.Round(assessment.RiskScore, 1),
            VulnerabilityScore = Math.Round(assessment.VulnerabilityScore, 1),
            ImpactScore = Math.Round(assessment.ImpactScore, 1),
            SeverityIndex = severity,
            Priority = priority,
            SeverityMultiplier = severityMultiplier,
            PriorityMultiplier = priorityMultiplier,
            PopulationBlocks = populationBlocks,
            Resources = lines,
        };
    }

    public async Task<List<ResourceAllocation>> OptimizeAsync(
        Guid vulnerabilityAssessmentId)
    {
        var assessment = await _context.VulnerabilityAssessments
            .FirstOrDefaultAsync(x => x.Id == vulnerabilityAssessmentId);

        if (assessment == null)
            return new List<ResourceAllocation>();

        var severity = CalculateSeverity(
            assessment.RiskScore,
            assessment.VulnerabilityScore,
            assessment.ImpactScore);

        var priority = GetPriority(severity);

        // Hard backend guard: Agent 03 can never allocate for Low/Medium.
        if (!IsAgent03EligiblePriority(priority))
            return new List<ResourceAllocation>();

        // Idempotent: do not allocate twice for the same Agent 02 assessment.
        var existing = await _context.ResourceAllocations
            .AsNoTracking()
            .Where(x => x.VulnerabilityAssessmentId == vulnerabilityAssessmentId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        if (existing.Count > 0)
            return existing;

        var preferred = GetPreferredCategories(assessment.DisasterType);

        var affected = Math.Max(0, assessment.AffectedPopulation);
        var populationBlocks = Math.Max(
            1,
            (int)Math.Ceiling(affected / 100d));

        // Only real DB rows can be allocated.
        var inventory = await _context.ReliefResources
            .Where(x => x.AvailableQuantity > x.AllocatedQuantity)
            .OrderBy(x => x.Location)
            .ThenBy(x => x.ResourceType)
            .ThenBy(x => x.ResourceName)
            .ToListAsync();

        if (inventory.Count == 0)
            return new List<ResourceAllocation>();

        var allocations = new List<ResourceAllocation>();

        foreach (var category in preferred)
        {
            var required = CalculatePredictedDemand(
                affected,
                populationBlocks,
                severity,
                priority,
                category,
                assessment.DisasterType);

            if (required <= 0)
                continue;

            var remainingDemand = required;

            // Local inventory first, then other locations.
            var categoryInventory = inventory
                .Where(x =>
                    NormalizeCategory(
                        x.ResourceType,
                        x.ResourceName)
                    .Equals(
                        category,
                        StringComparison.OrdinalIgnoreCase))
                .OrderBy(x =>
                    IsLocalLocation(
                        x.Location,
                        assessment.Location) ? 0 : 1)
                .ThenByDescending(GetRemainingQuantity)
                .ToList();

            foreach (var resource in categoryInventory)
            {
                if (remainingDemand <= 0)
                    break;

                var available = GetRemainingQuantity(resource);

                if (available <= 0)
                    continue;

                var allocated = Math.Min(
                    remainingDemand,
                    available);

                resource.AllocatedQuantity += allocated;

                resource.Status =
                    resource.AllocatedQuantity >= resource.AvailableQuantity
                        ? "Allocated"
                        : "Available";

                var allocation = new ResourceAllocation
                {
                    Id = Guid.NewGuid(),
                    VulnerabilityAssessmentId = assessment.Id,
                    ResourceId = resource.Id,
                    ResourceType = resource.ResourceType,
                    ResourceName = resource.ResourceName,
                    RecommendedQuantity = allocated,
                    Priority = priority,
                    Location = resource.Location,
                    CreatedAt = DateTime.UtcNow
                };

                allocations.Add(allocation);
                _context.ResourceAllocations.Add(allocation);

                remainingDemand -= allocated;
            }
        }

        if (allocations.Count > 0)
            await _context.SaveChangesAsync();

        return allocations;
    }

    // ================================================================
    // PREDICTIVE DEMAND MODEL
    // ================================================================

    private static int CalculatePredictedDemand(
        int affectedPopulation,
        int populationBlocks,
        double severity,
        string priority,
        string category,
        string? disasterType)
    {
        // These are planning coefficients, NOT inventory quantities.
        var baseRate = GetBaseRatePer100(category);

        var disasterMultiplier =
            GetDisasterMultiplier(disasterType, category);

        var severityMultiplier =
            GetSeverityMultiplier(severity);

        var priorityMultiplier =
            GetPriorityMultiplier(priority);

        var populationScale =
            GetPopulationScaleFactor(affectedPopulation);

        var raw =
            populationBlocks *
            baseRate *
            disasterMultiplier *
            severityMultiplier *
            priorityMultiplier *
            populationScale;

        return Math.Max(
            1,
            (int)Math.Ceiling(raw));
    }

    private static double GetPopulationScaleFactor(int population)
    {
        if (population <= 100)
            return 1.00;

        if (population <= 1_000)
            return 1.05;

        if (population <= 10_000)
            return 1.10;

        if (population <= 50_000)
            return 1.15;

        if (population <= 100_000)
            return 1.20;

        return 1.25;
    }

    private static int GetBaseRatePer100(string category) => category switch
    {
        "Water" => 40,
        "Food" => 30,
        "Medical" => 5,
        "Hygiene" => 8,
        "Shelter" => 10,
        "Blanket" => 20,
        "Clothing" => 8,
        "Transport" => 4,
        _ => 0
    };

    private static double GetDisasterMultiplier(
        string? disasterType,
        string category)
    {
        var type = (disasterType ?? string.Empty)
            .ToLowerInvariant();

        if (type.Contains("drought"))
        {
            return category switch
            {
                "Water" => 1.80,
                "Food" => 1.35,
                "Hygiene" => 1.15,
                "Medical" => 1.10,
                "Shelter" => 0.80,
                "Blanket" => 0.60,
                "Clothing" => 0.60,
                "Transport" => 0.90,
                _ => 0
            };
        }

        if (type.Contains("flood"))
        {
            return category switch
            {
                "Water" => 1.45,
                "Food" => 1.25,
                "Medical" => 1.30,
                "Hygiene" => 1.35,
                "Shelter" => 1.35,
                "Blanket" => 1.20,
                "Clothing" => 1.10,
                "Transport" => 1.30,
                _ => 0
            };
        }

        if (type.Contains("earthquake"))
        {
            return category switch
            {
                "Water" => 1.30,
                "Food" => 1.20,
                "Medical" => 1.55,
                "Hygiene" => 1.20,
                "Shelter" => 1.60,
                "Blanket" => 1.35,
                "Clothing" => 1.10,
                "Transport" => 1.30,
                _ => 0
            };
        }

        if (type.Contains("landslide"))
        {
            return category switch
            {
                "Water" => 1.20,
                "Food" => 1.15,
                "Medical" => 1.45,
                "Hygiene" => 1.15,
                "Shelter" => 1.50,
                "Blanket" => 1.20,
                "Clothing" => 1.00,
                "Transport" => 1.35,
                _ => 0
            };
        }

        if (type.Contains("fire"))
        {
            return category switch
            {
                "Water" => 1.20,
                "Food" => 1.00,
                "Medical" => 1.40,
                "Hygiene" => 1.10,
                "Shelter" => 1.30,
                "Blanket" => 0.90,
                "Clothing" => 0.90,
                "Transport" => 1.20,
                _ => 0
            };
        }

        if (type.Contains("cyclone") ||
            type.Contains("storm"))
        {
            return category switch
            {
                "Water" => 1.30,
                "Food" => 1.20,
                "Medical" => 1.35,
                "Hygiene" => 1.20,
                "Shelter" => 1.55,
                "Blanket" => 1.30,
                "Clothing" => 1.15,
                "Transport" => 1.30,
                _ => 0
            };
        }

        return category switch
        {
            "Water" => 1.10,
            "Food" => 1.10,
            "Medical" => 1.10,
            "Hygiene" => 1.05,
            "Shelter" => 1.00,
            "Blanket" => 1.00,
            "Clothing" => 1.00,
            "Transport" => 1.00,
            _ => 0
        };
    }

    // ================================================================
    // AGENT 02 SCORING
    // ================================================================

    private static double CalculateSeverity(
        double risk,
        double vulnerability,
        double impact)
    {
        var r = Math.Clamp(risk, 0, 100);
        var v = Math.Clamp(vulnerability, 0, 100);
        var i = Math.Clamp(impact, 0, 100);

        return Math.Round(
            (r * 0.40) +
            (v * 0.30) +
            (i * 0.30),
            1);
    }

    private static bool IsAgent03EligiblePriority(string priority) =>
        priority.Equals("High", StringComparison.OrdinalIgnoreCase) ||
        priority.Equals("Critical", StringComparison.OrdinalIgnoreCase);

    private static string GetPriority(double severity) => severity switch
    {
        >= 75 => "Critical",
        >= 55 => "High",
        >= 30 => "Medium",
        _ => "Low"
    };

    private static double GetSeverityMultiplier(double severity)
    {
        var normalized =
            Math.Clamp(severity, 0, 100) / 100d;

        return Math.Round(
            0.85 + (normalized * 0.50),
            2);
    }

    private static double GetPriorityMultiplier(string priority) =>
        priority switch
        {
            "Critical" => 1.25,
            "High" => 1.15,
            "Medium" => 1.05,
            _ => 0.95
        };

    private static double GetPriorityPopulationShare(double severity)
    {
        return Math.Min(
            0.35,
            Math.Max(
                0.10,
                0.10 + severity * 0.002));
    }

    // ================================================================
    // INVENTORY HELPERS
    // ================================================================

    private static int GetRemainingQuantity(
        ReliefResource resource)
    {
        return Math.Max(
            0,
            resource.AvailableQuantity -
            resource.AllocatedQuantity);
    }

    private static bool IsLocalLocation(
        string? resourceLocation,
        string? assessmentLocation)
    {
        if (string.IsNullOrWhiteSpace(resourceLocation) ||
            string.IsNullOrWhiteSpace(assessmentLocation))
            return false;

        return resourceLocation
            .Trim()
            .Equals(
                assessmentLocation.Trim(),
                StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildInventoryLocationLabel(
        IReadOnlyCollection<ReliefResource> resources,
        string? assessmentLocation)
    {
        var local = resources
            .Where(x =>
                IsLocalLocation(
                    x.Location,
                    assessmentLocation))
            .Select(x => x.Location)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (local.Count > 0)
            return local.Count == 1
                ? local[0]!
                : $"{local.Count} local sources";

        var locations = resources
            .Select(x => x.Location)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return locations.Count switch
        {
            0 => "Inventory available",
            1 => locations[0]!,
            _ => $"{locations.Count} sources"
        };
    }

    // ================================================================
    // RESOURCE CATEGORIES
    // ================================================================

    private static string NormalizeCategory(
        string? type,
        string? name)
    {
        var key =
            $"{type} {name}".ToLowerInvariant();

        if (key.Contains("water"))
            return "Water";

        if (key.Contains("food") ||
            key.Contains("meal"))
            return "Food";

        if (key.Contains("medical") ||
            key.Contains("first aid") ||
            key.Contains("medicine"))
            return "Medical";

        if (key.Contains("shelter") ||
            key.Contains("tent"))
            return "Shelter";

        if (key.Contains("hygiene") ||
            key.Contains("sanitation"))
            return "Hygiene";

        if (key.Contains("blanket"))
            return "Blanket";

        if (key.Contains("clothing"))
            return "Clothing";

        if (key.Contains("transport") ||
            key.Contains("vehicle"))
            return "Transport";

        return "Other";
    }

    private static string GetDisplayResourceType(
        string category) => category switch
        {
            "Water" => "Water",
            "Food" => "Food",
            "Medical" => "Medical",
            "Hygiene" => "Hygiene",
            "Shelter" => "Shelter",
            "Blanket" => "Blanket",
            "Clothing" => "Clothing",
            "Transport" => "Transport",
            _ => "Other"
        };

    private static string GetDisplayResourceName(
        string category) => category switch
        {
            "Water" => "Drinking Water",
            "Food" => "Food Pack",
            "Medical" => "First Aid / Medical",
            "Hygiene" => "Hygiene Kit",
            "Shelter" => "Shelter Kit",
            "Blanket" => "Blanket",
            "Clothing" => "Clothing",
            "Transport" => "Transport",
            _ => "Other Resource"
        };

    private static List<string> GetPreferredCategories(
        string? disasterType)
    {
        var type =
            (disasterType ?? string.Empty)
            .ToLowerInvariant();

        if (type.Contains("drought"))
        {
            return new List<string>
            {
                "Water",
                "Food",
                "Hygiene",
                "Medical",
                "Shelter"
            };
        }

        if (type.Contains("flood"))
        {
            return new List<string>
            {
                "Water",
                "Food",
                "Medical",
                "Hygiene",
                "Shelter",
                "Blanket",
                "Clothing",
                "Transport"
            };
        }

        if (type.Contains("earthquake"))
        {
            return new List<string>
            {
                "Shelter",
                "Medical",
                "Water",
                "Food",
                "Hygiene",
                "Blanket",
                "Clothing",
                "Transport"
            };
        }

        if (type.Contains("landslide"))
        {
            return new List<string>
            {
                "Shelter",
                "Medical",
                "Water",
                "Food",
                "Hygiene",
                "Transport"
            };
        }

        if (type.Contains("fire"))
        {
            return new List<string>
            {
                "Medical",
                "Water",
                "Shelter",
                "Hygiene",
                "Food",
                "Transport"
            };
        }

        if (type.Contains("cyclone") ||
            type.Contains("storm"))
        {
            return new List<string>
            {
                "Shelter",
                "Water",
                "Food",
                "Medical",
                "Hygiene",
                "Blanket",
                "Clothing",
                "Transport"
            };
        }

        return new List<string>
        {
            "Medical",
            "Water",
            "Food",
            "Hygiene",
            "Shelter"
        };
    }
}



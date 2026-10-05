using System;

namespace ReliefNexus.API.DTOs.ResourceOptimization;

public class ResourceAllocationDto
{
    public Guid Id { get; set; }

    public Guid VulnerabilityAssessmentId
    {
        get;
        set;
    }

    public Guid ResourceId
    {
        get;
        set;
    }

    public string ResourceType
    {
        get;
        set;
    } = string.Empty;

    public string ResourceName
    {
        get;
        set;
    } = string.Empty;

    public int RecommendedQuantity
    {
        get;
        set;
    }

    public string Priority
    {
        get;
        set;
    } = string.Empty;

    public string Location
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedAt
    {
        get;
        set;
    }

    public int AvailableQuantity
    {
        get;
        set;
    }

    public int AllocatedQuantity
    {
        get;
        set;
    }

    public int RemainingQuantity
    {
        get;
        set;
    }

    public int GapQuantity
    {
        get;
        set;
    }

    public string Status
    {
        get;
        set;
    } = string.Empty;
}

public class ResourceDemandAssessmentDto
{
    public Guid VulnerabilityAssessmentId
    {
        get;
        set;
    }

    public string Location
    {
        get;
        set;
    } = string.Empty;

    public string DisasterType
    {
        get;
        set;
    } = string.Empty;

    public int AffectedPopulation
    {
        get;
        set;
    }

    public int PriorityAffectedPopulation
    {
        get;
        set;
    }

    public double RiskScore
    {
        get;
        set;
    }

    public double VulnerabilityScore
    {
        get;
        set;
    }

    public double ImpactScore
    {
        get;
        set;
    }

    public double SeverityIndex
    {
        get;
        set;
    }

    public string Priority
    {
        get;
        set;
    } = string.Empty;

    public double SeverityMultiplier
    {
        get;
        set;
    }

    public double PriorityMultiplier
    {
        get;
        set;
    }

    public int PopulationBlocks
    {
        get;
        set;
    }

    public List<ResourceDemandLineDto>
        Resources { get; set; } = new();
}

public class ResourceDemandLineDto
{
    public Guid ResourceId
    {
        get;
        set;
    }

    public string ResourceType
    {
        get;
        set;
    } = string.Empty;

    public string ResourceName
    {
        get;
        set;
    } = string.Empty;

    public string Location
    {
        get;
        set;
    } = string.Empty;

    public int RequiredQuantity
    {
        get;
        set;
    }

    public int AvailableQuantity
    {
        get;
        set;
    }

    public int AllocatableQuantity
    {
        get;
        set;
    }

    public int GapQuantity
    {
        get;
        set;
    }

    public string CoverageStatus
    {
        get;
        set;
    } = string.Empty;
}
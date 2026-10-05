using System.Reflection;
using Xunit;
using ReliefNexus.API.AI.Agents;

namespace ReliefNexus.AI.Tests;

public class ResourceOptimizationAgentTests
{
    private static object InvokePrivate(
        string methodName,
        params object?[] args)
    {
        var method = typeof(ResourceOptimizationAgent)
            .GetMethod(
                methodName,
                BindingFlags.NonPublic | BindingFlags.Static);

        Assert.NotNull(method);

        return method!.Invoke(null, args)!;
    }

    [Fact]
    public void CalculateSeverity_UsesAgent02WeightedFormula()
    {
        // Risk 80, Vulnerability 60, Impact 70
        // Expected = 80*0.40 + 60*0.30 + 70*0.30 = 71
        var result = InvokePrivate(
            "CalculateSeverity",
            80d,
            60d,
            70d);

        Assert.Equal(71.0, (double)result);
    }

    [Theory]
    [InlineData(80, "Critical")]
    [InlineData(75, "Critical")]
    [InlineData(74.9, "High")]
    [InlineData(55, "High")]
    [InlineData(54.9, "Medium")]
    [InlineData(30, "Medium")]
    [InlineData(29.9, "Low")]
    [InlineData(0, "Low")]
    public void GetPriority_ReturnsCorrectPriority(
        double severity,
        string expected)
    {
        var result = InvokePrivate(
            "GetPriority",
            severity);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("High", true)]
    [InlineData("Critical", true)]
    [InlineData("Medium", false)]
    [InlineData("Low", false)]
    public void Agent03_OnlyAllowsHighAndCritical(
        string priority,
        bool expected)
    {
        var result = InvokePrivate(
            "IsAgent03EligiblePriority",
            priority);

        Assert.Equal(expected, (bool)result);
    }

    [Fact]
    public void CalculatePredictedDemand_IncreasesWithAffectedPopulation()
    {
        var smallPopulation = (int)InvokePrivate(
            "CalculatePredictedDemand",
            100,
            1,
            70d,
            "High",
            "Water",
            "Flood");

        var largePopulation = (int)InvokePrivate(
            "CalculatePredictedDemand",
            1000,
            10,
            70d,
            "High",
            "Water",
            "Flood");

        Assert.True(largePopulation > smallPopulation);
    }

    [Fact]
    public void CalculatePredictedDemand_ReturnsPositiveDemand()
    {
        var result = (int)InvokePrivate(
            "CalculatePredictedDemand",
            500,
            5,
            80d,
            "Critical",
            "Water",
            "Flood");

        Assert.True(result > 0);
    }

    [Fact]
    public void FloodDemand_PrioritizesWaterAndFoodCategories()
    {
        var categories = (List<string>)InvokePrivate(
            "GetPreferredCategories",
            "Flood");

        Assert.Contains("Water", categories);
        Assert.Contains("Food", categories);
        Assert.Contains("Medical", categories);
        Assert.Contains("Shelter", categories);
    }

    [Fact]
    public void DroughtDemand_PrioritizesWater()
    {
        var categories = (List<string>)InvokePrivate(
            "GetPreferredCategories",
            "Drought");

        Assert.Equal("Water", categories.First());
        Assert.Contains("Food", categories);
        Assert.Contains("Medical", categories);
    }

    [Theory]
    [InlineData("Water Bottle", "Drinking Water", "Water")]
    [InlineData("Food Pack", "Food", "Food")]
    [InlineData("Medical Kit", "First Aid", "Medical")]
    [InlineData("Tent", "Shelter", "Shelter")]
    [InlineData("Blanket", "Blanket", "Blanket")]
    public void NormalizeCategory_MapsResourcesCorrectly(
        string resourceType,
        string resourceName,
        string expected)
    {
        var result = (string)InvokePrivate(
            "NormalizeCategory",
            resourceType,
            resourceName);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void SeverityMultiplier_IncreasesForHigherSeverity()
    {
        var low = (double)InvokePrivate(
            "GetSeverityMultiplier",
            30d);

        var high = (double)InvokePrivate(
            "GetSeverityMultiplier",
            80d);

        Assert.True(high > low);
    }

    [Theory]
    [InlineData("Critical", 1.25)]
    [InlineData("High", 1.15)]
    [InlineData("Medium", 1.05)]
    [InlineData("Low", 0.95)]
    public void PriorityMultiplier_ReturnsExpectedValue(
        string priority,
        double expected)
    {
        var result = (double)InvokePrivate(
            "GetPriorityMultiplier",
            priority);

        Assert.Equal(expected, result);
    }
}
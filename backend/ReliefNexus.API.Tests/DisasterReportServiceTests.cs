using Microsoft.EntityFrameworkCore;
using Moq;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.AI.Policies;
using ReliefNexus.API.AI.Services;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;
using ReliefNexus.API.Services;

namespace ReliefNexus.API.Tests;

public class DisasterReportServiceTests
{
    private static DisasterReportService CreateService(AppDbContext context)
    {
        return new DisasterReportService(
            context,
            Mock.Of<IRiskPredictionService>(),
            Mock.Of<IAgentExecutionService>(),
            Mock.Of<IVulnerabilityImpactService>(),
            Mock.Of<IResourceService>(),
            new EarlyWarningCoordinationAgent(
                context,
                Mock.Of<IAgentExecutionService>(),
                Mock.Of<IPythonEarlyWarningService>(),
                Mock.Of<IAgentToolPolicyService>()),
            Mock.Of<IEmailService>(),
            Mock.Of<Microsoft.AspNetCore.Http.IHttpContextAccessor>());
    }

    [Fact]
    public async Task UpdateStatusAsync_WithExistingReport_UpdatesStatus()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);

        var reporterId = Guid.NewGuid();
        var reportId = Guid.NewGuid();

        context.Users.Add(new User
        {
            Id = reporterId,
            FullName = "Test Reporter",
            Email = "test@example.com"
        });

        context.DisasterReports.Add(new DisasterReport
        {
            Id = reportId,
            ReporterUserId = reporterId,
            DisasterType = "Flood",
            Description = "Test disaster",
            Location = "Colombo",
            Severity = "High",
            Status = "Submitted",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.UpdateStatusAsync(
            reportId,
            "Resolved");

        Assert.NotNull(result);
        Assert.Equal("Resolved", result!.Status);

        var savedReport = await context.DisasterReports
            .FirstAsync(x => x.Id == reportId);

        Assert.Equal("Resolved", savedReport.Status);
    }

    [Fact]
    public async Task AssignVolunteerAsync_WithApprovedActiveVolunteer_AssignsVolunteer()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);

        var reporterId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var reportId = Guid.NewGuid();

        context.Users.AddRange(
            new User
            {
                Id = reporterId,
                FullName = "Test Reporter",
                Email = "reporter@test.com"
            },
            new User
            {
                Id = volunteerId,
                FullName = "Test Volunteer",
                Email = "volunteer@test.com",
                Role = "FieldVolunteer",
                IsActive = true,
                RoleRequestStatus = "Approved"
            });

        context.DisasterReports.Add(new DisasterReport
        {
            Id = reportId,
            ReporterUserId = reporterId,
            DisasterType = "Flood",
            Description = "Test disaster",
            Location = "Colombo",
            Severity = "High",
            Status = "VolunteerQueue",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.AssignVolunteerAsync(
            reportId,
            volunteerId);

        Assert.NotNull(result);
        Assert.Equal(volunteerId, result!.AssignedVolunteerUserId);
        Assert.Equal("Assigned", result.Status);

        var savedReport = await context.DisasterReports
            .FirstAsync(x => x.Id == reportId);

        Assert.Equal(volunteerId, savedReport.AssignedVolunteerUserId);
        Assert.Equal("Assigned", savedReport.Status);
    }
}



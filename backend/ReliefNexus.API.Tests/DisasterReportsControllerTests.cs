using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using ReliefNexus.API.Controllers;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.DTOs;
using System.Security.Claims;

namespace ReliefNexus.API.Tests;

public class DisasterReportsControllerTests
{
    private readonly Mock<IDisasterReportService> _serviceMock;
    private readonly DisasterReportsController _controller;

    public DisasterReportsControllerTests()
    {
        _serviceMock = new Mock<IDisasterReportService>();
        _controller = new DisasterReportsController(_serviceMock.Object);

        var userId = Guid.NewGuid();

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(claims, "TestAuth"))
            }
        };
    }

    [Fact]
    public async Task Create_WithoutDisasterType_ReturnsBadRequest()
    {
        var request = new DisasterReportDto
        {
            Description = "Test disaster report",
            Location = "Colombo"
        };

        var result = await _controller.Create(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        _serviceMock.Verify(
            x => x.CreateAsync(
                It.IsAny<Guid>(),
                It.IsAny<DisasterReportDto>()),
            Times.Never);
    }

    [Fact]
    public async Task Create_WithoutDescription_ReturnsBadRequest()
    {
        var request = new DisasterReportDto
        {
            DisasterType = "Flood",
            Location = "Colombo"
        };

        var result = await _controller.Create(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        _serviceMock.Verify(
            x => x.CreateAsync(
                It.IsAny<Guid>(),
                It.IsAny<DisasterReportDto>()),
            Times.Never);
    }

    [Fact]
    public async Task Create_WithoutLocation_ReturnsBadRequest()
    {
        var request = new DisasterReportDto
        {
            DisasterType = "Flood",
            Description = "Test disaster report"
        };

        var result = await _controller.Create(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        _serviceMock.Verify(
            x => x.CreateAsync(
                It.IsAny<Guid>(),
                It.IsAny<DisasterReportDto>()),
            Times.Never);
    }
}

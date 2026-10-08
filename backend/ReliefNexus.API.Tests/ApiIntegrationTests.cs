using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ReliefNexus.API.Tests;

public class ApiIntegrationTests
    : IClassFixture<ReliefNexusWebApplicationFactory>
{
    private readonly ReliefNexusWebApplicationFactory _factory;

    public ApiIntegrationTests(
        ReliefNexusWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient()
    {
        return _factory.CreateClient();
    }

    private HttpClient CreateAuthenticatedClient(string role)
    {
        var client = CreateClient();

        var configuration =
            _factory.Services
                .GetRequiredService<IConfiguration>();

        var key =
            configuration["Jwt:Key"]!;

        var issuer =
            configuration["Jwt:Issuer"]!;

        var audience =
            configuration["Jwt:Audience"]!;

        var userId = Guid.NewGuid();

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                userId.ToString()),

            new Claim(
                ClaimTypes.Name,
                $"SE3110-{role}-TestUser"),

            new Claim(
                ClaimTypes.Role,
                role),

            new Claim(
                JwtRegisteredClaimNames.Email,
                $"{role.ToLowerInvariant()}@test.local")
        };

        var credentials =
            new SigningCredentials(
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256);

        var token =
            new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: credentials);

        var tokenValue =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                tokenValue);

        return client;
    }

    [Fact]
    public async Task HealthEndpoint_Returns200()
    {
        using var client = CreateClient();

        var response =
            await client.GetAsync("/health");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    [Fact]
    public async Task UsersEndpoint_WithoutAuthentication_Returns401()
    {
        using var client = CreateClient();

        var response =
            await client.GetAsync("/api/Users");

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    [Fact]
    public async Task UsersEndpoint_WithNonAdminRole_Returns403()
    {
        using var client =
            CreateAuthenticatedClient("AffectedUser");

        var response =
            await client.GetAsync("/api/Users");

        Assert.Equal(
            HttpStatusCode.Forbidden,
            response.StatusCode);
    }

    [Fact]
    public async Task UsersEndpoint_WithAdminRole_Returns200()
    {
        using var client =
            CreateAuthenticatedClient(
                "SystemAdministrator");

        var response =
            await client.GetAsync("/api/Users");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    [Fact]
    public async Task UserById_WithNonExistingId_Returns404()
    {
        using var client =
            CreateAuthenticatedClient(
                "SystemAdministrator");

        var response =
            await client.GetAsync(
                $"/api/Users/{Guid.NewGuid()}");

        Assert.Equal(
            HttpStatusCode.NotFound,
            response.StatusCode);
    }

    [Fact]
    public async Task VolunteerRecommendation_WithEmptyReportId_Returns400()
    {
        using var client =
            CreateAuthenticatedClient(
                "ReliefCoordinator");

        var content =
            new StringContent(
                """
                {
                    "disasterReportId":
                    "00000000-0000-0000-0000-000000000000"
                }
                """,
                Encoding.UTF8,
                "application/json");

        var response =
            await client.PostAsync(
                "/api/volunteer-assignment/recommend",
                content);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);
    }

    [Fact]
    public async Task UsersEndpoint_WithWrongHttpMethod_Returns405()
    {
        using var client =
            CreateAuthenticatedClient(
                "SystemAdministrator");

        using var request =
            new HttpRequestMessage(
                HttpMethod.Patch,
                "/api/Users");

        var response =
            await client.SendAsync(request);

        Assert.Equal(
            HttpStatusCode.MethodNotAllowed,
            response.StatusCode);
    }
}


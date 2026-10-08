using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ReliefNexus.API.Tests;

public sealed class ReliefNexusWebApplicationFactory
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            var settings = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Host=localhost;Port=5432;Database=reliefnexus_test_db;Username=postgres",

                ["Jwt:Key"] =
                    "SE3110-Test-Only-Key-2026-ReliefNexus-Integration-Testing-1234567890",

                ["Jwt:Issuer"] =
                    "ReliefNexus.API",

                ["Jwt:Audience"] =
                    "ReliefNexus.Client",

                ["Jwt:ExpiryMinutes"] =
                    "60",

                ["AIService:BaseUrl"] =
                    "http://127.0.0.1:8000"
            };

            config.AddInMemoryCollection(settings);
        });
    }
}

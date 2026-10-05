using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;
    private readonly IServiceProvider _serviceProvider;
    private readonly IWebHostEnvironment _environment;

    public AuthController(
        IAuthService authService,
        AppDbContext context,
        IServiceProvider serviceProvider,
        IWebHostEnvironment environment)
    {
        _authService = authService;
        _context = context;
        _serviceProvider = serviceProvider;
        _environment = environment;
    }

    // REGISTER
    [HttpPost("register")]
    public async Task<ActionResult<AuthDto>> Register(
        [FromBody] AuthDto dto)
    {
        try
        {
            var response = await _authService.RegisterAsync(dto);

            if (response == null)
                return BadRequest(new
                {
                    message = "Invalid registration data"
                });

            return StatusCode(
                StatusCodes.Status201Created,
                response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

    // LOGIN
    [HttpPost("login")]
    public async Task<ActionResult<AuthDto>> Login(
        [FromBody] AuthDto dto)
    {
        var response = await _authService.LoginAsync(dto);

        if (response == null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password"
            });
        }

        return Ok(response);
    }

    // REFRESH TOKEN
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthDto>> Refresh(
        [FromBody] AuthDto dto)
    {
        var response = await _authService.RefreshAsync(
            dto.RefreshToken ?? string.Empty);

        if (response == null)
        {
            return Unauthorized(new
            {
                message = "Invalid refresh token"
            });
        }

        return Ok(response);
    }

    // SYSTEM HEALTH
    [HttpGet("system-health")]
    [Authorize(Roles = "SystemAdministrator")]
    public async Task<IActionResult> GetSystemHealth()
    {
        var checkedAt = DateTime.UtcNow;

        // ------------------------------------------------------------
        // DATABASE HEALTH + RESPONSE TIME
        // ------------------------------------------------------------
        var databaseHealthy = false;
        double databaseResponseMs = 0;

        var databaseStopwatch = Stopwatch.StartNew();

        try
        {
            databaseHealthy =
                await _context.Database.CanConnectAsync();
        }
        catch
        {
            databaseHealthy = false;
        }
        finally
        {
            databaseStopwatch.Stop();
            databaseResponseMs = databaseStopwatch.Elapsed.TotalMilliseconds;
        }

        // ------------------------------------------------------------
        // API HEALTH
        // Reaching this authenticated endpoint successfully confirms
        // that the API/controller pipeline is available.
        // ------------------------------------------------------------
        var apiAvailability = 100;

        // Map database response time into an API response-health score.
        var apiResponseHealth = databaseHealthy
            ? databaseResponseMs <= 100
                ? 100
                : databaseResponseMs <= 250
                    ? 95
                    : databaseResponseMs <= 500
                        ? 90
                        : databaseResponseMs <= 1000
                            ? 75
                            : databaseResponseMs <= 2000
                                ? 50
                                : 25
            : 0;

        // ------------------------------------------------------------
        // CPU UTILIZATION
        // Process CPU over a short sampling window.
        // ------------------------------------------------------------
        var cpuUtilization = await MeasureCpuUtilizationAsync();

        // ------------------------------------------------------------
        // MEMORY UTILIZATION
        // Process working set relative to the memory available to the
        // .NET runtime/container.
        // ------------------------------------------------------------
        var memoryUtilization = MeasureMemoryUtilization();

        // ------------------------------------------------------------
        // DISK UTILIZATION / STORAGE HEALTH
        // diskUtilization = percentage used
        // storage       = remaining health percentage
        // ------------------------------------------------------------
        var (diskUtilization, storageHealth, diskTotalGb, diskFreeGb) =
            MeasureDiskHealth();

        // ------------------------------------------------------------
        // AI SERVICES
        // Validate that all four registered AI agents can be resolved
        // through dependency injection. This is a readiness check, not
        // a fake execution result.
        // ------------------------------------------------------------
        var aiAgents = new[]
        {
            typeof(RiskPredictionAgent),
            typeof(VulnerabilityImpactAgent),
            typeof(ResourceOptimizationAgent),
            typeof(EarlyWarningCoordinationAgent)
        };

        var aiAgentsAvailable = 0;

        foreach (var agentType in aiAgents)
        {
            try
            {
                var agent = _serviceProvider.GetService(agentType);

                if (agent != null)
                    aiAgentsAvailable++;
            }
            catch
            {
                // Keep checking the remaining agents.
            }
        }

        var aiServices = (int)Math.Round(
            aiAgents.Length == 0
                ? 0
                : aiAgentsAvailable * 100.0 / aiAgents.Length);

        // ------------------------------------------------------------
        // OPTIONAL DATABASE-BACKED AI EXECUTION TELEMETRY
        // This tells the dashboard whether the execution table itself
        // is readable and gives the most recent execution information.
        // ------------------------------------------------------------
        var executionStoreHealthy = false;
        var totalAgentExecutions = 0;
        DateTime? latestAgentExecutionAt = null;

        try
        {
            totalAgentExecutions =
                await _context.RiskAgentExecutions.CountAsync();

            latestAgentExecutionAt =
                await _context.RiskAgentExecutions
                    .OrderByDescending(x => x.StartedAt)
                    .Select(x => (DateTime?)x.StartedAt)
                    .FirstOrDefaultAsync();

            executionStoreHealthy = true;
        }
        catch
        {
            executionStoreHealthy = false;
        }

        // ------------------------------------------------------------
        // OVERALL HEALTH
        // Average only real numeric health indicators.
        // ------------------------------------------------------------
        var healthValues = new[]
        {
            (double)apiAvailability,
            databaseHealthy ? 100d : 0d,
            (double)aiServices,
            (double)storageHealth
        };

        var overallHealth = (int)Math.Round(
            healthValues.Average());

        return Ok(new
        {
            apiAvailability,
            databaseHealth = databaseHealthy ? 100 : 0,
            aiServices,
            storage = storageHealth,

            cpuUtilization,
            memoryUtilization,
            diskUtilization,
            apiResponseHealth,

            overallHealth,
            checkedAt,

            // Database response / storage telemetry
            databaseResponseMs = Math.Round(databaseResponseMs, 2),
            diskTotalGb = Math.Round(diskTotalGb, 2),
            diskFreeGb = Math.Round(diskFreeGb, 2),

            // AI readiness telemetry
            aiAgentsAvailable,
            aiAgentsTotal = aiAgents.Length,
            aiExecutionStoreHealthy = executionStoreHealthy,
            totalAgentExecutions,
            latestAgentExecutionAt
        });
    }

    private static async Task<double> MeasureCpuUtilizationAsync()
    {
        try
        {
            using var process = Process.GetCurrentProcess();

            var startCpu = process.TotalProcessorTime;
            var startTimestamp = Stopwatch.GetTimestamp();

            await Task.Delay(150);

            process.Refresh();

            var endCpu = process.TotalProcessorTime;
            var elapsed = Stopwatch.GetElapsedTime(startTimestamp);

            if (elapsed.TotalSeconds <= 0 ||
                Environment.ProcessorCount <= 0)
            {
                return 0;
            }

            var cpuUsedSeconds =
                (endCpu - startCpu).TotalSeconds;

            var totalAvailableCpuSeconds =
                elapsed.TotalSeconds * Environment.ProcessorCount;

            var utilization =
                cpuUsedSeconds /
                totalAvailableCpuSeconds *
                100d;

            return Math.Round(
                Math.Clamp(utilization, 0, 100),
                1);
        }
        catch
        {
            return 0;
        }
    }

    private static double MeasureMemoryUtilization()
    {
        try
        {
            using var process = Process.GetCurrentProcess();

            var workingSetBytes =
                process.WorkingSet64;

            var runtimeMemoryInfo =
                GC.GetGCMemoryInfo();

            var availableMemoryBytes =
                runtimeMemoryInfo.TotalAvailableMemoryBytes;

            if (workingSetBytes <= 0 ||
                availableMemoryBytes <= 0)
            {
                return 0;
            }

            var utilization =
                workingSetBytes /
                (double)availableMemoryBytes *
                100d;

            return Math.Round(
                Math.Clamp(utilization, 0, 100),
                1);
        }
        catch
        {
            return 0;
        }
    }

    private (double DiskUtilization, double StorageHealth, double TotalGb, double FreeGb)
        MeasureDiskHealth()
    {
        try
        {
            var root =
                Path.GetPathRoot(
                    _environment.ContentRootPath ??
                    Environment.CurrentDirectory);

            if (string.IsNullOrWhiteSpace(root))
            {
                return (0, 100, 0, 0);
            }

            var drive = new DriveInfo(root);

            if (!drive.IsReady ||
                drive.TotalSize <= 0)
            {
                return (0, 100, 0, 0);
            }

            var totalBytes = (double)drive.TotalSize;
            var freeBytes = (double)drive.AvailableFreeSpace;
            var usedBytes = Math.Max(
                0,
                totalBytes - freeBytes);

            var diskUtilization =
                usedBytes / totalBytes * 100d;

            var storageHealth =
                100d - diskUtilization;

            return
            (
                Math.Round(
                    Math.Clamp(diskUtilization, 0, 100),
                    1),

                Math.Round(
                    Math.Clamp(storageHealth, 0, 100),
                    1),

                totalBytes /
                (1024d * 1024d * 1024d),

                freeBytes /
                (1024d * 1024d * 1024d)
            );
        }
        catch
        {
            return (0, 100, 0, 0);
        }
    }
}

using Microsoft.AspNetCore.Http;
using ReliefNexus.API.AI.Agents;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class DisasterReportService : IDisasterReportService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IRiskPredictionService _riskPredictionService;
    private readonly IAgentExecutionService _agentExecutionService;
    private readonly IVulnerabilityImpactService _vulnerabilityImpactService;
    private readonly IResourceService _resourceService;
    private readonly EarlyWarningCoordinationAgent _earlyWarningCoordinationAgent;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DisasterReportService(
        AppDbContext context,
        IRiskPredictionService riskPredictionService,
        IAgentExecutionService agentExecutionService,
        IVulnerabilityImpactService vulnerabilityImpactService,
        IResourceService resourceService,
        EarlyWarningCoordinationAgent earlyWarningCoordinationAgent,
        IEmailService emailService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _riskPredictionService = riskPredictionService;
        _agentExecutionService = agentExecutionService;
        _vulnerabilityImpactService = vulnerabilityImpactService;
        _resourceService = resourceService;
        _earlyWarningCoordinationAgent = earlyWarningCoordinationAgent;
        _emailService = emailService;
        _httpContextAccessor = httpContextAccessor;
    }

    private Guid? GetCurrentUserId()
    {
        var value =
            _httpContextAccessor.HttpContext?.User.FindFirstValue("sub")
            ?? _httpContextAccessor.HttpContext?.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(
            value,
            out var id)
            ? id
            : null;
    }
    public async Task<List<DisasterReportDto>> GetAllAsync()
    {
        return await (
            from report in _context.DisasterReports

            join reporter in _context.Users
                on report.ReporterUserId equals reporter.Id

            join volunteerUser in _context.Users
                on report.AssignedVolunteerUserId equals volunteerUser.Id
                into volunteerGroup

            from volunteer in volunteerGroup.DefaultIfEmpty()

            orderby report.CreatedAt descending

            select new DisasterReportDto
            {
                Id = report.Id,

                ReporterUserId = report.ReporterUserId,

                ReporterName = reporter.FullName,

                ReporterEmail = reporter.Email,

                DisasterType = report.DisasterType,

                Description = report.Description,

                Location = report.Location,

                Latitude = report.Latitude,

                Longitude = report.Longitude,

                Severity = report.Severity,

                Status = report.Status,

                RiskPredictionId = report.RiskPredictionId,

                AssignedVolunteerUserId =
                    report.AssignedVolunteerUserId,

                AssignedVolunteerName =
                    volunteer != null
                        ? volunteer.FullName
                        : null,

                AssignedAt = report.AssignedAt,

                FieldUpdateNotes =
                    report.FieldUpdateNotes,

                FieldSituation =
                    report.FieldSituation,

                FieldUpdateLatitude =
                    report.FieldUpdateLatitude,

                FieldUpdateLongitude =
                    report.FieldUpdateLongitude,

                FieldUpdatedAt =
                    report.FieldUpdatedAt,

                CreatedAt = report.CreatedAt,

                UpdatedAt = report.UpdatedAt
            }
        ).ToListAsync();
    }

    public async Task<List<DisasterReportDto>> GetAssignedReportsAsync(
        Guid userId)
    {
        return await (
            from report in _context.DisasterReports

            join reporter in _context.Users
                on report.ReporterUserId equals reporter.Id

            join volunteerUser in _context.Users
                on report.AssignedVolunteerUserId equals volunteerUser.Id
                into volunteerGroup

            from volunteer in volunteerGroup.DefaultIfEmpty()

            where report.AssignedVolunteerUserId == userId

            orderby report.AssignedAt descending, report.CreatedAt descending

            select new DisasterReportDto
            {
                Id = report.Id,
                ReporterUserId = report.ReporterUserId,
                ReporterName = reporter.FullName,
                ReporterEmail = reporter.Email,
                DisasterType = report.DisasterType,
                Description = report.Description,
                Location = report.Location,
                Latitude = report.Latitude,
                Longitude = report.Longitude,
                Severity = report.Severity,
                Status = report.Status,
                RiskPredictionId = report.RiskPredictionId,
                AssignedVolunteerUserId = report.AssignedVolunteerUserId,
                AssignedVolunteerName =
                    volunteer != null ? volunteer.FullName : null,
                AssignedAt = report.AssignedAt,
                FieldUpdateNotes = report.FieldUpdateNotes,
                FieldSituation = report.FieldSituation,
                FieldUpdateLatitude = report.FieldUpdateLatitude,
                FieldUpdateLongitude = report.FieldUpdateLongitude,
                FieldUpdatedAt = report.FieldUpdatedAt,
                CreatedAt = report.CreatedAt,
                UpdatedAt = report.UpdatedAt
            }
        ).ToListAsync();
    }

    public async Task<List<DisasterReportDto>> GetMyReportsAsync(
        Guid userId)
    {
        return await (
            from report in _context.DisasterReports

            join volunteerUser in _context.Users
                on report.AssignedVolunteerUserId equals volunteerUser.Id
                into volunteerGroup

            from volunteer in volunteerGroup.DefaultIfEmpty()

            where report.ReporterUserId == userId

            orderby report.CreatedAt descending

            select new DisasterReportDto
            {
                Id = report.Id,

                ReporterUserId = report.ReporterUserId,

                DisasterType = report.DisasterType,

                Description = report.Description,

                Location = report.Location,

                Latitude = report.Latitude,

                Longitude = report.Longitude,

                Severity = report.Severity,

                Status = report.Status,

                RiskPredictionId = report.RiskPredictionId,

                AssignedVolunteerUserId =
                    report.AssignedVolunteerUserId,

                AssignedVolunteerName =
                    volunteer != null
                        ? volunteer.FullName
                        : null,

                AssignedAt = report.AssignedAt,

                FieldUpdateNotes =
                    report.FieldUpdateNotes,

                FieldSituation =
                    report.FieldSituation,

                FieldUpdateLatitude =
                    report.FieldUpdateLatitude,

                FieldUpdateLongitude =
                    report.FieldUpdateLongitude,

                FieldUpdatedAt =
                    report.FieldUpdatedAt,

                CreatedAt = report.CreatedAt,

                UpdatedAt = report.UpdatedAt
            }
        ).ToListAsync();
    }

    public async Task<DisasterReportDto?> CreateFromPredictionAsync(
        Guid userId,
        Guid predictionId,
        DisasterReportDto request)
    {
        // Idempotent: do not create duplicate operational incidents for the
        // same Agent 01 prediction.
        var existing = await _context.DisasterReports
            .Where(x =>
                x.RiskPredictionId == predictionId &&
                x.Status != "Resolved" &&
                x.Status != "Rejected" &&
                x.Status != "Closed")
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (existing != null)
            return await BuildDtoAsync(existing.Id);


        var prediction = await _context.RiskPredictions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == predictionId);

        if (prediction == null)
            return null;

        if (prediction.UserId == Guid.Empty)
            throw new InvalidOperationException(
                "The Agent 01 prediction is not linked to its originating affected user.");

        var report = new DisasterReport
        {
            // The authenticated coordinator/admin becomes the creator of the
            // operational incident record. The incident is still linked to
            // the original Agent 01 prediction.
            ReporterUserId = prediction.UserId.Value,

            DisasterType = string.IsNullOrWhiteSpace(request.DisasterType)
                ? "Disaster"
                : request.DisasterType.Trim(),

            Description =
                string.IsNullOrWhiteSpace(request.Description)
                    ? $"Operational incident created from Agent 01 risk prediction {predictionId}."
                    : request.Description.Trim(),

            Location = string.IsNullOrWhiteSpace(request.Location)
                ? "Unknown"
                : request.Location.Trim(),

            Latitude = request.Latitude,
            Longitude = request.Longitude,

            Severity = string.IsNullOrWhiteSpace(request.Severity)
                ? "Medium"
                : request.Severity.Trim(),

            // Step 6 must be explicitly completed by an authorized
            // coordinator/admin, so do not auto-assign a volunteer here.
            Status = "VolunteerQueue",

            RiskPredictionId = predictionId,
            AssignedVolunteerUserId = null,
            AssignedAt = null,

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.DisasterReports.Add(report);
        await _context.SaveChangesAsync();

        return await BuildDtoAsync(report.Id);
    }

    public async Task<DisasterReportDto?> CreateAsync(
        Guid userId,
        DisasterReportDto request)
    {
        var disasterType = request.DisasterType.Trim();
        var description = request.Description.Trim();
        var location = request.Location.Trim();

        var severity = string.IsNullOrWhiteSpace(request.Severity)
            ? "Medium"
            : request.Severity.Trim();

        // Prevent accidental duplicate submissions.
        var duplicateSince = DateTime.UtcNow.AddMinutes(-5);

        var duplicate = await _context.DisasterReports
            .Where(x =>
                x.ReporterUserId == userId &&
                x.CreatedAt >= duplicateSince &&
                x.Status != "Resolved" &&
                x.Status != "Rejected" &&
                x.Status != "Closed" &&
                x.DisasterType == disasterType &&
                x.Description == description &&
                x.Location == location &&
                x.Severity == severity &&
                x.Latitude == request.Latitude &&
                x.Longitude == request.Longitude)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (duplicate != null)
        {
            return await BuildDtoAsync(duplicate.Id);
        }

        var report = new DisasterReport
        {
            ReporterUserId = userId,

            DisasterType = disasterType,

            Description = description,

            Location = location,

            Latitude = request.Latitude,

            Longitude = request.Longitude,

            Severity = severity,

            // Initial state while AI processing starts.
            Status = "Submitted",

            RiskPredictionId = null,

            AssignedVolunteerUserId = null,

            AssignedAt = null,

            CreatedAt = DateTime.UtcNow,

            UpdatedAt = DateTime.UtcNow
        };

        _context.DisasterReports.Add(report);

        await _context.SaveChangesAsync();

        RiskAgentExecution? execution = null;

        try
        {
            // ============================================================
            // AGENT 1 - RISK PREDICTION
            // ============================================================

            var inputSummary =
                $"DisasterReportId={report.Id}; " +
                $"Location={report.Location}; " +
                $"Latitude={report.Latitude}; " +
                $"Longitude={report.Longitude}; " +
                $"DisasterType={report.DisasterType}; " +
                $"Severity={report.Severity}";

            execution = await _agentExecutionService.StartAsync(
                inputSummary,

                "Assess disaster risk for the submitted disaster report using available environmental and historical data.",

                "1. Load disaster report; " +
                "2. Collect environmental data; " +
                "3. Calculate multi-hazard risk; " +
                "4. Validate risk result; " +
                "5. Persist risk prediction.",

                "Risk Prediction Agent");

            var riskRequest = new RiskPredictionDto
            {
                Location = report.Location,

                Latitude = report.Latitude,

                Longitude = report.Longitude,

                DisasterType = report.DisasterType,

                // Agent 1 enriches these using its available tools.
                Rainfall1h = 0,

                Rainfall3h = 0,

                Rainfall24h = 0,

                RiverLevel = 0,

                RiverFlow = 0,

                Temperature = 0,

                Humidity = 0,

                WindSpeed = 0,

                SoilMoisture = 0,

                Elevation = 0,

                PopulationDensity = 0,

                HistoricalFloodCount = 0,

                HistoricalSeverity = 0,

                DrainageCapacity = 0,

                ForecastRainfall = 0
            };

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                throw new UnauthorizedAccessException("Authenticated user ID was not found.");

            var prediction =
                await _riskPredictionService.CreateAsync(
                    currentUserId.Value,
                    riskRequest,
                    execution.Id);
            // ============================================================
            // VALIDATE RISK PREDICTION ID
            // ============================================================

            if (!prediction.Id.HasValue)
            {
                throw new InvalidOperationException(
                    "Risk prediction was created without a valid ID.");
            }

            var predictionId = prediction.Id.Value;

            // Connect the disaster report to Agent 1 result.
            report.RiskPredictionId = predictionId;

            await _context.SaveChangesAsync();

            // ============================================================
            // AGENT 2 - VULNERABILITY & IMPACT
            // ============================================================

            var vulnerabilityAssessment =
                await _vulnerabilityImpactService.AssessAsync(
                    predictionId);

            // ============================================================
            // AGENT 3 - RESOURCE OPTIMIZATION
            // ============================================================

            if (vulnerabilityAssessment != null)
            {
                await _resourceService.OptimizeAsync(
                    vulnerabilityAssessment.Id);

                // ========================================================
                // AGENT 4 - EARLY WARNING & COORDINATION
                // ========================================================

                await _earlyWarningCoordinationAgent.CreateAlertAsync(
                    vulnerabilityAssessment.Id);
            }

            // ============================================================
            // VOLUNTEER ASSIGNMENT
            // ============================================================
            // Assignment is intentionally NOT performed automatically during
            // report creation. The coordinator/admin performs Step 6 after
            // reviewing the complete AI results.

            report.AssignedVolunteerUserId = null;
            report.AssignedAt = null;
            report.Status = "VolunteerQueue";
            report.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // ============================================================
            // COMPLETE THE WHOLE AI WORKFLOW
            // ============================================================

            await _agentExecutionService.CompleteAsync(
                execution.Id,

                predictionId,

                $"DisasterReportId={report.Id}; " +
                $"RiskPredictionId={predictionId}; " +
                $"RiskScore={prediction.RiskScore:F2}; " +
                $"RiskLevel={prediction.RiskLevel}; " +
                "Volunteer=Pending coordinator assignment; " +
                $"FinalStatus={report.Status}",

                "Risk prediction, vulnerability assessment, resource optimization and early warning completed; volunteer assignment remains an explicit coordinator stage.",

                "Complete disaster response AI workflow completed successfully.",

                prediction.RequiresHumanApproval
                    ? "Pending"
                    : "NotRequired");
        }
        catch (Exception ex)
        {
            // AI processing failed.
            // Keep the submitted report visible to administration.
            if (execution != null)
            {
                await _agentExecutionService.FailAsync(
                    execution.Id,
                    ex.Message);
            }

            report.Status = "Submitted";

            report.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            throw new InvalidOperationException(
                $"Disaster report was created, but AI workflow failed: {ex.Message}",
                ex);
        }

        return await BuildDtoAsync(report.Id);
    }

    public async Task<DisasterReportDto?> UpdateStatusAsync(
        Guid id,
        string status)
    {
        var report =
            await _context.DisasterReports
                .FirstOrDefaultAsync(x => x.Id == id);

        if (report == null)
            return null;

        report.Status = status.Trim();

        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await BuildDtoAsync(report.Id);
    }

    public async Task<DisasterReportDto?> ReviewAsync(
        Guid id)
    {
        return await SetStatusAsync(
            id,
            "UnderReview");
    }

    public async Task<DisasterReportDto?> VerifyAsync(
        Guid id)
    {
        var report =
            await _context.DisasterReports
                .FirstOrDefaultAsync(x => x.Id == id);

        if (report == null)
            return null;

        var alreadyVerified =
            string.Equals(
                report.Status,
                "Verified",
                StringComparison.OrdinalIgnoreCase);

        report.Status = "Verified";
        report.UpdatedAt = DateTime.UtcNow;

        if (!alreadyVerified)
        {
            var reporter =
                await _context.Users
                    .FirstOrDefaultAsync(
                        x => x.Id == report.ReporterUserId);

            if (reporter != null)
            {
                var message =
                    $"Your disaster report has been verified. " +
                    $"Disaster: {report.DisasterType}. " +
                    $"Location: {report.Location}. " +
                    $"Severity: {report.Severity}. " +
                    "The ReliefNexus response team will continue the response workflow.";

                _context.Notifications.Add(
                    new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = reporter.Id,
                        Title = "Disaster Report Verified",
                        Message = message,
                        Type = "DisasterReportVerified",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });

                await _context.SaveChangesAsync();

                if (!string.IsNullOrWhiteSpace(reporter.Email))
                {
                    var emailBody =
                        $"Hello {reporter.FullName},`r`n`r`n" +
                        "Your disaster report has been verified by the ReliefNexus response team.`r`n`r`n" +
                        "REPORT DETAILS`r`n" +
                        "--------------------------------`r`n" +
                        $"Disaster Type: {report.DisasterType}`r`n" +
                        $"Location: {report.Location}`r`n" +
                        $"Severity: {report.Severity}`r`n" +
                        "Status: Verified`r`n" +
                        $"Report ID: {report.Id}`r`n" +
                        $"Submitted: {report.CreatedAt:u}`r`n`r`n" +
                        "Your report is now part of the verified disaster-response workflow.`r`n`r`n" +
                        "ReliefNexus";

                    await _emailService.SendAsync(
                        reporter.Email,
                        "ReliefNexus - Disaster Report Verified",
                        emailBody);
                }
            }
            else
            {
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            await _context.SaveChangesAsync();
        }

        return await BuildDtoAsync(report.Id);
    }

    public async Task<DisasterReportDto?> AssignVolunteerAsync(
        Guid id,
        Guid volunteerUserId)
    {
        var volunteer =
            await _context.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == volunteerUserId);

        if (volunteer == null)
            return null;

        if (!string.Equals(
                volunteer.Role,
                "FieldVolunteer",
                StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!volunteer.IsActive ||
            !string.Equals(
                volunteer.RoleRequestStatus,
                "Approved",
                StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var report =
            await _context.DisasterReports
                .FirstOrDefaultAsync(x => x.Id == id);

        if (report == null)
            return null;

        report.AssignedVolunteerUserId =
            volunteerUserId;

        report.AssignedAt =
            DateTime.UtcNow;

        report.Status =
            "Assigned";

        report.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await BuildDtoAsync(report.Id);
    }

    public async Task<DisasterReportDto?> FieldStartAsync(
        Guid id,
        Guid volunteerUserId)
    {
        return await UpdateFieldStatusAsync(
            id,
            volunteerUserId,
            "InProgress");
    }

    public async Task<DisasterReportDto?> FieldUpdateAsync(
        Guid id,
        Guid volunteerUserId,
        ReliefNexus.API.DTOs.FieldUpdateRequest request)
    {
        var report = await _context.DisasterReports
            .FirstOrDefaultAsync(x => x.Id == id);

        if (report == null ||
            report.AssignedVolunteerUserId != volunteerUserId)
        {
            return null;
        }

        report.FieldUpdateNotes =
            request.Notes?.Trim();

        report.FieldSituation =
            request.Situation?.Trim();

        report.FieldUpdateLatitude =
            request.Latitude;

        report.FieldUpdateLongitude =
            request.Longitude;

        report.FieldUpdatedAt =
            DateTime.UtcNow;

        report.Status =
            "FieldUpdateSubmitted";

        report.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await BuildDtoAsync(report.Id);
    }

    public async Task<DisasterReportDto?> FieldCompleteAsync(
        Guid id,
        Guid volunteerUserId)
    {
        return await UpdateFieldStatusAsync(
            id,
            volunteerUserId,
            "FieldCompleted");
    }

    public async Task<DisasterReportDto?> ResolveAsync(
        Guid id)
    {
        return await SetStatusAsync(
            id,
            "Resolved");
    }

    public async Task<DisasterReportDto?> RejectAsync(
        Guid id)
    {
        return await SetStatusAsync(
            id,
            "Rejected");
    }

    private async Task<DisasterReportDto?> SetStatusAsync(
        Guid id,
        string status)
    {
        var report =
            await _context.DisasterReports
                .FirstOrDefaultAsync(x => x.Id == id);

        if (report == null)
            return null;

        report.Status = status;

        report.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await BuildDtoAsync(report.Id);
    }

    private async Task<DisasterReportDto?> UpdateFieldStatusAsync(
        Guid id,
        Guid volunteerUserId,
        string status)
    {
        var report =
            await _context.DisasterReports
                .FirstOrDefaultAsync(x => x.Id == id);

        if (report == null)
            return null;

        if (report.AssignedVolunteerUserId !=
            volunteerUserId)
        {
            return null;
        }

        report.Status = status;

        report.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await BuildDtoAsync(report.Id);
    }

    private async Task<DisasterReportDto?> BuildDtoAsync(
        Guid id)
    {
        return await (
            from report in _context.DisasterReports

            join reporter in _context.Users
                on report.ReporterUserId equals reporter.Id

            join volunteerUser in _context.Users
                on report.AssignedVolunteerUserId equals volunteerUser.Id
                into volunteerGroup

            from volunteer in volunteerGroup.DefaultIfEmpty()

            where report.Id == id

            select new DisasterReportDto
            {
                Id = report.Id,

                ReporterUserId =
                    report.ReporterUserId,

                ReporterName =
                    reporter.FullName,

                ReporterEmail =
                    reporter.Email,

                DisasterType =
                    report.DisasterType,

                Description =
                    report.Description,

                Location =
                    report.Location,

                Latitude =
                    report.Latitude,

                Longitude =
                    report.Longitude,

                Severity =
                    report.Severity,

                Status =
                    report.Status,

                RiskPredictionId =
                    report.RiskPredictionId,

                AssignedVolunteerUserId =
                    report.AssignedVolunteerUserId,

                AssignedVolunteerName =
                    volunteer != null
                        ? volunteer.FullName
                        : null,

                AssignedAt =
                    report.AssignedAt,

                FieldUpdateNotes =
                    report.FieldUpdateNotes,

                FieldSituation =
                    report.FieldSituation,

                FieldUpdateLatitude =
                    report.FieldUpdateLatitude,

                FieldUpdateLongitude =
                    report.FieldUpdateLongitude,

                FieldUpdatedAt =
                    report.FieldUpdatedAt,

                CreatedAt =
                    report.CreatedAt,

                UpdatedAt =
                    report.UpdatedAt
            }
        ).FirstOrDefaultAsync();
    }
}













using ReliefNexus.API.AI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using ReliefNexus.API.AI.Tools;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.AI.Engines;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();

// ======================================================
// SERVICES
// ======================================================

// Controllers
builder.Services.AddControllers();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// API Explorer
builder.Services.AddEndpointsApiExplorer();

// ======================================================
// SWAGGER + JWT
// ======================================================

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description =
                "JWT Authorization header using the Bearer scheme."
        });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [
                new OpenApiSecuritySchemeReference(
                    "Bearer",
                    document)
            ] = []
        });
});

// ======================================================
// DATABASE
// ======================================================

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")
    )
);

// ======================================================
// DEPENDENCY INJECTION
// ======================================================

// ------------------------------------------------------
// Core Services
// ------------------------------------------------------

builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<
    IRiskPredictionService,
    RiskPredictionService>();

builder.Services.AddScoped<
    IVulnerabilityImpactService,
    VulnerabilityImpactService>();

builder.Services.AddScoped<
    IResourceService,
    ResourceService>();

builder.Services.AddScoped<
    IDisasterReportService,
    DisasterReportService>();

builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddScoped<
    IReliefRequestService,
    ReliefRequestService>();

builder.Services.AddScoped<
    ILocationSharingService,
    LocationSharingService>();

builder.Services.AddScoped<
EarlyWarningCoordinationAgent>();

builder.Services.AddScoped<
IEmergencyAlertService, EmergencyAlertService>();

builder.Services.AddScoped<
    IAuditLogService,
    AuditLogService>();

builder.Services.AddScoped<
    IAuthService,
    AuthService>();

// ------------------------------------------------------
// Agent Execution
// ------------------------------------------------------

builder.Services.AddScoped<
    IAgentExecutionService,
    AgentExecutionService>();

// ------------------------------------------------------
// Emergency Alert
// ------------------------------------------------------

builder.Services.AddScoped<
    IEmergencyAlertService,
    EmergencyAlertService>();

// ------------------------------------------------------
// Volunteer Assignment
// ------------------------------------------------------

builder.Services.AddScoped<
    IVolunteerAssignmentService,
    VolunteerAssignmentService>();

builder.Services.AddScoped<
    VolunteerAssignmentAgent>();

// ------------------------------------------------------
// AI Agents
// ------------------------------------------------------

builder.Services.AddScoped<
    RiskPredictionAgent>();

builder.Services.AddScoped<
    VulnerabilityImpactAgent>();

builder.Services.AddScoped<
    ResourceOptimizationAgent>();

builder.Services.AddScoped<
    EarlyWarningCoordinationAgent>();

// ------------------------------------------------------
// AI Engines
// ------------------------------------------------------

builder.Services.AddScoped<
    RiskEngine>();

// ------------------------------------------------------
// AI Tools
// ------------------------------------------------------

builder.Services.AddHttpClient<
    DisasterDataTool>();

builder.Services.AddHttpClient<
    WeatherTool>();

builder.Services.AddHttpClient<
    RiverGaugeTool>();

builder.Services.AddHttpClient<
    HistoricalDisasterTool>();

builder.Services.AddHttpClient<
    PopulationTool>();

builder.Services.AddHttpClient<
    DrainageDataTool>();
// ======================================================
// JWT AUTHENTICATION
// ======================================================

builder.Services.AddAuthentication(
    JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                // Validate issuer
                ValidateIssuer = true,

                // Validate audience
                ValidateAudience = true,

                // Validate token expiry
                ValidateLifetime = true,

                // Validate signing key
                ValidateIssuerSigningKey = true,

                // JWT Issuer
                ValidIssuer =
                    builder.Configuration["Jwt:Issuer"],

                // JWT Audience
                ValidAudience =
                    builder.Configuration["Jwt:Audience"],

                // JWT Secret Key
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            builder.Configuration["Jwt:Key"]!
                        )
                    )
            };
    });

// ======================================================
// AUTHORIZATION
// ======================================================

builder.Services.AddAuthorization(options =>
{
    foreach (var permission in
        ReliefNexus.API.Helpers.RoleConstants.AllPermissions)
    {
        options.AddPolicy(
            $"Permission:{permission}",
            policy =>
            {
                policy.RequireAuthenticatedUser();

                policy.RequireAssertion(context =>
                    context.User.IsInRole(
                        ReliefNexus.API.Helpers
                            .RoleConstants
                            .SystemAdministrator)
                    ||
                    context.User.Claims.Any(c =>
                        (
                            c.Type == "permission" ||
                            c.Type == "permissions" ||
                            c.Type ==
                                System.Security.Claims
                                    .ClaimTypes.Role
                        )
                        &&
                        string.Equals(
                            c.Value,
                            permission,
                            StringComparison
                                .OrdinalIgnoreCase)));
            });
    }
});

// ======================================================
// BUILD APPLICATION
// ======================================================

builder.Services.AddHttpClient<IPythonAIService, PythonAIService>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["AIService:BaseUrl"]
        ?? "http://127.0.0.1:8000");

    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddHttpClient<IPythonVulnerabilityService, PythonVulnerabilityService>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["AIService:BaseUrl"]
        ?? "http://127.0.0.1:8000");

    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddHttpClient<IPythonResourceService, PythonResourceService>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["AIService:BaseUrl"]
        ?? "http://127.0.0.1:8000");

    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddHttpClient<IPythonEarlyWarningService, PythonEarlyWarningService>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["AIService:BaseUrl"]
        ?? "http://127.0.0.1:8000");

    client.Timeout = TimeSpan.FromSeconds(60);
});
var app = builder.Build();

var uploadsPath = Path.Combine(
    builder.Environment.ContentRootPath,
    "uploads");

Directory.CreateDirectory(uploadsPath);

// ======================================================
// DATABASE / INITIAL SCHEMA
// ======================================================

using (var profileScope =
    app.Services.CreateScope())
{
    var profileDb =
        profileScope.ServiceProvider
            .GetRequiredService<AppDbContext>();

    // --------------------------------------------------
    // Users
    // --------------------------------------------------

    await profileDb.Database.ExecuteSqlRawAsync(
        """
        ALTER TABLE "Users"
        ADD COLUMN IF NOT EXISTS "ProfileImageUrl" text;
        """);

    // --------------------------------------------------
    // Disaster Reports
    // --------------------------------------------------

    await profileDb.Database.ExecuteSqlRawAsync(
        """
        ALTER TABLE "DisasterReports"
        ADD COLUMN IF NOT EXISTS "AssignedVolunteerUserId" uuid;

        ALTER TABLE "DisasterReports"
        ADD COLUMN IF NOT EXISTS "AssignedAt"
            timestamp with time zone;

        ALTER TABLE "DisasterReports"
        ADD COLUMN IF NOT EXISTS "FieldUpdateNotes" text;

        ALTER TABLE "DisasterReports"
        ADD COLUMN IF NOT EXISTS "FieldSituation" text;

        ALTER TABLE "DisasterReports"
        ADD COLUMN IF NOT EXISTS "FieldUpdateLatitude"
            double precision;

        ALTER TABLE "DisasterReports"
        ADD COLUMN IF NOT EXISTS "FieldUpdateLongitude"
            double precision;

        ALTER TABLE "DisasterReports"
        ADD COLUMN IF NOT EXISTS "FieldUpdatedAt"
            timestamp with time zone;
        """);
}

// ======================================================
// INITIAL DATA SEEDING
// ======================================================

await SeedData.InitializeAsync(
    app.Services,
    app.Configuration);

// ======================================================
// HTTP REQUEST PIPELINE
// ======================================================

app.UseSwagger();
app.UseSwaggerUI();

// ======================================================
// HTTPS
// ======================================================

app.UseHttpsRedirection();

// ======================================================
// STATIC FILES
// ======================================================

app.UseStaticFiles();

app.UseStaticFiles(
    new StaticFileOptions
    {
        FileProvider =
            new PhysicalFileProvider(
                Path.Combine(
                    builder.Environment.ContentRootPath,
                    "uploads")),

        RequestPath = "/uploads"
    });

// ======================================================
// CORS
// ======================================================

app.UseCors("FrontendPolicy");

// ======================================================
// AUTHENTICATION
// ======================================================

app.UseAuthentication();

// ======================================================
// AUTHORIZATION
// ======================================================

app.UseAuthorization();

// ======================================================
// CONTROLLERS
// ======================================================

app.MapControllers();

// ======================================================
// RUN APPLICATION
// ======================================================

app.Run();









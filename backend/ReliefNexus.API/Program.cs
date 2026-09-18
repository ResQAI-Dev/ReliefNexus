using ReliefNexus.API.AI.Tools;
using ReliefNexus.API.AI.Agents;
using ReliefNexus.API.AI.Engines;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ======================================================
// SERVICES
// ======================================================

// Controllers
builder.Services.AddControllers();
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
    // JWT Bearer authentication
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme."
    });

    // Apply Bearer authentication to Swagger
    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});

// ======================================================
// DATABASE
// ======================================================

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ======================================================
// DEPENDENCY INJECTION
// ======================================================

builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRiskPredictionService, RiskPredictionService>();
builder.Services.AddScoped<RiskPredictionAgent>();
builder.Services.AddScoped<RiskEngine>();
builder.Services.AddHttpClient<DisasterDataTool>();
builder.Services.AddHttpClient<WeatherTool>();
builder.Services.AddHttpClient<RiverGaugeTool>();
builder.Services.AddHttpClient<HistoricalDisasterTool>();
builder.Services.AddHttpClient<PopulationTool>();
builder.Services.AddHttpClient<DrainageDataTool>();
builder.Services.AddScoped<IAgentExecutionService, AgentExecutionService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// ======================================================
// JWT AUTHENTICATION
// ======================================================

builder.Services.AddAuthentication(
    JwtBearerDefaults.AuthenticationScheme
)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],

        // JWT Audience
        ValidAudience = builder.Configuration["Jwt:Audience"],

        // JWT Secret Key
        IssuerSigningKey = new SymmetricSecurityKey(
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
    foreach (var permission in ReliefNexus.API.Helpers.RoleConstants.AllPermissions)
    {
        options.AddPolicy(
            $"Permission:{permission}",
            policy =>
            {
                policy.RequireAuthenticatedUser();

                policy.RequireAssertion(context =>
                    context.User.IsInRole(
                        ReliefNexus.API.Helpers.RoleConstants.SystemAdministrator)
                    ||
                    context.User.Claims.Any(c =>
                        c.Type == "permission" &&
                        c.Value == permission));
            });
    }
});

// ======================================================
// BUILD APPLICATION
// ======================================================

var app = builder.Build();

// ======================================================
// INITIAL DATA SEEDING
// ======================================================

await SeedData.InitializeAsync(
    app.Services,
    app.Configuration);

// ======================================================
// HTTP REQUEST PIPELINE
// ======================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS
app.UseHttpsRedirection();

// CORS
app.UseCors("FrontendPolicy");

// Authentication
app.UseAuthentication();

// Authorization
app.UseAuthorization();

// Controllers
app.MapControllers();

// ======================================================
// RUN
// ======================================================

app.Run();























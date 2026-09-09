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

builder.Services.AddAuthorization();

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



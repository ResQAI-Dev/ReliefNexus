using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ======================================================
// SERVICES
// ======================================================

// Add Controllers
builder.Services.AddControllers();

// Add API Explorer
builder.Services.AddEndpointsApiExplorer();

// Test Swagger
builder.Services.AddSwaggerGen();

// Add PostgreSQL + Entity Framework Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);
builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// ======================================================
// HTTP REQUEST PIPELINE
// ======================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS Redirection
app.UseHttpsRedirection();

// Authorization
app.UseAuthorization();

// Map Controllers
app.MapControllers();

// ======================================================
// RUN APPLICATION
// ======================================================

app.Run();
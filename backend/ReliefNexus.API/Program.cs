var builder = WebApplication.CreateBuilder(args);

// ======================================================
// SERVICES
// ======================================================

// Add Controllers
builder.Services.AddControllers();

// Add API Explorer
builder.Services.AddEndpointsApiExplorer();

// Add Swagger
builder.Services.AddSwaggerGen();

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
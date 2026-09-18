using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using ReliefNexus.API.Models;
using System.Text.Json;

namespace ReliefNexus.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<RiskPrediction> RiskPredictions { get; set; }
    public DbSet<RiskAgentExecution> RiskAgentExecutions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .Property(u => u.Permissions)
            .HasColumnType("jsonb")
            .HasConversion(
                permissions => JsonSerializer.Serialize(
                    permissions,
                    (JsonSerializerOptions?)null),
                json => JsonSerializer.Deserialize<List<string>>(
                    json,
                    (JsonSerializerOptions?)null) ?? new List<string>());

        modelBuilder.Entity<User>()
            .Property(u => u.Permissions)
            .Metadata.SetValueComparer(
                new ValueComparer<List<string>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    value => value == null
                        ? 0
                        : value.Aggregate(
                            0,
                            (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
                    value => value == null
                        ? new List<string>()
                        : value.ToList()));

        modelBuilder.Entity<RiskPrediction>()
            .ToTable("RiskPredictions");

        modelBuilder.Entity<RiskFactor>()
            .ToTable("RiskFactors");
    }
}



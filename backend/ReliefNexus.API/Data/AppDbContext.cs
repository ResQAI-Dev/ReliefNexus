using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<RiskPrediction> RiskPredictions { get; set; }
    public DbSet<RiskAgentExecution> RiskAgentExecutions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<RiskPrediction>().ToTable("RiskPredictions");
        modelBuilder.Entity<RiskFactor>().ToTable("RiskFactors");
    }
}





using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // Existing User table
    public DbSet<User> Users { get; set; }

    // Disaster Risk Prediction component
    public DbSet<RiskAssessment> RiskAssessments { get; set; }

    public DbSet<RiskFactor> RiskFactors { get; set; }

    public DbSet<RiskPrediction> RiskPredictions { get; set; }

    public DbSet<RiskAssessmentHistory> RiskAssessmentHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User → RiskAssessment
        modelBuilder.Entity<RiskAssessment>()
            .HasOne(r => r.CreatedByUser)
            .WithMany()
            .HasForeignKey(r => r.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // RiskAssessment → RiskFactors
        modelBuilder.Entity<RiskFactor>()
            .HasOne(rf => rf.RiskAssessment)
            .WithMany(r => r.RiskFactors)
            .HasForeignKey(rf => rf.RiskAssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // RiskAssessment → RiskPrediction
        modelBuilder.Entity<RiskPrediction>()
            .HasOne(rp => rp.RiskAssessment)
            .WithOne(r => r.RiskPrediction)
            .HasForeignKey<RiskPrediction>(rp => rp.RiskAssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // RiskAssessment → History
        modelBuilder.Entity<RiskAssessmentHistory>()
            .HasOne(h => h.RiskAssessment)
            .WithMany(r => r.History)
            .HasForeignKey(h => h.RiskAssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // One prediction per assessment
        modelBuilder.Entity<RiskPrediction>()
            .HasIndex(rp => rp.RiskAssessmentId)
            .IsUnique();
    }
}
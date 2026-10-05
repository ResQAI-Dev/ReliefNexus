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

    // =========================================================================
    // Existing / Shared DbSets (DO NOT MODIFY – owned by other components)
    // =========================================================================

    public DbSet<User> Users { get; set; }
 HEAD

    // =========================================================================
    // Component 1 – Risk Prediction (from develop)
    // =========================================================================


    public DbSet<DisasterReport> DisasterReports { get; set; }
    public DbSet<ReliefRequest> ReliefRequests { get; set; }
    public DbSet<LocationShare> LocationShares { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Notification> Notifications { get; set; }
e607c09081109747a894baa16772e0eb4a19a0ef
    public DbSet<RiskPrediction> RiskPredictions { get; set; }
    public DbSet<RiskAgentExecution> RiskAgentExecutions { get; set; }
    public DbSet<VulnerabilityAssessment> VulnerabilityAssessments { get; set; }
    public DbSet<ReliefResource> ReliefResources { get; set; }
    public DbSet<ResourceAllocation> ResourceAllocations { get; set; }
    public DbSet<EmergencyAlert> EmergencyAlerts { get; set; }

    // =========================================================================
    // Component 2 – Population Vulnerability & Impact Assessment
    // Owner: Component 2 team
    // Tables: population_risk_snapshots, critical_infrastructures,
    //         impact_assessments
    // =========================================================================

    /// <summary>
    /// Aggregated, privacy-safe population demographic snapshots per affected area.
    /// No PII is stored in this table.
    /// </summary>
    public DbSet<PopulationRiskSnapshot> PopulationRiskSnapshots { get; set; }

    /// <summary>
    /// Critical infrastructure facilities (hospitals, schools, power stations, etc.)
    /// linked to affected geographic areas.
    /// </summary>
    public DbSet<CriticalInfrastructure> CriticalInfrastructures { get; set; }

    /// <summary>
    /// AI-generated or manual impact assessments linking disaster events to
    /// population exposure and severity classification.
    /// Pending AI assessments require human approval before downstream actions.
    /// </summary>
    public DbSet<ImpactAssessment> ImpactAssessments { get; set; }

    // =========================================================================
    // Fluent API Configuration
    // =========================================================================

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

 HEAD
        // ─────────────────────────────────────────────────────────────────────
        // Component 1 – Risk Prediction (from develop)
        // ─────────────────────────────────────────────────────────────────────
        modelBuilder.Entity<RiskPrediction>().ToTable("RiskPredictions");
        modelBuilder.Entity<RiskFactor>().ToTable("RiskFactors");

        // ─────────────────────────────────────────────────────────────────────
        // Component 2 – PopulationRiskSnapshot
        // ─────────────────────────────────────────────────────────────────────
        modelBuilder.Entity<PopulationRiskSnapshot>(entity =>
        {
            // Explicit snake_case table name to avoid EF Core pluralisation surprises
            entity.ToTable("population_risk_snapshots");

            entity.HasKey(e => e.Id);

            // Index on AffectedAreaId – most queries filter by area
            entity.HasIndex(e => e.AffectedAreaId)
                  .HasDatabaseName("ix_population_risk_snapshots_affected_area_id");

            // Index on SnapshotDate – supports time-series queries
            entity.HasIndex(e => e.SnapshotDate)
                  .HasDatabaseName("ix_population_risk_snapshots_snapshot_date");

            entity.Property(e => e.DataSource).HasMaxLength(100);

            // Ensure UTC storage for all timestamp columns
            entity.Property(e => e.SnapshotDate)
                  .HasColumnType("timestamp with time zone");
            entity.Property(e => e.CreatedAt)
                  .HasColumnType("timestamp with time zone");
            entity.Property(e => e.UpdatedAt)
                  .HasColumnType("timestamp with time zone");
        });

        // ─────────────────────────────────────────────────────────────────────
        // Component 2 – CriticalInfrastructure
        // ─────────────────────────────────────────────────────────────────────
        modelBuilder.Entity<CriticalInfrastructure>(entity =>
        {
            entity.ToTable("critical_infrastructures");

            entity.HasKey(e => e.Id);

            // Index on AffectedAreaId – most queries filter by area
            entity.HasIndex(e => e.AffectedAreaId)
                  .HasDatabaseName("ix_critical_infrastructures_affected_area_id");

            // Composite index on (AffectedAreaId, Type) – common filter pattern
            entity.HasIndex(e => new { e.AffectedAreaId, e.Type })
                  .HasDatabaseName("ix_critical_infrastructures_area_type");

            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();

            // Double precision for geospatial coordinates (WGS-84)
            entity.Property(e => e.Latitude).HasColumnType("double precision");
            entity.Property(e => e.Longitude).HasColumnType("double precision");

            entity.Property(e => e.IsEmergencyHub).HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                  .HasColumnType("timestamp with time zone");
            entity.Property(e => e.UpdatedAt)
                  .HasColumnType("timestamp with time zone");
        });

        // ─────────────────────────────────────────────────────────────────────
        // Component 2 – ImpactAssessment
        // ─────────────────────────────────────────────────────────────────────
        modelBuilder.Entity<ImpactAssessment>(entity =>
        {
            entity.ToTable("impact_assessments");

            entity.HasKey(e => e.Id);

            // Index on DisasterEventId – joins back to disaster events
            entity.HasIndex(e => e.DisasterEventId)
                  .HasDatabaseName("ix_impact_assessments_disaster_event_id");

            // Index on AffectedAreaId – area-level filtering
            entity.HasIndex(e => e.AffectedAreaId)
                  .HasDatabaseName("ix_impact_assessments_affected_area_id");

            // Index on WorkflowId – agent workflow correlation queries
            entity.HasIndex(e => e.WorkflowId)
                  .HasDatabaseName("ix_impact_assessments_workflow_id")
                  .IsUnique(false);

            entity.Property(e => e.ImpactSeverity)
                  .HasMaxLength(20)
                  .IsRequired()
                  .HasDefaultValue("LOW");

            // JSON summary stored as PostgreSQL text column
            entity.Property(e => e.AffectedFacilitiesSummary)
                  .HasColumnType("text");

            entity.Property(e => e.GeneratedBy)
                  .HasMaxLength(50)
                  .HasDefaultValue("VulnerabilityAgent");

            entity.Property(e => e.CreatedAt)
                  .HasColumnType("timestamp with time zone");
            entity.Property(e => e.UpdatedAt)
                  .HasColumnType("timestamp with time zone");
        });
    }
}

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














 e607c09081109747a894baa16772e0eb4a19a0ef

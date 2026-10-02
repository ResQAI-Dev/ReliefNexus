using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReliefNexus.API.Migrations
{
    /// <inheritdoc />
    public partial class SyncRiskPredictionModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RiskAgentExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RiskPredictionId = table.Column<Guid>(type: "uuid", nullable: true),
                    AgentName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    InputSummary = table.Column<string>(type: "text", nullable: false),
                    OutputSummary = table.Column<string>(type: "text", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskAgentExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RiskPredictions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    Rainfall1h = table.Column<double>(type: "double precision", nullable: false),
                    Rainfall3h = table.Column<double>(type: "double precision", nullable: false),
                    Rainfall24h = table.Column<double>(type: "double precision", nullable: false),
                    RiverLevel = table.Column<double>(type: "double precision", nullable: false),
                    RiverFlow = table.Column<double>(type: "double precision", nullable: false),
                    Temperature = table.Column<double>(type: "double precision", nullable: false),
                    Humidity = table.Column<double>(type: "double precision", nullable: false),
                    WindSpeed = table.Column<double>(type: "double precision", nullable: false),
                    SoilMoisture = table.Column<double>(type: "double precision", nullable: false),
                    Elevation = table.Column<double>(type: "double precision", nullable: false),
                    PopulationDensity = table.Column<double>(type: "double precision", nullable: false),
                    HistoricalFloodCount = table.Column<int>(type: "integer", nullable: false),
                    HistoricalSeverity = table.Column<double>(type: "double precision", nullable: false),
                    DrainageCapacity = table.Column<double>(type: "double precision", nullable: false),
                    ForecastRainfall = table.Column<double>(type: "double precision", nullable: false),
                    DisasterType = table.Column<string>(type: "text", nullable: false),
                    RiskScore = table.Column<double>(type: "double precision", nullable: false),
                    RiskLevel = table.Column<string>(type: "text", nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    PredictionSource = table.Column<string>(type: "text", nullable: false),
                    ModelVersion = table.Column<string>(type: "text", nullable: false),
                    RequiresHumanApproval = table.Column<bool>(type: "boolean", nullable: false),
                    IsApproved = table.Column<bool>(type: "boolean", nullable: false),
                    ApprovalStatus = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskPredictions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RiskFactors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RiskPredictionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Factor = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<double>(type: "double precision", nullable: false),
                    Impact = table.Column<string>(type: "text", nullable: false),
                    Contribution = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskFactors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskFactors_RiskPredictions_RiskPredictionId",
                        column: x => x.RiskPredictionId,
                        principalTable: "RiskPredictions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RiskFactors_RiskPredictionId",
                table: "RiskFactors",
                column: "RiskPredictionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RiskAgentExecutions");

            migrationBuilder.DropTable(
                name: "RiskFactors");

            migrationBuilder.DropTable(
                name: "RiskPredictions");
        }
    }
}

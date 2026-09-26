using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReliefNexus.API.Migrations
{
    /// <inheritdoc />
    public partial class AddWarningAffectedAreas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WarningAffectedAreas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AffectedAreaId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarningId = table.Column<Guid>(type: "uuid", nullable: false),
                    AreaName = table.Column<string>(type: "text", nullable: false),
                    TargetAudience = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WarningAffectedAreas", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WarningAffectedAreas");
        }
    }
}

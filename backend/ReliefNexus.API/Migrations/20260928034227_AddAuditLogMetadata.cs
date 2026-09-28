using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReliefNexus.API.Migrations
{
    public partial class AddAuditLogMetadata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "AuditLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "AuditLogs",
                type: "text",
                nullable: false,
                defaultValue: "Success");

            migrationBuilder.AddColumn<string>(
                name: "Severity",
                table: "AuditLogs",
                type: "text",
                nullable: false,
                defaultValue: "Normal");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Role",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "Severity",
                table: "AuditLogs");
        }
    }
}
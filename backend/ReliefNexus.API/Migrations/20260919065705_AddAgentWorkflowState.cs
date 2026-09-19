using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReliefNexus.API.Migrations
{
    public partial class AddAgentWorkflowState : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "NotRequired");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovalTimestamp",
                table: "RiskAgentExecutions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApprovalUser",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompletedSteps",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CurrentStep",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ErrorMessage",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FinalOutcome",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Objective",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Plan",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ToolResults",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ValidationResults",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WorkflowId",
                table: "RiskAgentExecutions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "ApprovalTimestamp",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "ApprovalUser",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "CompletedSteps",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "CurrentStep",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "ErrorMessage",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "FinalOutcome",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "Objective",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "Plan",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "ToolResults",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "ValidationResults",
                table: "RiskAgentExecutions");

            migrationBuilder.DropColumn(
                name: "WorkflowId",
                table: "RiskAgentExecutions");
        }
    }
}
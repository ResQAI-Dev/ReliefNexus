using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Services;

public class AgentExecutionService : IAgentExecutionService
{
    private readonly AppDbContext _context;

    public AgentExecutionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RiskAgentExecution> StartAsync(
        string inputSummary,
        string objective,
        string plan)
    {
        var execution = new RiskAgentExecution
        {
            AgentName = "Risk Prediction Agent",
            Status = "Started",
            InputSummary = inputSummary,
            WorkflowId = Guid.NewGuid().ToString(),
            Objective = objective,
            Plan = plan,
            CurrentStep = "Workflow initialized",
            CompletedSteps = string.Empty,
            ToolResults = string.Empty,
            ValidationResults = string.Empty,
            ApprovalStatus = "NotRequired",
            FinalOutcome = string.Empty,
            StartedAt = DateTime.UtcNow
        };

        _context.RiskAgentExecutions.Add(execution);

        await _context.SaveChangesAsync();

        return execution;
    }

    public async Task<RiskAgentExecution?> UpdateStepAsync(
        Guid executionId,
        string currentStep,
        string completedSteps,
        string toolResults)
    {
        var execution =
            await _context.RiskAgentExecutions
                .FirstOrDefaultAsync(x => x.Id == executionId);

        if (execution == null)
            return null;

        execution.CurrentStep = currentStep;
        execution.CompletedSteps = completedSteps;
        execution.ToolResults = toolResults;
        execution.Status = "Running";

        await _context.SaveChangesAsync();

        return execution;
    }

    public async Task<RiskAgentExecution?> CompleteAsync(
        Guid executionId,
        Guid predictionId,
        string outputSummary,
        string validationResults,
        string finalOutcome,
        string approvalStatus)
    {
        var execution =
            await _context.RiskAgentExecutions
                .FirstOrDefaultAsync(x => x.Id == executionId);

        if (execution == null)
            return null;

        execution.RiskPredictionId = predictionId;
        execution.Status = "Completed";
        execution.OutputSummary = outputSummary;
        execution.ValidationResults = validationResults;
        execution.FinalOutcome = finalOutcome;
        execution.ApprovalStatus = approvalStatus;
        execution.CurrentStep = "Workflow completed";
        execution.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return execution;
    }

    public async Task<RiskAgentExecution?> FailAsync(
        Guid executionId,
        string errorMessage)
    {
        var execution =
            await _context.RiskAgentExecutions
                .FirstOrDefaultAsync(x => x.Id == executionId);

        if (execution == null)
            return null;

        execution.Status = "Failed";
        execution.ErrorMessage = errorMessage;
        execution.FinalOutcome = "Workflow failed safely";
        execution.CurrentStep = "Workflow terminated";
        execution.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return execution;
    }

    public async Task<RiskAgentExecution?> RecordApprovalAsync(
        Guid executionId,
        string approvalStatus,
        string approvalUser)
    {
        var execution =
            await _context.RiskAgentExecutions
                .FirstOrDefaultAsync(x => x.Id == executionId);

        if (execution == null)
            return null;

        execution.ApprovalStatus = approvalStatus;
        execution.ApprovalUser = approvalUser;
        execution.ApprovalTimestamp = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return execution;
    }

    public async Task<List<RiskAgentExecution>> GetAllAsync()
    {
        return await _context.RiskAgentExecutions
            .OrderByDescending(x => x.StartedAt)
            .ToListAsync();
    }

    public async Task<List<RiskAgentExecution>>
        GetByPredictionIdAsync(Guid predictionId)
    {
        return await _context.RiskAgentExecutions
            .Where(x => x.RiskPredictionId == predictionId)
            .OrderByDescending(x => x.StartedAt)
            .ToListAsync();
    }
}

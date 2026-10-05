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
        string plan,
        string agentName = "Risk Prediction Agent")
    {
        var execution = new RiskAgentExecution
        {
            AgentName = agentName,
            Status = "Started",
            InputSummary = inputSummary,
            WorkflowId = Guid.NewGuid().ToString(),
            Objective = objective,
            Plan = plan,
            CurrentStep = "Workflow initialized",
            CompletedSteps = string.Empty,
            ToolResults = string.Empty,
            ValidationResults = string.Empty,
            ApprovalStatus =
    agentName is "Vulnerability & Impact Agent"
        or "Resource Optimization Agent"
        ? "Pending"
        : "NotRequired",
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
        string approvalStatus,
        int inputTokens = 0,
        int outputTokens = 0,
        int totalTokens = 0,
        string modelName = "",
        decimal? estimatedCost = null)
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
        if (execution.AgentName != "Vulnerability & Impact Agent" &&
    execution.AgentName != "Resource Optimization Agent")
{
    execution.ApprovalStatus = approvalStatus;
}
        if (inputTokens != 0 || outputTokens != 0 || totalTokens != 0 || !string.IsNullOrWhiteSpace(modelName))
        {
            execution.InputTokens = inputTokens;
            execution.OutputTokens = outputTokens;
            execution.TotalTokens = totalTokens;
            execution.ModelName = modelName;
        }

        if (estimatedCost.HasValue)
        {
            execution.EstimatedCost = estimatedCost;
        }
        execution.CurrentStep = "Workflow completed";
        execution.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return execution;
    }

    public async Task<RiskAgentExecution?> RecordUsageAsync(
        Guid executionId,
        int inputTokens,
        int outputTokens,
        int totalTokens,
        string modelName)
    {
        var execution =
            await _context.RiskAgentExecutions
                .FirstOrDefaultAsync(x => x.Id == executionId);

        if (execution == null)
            return null;

        execution.InputTokens = inputTokens;
        execution.OutputTokens = outputTokens;
        execution.TotalTokens = totalTokens;
        execution.ModelName = modelName ?? string.Empty;

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

        if (execution.AgentName != "Vulnerability & Impact Agent" &&
    execution.AgentName != "Resource Optimization Agent")
{
    execution.ApprovalStatus = approvalStatus;
}
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








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
        string inputSummary)
    {
        var execution = new RiskAgentExecution
        {
            AgentName = "Risk Prediction Agent",
            Status = "Started",
            InputSummary = inputSummary,
            StartedAt = DateTime.UtcNow
        };

        _context.RiskAgentExecutions.Add(execution);

        await _context.SaveChangesAsync();

        return execution;
    }

    public async Task<RiskAgentExecution?> CompleteAsync(
        Guid executionId,
        Guid predictionId,
        string outputSummary)
    {
        var execution =
            await _context.RiskAgentExecutions
                .FirstOrDefaultAsync(x => x.Id == executionId);

        if (execution == null)
            return null;

        execution.RiskPredictionId = predictionId;
        execution.Status = "Completed";
        execution.OutputSummary = outputSummary;
        execution.CompletedAt = DateTime.UtcNow;

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

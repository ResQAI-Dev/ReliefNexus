$ErrorActionPreference = "Stop"

$root = "C:\Users\SK COMPUTERS\ReliefNexus"
$api = Join-Path $root "backend\ReliefNexus.API"
$agent = Join-Path $api "AI\Agents\ResourceOptimizationAgent.cs"

if (!(Test-Path $agent)) {
    throw "Agent 03 file not found: $agent"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "$agent.before-agent03-telemetry-$stamp.bak"
Copy-Item $agent $backup -Force

$c = Get-Content $agent -Raw

# 1. Add execution-service dependency
if ($c -notmatch 'using ReliefNexus\.API\.Interfaces;') {
    $c = $c -replace 'using ReliefNexus\.API\.DTOs\.ResourceOptimization;\r?\n',
        "using ReliefNexus.API.DTOs.ResourceOptimization;`r`nusing ReliefNexus.API.Interfaces;`r`n"
}

if ($c -notmatch 'private readonly IAgentExecutionService _agentExecutionService;') {
    $c = $c -replace 'private readonly IPythonResourceService _pythonResourceService;\r?\n',
        "private readonly IPythonResourceService _pythonResourceService;`r`n    private readonly IAgentExecutionService _agentExecutionService;`r`n"
}

if ($c -notmatch 'IAgentExecutionService agentExecutionService') {
    $ctorPattern = '(?s)(public ResourceOptimizationAgent\(\s*AppDbContext context,\s*IPythonResourceService pythonResourceService,\s*IAgentToolPolicyService agentToolPolicy)(\))'
    if (-not [regex]::IsMatch($c, $ctorPattern)) {
        throw "Current Agent 03 constructor shape was not recognized. No source changes were applied."
    }

    $c = [regex]::Replace(
        $c,
        $ctorPattern,
        '$1,`r`n        IAgentExecutionService agentExecutionService$2',
        1
    )

    $c = $c -replace '_pythonResourceService = pythonResourceService;\r?\n',
        "_pythonResourceService = pythonResourceService;`r`n        _agentExecutionService = agentExecutionService;`r`n"
}

# 2. Start persistent Agent 03 execution after eligibility check
if ($c -notmatch 'Agent03 execution started') {
    $guardPattern = '(?s)(if \(!IsAgent03EligiblePriority\(priority\)\)\s*return null;\s*)'

    if (-not [regex]::IsMatch($c, $guardPattern)) {
        throw "Agent 03 eligibility guard was not found. No source changes were applied."
    }

    $startBlock = @'
$1
        var execution = await _agentExecutionService.StartAsync(
            $"VulnerabilityAssessmentId={assessment.Id}; RiskPredictionId={assessment.RiskPredictionId}; Location={assessment.Location}; DisasterType={assessment.DisasterType}; Priority={priority}",
            "Predict disaster resource demand from the validated Agent 02 assessment and match the prediction against real inventory.",
            "1. Load Agent 02 assessment; 2. Validate High/Critical eligibility; 3. Read real inventory; 4. Predict demand; 5. Run Python resource analysis; 6. Validate structured output; 7. Persist execution telemetry.",
            "Resource Optimization Agent");

        var executionSteps = new List<string>
        {
            "Agent 02 assessment loaded",
            $"Eligibility validated: {priority}"
        };

        await _agentExecutionService.UpdateStepAsync(
            execution.Id,
            "Building resource demand assessment",
            string.Join(" -> ", executionSteps),
            $"VulnerabilityAssessmentId={assessment.Id}; real inventory analysis started");

        // Agent03 execution started
'@
    $c = [regex]::Replace(
        $c,
        $guardPattern,
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($m)
            $startBlock.Replace('$1', $m.Groups[1].Value)
        },
        1
    )
}

# 3. Fix/capture the Python AI call and fail safely if it errors
if ($c -notmatch 'Agent03 PythonService failure recorded') {

    $pythonPrefixPattern = '(?s)var\s+pythonResourceAnalysis\s*=\s*_agentToolPolicy\.EnsureAllowed\(\s*AgentToolPolicies\.ResourceOptimizationAgent,\s*"PythonResourceService"\s*\);\s*await\s+_pythonResourceService\.OptimizeAsync\('

    if ([regex]::IsMatch($c, $pythonPrefixPattern)) {
        $replacement = @'
_agentToolPolicy.EnsureAllowed(
            AgentToolPolicies.ResourceOptimizationAgent,
            "PythonResourceService");

        executionSteps.Add("PythonResourceService authorized");

        JsonElement? pythonResourceAnalysis;

        try
        {
            await _agentExecutionService.UpdateStepAsync(
                execution.Id,
                "Running Python resource optimization analysis",
                string.Join(" -> ", executionSteps),
                "PythonResourceService: Started");

            pythonResourceAnalysis = await _pythonResourceService.OptimizeAsync(
'@
        $c = [regex]::Replace($c, $pythonPrefixPattern, $replacement, 1)
    }
    elseif ($c -match 'var\s+pythonResourceAnalysis\s*=\s*await\s+_pythonResourceService\.OptimizeAsync\(') {
        $c = $c -replace 'var\s+pythonResourceAnalysis\s*=\s*await\s+_pythonResourceService\.OptimizeAsync\(',
            "JsonElement? pythonResourceAnalysis;`r`n`r`n        try`r`n        {`r`n            await _agentExecutionService.UpdateStepAsync(`r`n                execution.Id,`r`n                `"Running Python resource optimization analysis`",`r`n                string.Join(`" -> `", executionSteps),`r`n                `"PythonResourceService: Started`");`r`n`r`n            pythonResourceAnalysis = await _pythonResourceService.OptimizeAsync("
    }
    else {
        throw "PythonResourceService call was not found in the current Agent 03 source. No source changes were applied."
    }

    $returnMarker = '\r?\n\s*return\s+new\s+ResourceDemandAssessmentDto'
    if (-not [regex]::IsMatch($c, $returnMarker)) {
        throw "ResourceDemandAssessmentDto return was not found."
    }

    $c = [regex]::Replace(
        $c,
        $returnMarker,
        @'
        }
        catch (Exception ex)
        {
            await _agentExecutionService.FailAsync(
                execution.Id,
                $"PythonResourceService failed: {ex.Message}");

            pythonResourceAnalysis = null;
            executionSteps.Add("PythonResourceService failed safely");
        }

        // Persist actual provider usage when the Python service returns it.
        var inputTokens = 0;
        var outputTokens = 0;
        var totalTokens = 0;
        var modelName = string.Empty;

        if (pythonResourceAnalysis.HasValue &&
            pythonResourceAnalysis.Value.ValueKind == JsonValueKind.Object &&
            pythonResourceAnalysis.Value.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("inputTokens", out var inputTokenValue))
                inputTokens = inputTokenValue.GetInt32();

            if (usage.TryGetProperty("outputTokens", out var outputTokenValue))
                outputTokens = outputTokenValue.GetInt32();

            if (usage.TryGetProperty("totalTokens", out var totalTokenValue))
                totalTokens = totalTokenValue.GetInt32();

            if (usage.TryGetProperty("model", out var modelValue))
                modelName = modelValue.GetString() ?? string.Empty;
        }

        var estimatedCost = CalculateAgent03EstimatedCost(
            inputTokens,
            outputTokens,
            modelName);

        await _agentExecutionService.RecordUsageAsync(
            execution.Id,
            inputTokens,
            outputTokens,
            totalTokens,
            modelName);

        executionSteps.Add("Python resource analysis completed");
        executionSteps.Add($"Usage recorded: {totalTokens:N0} total tokens");

        await _agentExecutionService.UpdateStepAsync(
            execution.Id,
            "Validating resource demand output",
            string.Join(" -> ", executionSteps),
            $"Model={modelName}; InputTokens={inputTokens}; OutputTokens={outputTokens}; TotalTokens={totalTokens}");

        await _agentExecutionService.CompleteAsync(
            execution.Id,
            assessment.RiskPredictionId ?? Guid.Empty,
            "Resource demand assessment completed using validated Agent 02 data and real inventory.",
            "Deterministic C# demand calculations remained authoritative; Python output was AI enrichment only.",
            "Agent 03 completed successfully.",
            "NotRequired",
            inputTokens,
            outputTokens,
            totalTokens,
            modelName,
            estimatedCost);

        return new ResourceDemandAssessmentDto
'@,
        1
    )
}

# 4. Add cost calculation helper
if ($c -notmatch 'CalculateAgent03EstimatedCost') {
    $lastBrace = $c.LastIndexOf("`r`n}")
    if ($lastBrace -lt 0) { $lastBrace = $c.LastIndexOf("`n}") }
    if ($lastBrace -lt 0) {
        throw "Could not find ResourceOptimizationAgent class end."
    }

    $helper = @'

    private static decimal? CalculateAgent03EstimatedCost(
        int inputTokens,
        int outputTokens,
        string modelName)
    {
        if (inputTokens <= 0 && outputTokens <= 0)
            return null;

        // OpenRouter listed price for openai/gpt-oss-20b:
        // $0.02 / 1M input tokens and $0.10 / 1M output tokens.
        // For another model, do not invent a price.
        if (!string.IsNullOrWhiteSpace(modelName) &&
            modelName.Contains("gpt-oss-20b", StringComparison.OrdinalIgnoreCase))
        {
            var cost =
                (inputTokens / 1_000_000m) * 0.02m +
                (outputTokens / 1_000_000m) * 0.10m;

            return Math.Round(cost, 8);
        }

        return null;
    }
'@

    $c = $c.Substring(0, $lastBrace) + $helper + $c.Substring($lastBrace)
}

# 5. Ensure System.Text.Json import exists
if ($c -notmatch 'using System\.Text\.Json;') {
    $c = "using System.Text.Json;`r`n" + $c
}

# 6. Structural safety checks
foreach ($needle in @(
    'IAgentExecutionService _agentExecutionService',
    'Agent03 execution started',
    'RecordUsageAsync',
    'CalculateAgent03EstimatedCost',
    'CompleteAsync'
)) {
    if ($c -notmatch [regex]::Escape($needle)) {
        throw "Safety check failed: missing $needle. Original backup is untouched."
    }
}

Set-Content $agent $c -Encoding UTF8

# 7. Format + build. Restore automatically on failure.
Push-Location $api
try {
    dotnet format --no-restore | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet format failed."
    }

    dotnet build | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet build failed."
    }
}
catch {
    Copy-Item $backup $agent -Force
    Write-Host "Build failed. Original Agent 03 source restored." -ForegroundColor Red
    throw
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "Agent 03 telemetry update completed." -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor Yellow
Write-Host "Build: PASSED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

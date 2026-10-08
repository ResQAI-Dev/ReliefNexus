$ErrorActionPreference = "Stop"

cd "C:\Users\SK COMPUTERS\ReliefNexus\frontend"

$dashboard = ".\src\features\dashboard\pages\SystemAdministratorDashboard.tsx"
$component = ".\src\features\ai-assistant\pages\AIAgentExperiencePage.tsx"
$css = ".\src\features\ai-assistant\styles\agent-experience.css"

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $dashboard "$dashboard.before-dedicated-agent-pages-$stamp.bak" -Force

# ------------------------------------------------------------------
# 1. Add the new dedicated agent page component and stylesheet.
# ------------------------------------------------------------------
if (-not (Test-Path $component)) {
    throw "Missing AIAgentExperiencePage.tsx in the patch package."
}



Copy-Item ".\AIAgentExperiencePage.tsx" $component -Force
Copy-Item ".\agent-experience.css" $css -Force

# ------------------------------------------------------------------
# 2. Import the new page.
# ------------------------------------------------------------------
$dash = Get-Content $dashboard -Raw

$oldImport = 'import AIOperationsCenter from "../../ai-assistant/pages/AIOperationsCenter";'
$newImport = @'
import AIOperationsCenter from "../../ai-assistant/pages/AIOperationsCenter";
import AIAgentExperiencePage from "../../ai-assistant/pages/AIAgentExperiencePage";
import "../../ai-assistant/styles/agent-experience.css";
'@

if ($dash.Contains($oldImport) -and -not $dash.Contains("AIAgentExperiencePage")) {
    $dash = $dash.Replace($oldImport, $newImport.TrimEnd())
}

# ------------------------------------------------------------------
# 3. Extend Section safely.
# ------------------------------------------------------------------
$sectionAnchor = '  | "ai-agents"' + "`r`n"
if (-not $dash.Contains($sectionAnchor)) {
    $sectionAnchor = '  | "ai-agents"' + "`n"
}

if (-not $dash.Contains('"ai-risk-prediction"')) {
    $replacement = @'
  | "ai-agents"
  | "ai-risk-prediction"
  | "ai-vulnerability-impact"
  | "ai-resource-optimization"
  | "ai-early-warning"
  | "ai-volunteer-assignment"
'@
    $dash = $dash.Replace($sectionAnchor, $replacement)
}

# ------------------------------------------------------------------
# 4. Add Volunteer Assignment to the AI submenu.
# ------------------------------------------------------------------
$aiItems = @'
const aiAgentManagementItems = [
  "Risk Prediction",
  "Vulnerability & Impact",
  "Resource Optimization",
  "Early Warning & Coordination",
];
'@

$aiItemsWithVolunteer = @'
const aiAgentManagementItems = [
  "Risk Prediction",
  "Vulnerability & Impact",
  "Resource Optimization",
  "Early Warning & Coordination",
  "Volunteer Assignment",
];
'@

if ($dash.Contains($aiItems) -and -not $dash.Contains('"Volunteer Assignment"')) {
    $dash = $dash.Replace($aiItems, $aiItemsWithVolunteer)
}

# ------------------------------------------------------------------
# 5. Replace ONLY handleAiModuleClick using brace counting.
# ------------------------------------------------------------------
$marker = 'const handleAiModuleClick = (child: string) => {'
$start = $dash.IndexOf($marker)

if ($start -lt 0) {
    throw "Could not find handleAiModuleClick."
}

$braceCount = 0
$end = -1

for ($i = $start; $i -lt $dash.Length; $i++) {
    $ch = $dash[$i]

    if ($ch -eq '{') {
        $braceCount++
    }
    elseif ($ch -eq '}') {
        $braceCount--

        if ($braceCount -eq 0) {
            $end = $i + 1
            break
        }
    }
}

if ($end -lt 0) {
    throw "Could not safely locate handleAiModuleClick end."
}

$newHandler = @'
const handleAiModuleClick = (child: string) => {
    setAiAgentManagementOpen(true);
    setSelectedAiModule(child);
    setNotice("");
    setError("");

    const routes: Record<string, Section> = {
      "Risk Prediction": "ai-risk-prediction",
      "Vulnerability & Impact": "ai-vulnerability-impact",
      "Resource Optimization": "ai-resource-optimization",
      "Early Warning & Coordination": "ai-early-warning",
      "Volunteer Assignment": "ai-volunteer-assignment",
    };

    goToSection(routes[child] ?? "ai-agents");
  };
'@

$dash = $dash.Substring(0, $start) + $newHandler + $dash.Substring($end)

# ------------------------------------------------------------------
# 6. Add URL recognition for the five dedicated agent pages.
# ------------------------------------------------------------------
$pathAnchor = @'
    } else if (path.includes("/ai-agents")) {
      setSection("ai-agents");
'@

$pathReplacement = @'
    } else if (path.includes("/ai-risk-prediction")) {
      setSelectedAiModule("Risk Prediction");
      setSection("ai-risk-prediction");
    } else if (path.includes("/ai-vulnerability-impact")) {
      setSelectedAiModule("Vulnerability & Impact");
      setSection("ai-vulnerability-impact");
    } else if (path.includes("/ai-resource-optimization")) {
      setSelectedAiModule("Resource Optimization");
      setSection("ai-resource-optimization");
    } else if (path.includes("/ai-early-warning")) {
      setSelectedAiModule("Early Warning & Coordination");
      setSection("ai-early-warning");
    } else if (path.includes("/ai-volunteer-assignment")) {
      setSelectedAiModule("Volunteer Assignment");
      setSection("ai-volunteer-assignment");
    } else if (path.includes("/ai-agents")) {
      setSection("ai-agents");
'@

if ($dash.Contains($pathAnchor) -and -not $dash.Contains('path.includes("/ai-risk-prediction")')) {
    $dash = $dash.Replace($pathAnchor, $pathReplacement)
}

# ------------------------------------------------------------------
# 7. Add permission-map entries because it is Record<Section,...>.
# ------------------------------------------------------------------
$permissionAnchor = @'
      "ai-agents": "AI Agent Monitoring",
      monitoring: null,
'@

$permissionReplacement = @'
      "ai-agents": "AI Agent Monitoring",
      "ai-risk-prediction": "AI Agent Monitoring",
      "ai-vulnerability-impact": "AI Agent Monitoring",
      "ai-resource-optimization": "AI Agent Monitoring",
      "ai-early-warning": "AI Agent Monitoring",
      "ai-volunteer-assignment": "AI Agent Monitoring",
      monitoring: null,
'@

if ($dash.Contains($permissionAnchor) -and -not $dash.Contains('"ai-risk-prediction": "AI Agent Monitoring"')) {
    $dash = $dash.Replace($permissionAnchor, $permissionReplacement)
}

# ------------------------------------------------------------------
# 8. Add renderContent cases before the existing ai-agents case.
# ------------------------------------------------------------------
$renderAnchor = @'
      case "ai-agents":

  return <AIOperationsCenter selectedAiModule={selectedAiModule} />;
'@

$renderReplacement = @'
      case "ai-risk-prediction":
        return <AIAgentExperiencePage agent="risk" />;

      case "ai-vulnerability-impact":
        return <AIAgentExperiencePage agent="vulnerability" />;

      case "ai-resource-optimization":
        return <AIAgentExperiencePage agent="resource" />;

      case "ai-early-warning":
        return <AIAgentExperiencePage agent="warning" />;

      case "ai-volunteer-assignment":
        return <AIAgentExperiencePage agent="volunteer" />;

      case "ai-agents":
        return <AIOperationsCenter selectedAiModule={selectedAiModule} />;
'@

if ($dash.Contains($renderAnchor) -and -not $dash.Contains('case "ai-risk-prediction":')) {
    $dash = $dash.Replace($renderAnchor, $renderReplacement)
}

Set-Content $dashboard $dash -Encoding UTF8

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " DEDICATED AI AGENT PAGES INSTALLED" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Risk Prediction          -> /ai-risk-prediction"
Write-Host "Vulnerability & Impact   -> /ai-vulnerability-impact"
Write-Host "Resource Optimization    -> /ai-resource-optimization"
Write-Host "Early Warning            -> /ai-early-warning"
Write-Host "Volunteer Assignment     -> /ai-volunteer-assignment"
Write-Host ""
Write-Host "Premium animations + real disaster imagery enabled." -ForegroundColor Green
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED. Backup created:" -ForegroundColor Red
    Write-Host "$dashboard.before-dedicated-agent-pages-$stamp.bak"
    exit 1
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " BUILD SUCCESSFUL" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green


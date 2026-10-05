from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import traceback

from app.agents.risk_agent import run_risk_agent
from app.agents.vulnerability_agent import assess_vulnerability
from app.agents.resource_agent import optimize_resources
from app.agents.early_warning_agent import coordinate_warning
from app.agents.orchestrator_agent import orchestrate, simulate
from app.models.risk import RiskAgentRequest
from app.models.vulnerability import VulnerabilityAgentRequest
from app.models.resource import ResourceAgentRequest
from app.models.early_warning import WarningAgentRequest
from app.models.orchestration import OrchestrationRequest, SimulationRequest
from app.services.gemini import generate_text


app = FastAPI(
    title="ReliefNexus AI Service",
    version="2.0.0",
    description="Bounded multi-agent orchestration service for ReliefNexus.",
)


class GeminiTestRequest(BaseModel):
    prompt: str


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ReliefNexus AI Service",
        "version": "2.0.0",
        "capabilities": [
            "intent-parsing",
            "supervisor-planning",
            "multi-agent-orchestration",
            "shared-workflow-state",
            "deterministic-validation",
            "re-planning",
            "prompt-injection-resistance",
            "what-if-simulation",
        ],
    }


@app.post("/ai/test")
async def ai_test(request: GeminiTestRequest):
    result = await generate_text(request.prompt)
    return {"success": True, "response": result}


@app.post("/ai/risk-assessment")
async def risk_assessment(request: RiskAgentRequest):
    try:
        return await run_risk_agent(request.model_dump())
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/ai/vulnerability-impact")
async def vulnerability_impact(request: VulnerabilityAgentRequest):
    return await assess_vulnerability(request.model_dump())


@app.post("/ai/resource-optimization")
async def resource_optimization(request: ResourceAgentRequest):
    return await optimize_resources(request.model_dump())


@app.post("/ai/early-warning")
async def early_warning(request: WarningAgentRequest):
    return await coordinate_warning(request.model_dump())


@app.post("/ai/orchestrate")
async def ai_orchestrate(request: OrchestrationRequest):
    try:
        return await orchestrate(
            prompt=request.prompt,
            initial_state=request.state,
            execute_agents=request.execute_agents,
            max_replans=request.max_replans,
            execution_mode=request.execution_mode,
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/ai/simulate")
async def ai_simulate(request: SimulationRequest):
    try:
        return await simulate(
            prompt=request.prompt,
            state=request.state,
            changes=request.changes,
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))


from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import traceback

from app.agents.risk_agent import run_risk_agent
from app.models.risk import RiskAgentRequest
from app.services.gemini import generate_text

app = FastAPI(
    title="ReliefNexus AI Service",
    version="1.0.0"
)

class GeminiTestRequest(BaseModel):
    prompt: str

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ReliefNexus AI Service"
    }

@app.post("/ai/test")
async def ai_test(request: GeminiTestRequest):
    result = await generate_text(request.prompt)
    return {
        "success": True,
        "response": result
    }

@app.post("/ai/risk-assessment")
async def risk_assessment(request: RiskAgentRequest):
    try:
        payload = request.model_dump()
        result = await run_risk_agent(payload)
        return result

    except Exception as exc:
        print("\n" + "=" * 70)
        print("RELIEFNEXUS AI ERROR")
        print("=" * 70)
        traceback.print_exc()
        print("=" * 70 + "\n")

        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )
from app.agents.vulnerability_agent import assess_vulnerability
from app.agents.resource_agent import optimize_resources
from app.agents.early_warning_agent import coordinate_warning
from app.models.vulnerability import VulnerabilityAgentRequest
from app.models.resource import ResourceAgentRequest
from app.models.early_warning import WarningAgentRequest
@app.post("/ai/vulnerability-impact")
async def vulnerability_impact(request: VulnerabilityAgentRequest):
    return await assess_vulnerability(request.model_dump())


@app.post("/ai/resource-optimization")
async def resource_optimization(request: ResourceAgentRequest):
    return await optimize_resources(request.model_dump())


@app.post("/ai/early-warning")
async def early_warning(request: WarningAgentRequest):
    return await coordinate_warning(request.model_dump())


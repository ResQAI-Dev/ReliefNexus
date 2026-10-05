from typing import Any
from pydantic import BaseModel, Field


class OrchestrationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=4000)
    state: dict[str, Any] = Field(default_factory=dict)
    execute_agents: bool = True
    max_replans: int = Field(default=2, ge=0, le=3)

    execution_mode: str = Field(
        default="plan_only",
        pattern="^(plan_only|backend_execution|python_simulation)$",
    )


class SimulationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=4000)
    state: dict[str, Any] = Field(default_factory=dict)
    changes: dict[str, float] = Field(default_factory=dict)


class Intent(BaseModel):
    goal: str
    location: str = ""
    hazard: str = ""
    requested_actions: list[str] = Field(default_factory=list)
    urgency: str = "normal"
    missing_information: list[str] = Field(default_factory=list)


class PlanStep(BaseModel):
    step: int
    agent: str
    objective: str
    depends_on: list[int] = Field(default_factory=list)
    approval_required: bool = False
    status: str = "planned"


class OrchestrationResponse(BaseModel):
    workflow_id: str
    status: str
    intent: dict[str, Any]
    plan: list[dict[str, Any]]
    state: dict[str, Any]
    decisions: list[str]
    validation: dict[str, Any]
    replans: int
    approval: dict[str, Any]
    trace: list[dict[str, Any]]
    usage: dict[str, Any]


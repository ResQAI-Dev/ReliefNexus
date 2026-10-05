from typing import Any
from pydantic import BaseModel, Field

class WarningAgentRequest(BaseModel):
    location: str = ""
    disaster_type: str = ""
    severity_score: float = 0
    vulnerability_score: float = 0
    impact_score: float = 0
    allocations: list[dict[str, Any]] = Field(default_factory=list)

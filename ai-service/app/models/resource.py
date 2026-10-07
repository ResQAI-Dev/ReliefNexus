from typing import Any
from pydantic import BaseModel, Field

class ResourceAgentRequest(BaseModel):
    location: str = ""
    disaster_type: str = ""
    severity_index: float = 0
    priority: str = ""
    affected_population: int = 0
    resources: list[dict[str, Any]] = Field(default_factory=list)

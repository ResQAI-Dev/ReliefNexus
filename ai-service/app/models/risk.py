from typing import Any
from pydantic import BaseModel, Field


class RiskAgentRequest(BaseModel):
    location: str = ""
    latitude: float | None = None
    longitude: float | None = None

    rainfall_1h: float = 0
    rainfall_24h: float = 0
    river_level: float = 0
    historical_flood_count: int = 0
    historical_severity: float = 0
    drainage_capacity: float = 0
    forecast_rainfall: float = 0

    disaster_type: str = ""

    additional_context: dict[str, Any] = Field(default_factory=dict)


class RiskAgentResponse(BaseModel):
    agent: str
    status: str
    risk_score: float
    risk_level: str
    confidence: float
    primary_hazard: str
    hazards: list[Any]
    risk_factors: list[Any]
    missing_data: list[Any]
    reasoning: str
    recommended_next_step: str
    validation: dict[str, Any]

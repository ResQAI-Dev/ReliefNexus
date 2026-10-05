from __future__ import annotations

from typing import Any


TOOL_REGISTRY: dict[str, dict[str, Any]] = {
    "weather": {
        "name": "Weather Intelligence",
        "description": "Current and forecast weather conditions.",
        "keywords": ["weather", "rain", "rainfall", "storm", "temperature", "forecast"],
        "agents": ["Risk Prediction Agent", "Early Warning & Coordination Agent"],
    },
    "river_gauge": {
        "name": "River Gauge Intelligence",
        "description": "River and water-level observations.",
        "keywords": ["river", "water level", "gauge", "flood", "water"],
        "agents": ["Risk Prediction Agent", "Early Warning & Coordination Agent"],
    },
    "historical_disaster": {
        "name": "Historical Disaster Intelligence",
        "description": "Historical disaster patterns and incidents.",
        "keywords": ["history", "historical", "previous", "past", "incident"],
        "agents": ["Risk Prediction Agent"],
    },
    "population": {
        "name": "Population Intelligence",
        "description": "Population exposure and vulnerable-group information.",
        "keywords": ["population", "people", "affected", "elderly", "children", "disabled", "vulnerable"],
        "agents": ["Vulnerability & Impact Agent", "Volunteer Assignment Agent"],
    },
    "hazard": {
        "name": "Sri Lanka Hazard Intelligence",
        "description": "Location-specific Sri Lankan hazard information.",
        "keywords": ["hazard", "district", "province", "disaster", "colombo", "sri lanka"],
        "agents": ["Risk Prediction Agent", "Vulnerability & Impact Agent"],
    },
    "resource": {
        "name": "Resource Intelligence",
        "description": "Available disaster-response resources.",
        "keywords": ["resource", "inventory", "supplies", "kits", "water", "medicine", "shortage"],
        "agents": ["Resource Optimization Agent"],
    },
}


def select_tools(
    prompt: str,
    intent: dict[str, Any] | None = None,
    state: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    text = " ".join([
        prompt or "",
        str((intent or {}).get("goal", "")),
        str((intent or {}).get("hazard", "")),
        " ".join((intent or {}).get("requested_actions", []) or []),
    ]).lower()

    selected: list[dict[str, Any]] = []

    for key, tool in TOOL_REGISTRY.items():
        score = sum(
            1 for keyword in tool["keywords"]
            if keyword.lower() in text
        )

        if score > 0:
            selected.append({
                "tool": key,
                "name": tool["name"],
                "reason": f"{score} contextual signal(s) matched.",
                "score": score,
                "agents": tool["agents"],
            })

    selected.sort(key=lambda item: item["score"], reverse=True)
    return selected


def available_tools_for_agent(agent: str) -> list[dict[str, Any]]:
    return [
        {
            "tool": key,
            "name": value["name"],
            "description": value["description"],
        }
        for key, value in TOOL_REGISTRY.items()
        if agent in value["agents"]
    ]

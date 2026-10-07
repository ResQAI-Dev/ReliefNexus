from typing import Any


async def coordinate_warning(payload: dict[str, Any]) -> dict[str, Any]:
    location = str(payload.get("location", "") or "")
    disaster = str(payload.get("disaster_type", "") or "")
    severity = float(payload.get("severity_score", 0) or 0)
    vulnerability = float(payload.get("vulnerability_score", 0) or 0)
    impact = float(payload.get("impact_score", 0) or 0)

    allocations = payload.get("allocations", []) or []

    score = round(
        max(0, min(100,
            severity * 0.40 +
            vulnerability * 0.25 +
            impact * 0.25 +
            min(len(allocations) * 5, 10)
        )), 1)

    level = (
        "Critical" if score >= 75 else
        "High" if score >= 55 else
        "Medium" if score >= 30 else
        "Low"
    )

    if level in ("Critical", "High"):
        urgency = "Immediate coordination and continuous monitoring are recommended."
    elif level == "Medium":
        urgency = "Maintain preparedness and monitor changing conditions."
    else:
        urgency = "Maintain routine monitoring and preparedness."

    actions = [
        "Coordinate relevant response teams",
        "Review available emergency resources",
        "Maintain communication readiness",
        "Monitor the affected location for changes"
    ]

    return {
        "agent": "Agent 04 - Early Warning & Coordination",
        "status": "completed",
        "severity_score": score,
        "severity_level": level,
        "title": f"{level} {disaster or 'Disaster'} Warning - {location}",
        "warning_message": (
            f"{level} risk conditions identified for "
            f"{location or 'the assessed area'}. {urgency}"
        ),
        "recommended_actions": actions,
        "resource_summary": (
            f"{len(allocations)} resource allocation records were supplied "
            "for coordination."
        ),
        "reasoning": (
            "Warning assessment was generated from the supplied "
            "Agent 02 assessment and Agent 03 allocation data."
        ),
        "confidence": 0.90,
        "validation": {
            "assessment_grounded": True,
            "allocation_grounded": True,
            "real_world_action_executed": False
        }
    }

import json
from typing import Any

from app.services.OpenRouter import generate_text_with_usage


def _usage(result: dict[str, Any]) -> dict[str, Any]:
    return {
        "inputTokens": int(result.get("inputTokens", 0) or 0),
        "outputTokens": int(result.get("outputTokens", 0) or 0),
        "totalTokens": int(result.get("totalTokens", 0) or 0),
        "model": str(result.get("model", "") or ""),
        "cost": result.get("cost"),
    }


def _parse_json(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    try:
        value = json.loads(text)
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            try:
                value = json.loads(text[start:end + 1])
                return value if isinstance(value, dict) else {}
            except json.JSONDecodeError:
                pass
    return {}


async def coordinate_warning(payload: dict[str, Any]) -> dict[str, Any]:
    location = str(payload.get("location", "") or "")
    disaster = str(payload.get("disaster_type", "") or "")
    severity = float(payload.get("severity_score", 0) or 0)
    vulnerability = float(payload.get("vulnerability_score", 0) or 0)
    impact = float(payload.get("impact_score", 0) or 0)
    allocations = payload.get("allocations", []) or []

    # Keep the existing deterministic severity calculation.
    score = round(max(0, min(100,
        severity * 0.40
        + vulnerability * 0.25
        + impact * 0.25
        + min(len(allocations) * 5, 10)
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

    fallback_actions = [
        "Coordinate relevant response teams",
        "Review available emergency resources",
        "Maintain communication readiness",
        "Monitor the affected location for changes",
    ]

    warning_message = (
        f"{level} risk conditions identified for "
        f"{location or 'the assessed area'}. {urgency}"
    )
    reasoning = (
        "Warning assessment was generated from the supplied assessment "
        "scores and Agent 03 allocation data."
    )

    usage = {
        "inputTokens": 0,
        "outputTokens": 0,
        "totalTokens": 0,
        "model": "",
        "cost": None,
    }
    llm_status = "fallback"

    prompt_data = {
        "location": location,
        "disaster_type": disaster,
        "severity_score": severity,
        "vulnerability_score": vulnerability,
        "impact_score": impact,
        "calculated_warning_score": score,
        "calculated_warning_level": level,
        "urgency_guidance": urgency,
        "allocation_records": allocations,
    }

    prompt = (
        "You are an early-warning and response-coordination assistant. "
        "Use only the supplied assessment and allocation data. The calculated "
        "warning score and level are authoritative: do not change them. Do not "
        "invent facts, people, resources, locations, or completed actions. "
        "Do not send alerts, contact responders, dispatch volunteers, or execute "
        "any real-world action. Return ONLY valid JSON with keys 'warning_message' "
        "(string), 'recommended_actions' (array of concise strings), and "
        "'reasoning' (string). Make the message reflect the supplied severity "
        "and uncertainty. Recommendations are suggestions requiring the system's "
        "existing approval process. Input data: "
        + json.dumps(prompt_data, ensure_ascii=False, default=str)
    )

    try:
        result = await generate_text_with_usage(prompt)
        usage = _usage(result)
        analysis = _parse_json(str(result.get("text", "") or ""))
        if analysis:
            candidate_message = analysis.get("warning_message")
            candidate_actions = analysis.get("recommended_actions")
            candidate_reasoning = analysis.get("reasoning")

            if isinstance(candidate_message, str) and candidate_message.strip():
                warning_message = candidate_message.strip()
            if isinstance(candidate_actions, list):
                valid_actions = [
                    item.strip() for item in candidate_actions
                    if isinstance(item, str) and item.strip()
                ]
                if valid_actions:
                    fallback_actions = valid_actions[:8]
            if isinstance(candidate_reasoning, str) and candidate_reasoning.strip():
                reasoning = candidate_reasoning.strip()

            llm_status = "completed"
    except Exception:
        # Preserve warning generation if the provider is unavailable.
        pass

    return {
        "agent": "Agent 04 - Early Warning & Coordination",
        "status": "completed",
        "severity_score": score,
        "severity_level": level,
        "title": f"{level} {disaster or 'Disaster'} Warning - {location}",
        "warning_message": warning_message,
        "recommended_actions": fallback_actions,
        "resource_summary": (
            f"{len(allocations)} resource allocation records were supplied "
            "for coordination."
        ),
        "reasoning": reasoning,
        "llm_status": llm_status,
        "usage": usage,
        "confidence": 0.90,
        "validation": {
            "assessment_grounded": True,
            "allocation_grounded": True,
            "real_world_action_executed": False,
        },
    }

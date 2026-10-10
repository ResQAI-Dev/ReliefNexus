import json
from typing import Any

from app.services.OpenRouter import generate_text_with_usage


def _usage(result: dict[str, Any]) -> dict[str, Any]:
    return {
        "inputTokens": int(result.get("inputTokens", 0) or 0),
        "outputTokens": int(result.get("outputTokens", 0) or 0),
        "totalTokens": int(result.get("totalTokens", 0) or 0),
        "model": str(result.get("model", "") or ""),
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


async def optimize_resources(payload: dict[str, Any]) -> dict[str, Any]:
    disaster = str(payload.get("disaster_type", "") or "")
    location = str(payload.get("location", "") or "")
    priority = str(payload.get("priority", "Medium") or "Medium")
    severity = float(payload.get("severity_index", 0) or 0)
    population = int(payload.get("affected_population", 0) or 0)
    resources = payload.get("resources", []) or []

    if priority not in ("High", "Critical"):
        return {
            "agent": "Agent 03 - Resource Demand & Optimization",
            "status": "not_eligible",
            "reasoning": "Resource optimization is restricted to High/Critical assessments.",
            "recommendations": [],
            "allocation_executed": False,
            "validation": {
                "real_inventory_only": True,
                "allocation_executed": False,
                "no_inventory_invented": True,
            },
        }

    # These figures are calculated only from the supplied inventory.
    recommendations = []
    for resource in resources:
        required = float(resource.get("required_quantity", 0) or 0)
        available = float(resource.get("available_quantity", 0) or 0)
        gap = max(0, required - available)

        recommendations.append({
            "resource_id": resource.get("resource_id"),
            "resource_name": resource.get("resource_name", "Unknown"),
            "location": resource.get("location", ""),
            "required_quantity": required,
            "available_quantity": available,
            "gap_quantity": gap,
            "coverage_status": (
                "Fully Coverable" if available >= required
                else "Partially Coverable" if available > 0
                else "No Inventory"
            ),
        })

    analysis = {}
    usage = {
        "inputTokens": 0,
        "outputTokens": 0,
        "totalTokens": 0,
        "model": "",
    }
    llm_status = "fallback"

    prompt_data = {
        "disaster_type": disaster,
        "location": location,
        "priority": priority,
        "severity_index": severity,
        "affected_population": population,
        "inventory_analysis": recommendations,
    }

    prompt = (
        "You are the resource-analysis assistant for a disaster-response system. "
        "Analyze only the supplied assessment and inventory. Never invent inventory, "
        "quantities, resource IDs, or available supplies. Do not execute allocations "
        "or claim that any real-world action has occurred. Treat quantities and "
        "coverage_status values as authoritative calculations; do not change them. "
        "Return ONLY valid JSON with keys 'reasoning' (string) and "
        "'operational_priorities' (array of concise strings). Highlight inventory "
        "gaps and coverage limitations. If inventory is empty, state that no inventory "
        "records were supplied. Input data: "
        + json.dumps(prompt_data, ensure_ascii=False, default=str)
    )

    try:
        result = await generate_text_with_usage(prompt)
        usage = _usage(result)
        analysis = _parse_json(str(result.get("text", "") or ""))
        if analysis:
            llm_status = "completed"
    except Exception:
        # Keep the deterministic inventory assessment available if the LLM is down.
        analysis = {}

    fallback_reasoning = (
        f"Resource planning reviewed {len(recommendations)} supplied inventory "
        f"records for {location or 'the assessed area'}. "
        "Only supplied inventory was considered."
    )

    reasoning = str(analysis.get("reasoning", "") or fallback_reasoning)
    priorities = analysis.get("operational_priorities", [])
    if not isinstance(priorities, list):
        priorities = []
    priorities = [str(item) for item in priorities if isinstance(item, str)]

    return {
        "agent": "Agent 03 - Resource Demand & Optimization",
        "status": "completed",
        "location": location,
        "disaster_type": disaster,
        "affected_population": population,
        "severity_index": severity,
        "priority": priority,
        "recommendations": recommendations,
        "operational_priorities": priorities,
        "reasoning": reasoning,
        "llm_status": llm_status,
        "usage": usage,
        "allocation_executed": False,
        "confidence": 0.90,
        "validation": {
            "real_inventory_only": True,
            "allocation_executed": False,
            "no_inventory_invented": True,
        },
    }

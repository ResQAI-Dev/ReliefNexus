from typing import Any


async def optimize_resources(payload: dict[str, Any]) -> dict[str, Any]:
    disaster = str(payload.get("disaster_type", "") or "")
    location = str(payload.get("location", "") or "")
    priority = str(payload.get("priority", "") or "Medium")
    severity = float(payload.get("severity_index", 0) or 0)
    population = int(payload.get("affected_population", 0) or 0)

    resources = payload.get("resources", []) or []

    if priority not in ("High", "Critical"):
        return {
            "agent": "Agent 03 - Resource Demand & Optimization",
            "status": "not_eligible",
            "reasoning": "Resource optimization is restricted to High/Critical assessments.",
            "recommendations": [],
            "validation": {
                "real_inventory_only": True,
                "allocation_executed": False
            }
        }

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
            )
        })

    return {
        "agent": "Agent 03 - Resource Demand & Optimization",
        "status": "completed",
        "location": location,
        "disaster_type": disaster,
        "affected_population": population,
        "severity_index": severity,
        "priority": priority,
        "recommendations": recommendations,
        "reasoning": (
            f"Resource planning reviewed {len(resources)} supplied inventory "
            f"records for {location or 'the assessed area'}. "
            "Only supplied real inventory was considered."
        ),
        "allocation_executed": False,
        "confidence": 0.90,
        "validation": {
            "real_inventory_only": True,
            "allocation_executed": False,
            "no_inventory_invented": True
        }
    }

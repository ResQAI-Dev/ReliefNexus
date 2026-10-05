from typing import Any


def risk_context_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    factors = []
    missing = []

    rainfall_1h = float(payload.get("rainfall_1h", 0) or 0)
    rainfall_24h = float(payload.get("rainfall_24h", 0) or 0)
    forecast = float(payload.get("forecast_rainfall", 0) or 0)
    river = float(payload.get("river_level", 0) or 0)
    history = int(payload.get("historical_flood_count", 0) or 0)
    drainage = float(payload.get("drainage_capacity", 0) or 0)

    if rainfall_1h > 0:
        factors.append(
            f"Current 1-hour rainfall: {rainfall_1h}"
        )

    if rainfall_24h > 0:
        factors.append(
            f"Current 24-hour rainfall: {rainfall_24h}"
        )

    if forecast > 0:
        factors.append(
            f"Forecast rainfall: {forecast}"
        )

    if river > 0:
        factors.append(
            f"Current river level: {river}"
        )

    if history > 0:
        factors.append(
            f"Historical flood count: {history}"
        )

    if drainage > 0:
        factors.append(
            f"Drainage capacity: {drainage}"
        )

    if not payload.get("latitude") or not payload.get("longitude"):
        missing.append("Geographical coordinates")

    if rainfall_1h == 0 and rainfall_24h == 0:
        missing.append("Current rainfall measurements")

    if forecast == 0:
        missing.append("Forecast rainfall")

    if river == 0:
        missing.append("River level")

    if drainage == 0:
        missing.append("Drainage capacity")

    return {
        "tool": "risk_context_analysis",
        "observed_factors": factors,
        "missing_data": missing,
    }


def hazard_assessment(payload: dict[str, Any]) -> dict[str, Any]:
    hazards = []

    disaster_type = (
        payload.get("disaster_type") or ""
    ).strip()

    rainfall_24h = float(
        payload.get("rainfall_24h", 0) or 0
    )

    forecast = float(
        payload.get("forecast_rainfall", 0) or 0
    )

    river = float(
        payload.get("river_level", 0) or 0
    )

    historical_count = int(
        payload.get("historical_flood_count", 0) or 0
    )

    flood_alert = float(
        payload.get("additional_context", {})
        .get("sri_lanka_flood_alert_score", 0) or 0
    )

    landslide_alert = float(
        payload.get("additional_context", {})
        .get("sri_lanka_landslide_alert_score", 0) or 0
    )

    if disaster_type:
        hazards.append(disaster_type)

    if rainfall_24h >= 100 or forecast >= 100:
        hazards.append("Flood")

    if river > 0:
        hazards.append("River-related flooding")

    if historical_count > 0:
        hazards.append("Recurring flood vulnerability")

    if flood_alert > 0:
        hazards.append("Official flood alert")

    if landslide_alert > 0:
        hazards.append("Landslide risk")

    return {
        "tool": "hazard_assessment",
        "hazards": list(dict.fromkeys(hazards)),
        "flood_alert_score": flood_alert,
        "landslide_alert_score": landslide_alert,
    }


def risk_validation(
    assessment: dict[str, Any]
) -> dict[str, Any]:
    score = float(
        assessment.get("risk_score", 0) or 0
    )

    confidence = float(
        assessment.get("confidence", 0) or 0
    )

    score_valid = 0 <= score <= 100
    confidence_valid = 0 <= confidence <= 1

    if score >= 75:
        expected_level = "Critical"
    elif score >= 50:
        expected_level = "High"
    elif score >= 25:
        expected_level = "Medium"
    else:
        expected_level = "Low"

    supplied_level = (
        assessment.get("risk_level") or ""
    )

    level_valid = (
        supplied_level.lower()
        == expected_level.lower()
    )

    return {
        "tool": "risk_validation",
        "score_valid": score_valid,
        "confidence_valid": confidence_valid,
        "risk_level_valid": level_valid,
        "expected_risk_level": expected_level,
        "evidence_grounded": True,
    }


TOOL_REGISTRY = {
    "risk_context_analysis": risk_context_analysis,
    "hazard_assessment": hazard_assessment,
    "risk_validation": risk_validation,
}

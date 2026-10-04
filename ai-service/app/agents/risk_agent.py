import json
from typing import Any

from app.services.gemini import generate_text_with_usage, GeminiQuotaError
from app.tools.risk_tools import TOOL_REGISTRY


MAX_STEPS = 3


SYSTEM_INSTRUCTIONS = """
You are the ReliefNexus Risk Assessment Agent.

You operate as a bounded agent.

You MUST follow:

OBSERVE -> DECIDE -> ACT -> OBSERVE -> VALIDATE

Rules:
1. Use only supplied data and tool observations.
2. Never invent external weather, disaster, population, river,
   historical or infrastructure data.
3. Never execute real-world actions.
4. Available tools are allow-listed.
5. Maximum workflow steps: 3.
6. Risk score must be 0-100.
7. Confidence must be 0-1.
8. Risk levels:
   0-24 = Low
   25-49 = Medium
   50-74 = High
   75-100 = Critical.
9. Return JSON only when asked.
"""


async def choose_tool(
    payload: dict[str, Any],
    observations: list[dict[str, Any]],
    completed_tools: list[str],
) -> dict[str, Any]:

    prompt = f"""
{SYSTEM_INSTRUCTIONS}

AVAILABLE TOOLS:
{list(TOOL_REGISTRY.keys())}

ALREADY COMPLETED:
{completed_tools}

INPUT:
{json.dumps(payload, indent=2, default=str)}

OBSERVATIONS:
{json.dumps(observations, indent=2, default=str)}

Choose the NEXT tool that is useful.

Return ONLY:

{{
  "action": "tool",
  "tool": "risk_context_analysis"
}}

If enough evidence has been collected, return:

{{
  "action": "finish",
  "tool": null
}}
"""

    try:
        usage_result = await generate_text_with_usage(prompt)
        raw = usage_result["text"]
    except GeminiQuotaError:
        return {
            "action": "finish",
            "tool": None,
            "reason": "Gemini API quota exhausted",
        }

    cleaned = raw.strip()

    if cleaned.startswith("```"):
        cleaned = (
            cleaned
            .replace("```json", "", 1)
            .replace("```", "", 1)
            .strip()
        )

    try:
        decision = json.loads(cleaned)

        decision["_usage"] = {
            "inputTokens": usage_result["inputTokens"],
            "outputTokens": usage_result["outputTokens"],
            "totalTokens": usage_result["totalTokens"],
            "model": usage_result["model"],
        }

        return decision
    except json.JSONDecodeError:
        return {
            "action": "tool",
            "tool": "risk_context_analysis",
        }


async def generate_assessment(
    payload: dict[str, Any],
    observations: list[dict[str, Any]],
) -> dict[str, Any]:

    prompt = f"""
{SYSTEM_INSTRUCTIONS}

You are now at the FINAL ASSESSMENT stage.

INPUT DATA:
{json.dumps(payload, indent=2, default=str)}

TOOL OBSERVATIONS:
{json.dumps(observations, indent=2, default=str)}

Analyse the evidence and return ONLY valid JSON:

{{
  "agent": "ReliefNexusRiskAgent",
  "status": "completed",
  "risk_score": 0,
  "risk_level": "Low",
  "confidence": 0.0,
  "primary_hazard": "",
  "hazards": [],
  "risk_factors": [],
  "missing_data": [],
  "reasoning": "",
  "recommended_next_step": "",
  "validation": {{
    "score_valid": true,
    "confidence_valid": true,
    "evidence_grounded": true
  }}
}}

Do not invent facts.
Do not claim to have accessed data that was not supplied.
"""

    try:
        usage_result = await generate_text_with_usage(prompt)
        raw = usage_result["text"]
    except GeminiQuotaError:
        return {
            "agent": "ReliefNexusRiskAgent",
            "status": "unavailable",
            "error": "Gemini API quota exhausted",
            "risk_score": 0,
            "risk_level": "Low",
            "confidence": 0,
            "hazards": [],
            "risk_factors": [],
            "missing_data": [],
            "reasoning": "Risk assessment could not be completed because the Gemini API quota is exhausted.",
            "recommended_next_step": "Retry when the Gemini API quota is available.",
            "validation": {
                "score_valid": True,
                "confidence_valid": True,
                "evidence_grounded": True,
            },
        }

    cleaned = raw.strip()

    if cleaned.startswith("```"):
        cleaned = (
            cleaned
            .replace("```json", "", 1)
            .replace("```", "", 1)
            .strip()
        )

    try:
        result = json.loads(cleaned)

        result["_usage"] = {
            "inputTokens": usage_result["inputTokens"],
            "outputTokens": usage_result["outputTokens"],
            "totalTokens": usage_result["totalTokens"],
            "model": usage_result["model"],
        }
    except json.JSONDecodeError:
        return {
            "agent": "ReliefNexusRiskAgent",
            "status": "failed",
            "error": "LLM returned invalid JSON",
            "raw_response": raw[:4000],
        }

    score = float(
        result.get("risk_score", 0) or 0
    )

    confidence = float(
        result.get("confidence", 0) or 0
    )

    result["risk_score"] = max(
        0,
        min(100, score)
    )

    result["confidence"] = max(
        0,
        min(1, confidence)
    )

    if result["risk_score"] >= 75:
        result["risk_level"] = "Critical"
    elif result["risk_score"] >= 50:
        result["risk_level"] = "High"
    elif result["risk_score"] >= 25:
        result["risk_level"] = "Medium"
    else:
        result["risk_level"] = "Low"

    result.setdefault(
        "agent",
        "ReliefNexusRiskAgent"
    )

    result.setdefault(
        "status",
        "completed"
    )

    result.setdefault(
        "hazards",
        []
    )

    result.setdefault(
        "risk_factors",
        []
    )

    result.setdefault(
        "missing_data",
        []
    )

    result.setdefault(
        "reasoning",
        ""
    )

    result.setdefault(
        "recommended_next_step",
        ""
    )

    return result


async def run_risk_agent(
    payload: dict[str, Any]
) -> dict[str, Any]:
    observations: list[dict[str, Any]] = []
    completed_tools: list[str] = []

    total_input_tokens = 0
    total_output_tokens = 0
    total_tokens = 0
    model_name = ""

    # ==============================
    # AGENT LOOP
    # ==============================

    for _ in range(MAX_STEPS):

        decision = await choose_tool(
            payload,
            observations,
            completed_tools,
        )

        usage = decision.pop("_usage", {})

        total_input_tokens += int(
            usage.get("inputTokens", 0) or 0
        )

        total_output_tokens += int(
            usage.get("outputTokens", 0) or 0
        )

        total_tokens += int(
            usage.get("totalTokens", 0) or 0
        )

        if usage.get("model"):
            model_name = str(usage["model"])

        action = decision.get("action")
        tool_name = decision.get("tool")

        if action == "finish":
            break

        if tool_name not in TOOL_REGISTRY:
            break

        if tool_name in completed_tools:
            break

        tool = TOOL_REGISTRY[tool_name]

        # ACT
        if tool_name == "risk_context_analysis":
            observation = tool(payload)

        elif tool_name == "hazard_assessment":
            observation = tool(payload)

        else:
            # Validation is executed after assessment,
            # therefore stop tool-selection here.
            break

        # OBSERVE
        observations.append(observation)
        completed_tools.append(tool_name)

    # ==============================
    # FINAL REASONING
    # ==============================

    result = await generate_assessment(
        payload,
        observations,
    )

    usage = result.pop("_usage", {})

    total_input_tokens += int(
        usage.get("inputTokens", 0) or 0
    )

    total_output_tokens += int(
        usage.get("outputTokens", 0) or 0
    )

    total_tokens += int(
        usage.get("totalTokens", 0) or 0
    )

    if usage.get("model"):
        model_name = str(usage["model"])

    # ==============================
    # VALIDATION
    # ==============================

    validation = TOOL_REGISTRY[
        "risk_validation"
    ](result)

    result["validation"] = {
        "score_valid":
            validation["score_valid"],
        "confidence_valid":
            validation["confidence_valid"],
        "evidence_grounded":
            validation["evidence_grounded"],
    }

    result["agent_trace"] = {
        "steps": len(completed_tools),
        "completed_tools": completed_tools,
        "observations": observations,
    }

    result["usage"] = {
        "inputTokens": total_input_tokens,
        "outputTokens": total_output_tokens,
        "totalTokens": total_tokens,
        "model": model_name,
    }

    return result












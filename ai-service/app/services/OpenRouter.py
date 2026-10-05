import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
model_name = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-20b")

if not api_key:
    raise RuntimeError("OPENROUTER_API_KEY is not configured.")


class GeminiQuotaError(Exception):
    """Raised when the AI provider quota/rate limit is exhausted."""
    pass


async def generate_text_with_usage(prompt: str) -> dict[str, Any]:
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "ReliefNexus AI Service",
    }

    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
            )
        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"OpenRouter request failed: {exc}"
            ) from exc

    if response.status_code == 429:
        raise GeminiQuotaError(
            "OpenRouter API rate limit or quota exhausted."
        )

    if response.status_code >= 400:
        raise RuntimeError(
            f"OpenRouter API error {response.status_code}: "
            f"{response.text}"
        )

    data = response.json()

    choices = data.get("choices", [])
    text = ""

    if choices:
        message = choices[0].get("message", {})
        text = message.get("content", "") or ""

    usage = data.get("usage", {})

    input_tokens = int(
        usage.get("prompt_tokens", 0) or 0
    )

    output_tokens = int(
        usage.get("completion_tokens", 0) or 0
    )

    total_tokens = int(
        usage.get("total_tokens", 0) or 0
    )

    return {
        "text": text,
        "model": model_name,
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": total_tokens,
    }


async def generate_text(prompt: str) -> str:
    result = await generate_text_with_usage(prompt)
    return result["text"]
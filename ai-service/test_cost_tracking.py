import os
import asyncio
import unittest
from unittest.mock import AsyncMock, patch

# Dummy key only; no real API request will be sent.
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")

from app.services import OpenRouter


class MockResponse:
    status_code = 200
    text = ""

    def json(self):
        return {
            "choices": [
                {"message": {"content": "Mock AI response"}}
            ],
            "usage": {
                "prompt_tokens": 100,
                "completion_tokens": 50,
                "total_tokens": 150,
                "cost": 0.0025
            }
        }


class CostTrackingTest(unittest.IsolatedAsyncioTestCase):
    async def test_cost_and_tokens_are_returned(self):
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = False
        mock_client.post.return_value = MockResponse()

        with patch.object(
            OpenRouter.httpx,
            "AsyncClient",
            return_value=mock_client
        ):
            result = await OpenRouter.generate_text_with_usage(
                "Test prompt"
            )

        self.assertEqual(result["text"], "Mock AI response")
        self.assertEqual(result["inputTokens"], 100)
        self.assertEqual(result["outputTokens"], 50)
        self.assertEqual(result["totalTokens"], 150)
        self.assertEqual(result["cost"], 0.0025)

        print("PASS: Mock cost and token values returned correctly.")
        print(result)

    async def test_missing_cost_returns_none(self):
        response = MockResponse()
        response.json = lambda: {
            "choices": [{"message": {"content": "Mock response"}}],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15
            }
        }

        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = False
        mock_client.post.return_value = response

        with patch.object(
            OpenRouter.httpx,
            "AsyncClient",
            return_value=mock_client
        ):
            result = await OpenRouter.generate_text_with_usage(
                "Test prompt"
            )

        self.assertAlmostEqual(result["cost"], 0.0000007)
        self.assertEqual(result["totalTokens"], 15)
        print("PASS: Missing provider cost uses fallback estimate.")


if __name__ == "__main__":
    unittest.main(verbosity=2)

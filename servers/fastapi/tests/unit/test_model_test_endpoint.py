import asyncio

import pytest
from fastapi import HTTPException

from api.v1.ppt.endpoints import model_test


def test_model_test_disables_thinking_for_custom_openai_compatible_provider():
    assert model_test._openai_compatible_extra_body("custom") == {
        "enable_thinking": False
    }


def test_model_test_disables_thinking_for_deepseek_provider():
    assert model_test._openai_compatible_extra_body("deepseek") == {
        "thinking": {"type": "disabled"}
    }


def test_model_test_does_not_send_thinking_flags_to_standard_openai():
    assert model_test._openai_compatible_extra_body("openai") is None


def test_model_test_endpoint_returns_provider_response(monkeypatch):
    async def fake_test_provider(request):
        assert request.provider == "openai"
        assert request.model == "gpt-4.1"
        assert request.prompt == "ping"
        return "pong"

    monkeypatch.setattr(model_test, "_test_provider", fake_test_provider)

    response = asyncio.run(
        model_test.test_model(
            model_test.ModelTestRequest(
                provider="openai",
                model="gpt-4.1",
                prompt="ping",
                api_key="test-key",
                base_url="https://api.openai.com/v1",
            )
        )
    )

    assert response.success is True
    assert response.provider == "openai"
    assert response.model == "gpt-4.1"
    assert response.content == "pong"
    assert response.latency_ms >= 0


def test_model_test_endpoint_rejects_unsupported_provider():
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            model_test._test_provider(
                model_test.ModelTestRequest(
                    provider="bedrock",
                    model="anthropic.claude",
                    prompt="ping",
                )
            )
        )

    assert exc_info.value.status_code == 400
    assert "not supported" in exc_info.value.detail

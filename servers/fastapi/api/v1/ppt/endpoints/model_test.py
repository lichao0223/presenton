import asyncio
import time

import aiohttp
from anthropic import APIError as AnthropicAPIError
from anthropic import AsyncAnthropic
from fastapi import APIRouter, HTTPException
from google import genai
from google.genai.errors import APIError as GoogleAPIError
from openai import APIError as OpenAIAPIError
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from utils.available_models import normalize_openai_compatible_base_url


MODEL_TEST_ROUTER = APIRouter(prefix="/model", tags=["Model Test"])

OPENAI_COMPATIBLE_PROVIDERS = {
    "openai",
    "deepseek",
    "openrouter",
    "fireworks",
    "together",
    "cerebras",
    "litellm",
    "lmstudio",
    "custom",
    "ollama",
}


def _openai_compatible_extra_body(provider: str) -> dict | None:
    normalized_provider = provider.strip().lower()
    if normalized_provider == "deepseek":
        return {"thinking": {"type": "disabled"}}
    if normalized_provider == "custom":
        return {"enable_thinking": False}
    return None


class ModelTestRequest(BaseModel):
    provider: str = Field(min_length=1)
    model: str = Field(min_length=1)
    prompt: str = Field(min_length=1, max_length=8000)
    api_key: str | None = None
    base_url: str | None = None
    ollama_url: str | None = None


class ModelTestResponse(BaseModel):
    success: bool
    provider: str
    model: str
    content: str
    latency_ms: int


def _provider_error_detail(error: Exception) -> str:
    body = getattr(error, "body", None)
    if isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict):
            message = err.get("message") or err.get("detail") or err.get("code")
            if message:
                return str(message)
        message = body.get("message") or body.get("detail")
        if message:
            return str(message)

    message = getattr(error, "message", None)
    if message:
        return str(message)

    return str(error)


async def _test_openai_compatible(request: ModelTestRequest) -> str:
    provider = request.provider.strip().lower()
    if provider == "ollama":
        root_url = (request.ollama_url or "http://localhost:11434").strip().rstrip("/")
        base_url = normalize_openai_compatible_base_url(root_url)
        api_key = "ollama"
    else:
        base_url = normalize_openai_compatible_base_url(request.base_url or "")
        api_key = (request.api_key or "").strip() or "EMPTY"

    if not base_url:
        raise HTTPException(status_code=400, detail="Base URL is required")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    extra_body = _openai_compatible_extra_body(provider)
    try:
        kwargs = {
            "model": request.model,
            "messages": [{"role": "user", "content": request.prompt}],
            "max_tokens": 1024,
            "temperature": 0,
        }
        if extra_body:
            kwargs["extra_body"] = extra_body
        response = await client.chat.completions.create(**kwargs)
    except OpenAIAPIError as e:
        raise HTTPException(
            status_code=getattr(e, "status_code", None) or 500,
            detail=_provider_error_detail(e),
        ) from e

    message = response.choices[0].message if response.choices else None
    content = getattr(message, "content", None)
    if isinstance(content, str) and content.strip():
        return content.strip()
    reasoning_content = getattr(message, "reasoning_content", None)
    if isinstance(reasoning_content, str) and reasoning_content.strip():
        raise HTTPException(
            status_code=500,
            detail=(
                "Model only returned reasoning content and no final text. "
                "Thinking was disabled for this test, but the provider still "
                "did not emit message.content."
            ),
        )
    raise HTTPException(status_code=500, detail="Model returned no text content")


async def _test_google(request: ModelTestRequest) -> str:
    api_key = (request.api_key or "").strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="Google API key is required")

    client = genai.Client(api_key=api_key)
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=request.model,
            contents=request.prompt,
        )
    except GoogleAPIError as e:
        raise HTTPException(
            status_code=getattr(e, "code", None) or getattr(e, "status_code", None) or 500,
            detail=_provider_error_detail(e),
        ) from e

    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    parts: list[str] = []
    for candidate in getattr(response, "candidates", None) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", None) or []:
            part_text = getattr(part, "text", None)
            if isinstance(part_text, str) and part_text:
                parts.append(part_text)
    joined = "".join(parts).strip()
    if joined:
        return joined

    raise HTTPException(status_code=500, detail="Model returned no text content")


async def _test_anthropic(request: ModelTestRequest) -> str:
    api_key = (request.api_key or "").strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="Anthropic API key is required")

    client = AsyncAnthropic(api_key=api_key)
    try:
        response = await client.messages.create(
            model=request.model,
            max_tokens=256,
            messages=[{"role": "user", "content": request.prompt}],
        )
    except AnthropicAPIError as e:
        raise HTTPException(
            status_code=getattr(e, "status_code", None) or 500,
            detail=_provider_error_detail(e),
        ) from e

    parts: list[str] = []
    for block in response.content:
        text = getattr(block, "text", None)
        if isinstance(text, str) and text:
            parts.append(text)

    joined = "".join(parts).strip()
    if joined:
        return joined

    raise HTTPException(status_code=500, detail="Model returned no text content")


async def _test_provider(request: ModelTestRequest) -> str:
    provider = request.provider.strip().lower()
    if provider in OPENAI_COMPATIBLE_PROVIDERS:
        return await _test_openai_compatible(request)
    if provider == "google":
        return await _test_google(request)
    if provider == "anthropic":
        return await _test_anthropic(request)

    raise HTTPException(
        status_code=400,
        detail=(
            "Model test is not supported for this provider yet. "
            "Use OpenAI-compatible, Google, Anthropic, or Ollama."
        ),
    )


@MODEL_TEST_ROUTER.post("/test", response_model=ModelTestResponse)
async def test_model(request: ModelTestRequest):
    started_at = time.perf_counter()
    try:
        content = await _test_provider(request)
    except HTTPException:
        raise
    except (OpenAIAPIError, GoogleAPIError, AnthropicAPIError) as e:
        raise HTTPException(status_code=500, detail=_provider_error_detail(e)) from e
    except aiohttp.ClientError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model test failed: {e}") from e

    return ModelTestResponse(
        success=True,
        provider=request.provider,
        model=request.model,
        content=content,
        latency_ms=round((time.perf_counter() - started_at) * 1000),
    )

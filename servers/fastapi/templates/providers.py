import asyncio
import base64
import logging
import os
import time
from typing import Any, Awaitable, Callable, Optional

from fastapi import HTTPException
from llmai import get_client
from llmai.shared import ImageContentPart, SystemMessage, TextResponse, UserMessage
from openai import AsyncOpenAI

from enums.llm_provider import LLMProvider
from utils.available_models import normalize_openai_compatible_base_url
from utils.get_env import get_custom_llm_api_key_env, get_custom_llm_url_env
from utils.llm_config import get_extra_body, get_llm_config
from utils.llm_provider import get_llm_provider, get_model
from utils.llm_utils import extract_text, get_generate_kwargs
from utils.template_vision_errors import (
    VISION_LAYOUT_USER_MESSAGE,
    is_likely_vision_capability_error,
)

MAX_ATTEMPTS_PER_PROVIDER = 4
DEFAULT_TEMPLATE_PROVIDER_TIMEOUT_SECONDS = 600
logger = logging.getLogger("uvicorn.error")


def _template_provider_timeout_seconds() -> float:
    raw_value = os.getenv("TEMPLATE_PROVIDER_CALL_TIMEOUT_SECONDS")
    if not raw_value:
        return float(DEFAULT_TEMPLATE_PROVIDER_TIMEOUT_SECONDS)
    try:
        timeout = float(raw_value)
    except ValueError:
        logger.warning(
            "Invalid TEMPLATE_PROVIDER_CALL_TIMEOUT_SECONDS=%r; using %ss",
            raw_value,
            DEFAULT_TEMPLATE_PROVIDER_TIMEOUT_SECONDS,
        )
        return float(DEFAULT_TEMPLATE_PROVIDER_TIMEOUT_SECONDS)
    return max(1.0, timeout)


def _exception_message(exc: Exception) -> str:
    if isinstance(exc, HTTPException):
        detail = exc.detail
        if isinstance(detail, str):
            message = detail
        else:
            message = str(detail)
    else:
        message = str(exc) or exc.__class__.__name__
    return " ".join(message.split())[:500]


def _resolve_template_provider_and_model() -> tuple[LLMProvider, str]:
    """Uses the configured text LLM; slide layout generation requires vision (image parts)."""
    return get_llm_provider(), get_model()


def _provider_label(provider: LLMProvider) -> str:
    if provider == LLMProvider.OPENAI:
        return "OpenAI"
    if provider == LLMProvider.CODEX:
        return "Codex"
    if provider == LLMProvider.GOOGLE:
        return "Google"
    if provider == LLMProvider.VERTEX:
        return "Vertex AI"
    if provider == LLMProvider.ANTHROPIC:
        return "Anthropic"
    if provider == LLMProvider.AZURE:
        return "Azure OpenAI"
    if provider == LLMProvider.BEDROCK:
        return "Amazon Bedrock"
    if provider == LLMProvider.OLLAMA:
        return "Ollama"
    if provider == LLMProvider.OPENROUTER:
        return "OpenRouter"
    if provider == LLMProvider.FIREWORKS:
        return "Fireworks"
    if provider == LLMProvider.TOGETHER:
        return "Together AI"
    if provider == LLMProvider.CEREBRAS:
        return "Cerebras"
    if provider == LLMProvider.CUSTOM:
        return "Custom"
    if provider == LLMProvider.LITELLM:
        return "LiteLLM"
    if provider == LLMProvider.LMSTUDIO:
        return "LM Studio"
    return "Template provider"


def _template_user_content(
    *,
    user_text: str,
    image_bytes: Optional[bytes],
    media_type: str,
) -> str | list[object]:
    if not image_bytes:
        return user_text
    return [
        ImageContentPart(data=image_bytes, mime_type=media_type),
        user_text,
    ]


async def _call_template_provider_with_llmai(
    *,
    model: str,
    system_prompt: str,
    user_text: str,
    image_bytes: Optional[bytes] = None,
    media_type: str = "image/png",
) -> str:
    client = get_client(config=get_llm_config())
    response = await asyncio.to_thread(
        client.generate,
        **get_generate_kwargs(
            model=model,
            messages=[
                SystemMessage(content=system_prompt),
                UserMessage(
                    content=_template_user_content(
                        user_text=user_text,
                        image_bytes=image_bytes,
                        media_type=media_type,
                    )
                ),
            ],
            response_format=TextResponse(),
            max_tokens=8192,
        ),
    )
    output_text = extract_text(response.content) or ""
    if not output_text:
        raise HTTPException(status_code=500, detail="No output from template provider")
    return output_text


def _extract_openai_compatible_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content")
                if isinstance(text, str):
                    parts.append(text)
            else:
                text = getattr(item, "text", None) or getattr(item, "content", None)
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(part.strip() for part in parts if part.strip()).strip()
    return ""


def _extract_openai_compatible_stream_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content")
                if isinstance(text, str):
                    parts.append(text)
            else:
                text = getattr(item, "text", None) or getattr(item, "content", None)
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return ""


async def _collect_openai_compatible_stream_text(
    stream: Any,
    *,
    provider_label: str,
) -> str:
    parts: list[str] = []
    first_chunk_at: Optional[float] = None
    started_at = time.perf_counter()

    async for chunk in stream:
        choices = getattr(chunk, "choices", None) or []
        if not choices:
            continue

        delta = getattr(choices[0], "delta", None)
        content = getattr(delta, "content", None)
        text = _extract_openai_compatible_stream_text(content)
        if not text:
            continue

        if first_chunk_at is None:
            first_chunk_at = time.perf_counter()
            logger.info(
                "Custom template provider stream first content chunk provider=%s elapsed=%.2fs",
                provider_label,
                first_chunk_at - started_at,
            )
        parts.append(text)

    output_text = "".join(parts).strip()
    logger.info(
        "Custom template provider stream completed provider=%s chunks=%s response_chars=%s elapsed=%.2fs",
        provider_label,
        len(parts),
        len(output_text),
        time.perf_counter() - started_at,
    )
    return output_text


async def _call_template_provider_with_custom_openai_compatible(
    *,
    model: str,
    system_prompt: str,
    user_text: str,
    image_bytes: Optional[bytes] = None,
    media_type: str = "image/png",
) -> str:
    base_url = normalize_openai_compatible_base_url(get_custom_llm_url_env() or "")
    if not base_url:
        raise HTTPException(status_code=400, detail="Custom LLM URL is not set")

    user_content: str | list[dict[str, Any]] = user_text
    if image_bytes:
        encoded_image = base64.b64encode(image_bytes).decode("ascii")
        user_content = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{media_type};base64,{encoded_image}",
                },
            },
            {"type": "text", "text": user_text},
        ]

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]
    kwargs: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "max_tokens": 8192,
        "temperature": 0,
    }
    extra_body = get_extra_body()
    if extra_body:
        kwargs["extra_body"] = extra_body

    client = AsyncOpenAI(
        api_key=(get_custom_llm_api_key_env() or "").strip() or "EMPTY",
        base_url=base_url,
    )

    provider_label = f"Custom/{model}"
    try:
        stream = await client.chat.completions.create(**kwargs, stream=True)
        output_text = await _collect_openai_compatible_stream_text(
            stream,
            provider_label=provider_label,
        )
    except Exception as exc:
        if not image_bytes or not is_likely_vision_capability_error(exc):
            raise
        logger.warning(
            "Custom template provider rejected image input; retrying with text-only fallback: %s",
            _exception_message(exc),
        )
        text_only_user_text = (
            f"{user_text}\n\n"
            "#SCREENSHOT UNAVAILABLE\n"
            "The configured custom model rejected image inputs. Reconstruct the "
            "layout from the SLIDE HTML REFERENCE only. Return complete TSX layout "
            "code only, with no markdown fences and no explanation."
        )
        text_only_kwargs = dict(kwargs)
        text_only_kwargs["messages"] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text_only_user_text},
        ]
        stream = await client.chat.completions.create(**text_only_kwargs, stream=True)
        output_text = await _collect_openai_compatible_stream_text(
            stream,
            provider_label=provider_label,
        )

    if not output_text:
        raise HTTPException(
            status_code=500,
            detail="No output from custom template provider",
        )
    return output_text


async def _run_template_llm_with_retries(
    *,
    provider_label: str,
    call: Callable[[], Awaitable[str]],
    requires_vision: bool = False,
) -> str:
    last_exception: Optional[Exception] = None
    timeout_seconds = _template_provider_timeout_seconds()

    for attempt in range(1, MAX_ATTEMPTS_PER_PROVIDER + 1):
        started_at = time.perf_counter()
        logger.info(
            "Template provider call started provider=%s attempt=%s/%s timeout=%ss requires_vision=%s",
            provider_label,
            attempt,
            MAX_ATTEMPTS_PER_PROVIDER,
            f"{timeout_seconds:g}",
            requires_vision,
        )
        try:
            response_text = await asyncio.wait_for(call(), timeout=timeout_seconds)
            if response_text:
                logger.info(
                    "Template provider call succeeded provider=%s attempt=%s/%s response_chars=%s elapsed=%.2fs",
                    provider_label,
                    attempt,
                    MAX_ATTEMPTS_PER_PROVIDER,
                    len(response_text),
                    time.perf_counter() - started_at,
                )
                return response_text
            raise ValueError("No output from template generation provider")
        except asyncio.TimeoutError as exc:
            logger.warning(
                "Template provider call timed out provider=%s attempt=%s/%s timeout=%ss elapsed=%.2fs",
                provider_label,
                attempt,
                MAX_ATTEMPTS_PER_PROVIDER,
                f"{timeout_seconds:g}",
                time.perf_counter() - started_at,
            )
            last_exception = HTTPException(
                status_code=504,
                detail=(
                    f"{provider_label} timed out after "
                    f"{timeout_seconds:g} seconds"
                ),
            )
        except HTTPException as exc:
            logger.warning(
                "Template provider call failed provider=%s attempt=%s/%s status=%s error=%s elapsed=%.2fs",
                provider_label,
                attempt,
                MAX_ATTEMPTS_PER_PROVIDER,
                exc.status_code,
                _exception_message(exc),
                time.perf_counter() - started_at,
            )
            if requires_vision and is_likely_vision_capability_error(exc):
                raise HTTPException(
                    status_code=400, detail=VISION_LAYOUT_USER_MESSAGE
                ) from exc
            if 400 <= exc.status_code < 500:
                raise exc
            last_exception = exc
        except Exception as exc:
            logger.warning(
                "Template provider call failed provider=%s attempt=%s/%s error=%s elapsed=%.2fs",
                provider_label,
                attempt,
                MAX_ATTEMPTS_PER_PROVIDER,
                _exception_message(exc),
                time.perf_counter() - started_at,
            )
            if requires_vision and is_likely_vision_capability_error(exc):
                raise HTTPException(
                    status_code=400, detail=VISION_LAYOUT_USER_MESSAGE
                ) from exc
            last_exception = exc

    if isinstance(last_exception, HTTPException):
        raise last_exception
    if last_exception:
        raise HTTPException(
            status_code=502,
            detail=f"{provider_label} error: {_exception_message(last_exception)}",
        )
    raise HTTPException(status_code=500, detail="Failed to generate template output")


def _template_provider_label_and_call(
    *,
    system_prompt: str,
    user_text: str,
    image_bytes: Optional[bytes] = None,
    media_type: str = "image/png",
) -> tuple[str, Callable[[], Awaitable[str]]]:
    provider, model = _resolve_template_provider_and_model()
    label = f"{_provider_label(provider)}/{model}"
    if provider == LLMProvider.CUSTOM:
        return (
            label,
            lambda: _call_template_provider_with_custom_openai_compatible(
                model=model,
                system_prompt=system_prompt,
                user_text=user_text,
                image_bytes=image_bytes,
                media_type=media_type,
            ),
        )
    return (
        label,
        lambda: _call_template_provider_with_llmai(
            model=model,
            system_prompt=system_prompt,
            user_text=user_text,
            image_bytes=image_bytes,
            media_type=media_type,
        ),
    )


async def generate_slide_layout_code(
    *,
    system_prompt: str,
    user_text: str,
    image_bytes: bytes,
    media_type: str = "image/png",
) -> str:
    label, call = _template_provider_label_and_call(
        system_prompt=system_prompt,
        user_text=user_text,
        image_bytes=image_bytes,
        media_type=media_type,
    )
    return await _run_template_llm_with_retries(
        provider_label=label, call=call, requires_vision=True
    )


async def edit_slide_layout_code(
    *,
    system_prompt: str,
    user_text: str,
) -> str:
    label, call = _template_provider_label_and_call(
        system_prompt=system_prompt,
        user_text=user_text,
    )
    return await _run_template_llm_with_retries(provider_label=label, call=call)

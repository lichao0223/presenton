import json
import re
from typing import Any

import dirtyjson
from llmai.shared import Message, SystemMessage
from openai import AsyncOpenAI

from utils.available_models import normalize_openai_compatible_base_url
from utils.get_env import get_custom_llm_api_key_env, get_custom_llm_url_env
from utils.llm_config import get_extra_body
from utils.llm_utils import message_content_to_text


def extract_json_text(text: str) -> str:
    cleaned = text.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()
    first = cleaned.find("{")
    last = cleaned.rfind("}")
    if first != -1 and last != -1 and last > first:
        return cleaned[first : last + 1].strip()
    return cleaned


def messages_to_openai(messages: list[Message]) -> list[dict[str, str]]:
    converted: list[dict[str, str]] = []
    for message in messages:
        role = "system" if isinstance(message, SystemMessage) else "user"
        content = message_content_to_text(message.content) or ""
        if content:
            converted.append({"role": role, "content": content})
    return converted


async def generate_custom_json_from_messages(
    *,
    model: str,
    messages: list[Message],
    instruction: str,
    max_tokens: int = 8192,
) -> Any:
    base_url = normalize_openai_compatible_base_url(get_custom_llm_url_env() or "")
    if not base_url:
        raise ValueError("Custom LLM URL is not set")

    openai_messages = messages_to_openai(messages)
    openai_messages.append({"role": "user", "content": instruction})

    kwargs: dict[str, Any] = {
        "model": model,
        "messages": openai_messages,
        "max_tokens": max_tokens,
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    extra_body = get_extra_body()
    if extra_body:
        kwargs["extra_body"] = extra_body

    client = AsyncOpenAI(
        api_key=(get_custom_llm_api_key_env() or "").strip() or "EMPTY",
        base_url=base_url,
    )
    try:
        response = await client.chat.completions.create(**kwargs)
    except Exception as exc:
        message = str(exc).lower()
        if "response_format" not in message and "json_object" not in message:
            raise
        fallback_kwargs = dict(kwargs)
        fallback_kwargs.pop("response_format", None)
        response = await client.chat.completions.create(**fallback_kwargs)
    message = response.choices[0].message if response.choices else None
    content = getattr(message, "content", None)
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Custom LLM returned no text content")

    return dirtyjson.loads(extract_json_text(content))

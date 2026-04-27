import asyncio
import json
from collections.abc import AsyncGenerator, Sequence
from typing import Any, Optional

import dirtyjson
from llmai.shared import (
    LLMTool,
    Message,
    ResponseFormat,
    normalize_content_parts,
)
from llmai.shared.tools import Tool  # type: ignore[import-not-found]
from pydantic import BaseModel

from enums.llm_provider import LLMProvider
from utils.llm_config import get_extra_body
from utils.llm_provider import get_llm_provider
from utils.schema_utils import flatten_json_schema


def _tools_for_google_gemini(tools: list[LLMTool]) -> list[LLMTool]:
    """Gemini's Python SDK rejects ``$ref`` / ``$defs`` in function parameters; inline them."""
    converted: list[LLMTool] = []
    for tool in tools:
        if not isinstance(tool, Tool):
            converted.append(tool)
            continue
        schema_obj = tool.input_schema
        if isinstance(schema_obj, dict):
            raw = dict(schema_obj)
        elif isinstance(schema_obj, type) and issubclass(schema_obj, BaseModel):
            raw = schema_obj.model_json_schema()
        elif isinstance(schema_obj, BaseModel):
            raw = schema_obj.__class__.model_json_schema()
        else:
            converted.append(tool)
            continue
        flat = flatten_json_schema(raw)
        converted.append(
            Tool(
                name=tool.name,
                description=tool.description,
                schema=flat,
                strict=tool.strict,
            )
        )
    return converted


def get_generate_kwargs(
    model: str,
    messages: Sequence[Message],
    max_tokens: Optional[int] = None,
    tools: Optional[list[LLMTool]] = None,
    response_format: Optional[ResponseFormat] = None,
    stream: bool = False,
) -> dict[str, Any]:
    kwargs: dict[str, Any] = {
        "model": model,
        "messages": list(messages),
        "stream": stream,
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    if tools:
        if get_llm_provider() == LLMProvider.GOOGLE:
            kwargs["tools"] = _tools_for_google_gemini(tools)
        else:
            kwargs["tools"] = tools
    if response_format is not None:
        kwargs["response_format"] = response_format

    extra_body = get_extra_body()
    if extra_body:
        kwargs["extra_body"] = extra_body

    return kwargs


def extract_text(content: Any) -> Optional[str]:
    if content is None:
        return None
    if isinstance(content, str):
        return content
    if isinstance(content, Sequence) and not isinstance(content, (bytes, bytearray)):
        parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
                continue
            text = getattr(part, "text", None)
            if isinstance(text, str):
                parts.append(text)
        joined = "".join(parts)
        return joined or None
    text = getattr(content, "text", None)
    if isinstance(text, str):
        return text
    return None


def extract_structured_content(content: Any) -> Optional[dict]:
    if content is None:
        return None
    if isinstance(content, dict):
        return content
    if hasattr(content, "model_dump"):
        dumped = content.model_dump(mode="json")
        if isinstance(dumped, dict):
            return dumped

    raw_text = extract_text(content)
    if not raw_text:
        return None

    try:
        parsed = dirtyjson.loads(raw_text)
    except Exception:
        return None

    if isinstance(parsed, dict):
        return dict(parsed)
    return None


def serialize_structured_content(content: Any) -> Optional[str]:
    parsed = extract_structured_content(content)
    if parsed is not None:
        return json.dumps(parsed, ensure_ascii=False)

    raw_text = extract_text(content)
    if raw_text:
        return raw_text
    return None


def message_content_to_text(content: Sequence[Any] | str | None) -> Optional[str]:
    joined = "".join(
        part.text
        for part in normalize_content_parts(content)
        if isinstance(getattr(part, "text", None), str)
    )
    return joined or None


async def stream_generate_events(client: Any, **kwargs) -> AsyncGenerator[Any, None]:
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[Any] = asyncio.Queue()
    sentinel = object()

    def worker():
        try:
            for event in client.generate(**kwargs):
                loop.call_soon_threadsafe(queue.put_nowait, event)
        except Exception as exc:
            loop.call_soon_threadsafe(queue.put_nowait, exc)
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, sentinel)

    worker_task = asyncio.create_task(asyncio.to_thread(worker))
    try:
        while True:
            item = await queue.get()
            if item is sentinel:
                break
            if isinstance(item, Exception):
                raise item
            yield item
    finally:
        await worker_task

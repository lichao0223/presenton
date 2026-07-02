import json
import logging
import time
from datetime import datetime
from typing import Optional

from llmai import get_client
from llmai.shared import JSONSchemaResponse, Message, SystemMessage, UserMessage

from enums.llm_provider import LLMProvider
from models.presentation_layout import SlideLayoutModel
from models.presentation_outline_model import SlideOutlineModel
from utils.custom_llm_json_fallback import generate_custom_json_from_messages
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_config import get_llm_config
from utils.llm_provider import get_llm_provider, get_model
from utils.llm_utils import generate_structured_with_schema_retries
from utils.schema_utils import (
    add_field_in_schema,
    ensure_array_schemas_have_items,
    generate_constraint_sentences,
    get_schema_validation_errors,
    remove_fields_from_schema,
)

LOGGER = logging.getLogger(__name__)


def _log_preview(value, limit: int = 1200) -> str:
    if isinstance(value, str):
        text = value
    else:
        try:
            text = json.dumps(value, ensure_ascii=False)
        except Exception:
            text = str(value)
    text = " ".join(text.split())
    return text if len(text) <= limit else f"{text[:limit]}..."


SLIDE_CONTENT_SYSTEM_PROMPT = """
You will be given slide content and response schema.
You need to generate structured content json based on the schema.

# Steps
1. Analyze the content.
2. Analyze the response schema.
3. Generate structured content json based on the schema.
4. Generate speaker note if required.
5. Provide structured content json as output.

# General Rules
- Follow language guidelines.
- Slide Language is authoritative when it is explicitly set. If slide content
  or user instructions request a different language, ignore that conflicting
  language request unless Slide Language says auto-detect.
- Speaker notes must be plain text (no markdown).
- Never exceed max character limits; do not clip mid-sentence to fit—rephrase instead.
- Do not use emojis or $schema fields.
- Follow user instructions literally when they do not conflict with Slide Language;
  do not reinterpret, generalize, or expand them.
- Apply slide-specific instructions only to the exact slide mentioned (first/second/last/named) and only once.
- Do not apply patterns across multiple slides unless explicitly requested.
- If instructions are ambiguous, use the most direct interpretation without extending scope.

# Hard Length Budget
- Treat every maxLength in the response schema as a hard limit, not a suggestion.
- Keep every visible title or heading as a short label, usually 2-5 words.
- Keep every visible description as one short sentence unless the schema clearly asks for a list.
- Do not write escaped newline sequences like \n or \\n in visible text fields; use normal spaces.
- Keep __speaker_note__ between 100 and 350 characters. Do not write a script or long narration.
- Keep __image_prompt__ in English, concrete, and under 6 words.
- Keep __icon_query__ in English and exactly 1-2 simple nouns, for example "clock" or "database".
- For Chinese slides, Chinese text is more compact; use concise Chinese wording for visible slide fields.
- If content does not fit, omit details instead of exceeding the schema.

{markdown_emphasis_rules}

{user_instructions}

{tone_instructions}

{verbosity_instructions}

{output_fields_instructions}
"""


SLIDE_CONTENT_USER_PROMPT = """
# Current Date and Time:
{current_date_time}

# Icon Query And Image Prompt Language:
English

# Slide Language:
{language}

# SLIDE CONTENT: START
{content}
# SLIDE CONTENT: END
"""

AUTO_DETECT_LANGUAGE_INSTRUCTION = (
    "auto-detect from the slide content and use the same language as the slide content"
)


def _resolve_prompt_language(language: Optional[str]) -> str:
    if language is None:
        return AUTO_DETECT_LANGUAGE_INSTRUCTION
    s = str(language).strip()
    if not s:
        return AUTO_DETECT_LANGUAGE_INSTRUCTION
    if s.lower() in {"auto", "auto-detect"}:
        return AUTO_DETECT_LANGUAGE_INSTRUCTION
    return s


def _get_schema_markdown(response_schema: Optional[dict]) -> str:
    if not response_schema:
        return "- Follow the provided response schema strictly."
    try:
        schema_text = json.dumps(response_schema, ensure_ascii=False)
    except Exception:
        return "- Follow the provided response schema strictly."
    return f"- Follow this response schema exactly: {schema_text}"


def _get_constraint_markdown(response_schema: Optional[dict]) -> str:
    if not response_schema:
        return ""
    try:
        constraints = generate_constraint_sentences(response_schema)
    except Exception:
        return ""
    if not constraints.strip():
        return ""
    return "\n# Schema Length Constraints:\n" + constraints


def get_system_prompt(
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
    response_schema: Optional[dict] = None,
):
    markdown_emphasis_rules = (
        "- Strictly use markdown to emphasize important points, by bolding or "
        "italicizing the part of text."
    )

    user_instructions = f"# User Instructions:\n{instructions}" if instructions else ""
    tone_instructions = (
        f"# Tone Instructions:\nMake slide as {tone} as possible." if tone else ""
    )

    verbosity_instructions = ""
    if verbosity:
        verbosity_instructions = "# Verbosity Instructions:\n"
        if verbosity == "concise":
            verbosity_instructions += "Make slide as concise as possible."
        elif verbosity == "standard":
            verbosity_instructions += "Make slide as standard as possible."
        elif verbosity == "text-heavy":
            verbosity_instructions += "Make slide as text-heavy as possible."

    output_fields_instructions = (
        "# Output Fields:\n"
        + _get_schema_markdown(response_schema)
        + _get_constraint_markdown(response_schema)
    )

    return SLIDE_CONTENT_SYSTEM_PROMPT.format(
        markdown_emphasis_rules=markdown_emphasis_rules,
        user_instructions=user_instructions,
        tone_instructions=tone_instructions,
        verbosity_instructions=verbosity_instructions,
        output_fields_instructions=output_fields_instructions,
    )


def get_user_prompt(outline: str, language: Optional[str]):
    return SLIDE_CONTENT_USER_PROMPT.format(
        current_date_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        language=_resolve_prompt_language(language),
        content=outline,
    )


def get_messages(
    outline: str,
    language: Optional[str],
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
    response_schema: Optional[dict] = None,
) -> list[Message]:

    return [
        SystemMessage(
            content=get_system_prompt(
                tone,
                verbosity,
                instructions,
                response_schema,
            ),
        ),
        UserMessage(
            content=get_user_prompt(outline, language),
        ),
    ]


async def _generate_custom_slide_content_fallback(
    *,
    model: str,
    messages: list[Message],
    response_schema: dict,
) -> dict:
    started_at = time.perf_counter()
    schema_text = json.dumps(response_schema, ensure_ascii=False)
    base_instruction = (
        "The previous structured-output attempt failed. Return JSON only. "
        "Do not wrap the JSON in markdown fences. Do not include explanation text. "
        "The JSON must exactly match this schema and respect every maxLength/minLength: "
        f"{schema_text}"
    )
    content = await generate_custom_json_from_messages(
        model=model,
        messages=messages,
        instruction=base_instruction,
    )
    LOGGER.warning(
        "Custom LLM slide fallback content received model=%s elapsed=%.2fs content=%r",
        model,
        time.perf_counter() - started_at,
        _log_preview(content),
    )
    if not isinstance(content, dict):
        raise ValueError("Custom LLM slide fallback did not return a JSON object")

    validation_errors = get_schema_validation_errors(
        response_schema,
        content,
        strict=False,
    )
    if not validation_errors:
        return content

    previous_content = content
    for repair_attempt in range(3):
        LOGGER.warning(
            "Custom LLM slide fallback validation failed, repair attempt %s/3: %s",
            repair_attempt + 1,
            " | ".join(validation_errors[:10]),
        )
        repair_instruction = (
            "The previous JSON did not match the schema. Return corrected JSON only. "
            "Validation errors:\n"
            + "\n".join(f"- {error}" for error in validation_errors[:10])
            + "\nPrevious JSON:\n"
            + json.dumps(previous_content, ensure_ascii=False)
            + "\nRespect all maxLength fields. Prefer deleting optional detail over "
            "exceeding limits. Keep __image_prompt__ under 6 English words and "
            "__icon_query__ as 1-2 English nouns."
        )
        repaired = await generate_custom_json_from_messages(
            model=model,
            messages=messages,
            instruction=repair_instruction,
        )
        LOGGER.warning(
            "Custom LLM slide repair content received model=%s repair_attempt=%s/3 elapsed=%.2fs content=%r",
            model,
            repair_attempt + 1,
            time.perf_counter() - started_at,
            _log_preview(repaired),
        )
        if not isinstance(repaired, dict):
            raise ValueError("Custom LLM slide repair did not return a JSON object")

        validation_errors = get_schema_validation_errors(
            response_schema,
            repaired,
            strict=False,
        )
        if not validation_errors:
            return repaired
        previous_content = repaired

    raise ValueError(
        "Custom LLM slide fallback returned invalid JSON: "
        + " | ".join(validation_errors[:10])
    )


async def get_slide_content_from_type_and_outline(
    slide_layout: SlideLayoutModel,
    outline: SlideOutlineModel,
    language: Optional[str],
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    client = get_client(config=get_llm_config())
    model = get_model()

    response_schema = remove_fields_from_schema(
        slide_layout.json_schema, ["__image_url__", "__icon_url__"]
    )
    response_schema = add_field_in_schema(
        response_schema,
        {
            "__speaker_note__": {
                "type": "string",
                "minLength": 100,
                "maxLength": 500,
                "description": "Speaker note for the slide",
            }
        },
        True,
    )
    response_schema = ensure_array_schemas_have_items(response_schema)
    messages = get_messages(
        outline.content,
        language,
        tone,
        verbosity,
        instructions,
        response_schema,
    )

    if get_llm_provider() == LLMProvider.CUSTOM:
        return await _generate_custom_slide_content_fallback(
            model=model,
            messages=messages,
            response_schema=response_schema,
        )

    try:
        response_format = JSONSchemaResponse(
            name="response",
            json_schema=response_schema,
            strict=False,
        )

        return await generate_structured_with_schema_retries(
            client,
            model,
            messages=messages,
            response_format=response_format,
            json_schema=response_schema,
            strict=False,
            validate_schema=True,
        )

    except Exception as e:
        if get_llm_provider() == LLMProvider.CUSTOM:
            try:
                return await _generate_custom_slide_content_fallback(
                    model=model,
                    messages=messages,
                    response_schema=response_schema,
                )
            except Exception:
                LOGGER.exception("Custom LLM slide-content fallback failed")
        raise handle_llm_client_exceptions(e)

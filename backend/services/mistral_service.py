"""Mistral AI service wrapper — agents, chat, and structured output."""

from __future__ import annotations

import json
from typing import Type, TypeVar

from mistralai import Mistral
from pydantic import BaseModel

from backend.config import get_settings

T = TypeVar("T", bound=BaseModel)


class MistralService:
    def __init__(self):
        self._settings = get_settings()
        self._client = Mistral(api_key=self._settings.mistral_api_key)

    async def chat(
        self,
        messages: list[dict],
        model: str | None = None,
        system_prompt: str | None = None,
    ) -> str:
        """Simple chat completion returning text content."""
        model = model or self._settings.mistral_medium_model
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(messages)

        response = await self._client.chat.complete_async(
            model=model,
            messages=msgs,
        )
        return response.choices[0].message.content

    async def parse(
        self,
        messages: list[dict],
        response_model: Type[T],
        model: str | None = None,
        system_prompt: str | None = None,
    ) -> T:
        """Structured output via Mistral — returns a parsed Pydantic model."""
        model = model or self._settings.mistral_large_model
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(messages)

        response = await self._client.chat.complete_async(
            model=model,
            messages=msgs,
            response_format={
                "type": "json_object",
            },
        )
        raw = response.choices[0].message.content
        return response_model.model_validate_json(raw)

    async def create_agent(
        self,
        name: str,
        instructions: str,
        model: str | None = None,
        description: str = "",
        handoff_ids: list[str] | None = None,
    ) -> str:
        """Create a Mistral agent and return its ID."""
        model = model or self._settings.mistral_medium_model
        agent = await self._client.beta.agents.create_async(
            model=model,
            name=name,
            instructions=instructions,
            description=description,
        )
        return agent.id

    async def agent_chat(
        self,
        agent_id: str,
        messages: list[dict],
    ) -> str:
        """Chat with a Mistral agent."""
        response = await self._client.beta.agents.complete_async(
            agent_id=agent_id,
            messages=messages,
        )
        return response.choices[0].message.content


_service: MistralService | None = None


def get_mistral_service() -> MistralService:
    global _service
    if _service is None:
        _service = MistralService()
    return _service

"""Code Developer Agent — generates and reviews code via Mistral."""

from __future__ import annotations

from backend.agents.base import BaseAgent
from backend.protocol.models import Deliverable, DeliverableType, Skill, SubTask
from backend.services.mistral_service import get_mistral_service


CODE_SYSTEM_PROMPT = """You are an expert software developer working on the AgentLance marketplace.
You write clean, well-documented, production-quality code.
When generating code, include comments explaining key decisions.
When reviewing code, provide specific, actionable feedback.
Format all code output in proper markdown code blocks with language identifiers."""


class CodeDeveloperAgent(BaseAgent):
    name = "Code Developer"
    skills = [Skill.CODE]

    async def execute(self, subtask: SubTask, context: dict | None = None) -> Deliverable:
        mistral = get_mistral_service()

        user_msg = f"Task: {subtask.title}\n\nDescription: {subtask.description}"
        if context:
            if "input_text" in context:
                user_msg += f"\n\nExisting code/context:\n{context['input_text']}"
            if "requirements" in context:
                user_msg += f"\n\nRequirements: {context['requirements']}"

        content = await mistral.chat(
            messages=[{"role": "user", "content": user_msg}],
            system_prompt=CODE_SYSTEM_PROMPT,
            model=(context.get("model_overrides", {}).get(Skill.CODE) if context else None)
                  or get_mistral_service()._settings.mistral_large_model,
        )

        return Deliverable(
            type=DeliverableType.CODE,
            content=content,
            metadata={"agent": self.name, "subtask_id": subtask.id},
        )

    async def can_handle(self, subtask: SubTask) -> bool:
        return subtask.required_skill == Skill.CODE

    async def estimate(self, subtask: SubTask) -> int:
        return 20  # seconds

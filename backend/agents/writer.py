"""Writer Agent — produces blog posts, copy, and scripts via Mistral."""

from __future__ import annotations

from backend.agents.base import BaseAgent
from backend.protocol.models import Deliverable, DeliverableType, Skill, SubTask
from backend.services.mistral_service import get_mistral_service


WRITER_SYSTEM_PROMPT = """You are a professional content writer working on the AgentLance marketplace.
You specialize in creating high-quality blog posts, marketing copy, product descriptions, and scripts.
Always deliver polished, engaging content. Format output in Markdown when appropriate.
If given context from other agents (e.g., code documentation to write about), incorporate it naturally."""


class WriterAgent(BaseAgent):
    name = "Writer"
    skills = [Skill.WRITING]

    async def execute(self, subtask: SubTask, context: dict | None = None) -> Deliverable:
        mistral = get_mistral_service()

        # Build the user message from subtask + any context
        user_msg = f"Task: {subtask.title}\n\nDescription: {subtask.description}"
        if context:
            if "input_text" in context:
                user_msg += f"\n\nReference material:\n{context['input_text']}"
            if "requirements" in context:
                user_msg += f"\n\nAdditional requirements: {context['requirements']}"

        content = await mistral.chat(
            messages=[{"role": "user", "content": user_msg}],
            system_prompt=WRITER_SYSTEM_PROMPT,
        )

        return Deliverable(
            type=DeliverableType.TEXT,
            content=content,
            metadata={"agent": self.name, "subtask_id": subtask.id},
        )

    async def can_handle(self, subtask: SubTask) -> bool:
        return subtask.required_skill == Skill.WRITING

    async def estimate(self, subtask: SubTask) -> int:
        return 15  # seconds

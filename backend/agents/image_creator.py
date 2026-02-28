"""Image Creator Agent — generates images via HuggingFace FLUX with Mistral prompt enhancement."""

from __future__ import annotations

from backend.agents.base import BaseAgent
from backend.protocol.models import Deliverable, DeliverableType, Skill, SubTask
from backend.services.mistral_service import get_mistral_service
from backend.services.huggingface_service import get_huggingface_service


PROMPT_ENHANCE_SYSTEM = """You are an expert at writing prompts for AI image generation models.
Take the user's description and transform it into a detailed, vivid image generation prompt.
Include style, lighting, composition, and mood details.
Output ONLY the enhanced prompt, nothing else. Keep it under 200 words."""


class ImageCreatorAgent(BaseAgent):
    name = "Image Creator"
    skills = [Skill.IMAGE]

    async def execute(self, subtask: SubTask, context: dict | None = None) -> Deliverable:
        mistral = get_mistral_service()
        hf = get_huggingface_service()

        description = subtask.description
        if context and "requirements" in context:
            description += f" {context['requirements']}"

        # Enhance the prompt with Mistral
        enhanced_prompt = await mistral.chat(
            messages=[{"role": "user", "content": description}],
            system_prompt=PROMPT_ENHANCE_SYSTEM,
        )

        # Generate image via HuggingFace
        filename, filepath = await hf.generate_image(prompt=enhanced_prompt)

        return Deliverable(
            type=DeliverableType.IMAGE,
            content=f"/static/deliverables/{filename}",
            filename=filename,
            mime_type="image/png",
            metadata={
                "agent": self.name,
                "subtask_id": subtask.id,
                "enhanced_prompt": enhanced_prompt,
            },
        )

    async def can_handle(self, subtask: SubTask) -> bool:
        return subtask.required_skill == Skill.IMAGE

    async def estimate(self, subtask: SubTask) -> int:
        return 30  # seconds

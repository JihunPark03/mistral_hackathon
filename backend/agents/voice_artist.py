"""Voice Artist Agent — generates voiceovers via ElevenLabs."""

from __future__ import annotations

from backend.agents.base import BaseAgent
from backend.protocol.models import Deliverable, DeliverableType, Skill, SubTask
from backend.services.mistral_service import get_mistral_service
from backend.services.elevenlabs_service import get_elevenlabs_service


SCRIPT_POLISH_PROMPT = """You are a voice-over script editor. Take the following text and adapt it
for natural spoken narration. Keep it concise, conversational, and engaging.
Remove any markdown formatting, links, or visual-only elements.
Output ONLY the polished script text, nothing else."""


class VoiceArtistAgent(BaseAgent):
    name = "Voice Artist"
    skills = [Skill.VOICE]

    async def execute(self, subtask: SubTask, context: dict | None = None) -> Deliverable:
        mistral = get_mistral_service()
        elevenlabs = get_elevenlabs_service()

        # Get the text to narrate — from context (handoff) or subtask description
        raw_text = subtask.description
        if context and "input_text" in context:
            raw_text = context["input_text"]

        # Polish the text for voice narration using Mistral
        script = await mistral.chat(
            messages=[{"role": "user", "content": raw_text}],
            system_prompt=SCRIPT_POLISH_PROMPT,
        )

        # Generate audio via ElevenLabs
        filename, filepath = await elevenlabs.text_to_speech(text=script)

        return Deliverable(
            type=DeliverableType.AUDIO,
            content=f"/static/deliverables/{filename}",
            filename=filename,
            mime_type="audio/mpeg",
            metadata={
                "agent": self.name,
                "subtask_id": subtask.id,
                "script": script,
            },
        )

    async def can_handle(self, subtask: SubTask) -> bool:
        return subtask.required_skill == Skill.VOICE

    async def estimate(self, subtask: SubTask) -> int:
        return 20  # seconds

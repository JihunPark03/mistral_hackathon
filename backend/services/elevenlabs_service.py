"""ElevenLabs TTS service wrapper."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from elevenlabs.client import ElevenLabs
from elevenlabs import save

from backend.config import get_settings

DELIVERABLES_DIR = Path(__file__).parent.parent / "static" / "deliverables"


class ElevenLabsService:
    def __init__(self):
        self._settings = get_settings()
        self._client = ElevenLabs(api_key=self._settings.elevenlabs_api_key)

    async def text_to_speech(
        self,
        text: str,
        voice_id: str | None = None,
        model_id: str | None = None,
    ) -> tuple[str, str]:
        """Generate speech from text. Returns (filename, filepath)."""
        voice_id = voice_id or self._settings.elevenlabs_voice_id
        model_id = model_id or self._settings.elevenlabs_model

        audio = self._client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id=model_id,
            output_format="mp3_44100_128",
        )

        filename = f"voice_{uuid.uuid4().hex[:8]}.mp3"
        filepath = DELIVERABLES_DIR / filename
        DELIVERABLES_DIR.mkdir(parents=True, exist_ok=True)
        save(audio, str(filepath))

        return filename, str(filepath)


_service: ElevenLabsService | None = None


def get_elevenlabs_service() -> ElevenLabsService:
    global _service
    if _service is None:
        _service = ElevenLabsService()
    return _service

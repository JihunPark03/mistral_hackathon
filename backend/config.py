from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mistral_api_key: str = ""
    elevenlabs_api_key: str = ""
    huggingface_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./agentlance.db"

    # Mistral model defaults
    mistral_medium_model: str = "mistral-medium-latest"
    mistral_large_model: str = "mistral-large-latest"

    # ElevenLabs defaults
    elevenlabs_voice_id: str = "JBFqnCBsd6RMkjVDRZzb"  # George
    elevenlabs_model: str = "eleven_flash_v2_5"

    # HuggingFace defaults
    hf_image_model: str = "black-forest-labs/FLUX.1-schnell"
    hf_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Networking / CORS
    # Accept either a comma-separated string or a JSON list in ALLOWED_ORIGINS.
    allowed_origins: str | list[str] = "http://localhost:5173"
    allow_origin_regex: str | None = None  # optional regex for dynamic hostnames

    model_config = {"env_file": ".env", "extra": "ignore"}

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, v: Any) -> list[str]:
        # Env parser tries JSON for lists; if it fails we land here with the raw string.
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()

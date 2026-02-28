from pydantic_settings import BaseSettings
from functools import lru_cache


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
    allowed_origins: list[str] = ["*"]  # comma-separated env var ALLOWED_ORIGINS
    allow_origin_regex: str | None = None  # optional regex for dynamic hostnames

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()

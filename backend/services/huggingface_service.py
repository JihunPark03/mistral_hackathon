"""HuggingFace Inference service wrapper — image generation + embeddings."""

from __future__ import annotations

import uuid
from pathlib import Path

from huggingface_hub import InferenceClient
import numpy as np

from backend.config import get_settings

DELIVERABLES_DIR = Path(__file__).parent.parent / "static" / "deliverables"


class HuggingFaceService:
    def __init__(self):
        self._settings = get_settings()
        # Hugging Face deprecated api-inference.huggingface.co.
        # Use the router service and pass fully qualified URLs per call.
        self._client = InferenceClient(token=self._settings.huggingface_api_key)

    def _normalize_model_url(self, model: str, kind: str) -> str:
        """Accept plain model id, router shortcut (hf://router/...), or full URL."""
        if model.startswith("http"):
            return model
        if model.startswith("hf://router/"):
            # Strip hf://router/ prefix so we can prepend the https router host
            path = model.removeprefix("hf://router/").lstrip("/")
            return f"https://router.huggingface.co/hf-inference/{path}"

        base = "https://router.huggingface.co/hf-inference"
        suffix = "models" if kind == "model" else "pipeline/feature-extraction"
        return f"{base}/{suffix}/{model}"

    async def generate_image(
        self,
        prompt: str,
        model: str | None = None,
    ) -> tuple[str, str]:
        """Generate an image from a prompt. Returns (filename, filepath)."""
        model = model or self._settings.hf_image_model
        model_url = self._normalize_model_url(model, kind="model")

        image = self._client.text_to_image(
            prompt=prompt,
            model=model_url,
        )

        filename = f"image_{uuid.uuid4().hex[:8]}.png"
        filepath = DELIVERABLES_DIR / filename
        DELIVERABLES_DIR.mkdir(parents=True, exist_ok=True)
        image.save(str(filepath))

        return filename, str(filepath)

    async def get_embeddings(
        self,
        texts: list[str],
        model: str | None = None,
    ) -> list[list[float]]:
        """Get text embeddings for semantic matching."""
        model = model or self._settings.hf_embedding_model
        model_url = self._normalize_model_url(model, kind="pipeline")
        result = self._client.feature_extraction(
            text=texts,
            model=model_url,
        )
        if isinstance(result, np.ndarray):
            return result.tolist()
        return result

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        """Compute cosine similarity between two vectors."""
        a_arr = np.array(a)
        b_arr = np.array(b)
        return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr)))


_service: HuggingFaceService | None = None


def get_huggingface_service() -> HuggingFaceService:
    global _service
    if _service is None:
        _service = HuggingFaceService()
    return _service

"""Job submission, tracking, and rating endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
import logging

from backend.protocol.models import Job, JobRating, JobRequest, Skill
from backend.protocol.router import get_router

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=list[Job])
async def list_jobs():
    return get_router().list_jobs()


@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str):
    job = get_router().get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=Job)
async def submit_job(req: JobRequest):
    # Auto-detect skills if not provided
    skills = req.required_skills
    if not skills:
        skills = _detect_skills(req.description)

    model_overrides = _sanitize_model_overrides(req.model_overrides)

    job = Job(
        title=req.title,
        description=req.description,
        required_skills=skills,
        budget=req.budget,
        client_name=req.client_name,
        model_overrides=model_overrides,
    )

    return await get_router().submit_job(job)


@router.post("/{job_id}/rate", response_model=Job)
async def rate_job(job_id: str, rating: JobRating):
    job = await get_router().rate_job(job_id, rating.rating, rating.review)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not completed")
    return job


def _detect_skills(description: str) -> list[Skill]:
    """Simple keyword-based skill detection as a fallback."""
    desc_lower = description.lower()
    skills = []

    writing_keywords = ["blog", "write", "article", "copy", "script", "content", "post", "story", "documentation"]
    voice_keywords = ["voice", "audio", "narrat", "voiceover", "speak", "podcast", "tts"]
    image_keywords = ["image", "logo", "banner", "illustration", "design", "visual", "picture", "photo", "graphic"]
    code_keywords = ["code", "develop", "program", "function", "api", "app", "software", "debug", "review"]

    if any(kw in desc_lower for kw in writing_keywords):
        skills.append(Skill.WRITING)
    if any(kw in desc_lower for kw in voice_keywords):
        skills.append(Skill.VOICE)
    if any(kw in desc_lower for kw in image_keywords):
        skills.append(Skill.IMAGE)
    if any(kw in desc_lower for kw in code_keywords):
        skills.append(Skill.CODE)

    return skills or [Skill.WRITING]  # default to writing


def _sanitize_model_overrides(overrides: dict[str, str]) -> dict[str, str]:
    """
    Accept only compatible overrides:
    - writing/code/voice rely on Mistral chat; allow only Mistral family IDs.
    - image/orchestration: keep as-is.
    """
    if not overrides:
        return {}

    allowed_prefixes = (
        "mistral-",
        "mixtral",
        "open-mistral",
        "open-mixtral",
        "codestral",
    )

    clean: dict[str, str] = {}
    for skill, model in overrides.items():
        s = str(skill).lower()
        if s in ("image", "orchestration"):
            clean[skill] = model
            continue
        if any(model.startswith(prefix) for prefix in allowed_prefixes):
            clean[skill] = model
        else:
            logger.warning("Dropping unsupported model override '%s' for skill '%s'", model, skill)
    return clean

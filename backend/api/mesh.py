"""Mesh topology and health endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.protocol.mesh import get_mesh
from backend.protocol.registry import get_registry
from backend.db.database import get_db
from backend.db.models import ModelRecord

router = APIRouter(prefix="/api/mesh", tags=["mesh"])


async def _get_default_models(db: AsyncSession) -> dict[str, ModelRecord]:
    """Return map of tag(lower) -> default model record."""
    res = await db.execute(select(ModelRecord).where(ModelRecord.is_default.is_(True)))
    models = res.scalars().all()
    return { (m.tag or "").lower(): m for m in models }


@router.get("/topology")
async def get_topology(db: AsyncSession = Depends(get_db)):
    """Return mesh topology with agent names replaced by active/default model names."""
    mesh = get_mesh()
    registry = get_registry()
    raw = mesh.get_topology()
    default_models = await _get_default_models(db)

    # Enrich nodes with agent profile data, swap name with default model when available
    nodes = []
    for agent_id in raw["nodes"]:
        profile = registry.get_profile(agent_id)
        if profile:
            primary_skill = profile.skills[0].value if profile.skills else ""
            model_for_skill = default_models.get(primary_skill)
            display_name = (model_for_skill.name or model_for_skill.source_url) if model_for_skill else profile.name
            nodes.append({
                "id": profile.id,
                "name": display_name,
                "role": profile.role,
                "status": profile.status.value,
                "skills": [s.value for s in profile.skills],
                "avatar": profile.avatar,
            })

    edges = []
    for e in raw["edges"]:
        src = registry.get_profile(e["source"])
        tgt = registry.get_profile(e["target"])
        edges.append({
            "source": e["source"],
            "target": e["target"],
            "source_name": src.name if src else "",
            "target_name": tgt.name if tgt else "",
        })

    return {"nodes": nodes, "edges": edges}


@router.get("/events")
async def get_events(job_id: str | None = None, limit: int = 100):
    return get_mesh().get_events(job_id=job_id, limit=limit)


@router.get("/health")
async def health():
    registry = get_registry()
    agents = registry.list_profiles()
    return {
        "status": "healthy",
        "agents_total": len(agents),
        "agents_available": sum(1 for a in agents if a.status.value == "available"),
    }

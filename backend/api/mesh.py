"""Mesh topology and health endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from backend.protocol.mesh import get_mesh
from backend.protocol.registry import get_registry

router = APIRouter(prefix="/api/mesh", tags=["mesh"])


@router.get("/topology")
async def get_topology():
    """Return mesh topology with agent names for visualization."""
    mesh = get_mesh()
    registry = get_registry()
    raw = mesh.get_topology()

    # Enrich nodes with agent profile data
    nodes = []
    for agent_id in raw["nodes"]:
        profile = registry.get_profile(agent_id)
        if profile:
            nodes.append({
                "id": profile.id,
                "name": profile.name,
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

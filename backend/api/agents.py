"""Agent profile CRUD endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.protocol.models import AgentProfile
from backend.protocol.registry import get_registry

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=list[AgentProfile])
async def list_agents():
    return get_registry().list_profiles()


@router.get("/{agent_id}", response_model=AgentProfile)
async def get_agent(agent_id: str):
    profile = get_registry().get_profile(agent_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Agent not found")
    return profile


@router.get("/{agent_id}/handoffs", response_model=list[AgentProfile])
async def get_agent_handoffs(agent_id: str):
    profile = get_registry().get_profile(agent_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Agent not found")
    return get_registry().get_handoff_targets(agent_id)

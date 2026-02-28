"""Agent Registry — in-memory agent registration and skill-based discovery."""

from __future__ import annotations

from backend.agents.base import BaseAgent
from backend.protocol.models import AgentProfile, AgentStatus, Skill


class AgentRegistry:
    """Manages agent profiles and their associated runtime instances."""

    def __init__(self):
        self._profiles: dict[str, AgentProfile] = {}
        self._instances: dict[str, BaseAgent] = {}  # agent_id -> runtime instance

    def register(self, profile: AgentProfile, instance: BaseAgent) -> AgentProfile:
        self._profiles[profile.id] = profile
        self._instances[profile.id] = instance
        return profile

    def get_profile(self, agent_id: str) -> AgentProfile | None:
        return self._profiles.get(agent_id)

    def get_instance(self, agent_id: str) -> BaseAgent | None:
        return self._instances.get(agent_id)

    def list_profiles(self) -> list[AgentProfile]:
        return list(self._profiles.values())

    def find_by_skill(self, skill: Skill) -> list[AgentProfile]:
        return [
            p for p in self._profiles.values()
            if skill in p.skills and p.status == AgentStatus.AVAILABLE
        ]

    def find_by_skills(self, skills: list[Skill]) -> list[AgentProfile]:
        return [
            p for p in self._profiles.values()
            if any(s in p.skills for s in skills) and p.status == AgentStatus.AVAILABLE
        ]

    def set_status(self, agent_id: str, status: AgentStatus):
        if agent_id in self._profiles:
            self._profiles[agent_id].status = status

    def get_handoff_targets(self, agent_id: str) -> list[AgentProfile]:
        profile = self._profiles.get(agent_id)
        if not profile:
            return []
        return [
            self._profiles[tid]
            for tid in profile.handoff_targets
            if tid in self._profiles
        ]


# Singleton
_registry: AgentRegistry | None = None


def get_registry() -> AgentRegistry:
    global _registry
    if _registry is None:
        _registry = AgentRegistry()
    return _registry

"""Base Agent ABC — all marketplace agents implement this interface."""

from __future__ import annotations

from abc import ABC, abstractmethod

from backend.protocol.models import Deliverable, Skill, SubTask


class BaseAgent(ABC):
    """Abstract base class for all AgentLance agents."""

    name: str
    skills: list[Skill]

    @abstractmethod
    async def execute(self, subtask: SubTask, context: dict | None = None) -> Deliverable:
        """Execute a subtask and return a deliverable."""
        ...

    @abstractmethod
    async def can_handle(self, subtask: SubTask) -> bool:
        """Return True if this agent can handle the given subtask."""
        ...

    @abstractmethod
    async def estimate(self, subtask: SubTask) -> int:
        """Estimate time in seconds to complete the subtask."""
        ...

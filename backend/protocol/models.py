"""All Pydantic models for the AgentLance protocol."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# --- Enums ---

class AgentStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"


class JobStatus(str, Enum):
    PENDING = "pending"
    DECOMPOSING = "decomposing"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class SubTaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING_DEPENDENCY = "waiting_dependency"


class Skill(str, Enum):
    WRITING = "writing"
    VOICE = "voice"
    IMAGE = "image"
    CODE = "code"
    ORCHESTRATION = "orchestration"


class DeliverableType(str, Enum):
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"
    CODE = "code"


class MeshEventType(str, Enum):
    AGENT_REGISTERED = "agent_registered"
    AGENT_STATUS_CHANGED = "agent_status_changed"
    JOB_CREATED = "job_created"
    JOB_DECOMPOSED = "job_decomposed"
    SUBTASK_ASSIGNED = "subtask_assigned"
    SUBTASK_STARTED = "subtask_started"
    SUBTASK_COMPLETED = "subtask_completed"
    SUBTASK_FAILED = "subtask_failed"
    HANDOFF = "handoff"
    JOB_COMPLETED = "job_completed"
    JOB_FAILED = "job_failed"


# --- Agent Models ---

class AgentProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: str
    skills: list[Skill]
    description: str
    avatar: str = ""
    hourly_rate: float = 0.0
    rating: float = 5.0
    jobs_completed: int = 0
    status: AgentStatus = AgentStatus.AVAILABLE
    handoff_targets: list[str] = Field(default_factory=list)  # agent IDs this agent can hand off to
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Deliverable Models ---

class Deliverable(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: DeliverableType
    content: str = ""  # text content or file path
    filename: str = ""
    mime_type: str = ""
    metadata: dict = Field(default_factory=dict)


# --- SubTask Models ---

class SubTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    title: str
    description: str
    required_skill: Skill
    assigned_agent_id: str | None = None
    status: SubTaskStatus = SubTaskStatus.PENDING
    dependencies: list[str] = Field(default_factory=list)  # subtask IDs this depends on
    deliverable: Deliverable | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


# --- Job Models ---

class JobRequest(BaseModel):
    title: str
    description: str
    required_skills: list[Skill] = Field(default_factory=list)
    budget: float = 0.0
    client_name: str = "Anonymous"
    # Optional per-skill model overrides (e.g., use a specific image or LLM model)
    model_overrides: dict[Skill, str] = Field(default_factory=dict)


class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    required_skills: list[Skill] = Field(default_factory=list)
    budget: float = 0.0
    client_name: str = "Anonymous"
    model_overrides: dict[Skill, str] = Field(default_factory=dict)
    status: JobStatus = JobStatus.PENDING
    assigned_agent_id: str | None = None
    subtasks: list[SubTask] = Field(default_factory=list)
    deliverables: list[Deliverable] = Field(default_factory=list)
    rating: float | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None


# --- Mesh Event ---

class MeshEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: MeshEventType
    job_id: str | None = None
    agent_id: str | None = None
    subtask_id: str | None = None
    source_agent_id: str | None = None
    target_agent_id: str | None = None
    data: dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# --- Structured Output Models (for Mistral parse) ---

class SubTaskPlan(BaseModel):
    """Used by Orchestrator to decompose jobs via Mistral structured output."""
    title: str
    description: str
    required_skill: Skill
    dependencies: list[int] = Field(default_factory=list)  # indices of dependent subtasks


class JobDecomposition(BaseModel):
    """Structured output from Orchestrator's job analysis."""
    reasoning: str
    subtasks: list[SubTaskPlan]
    estimated_total_minutes: int = 5


# --- Rating ---

class JobRating(BaseModel):
    rating: float = Field(ge=1.0, le=5.0)
    review: str = ""

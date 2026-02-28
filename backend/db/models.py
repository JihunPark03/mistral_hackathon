"""ORM models for SQLite persistence."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON
from backend.db.database import Base


class AgentRecord(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    skills = Column(JSON, default=list)
    description = Column(Text, default="")
    avatar = Column(String, default="")
    hourly_rate = Column(Float, default=0.0)
    rating = Column(Float, default=5.0)
    jobs_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class JobRecord(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    required_skills = Column(JSON, default=list)
    status = Column(String, default="pending")
    client_name = Column(String, default="Anonymous")
    budget = Column(Float, default=0.0)
    rating = Column(Float, nullable=True)
    assigned_agent_id = Column(String, nullable=True)
    deliverables = Column(JSON, default=list)
    subtasks = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

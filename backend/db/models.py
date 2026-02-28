"""ORM models for SQLite persistence."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    DateTime,
    Text,
    JSON,
    Enum,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import relationship
import enum
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


# -------------------------
# Auth & User content
# -------------------------


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    folders = relationship("Folder", back_populates="owner", cascade="all, delete-orphan")
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")
    models = relationship("ModelRecord", back_populates="owner", cascade="all, delete-orphan")


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    path = Column(String, default="/")
    depth = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    owner = relationship("UserModel", back_populates="folders")
    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    path = Column(String, default="/")
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)

    owner = relationship("UserModel", back_populates="files")
    folder = relationship("Folder", back_populates="files")


class ModelRecord(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    source_url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    owner = relationship("UserModel", back_populates="models")

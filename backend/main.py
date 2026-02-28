"""FastAPI application — AgentLance marketplace backend."""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import get_settings
from backend.db.seed import seed_agents
from backend.api import agents, jobs, mesh, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed demo agents
    await seed_agents()
    yield
    # Shutdown: cleanup if needed


settings = get_settings()

app = FastAPI(
    title="AgentLance",
    description="AI Agent Marketplace — Fiverr for AI agents on a mesh network",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins if settings.allowed_origins != ["*"] else ["*"],
    allow_origin_regex=settings.allow_origin_regex or (".*" if settings.allowed_origins == ["*"] else None),
    allow_credentials=False if "*" in settings.allowed_origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for deliverables
static_dir = Path(__file__).parent / "static" / "deliverables"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/deliverables", StaticFiles(directory=str(static_dir)), name="deliverables")

# API routers
app.include_router(agents.router)
app.include_router(jobs.router)
app.include_router(mesh.router)
app.include_router(ws.router)


@app.get("/")
async def root():
    return {
        "name": "AgentLance",
        "version": "0.1.0",
        "description": "AI Agent Marketplace — Fiverr for AI agents",
    }

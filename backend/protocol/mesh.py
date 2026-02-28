"""Mesh topology — WebSocket broadcast, handoff graph, and event history."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime

from fastapi import WebSocket

from backend.protocol.models import MeshEvent, MeshEventType


class MeshNetwork:
    """Manages the agent mesh: topology, events, and WebSocket broadcasting."""

    def __init__(self):
        self._events: list[MeshEvent] = []
        self._job_subscribers: dict[str, list[WebSocket]] = {}  # job_id -> websockets
        self._mesh_subscribers: list[WebSocket] = []
        self._handoff_graph: dict[str, list[str]] = {}  # agent_id -> [target_agent_ids]

    def register_handoffs(self, agent_id: str, targets: list[str]):
        self._handoff_graph[agent_id] = targets

    def get_handoff_graph(self) -> dict[str, list[str]]:
        return dict(self._handoff_graph)

    def get_topology(self) -> dict:
        """Return mesh topology for visualization."""
        nodes = list(set(
            list(self._handoff_graph.keys()) +
            [t for targets in self._handoff_graph.values() for t in targets]
        ))
        edges = [
            {"source": src, "target": tgt}
            for src, targets in self._handoff_graph.items()
            for tgt in targets
        ]
        return {"nodes": nodes, "edges": edges}

    # --- WebSocket management ---

    async def subscribe_job(self, job_id: str, ws: WebSocket):
        if job_id not in self._job_subscribers:
            self._job_subscribers[job_id] = []
        self._job_subscribers[job_id].append(ws)

    def unsubscribe_job(self, job_id: str, ws: WebSocket):
        if job_id in self._job_subscribers:
            self._job_subscribers[job_id] = [
                w for w in self._job_subscribers[job_id] if w != ws
            ]

    async def subscribe_mesh(self, ws: WebSocket):
        self._mesh_subscribers.append(ws)

    def unsubscribe_mesh(self, ws: WebSocket):
        self._mesh_subscribers = [w for w in self._mesh_subscribers if w != ws]

    # --- Event broadcasting ---

    async def emit(self, event: MeshEvent):
        self._events.append(event)
        payload = json.loads(event.model_dump_json())

        # Broadcast to job subscribers
        if event.job_id and event.job_id in self._job_subscribers:
            dead = []
            for ws in self._job_subscribers[event.job_id]:
                try:
                    await ws.send_json(payload)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.unsubscribe_job(event.job_id, ws)

        # Broadcast to mesh subscribers
        dead = []
        for ws in self._mesh_subscribers:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.unsubscribe_mesh(ws)

    def get_events(self, job_id: str | None = None, limit: int = 100) -> list[MeshEvent]:
        events = self._events
        if job_id:
            events = [e for e in events if e.job_id == job_id]
        return events[-limit:]


# Singleton
_mesh: MeshNetwork | None = None


def get_mesh() -> MeshNetwork:
    global _mesh
    if _mesh is None:
        _mesh = MeshNetwork()
    return _mesh

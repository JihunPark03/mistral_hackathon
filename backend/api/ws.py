"""WebSocket endpoints for real-time job tracking and mesh visualization."""

from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.protocol.mesh import get_mesh

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/jobs/{job_id}")
async def ws_job_tracker(websocket: WebSocket, job_id: str):
    """Subscribe to real-time events for a specific job."""
    await websocket.accept()
    mesh = get_mesh()
    await mesh.subscribe_job(job_id, websocket)

    # Send existing events for this job
    existing = mesh.get_events(job_id=job_id)
    for event in existing:
        await websocket.send_json(event.model_dump(mode="json"))

    try:
        while True:
            # Keep connection alive; client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        mesh.unsubscribe_job(job_id, websocket)


@router.websocket("/ws/mesh")
async def ws_mesh(websocket: WebSocket):
    """Subscribe to all mesh events (for the mesh visualizer)."""
    await websocket.accept()
    mesh = get_mesh()
    await mesh.subscribe_mesh(websocket)

    # Send recent events
    recent = mesh.get_events(limit=50)
    for event in recent:
        await websocket.send_json(event.model_dump(mode="json"))

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        mesh.unsubscribe_mesh(websocket)

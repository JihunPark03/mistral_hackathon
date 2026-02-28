"""Seed demo agents on startup."""

from __future__ import annotations

from backend.protocol.models import AgentProfile, MeshEvent, MeshEventType, Skill
from backend.protocol.registry import get_registry
from backend.protocol.mesh import get_mesh
from backend.agents.writer import WriterAgent
from backend.agents.voice_artist import VoiceArtistAgent
from backend.agents.image_creator import ImageCreatorAgent
from backend.agents.code_developer import CodeDeveloperAgent
from backend.agents.orchestrator import OrchestratorAgent


async def seed_agents():
    """Register all demo agents with profiles and runtime instances."""
    registry = get_registry()
    mesh = get_mesh()

    # Define agent profiles
    writer = AgentProfile(
        name="Nova",
        role="Content Writer",
        skills=[Skill.WRITING],
        description="Expert content writer specializing in blog posts, marketing copy, product descriptions, and creative scripts. Powered by Mistral AI.",
        avatar="pencil",
        hourly_rate=25.0,
        rating=4.9,
        jobs_completed=142,
    )

    voice_artist = AgentProfile(
        name="Echo",
        role="Voice Artist",
        skills=[Skill.VOICE],
        description="Professional voice artist creating natural-sounding voiceovers, narrations, and audio content. Powered by ElevenLabs.",
        avatar="microphone",
        hourly_rate=35.0,
        rating=4.8,
        jobs_completed=89,
    )

    image_creator = AgentProfile(
        name="Pixel",
        role="Image Creator",
        skills=[Skill.IMAGE],
        description="Creative visual designer producing logos, banners, illustrations, and hero images. Powered by HuggingFace FLUX.",
        avatar="palette",
        hourly_rate=30.0,
        rating=4.7,
        jobs_completed=203,
    )

    code_dev = AgentProfile(
        name="Cipher",
        role="Code Developer",
        skills=[Skill.CODE],
        description="Senior software developer handling code generation, reviews, debugging, and technical architecture. Powered by Mistral AI Large.",
        avatar="terminal",
        hourly_rate=45.0,
        rating=4.9,
        jobs_completed=167,
    )

    orchestrator = AgentProfile(
        name="Nexus",
        role="Orchestrator",
        skills=[Skill.ORCHESTRATION],
        description="Master coordinator that decomposes complex projects into subtasks and routes them to specialist agents. Powered by Mistral AI with structured output.",
        avatar="network",
        hourly_rate=40.0,
        rating=5.0,
        jobs_completed=56,
    )

    # Set up handoff topology
    # Orchestrator → all specialists
    orchestrator.handoff_targets = [writer.id, voice_artist.id, image_creator.id, code_dev.id]
    # Writer → VoiceArtist (written script → narration)
    writer.handoff_targets = [voice_artist.id]
    # CodeDeveloper → Writer (code → documentation)
    code_dev.handoff_targets = [writer.id]

    # Register all agents
    agents = [
        (writer, WriterAgent()),
        (voice_artist, VoiceArtistAgent()),
        (image_creator, ImageCreatorAgent()),
        (code_dev, CodeDeveloperAgent()),
        (orchestrator, OrchestratorAgent()),
    ]

    for profile, instance in agents:
        registry.register(profile, instance)
        mesh.register_handoffs(profile.id, profile.handoff_targets)

        await mesh.emit(MeshEvent(
            type=MeshEventType.AGENT_REGISTERED,
            agent_id=profile.id,
            data={"name": profile.name, "role": profile.role, "skills": [s.value for s in profile.skills]},
        ))

    print(f"Seeded {len(agents)} demo agents")
    return [p for p, _ in agents]

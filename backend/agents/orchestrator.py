"""Orchestrator Agent — decomposes complex jobs into subtasks using Mistral structured output."""

from __future__ import annotations

from backend.agents.base import BaseAgent
from backend.protocol.models import (
    Deliverable,
    DeliverableType,
    JobDecomposition,
    Skill,
    SubTask,
)
from backend.services.mistral_service import get_mistral_service


DECOMPOSE_SYSTEM_PROMPT = """You are an expert project manager and task decomposer for the AgentLance marketplace.
You analyze complex job requests and break them into concrete, actionable subtasks.

Available skills for agents:
- "writing": Blog posts, copy, scripts, documentation
- "voice": Voiceovers, narration, audio content
- "image": Logos, banners, illustrations, visual content
- "code": Code generation, review, debugging

Rules:
1. Each subtask must require exactly ONE skill
2. Identify dependencies between subtasks (e.g., voice narration depends on written script)
3. Maximize parallelism — only add dependencies where output from one task is input to another
4. Be specific in subtask descriptions so agents know exactly what to produce
5. Dependencies are specified as zero-based indices into the subtasks list

Return a JSON object with this exact structure:
{
  "reasoning": "Brief explanation of decomposition strategy",
  "subtasks": [
    {"title": "...", "description": "...", "required_skill": "writing|voice|image|code", "dependencies": []},
    ...
  ],
  "estimated_total_minutes": 5
}"""


class OrchestratorAgent(BaseAgent):
    name = "Mistral AI"
    skills = [Skill.ORCHESTRATION]

    async def execute(self, subtask: SubTask, context: dict | None = None) -> Deliverable:
        """For the orchestrator, 'execute' means decomposing a job description."""
        mistral = get_mistral_service()

        decomposition = await mistral.parse(
            messages=[{"role": "user", "content": subtask.description}],
            response_model=JobDecomposition,
            system_prompt=DECOMPOSE_SYSTEM_PROMPT,
        )

        return Deliverable(
            type=DeliverableType.TEXT,
            content=decomposition.model_dump_json(indent=2),
            metadata={
                "agent": self.name,
                "subtask_id": subtask.id,
                "decomposition": decomposition.model_dump(),
            },
        )

    async def can_handle(self, subtask: SubTask) -> bool:
        return subtask.required_skill == Skill.ORCHESTRATION

    async def estimate(self, subtask: SubTask) -> int:
        return 10  # seconds

"""Job Router — routes jobs to agents, handles decomposition, subtask assignment, and dependencies."""

from __future__ import annotations

import asyncio
from datetime import datetime

from backend.protocol.models import (
    AgentStatus,
    Deliverable,
    Job,
    JobDecomposition,
    JobStatus,
    MeshEvent,
    MeshEventType,
    Skill,
    SubTask,
    SubTaskStatus,
)
from backend.protocol.registry import get_registry
from backend.protocol.mesh import get_mesh


class JobRouter:
    """Routes jobs to agents, manages decomposition and execution."""

    def __init__(self):
        self._jobs: dict[str, Job] = {}

    def get_job(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def list_jobs(self) -> list[Job]:
        return list(self._jobs.values())

    async def submit_job(self, job: Job) -> Job:
        """Submit a job — determines if simple or complex, then routes accordingly."""
        self._jobs[job.id] = job
        mesh = get_mesh()

        await mesh.emit(MeshEvent(
            type=MeshEventType.JOB_CREATED,
            job_id=job.id,
            data={"title": job.title, "skills": [s.value for s in job.required_skills]},
        ))

        # Determine routing strategy
        if self._needs_orchestration(job):
            asyncio.create_task(self._orchestrate_job(job))
        else:
            asyncio.create_task(self._route_simple_job(job))

        return job

    def _needs_orchestration(self, job: Job) -> bool:
        """A job needs orchestration if it requires multiple different skills."""
        return len(job.required_skills) > 1

    async def _route_simple_job(self, job: Job):
        """Route a single-skill job directly to the best agent."""
        registry = get_registry()
        mesh = get_mesh()

        skill = job.required_skills[0] if job.required_skills else Skill.WRITING

        # Create a single subtask
        subtask = SubTask(
            job_id=job.id,
            title=job.title,
            description=job.description,
            required_skill=skill,
        )
        job.subtasks = [subtask]

        # Find an agent
        candidates = registry.find_by_skill(skill)
        if not candidates:
            job.status = JobStatus.FAILED
            await mesh.emit(MeshEvent(
                type=MeshEventType.JOB_FAILED,
                job_id=job.id,
                data={"error": f"No available agent for skill: {skill.value}"},
            ))
            return

        agent_profile = candidates[0]
        agent_instance = registry.get_instance(agent_profile.id)
        subtask.assigned_agent_id = agent_profile.id
        job.assigned_agent_id = agent_profile.id
        job.status = JobStatus.IN_PROGRESS

        await mesh.emit(MeshEvent(
            type=MeshEventType.SUBTASK_ASSIGNED,
            job_id=job.id,
            agent_id=agent_profile.id,
            subtask_id=subtask.id,
            data={"skill": skill.value, "agent_name": agent_profile.name},
        ))

        # Execute
        await self._execute_subtask(job, subtask, agent_profile.id)

        # Complete the job
        if subtask.status == SubTaskStatus.COMPLETED and subtask.deliverable:
            job.deliverables = [subtask.deliverable]
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            agent_profile.jobs_completed += 1
            await mesh.emit(MeshEvent(
                type=MeshEventType.JOB_COMPLETED,
                job_id=job.id,
                data={"deliverables_count": len(job.deliverables)},
            ))

    async def _orchestrate_job(self, job: Job):
        """Decompose a complex job via the Orchestrator, then execute subtasks."""
        registry = get_registry()
        mesh = get_mesh()
        job.status = JobStatus.DECOMPOSING

        # Find orchestrator
        orchestrators = registry.find_by_skill(Skill.ORCHESTRATION)
        if not orchestrators:
            # Fallback: treat as simple job with first skill
            await self._route_simple_job(job)
            return

        orch_profile = orchestrators[0]
        orch_instance = registry.get_instance(orch_profile.id)

        # Decompose via orchestrator
        decompose_subtask = SubTask(
            job_id=job.id,
            title="Decompose job",
            description=f"Decompose this job: {job.title}\n\n{job.description}",
            required_skill=Skill.ORCHESTRATION,
            assigned_agent_id=orch_profile.id,
        )

        try:
            deliverable = await orch_instance.execute(decompose_subtask)
            decomposition = JobDecomposition.model_validate(
                deliverable.metadata.get("decomposition", {})
            )
        except Exception as e:
            job.status = JobStatus.FAILED
            await mesh.emit(MeshEvent(
                type=MeshEventType.JOB_FAILED,
                job_id=job.id,
                data={"error": f"Decomposition failed: {str(e)}"},
            ))
            return

        # Create subtasks from decomposition
        subtasks: list[SubTask] = []
        for i, plan in enumerate(decomposition.subtasks):
            st = SubTask(
                job_id=job.id,
                title=plan.title,
                description=plan.description,
                required_skill=plan.required_skill,
            )
            subtasks.append(st)

        # Map dependency indices to subtask IDs
        for i, plan in enumerate(decomposition.subtasks):
            for dep_idx in plan.dependencies:
                if 0 <= dep_idx < len(subtasks):
                    subtasks[i].dependencies.append(subtasks[dep_idx].id)
                    subtasks[i].status = SubTaskStatus.WAITING_DEPENDENCY

        job.subtasks = subtasks
        job.status = JobStatus.IN_PROGRESS

        await mesh.emit(MeshEvent(
            type=MeshEventType.JOB_DECOMPOSED,
            job_id=job.id,
            data={
                "reasoning": decomposition.reasoning,
                "subtask_count": len(subtasks),
                "subtasks": [{"title": s.title, "skill": s.required_skill.value} for s in subtasks],
            },
        ))

        # Assign agents to subtasks
        for st in subtasks:
            candidates = registry.find_by_skill(st.required_skill)
            if candidates:
                st.assigned_agent_id = candidates[0].id
                await mesh.emit(MeshEvent(
                    type=MeshEventType.SUBTASK_ASSIGNED,
                    job_id=job.id,
                    agent_id=candidates[0].id,
                    subtask_id=st.id,
                    data={"skill": st.required_skill.value, "agent_name": candidates[0].name},
                ))

        # Execute subtasks respecting dependencies
        await self._execute_subtask_graph(job)

    async def _execute_subtask_graph(self, job: Job):
        """Execute subtasks respecting dependency ordering, parallelizing where possible."""
        mesh = get_mesh()
        completed_ids: set[str] = set()
        subtask_map = {st.id: st for st in job.subtasks}
        deliverable_map: dict[str, Deliverable] = {}  # subtask_id -> deliverable

        while True:
            # Find ready subtasks (all dependencies completed)
            ready = [
                st for st in job.subtasks
                if st.status in (SubTaskStatus.PENDING, SubTaskStatus.WAITING_DEPENDENCY)
                and st.assigned_agent_id
                and all(dep_id in completed_ids for dep_id in st.dependencies)
            ]

            if not ready:
                # Check if all done or stuck
                all_done = all(
                    st.status in (SubTaskStatus.COMPLETED, SubTaskStatus.FAILED)
                    for st in job.subtasks
                )
                if all_done:
                    break
                # Deadlock or no ready tasks
                break

            # Execute ready subtasks in parallel
            tasks = []
            for st in ready:
                # Build context from completed dependencies
                context = {}
                for dep_id in st.dependencies:
                    if dep_id in deliverable_map:
                        dep_deliverable = deliverable_map[dep_id]
                        context["input_text"] = dep_deliverable.content

                tasks.append(self._execute_subtask(job, st, st.assigned_agent_id, context))

            await asyncio.gather(*tasks)

            # Update tracking
            for st in ready:
                if st.status == SubTaskStatus.COMPLETED:
                    completed_ids.add(st.id)
                    if st.deliverable:
                        deliverable_map[st.id] = st.deliverable

        # Assemble final deliverables
        job.deliverables = [
            st.deliverable for st in job.subtasks
            if st.deliverable and st.status == SubTaskStatus.COMPLETED
        ]

        all_completed = all(st.status == SubTaskStatus.COMPLETED for st in job.subtasks)
        if all_completed:
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            await mesh.emit(MeshEvent(
                type=MeshEventType.JOB_COMPLETED,
                job_id=job.id,
                data={"deliverables_count": len(job.deliverables)},
            ))
        else:
            failed = [st for st in job.subtasks if st.status == SubTaskStatus.FAILED]
            if failed:
                job.status = JobStatus.FAILED
                await mesh.emit(MeshEvent(
                    type=MeshEventType.JOB_FAILED,
                    job_id=job.id,
                    data={"failed_subtasks": [st.title for st in failed]},
                ))

    async def _execute_subtask(
        self,
        job: Job,
        subtask: SubTask,
        agent_id: str,
        context: dict | None = None,
    ):
        """Execute a single subtask with the given agent."""
        registry = get_registry()
        mesh = get_mesh()

        agent_instance = registry.get_instance(agent_id)
        agent_profile = registry.get_profile(agent_id)

        if not agent_instance or not agent_profile:
            subtask.status = SubTaskStatus.FAILED
            return

        subtask.status = SubTaskStatus.IN_PROGRESS
        subtask.started_at = datetime.utcnow()
        registry.set_status(agent_id, AgentStatus.BUSY)

        await mesh.emit(MeshEvent(
            type=MeshEventType.SUBTASK_STARTED,
            job_id=job.id,
            agent_id=agent_id,
            subtask_id=subtask.id,
            data={"title": subtask.title},
        ))

        try:
            deliverable = await agent_instance.execute(subtask, context)
            subtask.deliverable = deliverable
            subtask.status = SubTaskStatus.COMPLETED
            subtask.completed_at = datetime.utcnow()

            await mesh.emit(MeshEvent(
                type=MeshEventType.SUBTASK_COMPLETED,
                job_id=job.id,
                agent_id=agent_id,
                subtask_id=subtask.id,
                data={
                    "title": subtask.title,
                    "deliverable_type": deliverable.type.value,
                },
            ))
        except Exception as e:
            subtask.status = SubTaskStatus.FAILED

            await mesh.emit(MeshEvent(
                type=MeshEventType.SUBTASK_FAILED,
                job_id=job.id,
                agent_id=agent_id,
                subtask_id=subtask.id,
                data={"title": subtask.title, "error": str(e)},
            ))
        finally:
            registry.set_status(agent_id, AgentStatus.AVAILABLE)

    async def rate_job(self, job_id: str, rating: float, review: str = "") -> Job | None:
        job = self._jobs.get(job_id)
        if not job or job.status != JobStatus.COMPLETED:
            return None
        job.rating = rating
        # Update agent rating
        registry = get_registry()
        if job.assigned_agent_id:
            profile = registry.get_profile(job.assigned_agent_id)
            if profile:
                # Simple rolling average
                total = profile.rating * profile.jobs_completed + rating
                profile.rating = total / (profile.jobs_completed + 1)
        return job


# Singleton
_router: JobRouter | None = None


def get_router() -> JobRouter:
    global _router
    if _router is None:
        _router = JobRouter()
    return _router

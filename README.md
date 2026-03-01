# AgentLance — AI Agent Mesh & Marketplace

AgentLance lets you “hire” AI agents like freelancers. Post a job once; the mesh decomposes it, routes subtasks to specialists (writer, voice, image, code, orchestration), and streams deliverables back in real time. Bring your own models or use the bundled defaults.

## What’s inside

- **Mesh router + orchestrator** (FastAPI): decomposes jobs, assigns agents, tracks events over WebSockets.
- **Agents**: Writer (Mistral), Voice (ElevenLabs), Image (HuggingFace FLUX), Code (Mistral Large), Orchestrator (Mistral structured output).
- **Frontend (React + Vite + Tailwind)**: Marketplace, job posting/tracking, mesh visualization, agent defaults.
- **Defaults control**: At `/defaults` pick per-skill agents (writing, voice, image, code, orchestration). You can always revert to the system default.
- **Public defaults**: Provided agents priced at ~\$3/hr for writing, voice, image, and code; used when you have no personal default.

## Quick start

### 1) Configure
```bash
cp .env.example .env
# Fill in keys:
# MISTRAL_API_KEY, ELEVENLABS_API_KEY, HUGGINGFACE_API_KEY
```

### 2) Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### LAN access / CORS
Set `ALLOWED_ORIGINS` in `.env` (comma-separated). Backend already listens on `0.0.0.0` if you pass `--host 0.0.0.0`.

## How to use

1) **Post a job** (`/post-job`): Enter title + description. Skills auto-detect; your default agents (or system defaults) are applied automatically.  
2) **Set defaults** (`/defaults`): Choose per-skill agent or revert to system default.
3) **Watch the mesh** (`/mesh`): Live topology and event feed as agents pick up tasks.  
4) **Track jobs** (`/jobs`): Status, subtasks, and deliverables (text, code, images, audio).  
5) **Manage agents** (`/models`): View uploaded agents/endpoints (currently read-only UI after recent tweaks).  

## Demo agents

| Agent | Powered By | Skill |
|-------|------------|-------|
| **Nova** (Writer) | Mistral | Blog posts, copy, scripts |
| **Echo** (Voice Artist) | ElevenLabs | Voiceovers, narration |
| **Pixel** (Image Creator) | HuggingFace FLUX | Logos, banners, illustrations |
| **Cipher** (Code Developer) | Mistral Large | Code gen, review, debugging |
| **Mistral AI** (Orchestrator) | Mistral + structured output | Decomposes complex jobs |

## Architecture (high level)

```
React/Vite frontend
   ↓ REST + WS
FastAPI backend
   ├─ Mesh router/orchestrator
   ├─ Agent registry (writer, voice, image, code, orchestration)
   ├─ HuggingFace images/embeddings
   ├─ Mistral chat/structured
   └─ ElevenLabs TTS
```

## API (selected)

- `POST /api/jobs` — Submit job (skills optional; auto-detects).  
- `GET /api/jobs/:id` — Status + deliverables.  
- `WS /ws/jobs/:id` — Live job events.  
- `WS /ws/mesh` — Mesh event stream.  
- `GET /api/mesh/topology` — Current agent graph.  
- `GET /api/mesh/health` — Availability summary.

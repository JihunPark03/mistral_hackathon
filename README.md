# AgentLance — AI Agent Marketplace

A Fiverr-like marketplace where AI agents are the workers, operating on a mesh network. Agents have browsable profiles, accept jobs, collaborate via handoffs, and deliver results (text, images, audio, code).

## Stack

- **Backend**: FastAPI + Python
- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Mistral (reasoning + orchestration), ElevenLabs (voice), HuggingFace (images + embeddings)

## Quick Start

### 1. Environment

```bash
cp .env.example .env
# Add your API keys to .env
```

### 2. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
# Bind to 0.0.0.0 so others on your network can reach it
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
# Expose Vite dev server to the LAN
npm run dev
```

Open http://localhost:5173

### Allowing other users to join

- The backend CORS whitelist is now configurable via `ALLOWED_ORIGINS` in `.env` (comma-separated, defaults to all origins). Use this to restrict/expand who can call the API.
- With the `--host 0.0.0.0` flags above, anyone on your LAN can open the frontend (port 5173) and talk to the backend (port 8000). Keep the ports open in your firewall/security groups.

## Demo Agents

| Agent | Powered By | Skill |
|-------|-----------|-------|
| **Nova** (Writer) | Mistral | Blog posts, copy, scripts |
| **Echo** (Voice Artist) | ElevenLabs | Voiceovers, narration |
| **Pixel** (Image Creator) | HuggingFace FLUX | Logos, banners, illustrations |
| **Cipher** (Code Developer) | Mistral Large | Code gen, review, debugging |
| **Mistral AI** (Orchestrator) | Mistral + structured output | Decomposes complex jobs |

Public default agents (used when you haven’t set your own) are priced at **~$3/hr** across writing, voice, image, and code.

### Default agents per skill

- At `/defaults` you can pick your own agent per skill (writing, voice, image, code, orchestration).
- “System default” is always available to fall back to; clearing your default reverts to it.

## Architecture

```
Frontend (React) → REST + WebSocket → FastAPI Backend
                                         ├── Agent Mesh Protocol
                                         │   ├── Registry
                                         │   ├── Router/Orchestrator
                                         │   └── Mesh State
                                         ├── Mistral Agents
                                         ├── ElevenLabs TTS
                                         └── HuggingFace Images/Embeddings
```

## API

- `GET /api/agents` — List all agents
- `GET /api/agents/:id` — Agent profile
- `POST /api/jobs` — Submit a job
- `GET /api/jobs/:id` — Job status + deliverables
- `WS /ws/jobs/:id` — Real-time job events
- `WS /ws/mesh` — Mesh event stream
- `GET /api/mesh/topology` — Agent network graph
- `GET /api/mesh/health` — System health

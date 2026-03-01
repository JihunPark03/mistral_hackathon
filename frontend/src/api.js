const BASE = ''
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function fetchAgents() {
  const res = await fetch(`${BASE}/api/agents`)
  return res.json()
}

export async function fetchAgent(id) {
  const res = await fetch(`${BASE}/api/agents/${id}`)
  return res.json()
}

export async function fetchAgentHandoffs(id) {
  const res = await fetch(`${BASE}/api/agents/${id}/handoffs`)
  return res.json()
}

export async function submitJob(job) {
  const res = await fetch(`${BASE}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  })
  return res.json()
}

export async function fetchJobs() {
  const res = await fetch(`${BASE}/api/jobs`)
  return res.json()
}

export async function fetchJob(id) {
  const res = await fetch(`${BASE}/api/jobs/${id}`)
  return res.json()
}

export async function rateJob(id, rating, review = '') {
  const res = await fetch(`${BASE}/api/jobs/${id}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, review }),
  })
  return res.json()
}

export async function fetchTopology() {
  const res = await fetch(`${BASE}/api/mesh/topology`)
  return res.json()
}

export async function fetchMeshHealth() {
  const res = await fetch(`${BASE}/api/mesh/health`)
  return res.json()
}

// Models (user-provided)
export async function fetchModels() {
  const res = await fetch(`${API_BASE}/models`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to load models')
  return res.json()
}

export async function createModel(payload) {
  const res = await fetch(`${API_BASE}/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Failed to create model')
  }
  return res.json()
}

export async function deleteModel(id) {
  const res = await fetch(`${API_BASE}/models/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Failed to delete model')
  }
  return res.json()
}

export async function activateModel(id) {
  const res = await fetch(`${API_BASE}/models/${id}/activate`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Failed to activate model')
  }
  return res.json()
}

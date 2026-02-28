const BASE = ''

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

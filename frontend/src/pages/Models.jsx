import { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { UploadCloud, Box, Trash } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export default function Models() {
  const { user, loading: authLoading, refresh } = useAuth()
  const [models, setModels] = useState([])
  const [form, setForm] = useState({ name: '', description: '', source_url: '', tag: 'Image' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const publicModels = [
    { name: 'black-forest-labs/FLUX.1-schnell', source_url: 'hf://router/models/black-forest-labs/FLUX.1-schnell', description: 'Default image model' },
    { name: 'sentence-transformers/all-MiniLM-L6-v2', source_url: 'hf://router/pipeline/feature-extraction/all-MiniLM-L6-v2', description: 'Default embeddings model' },
  ]

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/models`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load models')
      const data = await res.json()
      setModels(data)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (user) fetchModels()
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Upload failed')
      }
      setForm({ name: '', description: '', source_url: '', tag: 'Image' })
      await fetchModels()
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/models/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Delete failed')
      }
      await fetchModels()
    } catch (e) {
      setError(e.message)
    }
  }

  if (authLoading) return null
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-3">Available models</h2>
        <p className="text-gray-300 mb-4">Log in to manage your own uploads. You can use these defaults without an account.</p>
        <div className="space-y-3">
          {publicModels.map((m) => (
            <div key={m.name} className="border border-white/10 rounded-xl p-3 bg-black/20">
              <p className="text-white font-semibold">{m.name}</p>
              <p className="text-xs text-gray-400">{m.source_url}</p>
              <p className="text-sm text-gray-300 mt-1">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-lance-600/20 border border-lance-500/50 flex items-center justify-center">
            <Box className="text-lance-300" size={22} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-lance-300/80">My models</p>
            <h2 className="text-2xl font-bold text-white">{user.username}'s uploads</h2>
          </div>
        </div>
        <a
          href="#add-model"
          className="inline-flex items-center gap-2 rounded-xl bg-lance-500 hover:bg-lance-400 text-black font-semibold px-4 py-2 transition"
        >
          <UploadCloud size={16} />
          Add model
        </a>
      </div>

      <div className="grid lg:grid-cols-[2fr,1.2fr] gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-white font-semibold mb-3">Uploaded models</h3>
          {models.length === 0 && <p className="text-sm text-gray-400">No models yet.</p>}
          <div className="space-y-3">
            {models.map((m) => (
              <div key={m.id} className="border border-white/10 rounded-xl p-3 bg-black/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.source_url}</p>
                    <p className="text-xs text-lance-300 mt-1">{m.tag}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</span>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-300 hover:text-red-200 inline-flex items-center justify-center rounded-md border border-red-500/40 px-2 py-1 text-xs"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
                {m.description && <p className="text-sm text-gray-300 mt-1">{m.description}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-lance-500/20 bg-gradient-to-br from-lance-600/10 via-gray-900 to-gray-950 p-4">
          <div className="flex items-center gap-2 mb-3">
            <UploadCloud size={18} className="text-lance-300" />
            <h3 className="text-white font-semibold" id="add-model">
              Add a model
            </h3>
          </div>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Model name"
              className="w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
              value={form.name}
              onChange={handleChange}
              required
            />
            <select
              name="tag"
              className="w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
              value={form.tag}
              onChange={handleChange}
            >
              <option>Writing</option>
              <option>Voice</option>
              <option>Image</option>
              <option>Code</option>
              <option>Orchestration</option>
            </select>
            <input
              name="source_url"
              placeholder="Hub URL or endpoint"
              className="w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
              value={form.source_url}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description (optional)"
              className="w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
            {error && <div className="text-sm text-red-300 bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-lance-500 hover:bg-lance-400 text-black font-semibold py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Save model'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

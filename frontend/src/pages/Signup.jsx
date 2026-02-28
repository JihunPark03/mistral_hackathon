import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Shield } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export default function Signup() {
  const [form, setForm] = useState({ username: '', full_name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          full_name: form.full_name,
          email: form.email,
          password: form.password,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Sign up failed')
      }
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-lance-600/20 border border-lance-500/50 flex items-center justify-center">
              <UserPlus className="text-lance-300" size={22} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-lance-300/80">Create account</p>
              <h2 className="text-2xl font-bold text-white">Join AgentLance</h2>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm text-gray-300">Username</span>
              <input
                name="username"
                className="mt-1 w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-300">Full name</span>
              <input
                name="full_name"
                className="mt-1 w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
                value={form.full_name}
                onChange={handleChange}
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-300">Email</span>
              <input
                name="email"
                type="email"
                className="mt-1 w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-gray-300">Password</span>
                <input
                  name="password"
                  type="password"
                  className="mt-1 w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-300">Confirm</span>
                <input
                  name="confirm"
                  type="password"
                  className="mt-1 w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-200 bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-2">
                Account created — redirecting to login…
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-lance-500 hover:bg-lance-400 text-black font-semibold py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Shield size={16} />
              {loading ? 'Signing up…' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-lance-500/20 bg-gradient-to-br from-lance-600/20 via-gray-900 to-gray-950 p-8 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">What you get</h3>
          <ul className="space-y-3 text-sm text-gray-200">
            <li className="flex gap-3">
              <span className="text-lance-300">•</span>
              Upload and manage your own models (coming next).
            </li>
            <li className="flex gap-3">
              <span className="text-lance-300">•</span>
              Keep job history, deliverables, and preferences tied to your account.
            </li>
            <li className="flex gap-3">
              <span className="text-lance-300">•</span>
              Personalize agent prompts and reuse templates faster.
            </li>
          </ul>

          <div className="mt-8 text-sm text-gray-300 bg-black/30 border border-white/10 rounded-2xl p-4">
            <p className="font-semibold text-white mb-1">Dev notes</p>
            <p className="leading-relaxed">
              Endpoint: <code className="text-lance-200">POST {API_BASE}/register</code> with JSON body. Backend must have
              CORS allow-list set to your frontend origin and return 200 on success.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

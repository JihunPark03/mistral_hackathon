import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { ShieldCheck, KeyRound } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', username)
      form.append('password', password)

      const res = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        body: form,
        credentials: 'include', // receive HttpOnly cookie
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Login failed')
      }

      await refresh()
      navigate('/')
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
              <ShieldCheck className="text-lance-300" size={22} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-lance-300/80">Access</p>
              <h2 className="text-2xl font-bold text-white">Sign in to AgentLance</h2>
            </div>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Login to post jobs, upload your own models, and manage your deliverables. Cookies are used for secure
            sessions; keep this tab open while you work.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm text-gray-300">Username</span>
              <input
                className="mt-1 w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-300">Password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl bg-gray-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-lance-400 focus:ring-2 focus:ring-lance-500/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>

            {error && (
              <div className="text-sm text-red-300 bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-lance-500 hover:bg-lance-400 text-black font-semibold py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <KeyRound size={16} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-lance-500/20 bg-gradient-to-br from-lance-600/20 via-gray-900 to-gray-950 p-8 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Why sign in?</h3>
          <ul className="space-y-3 text-sm text-gray-200">
            <li className="flex gap-3">
              <span className="text-lance-300">•</span>
              Securely upload and manage your own models for jobs.
            </li>
            <li className="flex gap-3">
              <span className="text-lance-300">•</span>
              Track all job deliverables tied to your account.
            </li>
            <li className="flex gap-3">
              <span className="text-lance-300">•</span>
              Save preferred agents and reuse prompts faster.
            </li>
          </ul>

          <div className="mt-8 text-sm text-gray-300 bg-black/30 border border-white/10 rounded-2xl p-4">
            <p className="font-semibold text-white mb-1">Dev notes</p>
            <p className="leading-relaxed">
              Backend must allow credentials (CORS) and be reachable at <code className="text-lance-200">{API_BASE}</code>.
              Set <code className="text-lance-200">ALLOWED_ORIGINS</code> in <code className="text-lance-200">.env</code> to
              your frontend URL (e.g. http://localhost:5173) for cookies to stick.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

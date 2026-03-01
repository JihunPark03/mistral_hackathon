import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { fetchModels, activateModel } from '../api'

const TAGS = ['writing', 'voice', 'image', 'code', 'orchestration']
const PUBLIC_DEFAULTS = {
  writing: { id: 'public-writing', name: 'Mistral Large', source_url: 'mistral-large-latest' },
  voice: { id: 'public-voice', name: 'ElevenLabs Default Voice', source_url: 'elevenlabs/default-voice' },
  image: { id: 'public-image', name: 'FLUX.1-schnell', source_url: 'black-forest-labs/FLUX.1-schnell' },
  code: { id: 'public-code', name: 'Mistral Large (code)', source_url: 'mistral-large-latest' },
  orchestration: { id: 'public-orch', name: 'Mistral AI', source_url: 'mistral-large-latest' },
}

export default function DefaultAgents() {
  const { user, loading: authLoading } = useAuth()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingTag, setSavingTag] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchModels()
      setModels(data)
    } catch (e) {
      setError(e.message || 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => {
    const map = {}
    TAGS.forEach(t => { map[t] = [] })
    models.forEach(m => {
      const tag = (m.tag || '').toLowerCase()
      if (map[tag]) map[tag].push(m)
    })
    return map
  }, [models])

  const currentDefault = (tag) => grouped[tag]?.find(m => m.is_default)

  const setDefault = async (modelId, tag) => {
    setSavingTag(tag)
    setError('')
    try {
      await activateModel(modelId)
      await load()
    } catch (e) {
      setError(e.message || 'Failed to set default')
    } finally {
      setSavingTag('')
    }
  }

  if (authLoading) return null
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center text-gray-300">
        Log in to manage your default agents.
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-lance-300/80">Defaults</p>
          <h1 className="text-3xl font-bold text-white">Default Agents per Skill</h1>
          <p className="text-gray-400 mt-1">Pick which of your uploaded agents should handle each skill by default.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-sm text-gray-200 hover:border-lance-400"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <div className="text-sm text-red-300 bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        {TAGS.map(tag => {
          const options = grouped[tag] || []
          const active = currentDefault(tag)
          const publicOption = PUBLIC_DEFAULTS[tag]
          return (
            <div key={tag} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{tag}</p>
                  <p className="text-white font-semibold">
                    {active ? active.name : publicOption?.name || 'No default selected'}
                  </p>
                  {(active || publicOption) && (
                    <p className="text-xs text-gray-500">{(active || publicOption).source_url}</p>
                  )}
                </div>
                {active && (
                  <span className="inline-flex items-center gap-1 text-emerald-300 text-xs">
                    <CheckCircle2 size={14} />
                    Active
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {publicOption && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                    <input
                      type="radio"
                      name={`default-${tag}`}
                      checked={!active}
                      readOnly
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{publicOption.name}</p>
                      <p className="text-xs text-gray-500">{publicOption.source_url}</p>
                    </div>
                    {!active && <CheckCircle2 size={14} className="text-emerald-300" />}
                  </label>
                )}
                {options.length === 0 ? (
                  <p className="text-sm text-gray-500">No agents uploaded for this skill yet.</p>
                ) : (
                  options.map(m => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        m.is_default
                          ? 'border-emerald-400/50 bg-emerald-500/5'
                          : 'border-white/10 hover:border-lance-400/50 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`default-${tag}`}
                        checked={m.is_default || false}
                        onChange={() => setDefault(m.id, tag)}
                        disabled={savingTag === tag}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.source_url}</p>
                      </div>
                      {m.is_default && <CheckCircle2 size={14} className="text-emerald-300" />}
                    </label>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

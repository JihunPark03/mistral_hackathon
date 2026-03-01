import { useState, useEffect } from 'react'
import { Search, Filter, PlusCircle, CheckCircle2, Star, Trash2 } from 'lucide-react'
import { fetchModels, createModel, deleteModel, activateModel } from '../api'
import useAuth from '../hooks/useAuth'
import AgentCard from '../components/AgentCard'

const SKILL_FILTERS = ['all', 'writing', 'voice', 'image', 'code', 'orchestration']
const PUBLIC_DEFAULT_MAP = {
  image: 'public-flux-schnell',
  writing: 'public-mistral',
  voice: 'public-elevenlabs',
  orchestration: 'public-orchestration',
}
const PUBLIC_MODELS = [
  {
    id: 'public-flux-schnell',
    name: 'FLUX.1-schnell',
    description: 'Default fast image model from black-forest-labs',
    tag: 'image',
    source_url: 'black-forest-labs/FLUX.1-schnell',
    price: 0,
    is_default: true,
  },
  {
    id: 'public-all-minilm',
    name: 'all-MiniLM-L6-v2',
    description: 'SentenceTransformers MiniLM embeddings',
    tag: 'writing',
    source_url: 'sentence-transformers/all-MiniLM-L6-v2',
    price: 0,
    is_default: true,
  },
  {
    id: 'public-mistral',
    name: 'Mistral Large',
    description: 'Default text/writing model from Mistral AI',
    tag: 'writing',
    source_url: 'mistral-large-latest',
    price: 0,
    is_default: true,
  },
  {
    id: 'public-elevenlabs',
    name: 'ElevenLabs Default Voice',
    description: 'Default TTS voice model from ElevenLabs',
    tag: 'voice',
    source_url: 'elevenlabs/default-voice',
    price: 0,
    is_default: true,
  },
  {
    id: 'public-orchestration',
    name: 'Mistral AI',
    description: 'Default orchestration brain for decomposing jobs',
    tag: 'orchestration',
    source_url: 'mistral-large-latest',
    price: 0,
    is_default: true,
  },
]

export default function Marketplace() {
  const [agents, setAgents] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState(null)
  const [ratings, setRatings] = useState({})
  const [models, setModels] = useState([])
  const [defaults, setDefaults] = useState({}) // tag -> modelId
  const [defaultOnly, setDefaultOnly] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    tag: 'writing',
    source_url: '',
    price: 0,
    is_default: false,
  })
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // preload public defaults
    const publicMap = { ...PUBLIC_DEFAULT_MAP }
    PUBLIC_MODELS.forEach((m) => {
      if (m.is_default) publicMap[(m.tag || '').toLowerCase()] = m.id
    })
    setDefaults(publicMap)

    if (!user) {
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const data = await fetchModels()
        setModels(data)
        // compute defaults map, overlaying on public defaults
        const map = { ...publicMap }
        data.forEach((m) => {
          if (m.is_default) map[m.tag.toLowerCase()] = m.id
        })
        setDefaults(map)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const asAgent = (m) => {
    const tag = m.tag?.toLowerCase() || 'image'
    const avatarByTag = {
      writing: 'pencil',
      voice: 'microphone',
      image: 'palette',
      code: 'terminal',
      orchestration: 'network',
    }
    return {
      id: m.id,
      name: m.name,
      description: m.description || m.source_url,
      skills: [tag],
      role: m.tag,
      rating: 5.0,
      jobs_completed: 0,
      hourly_rate: m.price ?? 0,
      avatar: avatarByTag[tag] || 'terminal',
      status: 'available',
      is_default: m.is_default,
      owner: m.owner || 'user',
    }
  }

  const publicAgents = PUBLIC_MODELS.map((m) => ({
    ...asAgent(m),
    owner: 'public',
  }))
  const allAgents = [...publicAgents, ...models.map((m) => asAgent({ ...m, owner: 'user' }))]

  const filtered = allAgents.filter(a => {
    if (filter !== 'all' && !a.skills.includes(filter)) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.description.toLowerCase().includes(search.toLowerCase())) return false
    if (defaultOnly && defaults[a.skills[0]] !== a.id) return false
    return true
  })

  const handleAddAgent = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: form.name,
        description: form.description,
        tag: form.tag,
        source_url: form.source_url,
        price: Number(form.price) || 0,
        is_default: form.is_default,
      }
      const model = await createModel(payload)
      setModels((prev) => [...prev, model])
      if (model.is_default) {
        setDefaults((prev) => ({ ...prev, [model.tag.toLowerCase()]: model.id }))
      }
      setForm({ name: '', description: '', tag: 'writing', source_url: '', price: 0, is_default: false })
      setShowAdd(false)
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  const handleCardClick = (agent) => {
    setSelected(agent)
    setShowDetail(true)
  }

  const handleDelete = async (agent) => {
    if (!user) return
    if (agent.owner === 'public' || agent.id.toString().startsWith('public-')) return
    try {
      await deleteModel(agent.id)
      setModels((prev) => prev.filter((m) => m.id !== agent.id))
      setShowDetail(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRate = (agent, value) => {
    setRatings((r) => ({ ...r, [agent.id]: value }))
  }

  const handleActivate = async (agent) => {
    if (!user) {
      alert('Log in to set your defaults')
      return
    }
    if (agent.owner === 'public' || agent.id.toString().startsWith('public-')) return
    try {
      const updated = await activateModel(agent.id)
      const tag = (updated.tag || '').toLowerCase()
      // refresh defaults map for that tag only, keep others (including public)
      const map = { ...defaults, [tag]: updated.id }
      setDefaults(map)
      // sync local models list with updated default flags
      setModels((prev) =>
        prev.map((m) =>
          m.tag?.toLowerCase() === tag
            ? { ...m, is_default: m.id === updated.id }
            : m
        )
      )
      setSelected((s) =>
        s && s.id === updated.id ? { ...s, is_default: true } : s
      )
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
          Hire AI <span className="text-lance-400">Agents</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Browse our mesh network of specialized AI agents. They collaborate, hand off work,
          and deliver results in real-time.
        </p>
      </div>

      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 items-start">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full pl-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {SKILL_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                filter === s
                  ? 'bg-lance-600/20 text-lance-400 border border-lance-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'All Agents' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          {/* <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-lance-500 hover:bg-lance-400 text-black"
          >
            <PlusCircle size={14} />
            Add agent
          </button> */}
          <label className="flex items-center gap-2 text-xs text-gray-300 ml-2">
            <input
              type="checkbox"
              checked={defaultOnly}
              onChange={(e) => setDefaultOnly(e.target.checked)}
            />
            Show defaults only
          </label>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass-card animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isDefault={defaults[agent.skills[0]] === agent.id}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No agents found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
    {/* Add agent modal */}
    {showAdd && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-950 border border-white/10 rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Add agent</h3>
            <button className="text-gray-400" onClick={() => setShowAdd(false)}>✕</button>
          </div>
          <form className="space-y-3" onSubmit={handleAddAgent}>
            <input
              className="input-field w-full"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <textarea
              className="input-field w-full"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
            <select
              className="input-field w-full"
              value={form.tag}
              onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
            >
              <option value="writing">Writing</option>
              <option value="voice">Voice</option>
              <option value="image">Image</option>
              <option value="code">Code</option>
              <option value="orchestration">Orchestration</option>
            </select>
            <input
              className="input-field w-full"
              placeholder="Model URL / endpoint"
              value={form.source_url}
              onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
              required
            />
            <input
              type="number"
              className="input-field w-full"
              placeholder="Price (credits or $)"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              min={0}
            />
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
              />
              Set as default for this tag (only one default per tag)
            </label>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-lance-500 hover:bg-lance-400 text-black font-semibold py-2.5"
            >
              <CheckCircle2 size={16} />
              Save agent
            </button>
          </form>
        </div>
      </div>
    )}
    {showDetail && selected && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-950 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                {selected.name}
              </h3>
              <p className="text-xs text-gray-400">{selected.role}</p>
            </div>
            <button className="text-gray-400" onClick={() => setShowDetail(false)}>✕</button>
          </div>
          <p className="text-gray-200 text-sm mb-3">{selected.description}</p>
          <p className="text-xs text-gray-400 mb-3">Source: {selected.source_url}</p>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-400">Rate:</span>
            <span className="text-white font-semibold">${selected.hourly_rate}/hr</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {[1,2,3,4,5].map((i) => (
              <button
                key={i}
                onClick={() => handleRate(selected, i)}
                className={ratings[selected.id] >= i ? 'text-amber-400' : 'text-gray-600'}
              >
                <Star size={18} fill={ratings[selected.id] >= i ? 'currentColor' : 'none'} />
              </button>
            ))}
            <span className="text-xs text-gray-400">
              {ratings[selected.id] ? `${ratings[selected.id]}.0 / 5` : 'Rate this model'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">Tag: {selected.skills[0]}</div>
            <span className="inline-flex items-center gap-1 text-emerald-300 text-sm ml-auto">
              <CheckCircle2 size={14} />
              Active
            </span>
            {user && !(selected.owner === 'public' || selected.id.toString().startsWith('public-')) && (
              <button
                onClick={() => handleDelete(selected)}
                className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 text-sm"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}

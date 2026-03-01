import { useState, useEffect } from 'react'
import { Search, Filter, PlusCircle, CheckCircle2 } from 'lucide-react'
import { fetchAgents } from '../api'
import AgentCard from '../components/AgentCard'

const SKILL_FILTERS = ['all', 'writing', 'voice', 'image', 'code', 'orchestration']

export default function Marketplace() {
  const [agents, setAgents] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [customAgents, setCustomAgents] = useState([])
  const [defaults, setDefaults] = useState({}) // tag -> agentId
  const [form, setForm] = useState({ name: '', description: '', skill: 'writing', rate: 40, makeDefault: false })

  useEffect(() => {
    fetchAgents().then(data => {
      setAgents(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const allAgents = [...agents, ...customAgents]

  const filtered = allAgents.filter(a => {
    if (filter !== 'all' && !a.skills.includes(filter)) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleAddAgent = (e) => {
    e.preventDefault()
    const id = `custom-${Date.now()}`
    const newAgent = {
      id,
      name: form.name || 'Untitled Agent',
      description: form.description || 'Custom agent',
      skills: [form.skill],
      role: form.skill.charAt(0).toUpperCase() + form.skill.slice(1),
      rating: 5.0,
      jobs_completed: 0,
      hourly_rate: Number(form.rate) || 0,
      avatar: 'terminal',
      status: 'available',
    }
    setCustomAgents((prev) => [...prev, newAgent])
    if (form.makeDefault) {
      setDefaults((prev) => ({ ...prev, [form.skill]: id }))
    }
    setForm({ name: '', description: '', skill: 'writing', rate: 40, makeDefault: false })
    setShowAdd(false)
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
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-lance-500 hover:bg-lance-400 text-black"
          >
            <PlusCircle size={14} />
            Add agent
          </button>
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
              value={form.skill}
              onChange={e => setForm(f => ({ ...f, skill: e.target.value }))}
            >
              <option value="writing">Writing</option>
              <option value="voice">Voice</option>
              <option value="image">Image</option>
              <option value="code">Code</option>
              <option value="orchestration">Orchestration</option>
            </select>
            <input
              type="number"
              className="input-field w-full"
              placeholder="Rate (per hour)"
              value={form.rate}
              onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
              min={0}
            />
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.makeDefault}
                onChange={e => setForm(f => ({ ...f, makeDefault: e.target.checked }))}
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
    </>
  )
}

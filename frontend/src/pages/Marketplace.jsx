import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import { fetchAgents } from '../api'
import AgentCard from '../components/AgentCard'

const SKILL_FILTERS = ['all', 'writing', 'voice', 'image', 'code', 'orchestration']

export default function Marketplace() {
  const [agents, setAgents] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents().then(data => {
      setAgents(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = agents.filter(a => {
    if (filter !== 'all' && !a.skills.includes(filter)) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
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
        <div className="flex gap-1.5 flex-wrap">
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
            <AgentCard key={agent.id} agent={agent} />
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
  )
}

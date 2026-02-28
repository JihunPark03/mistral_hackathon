import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Briefcase, DollarSign, ArrowRight, Zap } from 'lucide-react'
import { fetchAgent, fetchAgentHandoffs, submitJob } from '../api'
import { AgentAvatar, SkillBadge } from '../components/AgentCard'

export default function AgentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [handoffs, setHandoffs] = useState([])
  const [jobDesc, setJobDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAgent(id).then(setAgent)
    fetchAgentHandoffs(id).then(setHandoffs)
  }, [id])

  const handleHire = async () => {
    if (!jobDesc.trim()) return
    setSubmitting(true)
    const job = await submitJob({
      title: `Job for ${agent.name}`,
      description: jobDesc,
      required_skills: agent.skills,
      client_name: 'User',
    })
    navigate(`/jobs/${job.id}`)
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="glass-card animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="glass-card mb-6">
        <div className="flex items-start gap-5">
          <AgentAvatar avatar={agent.avatar} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <span className={`w-2.5 h-2.5 rounded-full ${
                agent.status === 'available' ? 'bg-green-400' : 'bg-amber-400'
              }`} />
              <span className="text-sm text-gray-400 capitalize">{agent.status}</span>
            </div>
            <p className="text-gray-400 mb-3">{agent.role}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {agent.skills.map(s => <SkillBadge key={s} skill={s} />)}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{agent.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
              <Star size={16} />
              <span className="text-xl font-bold text-white">{agent.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-gray-500">Rating</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Briefcase size={16} className="text-gray-400" />
              <span className="text-xl font-bold">{agent.jobs_completed}</span>
            </div>
            <span className="text-xs text-gray-500">Jobs Done</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-xl font-bold">${agent.hourly_rate}</span>
            </div>
            <span className="text-xs text-gray-500">Per Hour</span>
          </div>
        </div>
      </div>

      {/* Handoff Network */}
      {handoffs.length > 0 && (
        <div className="glass-card mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Can Hand Off To
          </h2>
          <div className="flex flex-wrap gap-3">
            {handoffs.map(h => (
              <button
                key={h.id}
                onClick={() => navigate(`/agents/${h.id}`)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-white/5"
              >
                <AgentAvatar avatar={h.avatar} size="sm" />
                <div className="text-left">
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-gray-500">{h.role}</p>
                </div>
                <ArrowRight size={14} className="text-gray-500 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hire Form */}
      <div className="glass-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap size={18} className="text-lance-400" />
          Hire {agent.name}
        </h2>
        <textarea
          value={jobDesc}
          onChange={e => setJobDesc(e.target.value)}
          placeholder={`Describe what you need ${agent.name} to do...`}
          className="input-field w-full h-32 resize-none mb-4"
        />
        <button
          onClick={handleHire}
          disabled={!jobDesc.trim() || submitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>Processing...</>
          ) : (
            <>
              <Zap size={16} />
              Submit Job
            </>
          )}
        </button>
      </div>
    </div>
  )
}

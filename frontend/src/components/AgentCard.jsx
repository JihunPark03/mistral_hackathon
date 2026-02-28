import { Link } from 'react-router-dom'
import { Star, Briefcase, DollarSign, Pencil, Mic, Palette, Terminal, Network } from 'lucide-react'

const SKILL_COLORS = {
  writing: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  voice: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  image: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  code: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  orchestration: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
}

const SKILL_ICONS = {
  writing: Pencil,
  voice: Mic,
  image: Palette,
  code: Terminal,
  orchestration: Network,
}

const AVATARS = {
  pencil: '✍️',
  microphone: '🎙️',
  palette: '🎨',
  terminal: '💻',
  network: '🕸️',
}

export function SkillBadge({ skill }) {
  const colors = SKILL_COLORS[skill] || SKILL_COLORS.writing
  const Icon = SKILL_ICONS[skill] || Pencil
  return (
    <span className={`skill-badge ${colors.bg} ${colors.text} ${colors.border} flex items-center gap-1`}>
      <Icon size={10} />
      {skill}
    </span>
  )
}

export function AgentAvatar({ avatar, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-lg', md: 'w-12 h-12 text-2xl', lg: 'w-20 h-20 text-4xl' }
  return (
    <div className={`${sizes[size]} rounded-xl bg-white/10 flex items-center justify-center`}>
      {AVATARS[avatar] || '🤖'}
    </div>
  )
}

export default function AgentCard({ agent }) {
  return (
    <Link to={`/agents/${agent.id}`} className="glass-card block group cursor-pointer">
      <div className="flex items-start gap-4">
        <AgentAvatar avatar={agent.avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white group-hover:text-lance-400 transition-colors">
              {agent.name}
            </h3>
            <span className={`w-2 h-2 rounded-full ${
              agent.status === 'available' ? 'bg-green-400' :
              agent.status === 'busy' ? 'bg-amber-400' : 'bg-gray-500'
            }`} />
          </div>
          <p className="text-sm text-gray-400 mb-3">{agent.role}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {agent.skills.map(s => <SkillBadge key={s} skill={s} />)}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{agent.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Star size={12} className="text-amber-400" />
          {agent.rating.toFixed(1)}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase size={12} />
          {agent.jobs_completed} jobs
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <DollarSign size={12} />
          ${agent.hourly_rate}/hr
        </span>
      </div>
    </Link>
  )
}

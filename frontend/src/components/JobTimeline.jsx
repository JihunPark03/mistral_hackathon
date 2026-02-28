import { CheckCircle, Circle, Loader, AlertCircle, ArrowRight, Zap } from 'lucide-react'

const EVENT_ICONS = {
  job_created: { icon: Zap, color: 'text-lance-400' },
  job_decomposed: { icon: ArrowRight, color: 'text-purple-400' },
  subtask_assigned: { icon: Circle, color: 'text-blue-400' },
  subtask_started: { icon: Loader, color: 'text-amber-400' },
  subtask_completed: { icon: CheckCircle, color: 'text-green-400' },
  subtask_failed: { icon: AlertCircle, color: 'text-red-400' },
  handoff: { icon: ArrowRight, color: 'text-purple-400' },
  job_completed: { icon: CheckCircle, color: 'text-green-400' },
  job_failed: { icon: AlertCircle, color: 'text-red-400' },
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString()
}

function eventLabel(event) {
  const d = event.data || {}
  switch (event.type) {
    case 'job_created': return `Job created: ${d.title || ''}`
    case 'job_decomposed': return `Decomposed into ${d.subtask_count} subtasks`
    case 'subtask_assigned': return `${d.agent_name} assigned: ${d.skill}`
    case 'subtask_started': return `${d.title} started`
    case 'subtask_completed': return `${d.title} completed (${d.deliverable_type})`
    case 'subtask_failed': return `${d.title} failed: ${d.error || 'unknown'}`
    case 'handoff': return `Handoff: ${d.source_name} → ${d.target_name}`
    case 'job_completed': return `Job completed! ${d.deliverables_count} deliverables`
    case 'job_failed': return `Job failed: ${d.error || JSON.stringify(d.failed_subtasks || [])}`
    default: return event.type
  }
}

export default function JobTimeline({ events }) {
  if (!events.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Loader size={24} className="animate-spin mx-auto mb-3" />
        <p>Waiting for events...</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => {
        const { icon: Icon, color } = EVENT_ICONS[event.type] || EVENT_ICONS.job_created
        const isLast = i === events.length - 1
        return (
          <div key={event.id || i} className="flex gap-3 group">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${color} ${
                isLast ? 'ring-2 ring-lance-500/30' : ''
              }`}>
                <Icon size={14} className={event.type === 'subtask_started' ? 'animate-spin' : ''} />
              </div>
              {!isLast && <div className="w-px h-full bg-white/10 min-h-[24px]" />}
            </div>
            {/* Content */}
            <div className={`pb-4 ${isLast ? '' : ''}`}>
              <p className="text-sm text-white font-medium">{eventLabel(event)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatTime(event.timestamp)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

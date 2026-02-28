import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock, CheckCircle, AlertCircle, Loader, ChevronRight } from 'lucide-react'
import { fetchJobs, fetchJob } from '../api'
import { connectJobWS } from '../ws'
import JobTimeline from '../components/JobTimeline'
import DeliverableViewer, { DeliverableIcon } from '../components/DeliverableViewer'

const STATUS_STYLES = {
  pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-400/10' },
  decomposing: { icon: Loader, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  in_progress: { icon: Loader, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
  failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
}

function StatusBadge({ status }) {
  const { icon: Icon, color, bg } = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${color} ${bg}`}>
      <Icon size={12} className={status === 'in_progress' || status === 'decomposing' ? 'animate-spin' : ''} />
      {status.replace('_', ' ')}
    </span>
  )
}

function JobDetail({ jobId }) {
  const [job, setJob] = useState(null)
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetchJob(jobId).then(setJob)

    const ws = connectJobWS(jobId, (event) => {
      setEvents(prev => [...prev, event])
      // Refresh job data on key events
      if (['job_completed', 'job_failed', 'subtask_completed'].includes(event.type)) {
        fetchJob(jobId).then(setJob)
      }
    })

    return () => ws.close()
  }, [jobId])

  if (!job) {
    return <div className="glass-card animate-pulse h-64" />
  }

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <div className="glass-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{job.title}</h2>
            <p className="text-sm text-gray-400 mt-1">by {job.client_name}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-sm text-gray-300 mb-4">{job.description}</p>

        {/* Subtasks */}
        {job.subtasks.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subtasks</h3>
            <div className="space-y-2">
              {job.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/5">
                  <StatusBadge status={st.status} />
                  <span className="text-sm flex-1">{st.title}</span>
                  <span className="text-xs text-gray-500">{st.required_skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass-card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Live Timeline</h3>
        <JobTimeline events={events} />
      </div>

      {/* Deliverables */}
      {job.deliverables.length > 0 && (
        <div className="glass-card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Deliverables</h3>
          <div className="space-y-4">
            {job.deliverables.map(d => (
              <div key={d.id}>
                <div className="flex items-center gap-2 mb-2">
                  <DeliverableIcon type={d.type} />
                  <span className="text-sm font-medium capitalize">{d.type}</span>
                </div>
                <DeliverableViewer deliverable={d} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function JobList() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs().then(data => {
      setJobs(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="glass-card animate-pulse h-20" />)}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">No jobs yet</p>
        <Link to="/post-job" className="btn-primary inline-flex items-center gap-2">
          Post your first job
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {[...jobs].reverse().map(job => (
        <Link key={job.id} to={`/jobs/${job.id}`} className="glass-card flex items-center gap-4 group">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium group-hover:text-lance-400 transition-colors">{job.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{job.description}</p>
          </div>
          <StatusBadge status={job.status} />
          <ChevronRight size={16} className="text-gray-600" />
        </Link>
      ))}
    </div>
  )
}

export default function JobTracker() {
  const { id } = useParams()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {id ? 'Job Tracker' : 'All Jobs'}
      </h1>
      {id ? <JobDetail jobId={id} /> : <JobList />}
    </div>
  )
}

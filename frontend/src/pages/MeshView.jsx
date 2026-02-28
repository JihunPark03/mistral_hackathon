import { useState, useEffect } from 'react'
import { Activity, Wifi } from 'lucide-react'
import { fetchTopology, fetchMeshHealth } from '../api'
import { connectMeshWS } from '../ws'
import MeshGraph from '../components/MeshGraph'

export default function MeshView() {
  const [topology, setTopology] = useState(null)
  const [health, setHealth] = useState(null)
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    fetchTopology().then(setTopology).catch(() => {})
    fetchMeshHealth().then(setHealth).catch(() => {})

    const ws = connectMeshWS(
      (event) => setEvents(prev => [...prev.slice(-99), event]),
      {
        onOpen: () => setConnected(true),
        onClose: () => setConnected(false),
      }
    )

    return () => ws.close()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Mesh</h1>
          <p className="text-gray-400 mt-1">Real-time view of the agent network topology</p>
        </div>
        <div className="flex items-center gap-4">
          {health && (
            <div className="glass px-4 py-2 text-sm">
              <span className="text-gray-400">Agents: </span>
              <span className="font-bold text-green-400">{health.agents_available}</span>
              <span className="text-gray-500">/{health.agents_total}</span>
            </div>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            <Wifi size={12} />
            {connected ? 'Live' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="glass mb-6" style={{ height: '550px' }}>
        {topology ? (
          <MeshGraph topology={topology} events={events} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading mesh topology...
          </div>
        )}
      </div>

      {/* Event Feed */}
      <div className="glass-card">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity size={14} />
          Live Event Feed
        </h2>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Waiting for mesh events... Submit a job to see activity.
            </p>
          ) : (
            [...events].reverse().map((event, i) => (
              <div key={event.id || i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/5 text-sm">
                <span className="w-2 h-2 rounded-full bg-lance-400 animate-pulse-slow flex-shrink-0" />
                <span className="text-gray-300 flex-1">{event.type.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-600">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

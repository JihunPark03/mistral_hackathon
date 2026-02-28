import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Zap, Users, UserPlus, PlusCircle, Activity, Network } from 'lucide-react'
import Marketplace from './pages/Marketplace'
import AgentProfile from './pages/AgentProfile'
import PostJob from './pages/PostJob'
import JobTracker from './pages/JobTracker'
import MeshView from './pages/MeshView'
import Login from './pages/Login'
import Signup from './pages/Signup'

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-lance-600/20 text-lance-400 border border-lance-500/30'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-lance-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-lance-600/30 transition-all">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Agent<span className="text-lance-400">Lance</span>
              </span>
            </NavLink>

            <nav className="flex items-center gap-1">
              <NavItem to="/" icon={Users} label="Marketplace" />
              <NavItem to="/post-job" icon={PlusCircle} label="Post Job" />
              <NavItem to="/jobs" icon={Activity} label="Jobs" />
              <NavItem to="/mesh" icon={Network} label="Mesh" />
              <NavItem to="/login" icon={Users} label="Login" />
              <NavItem to="/signup" icon={UserPlus} label="Sign Up" />
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/agents/:id" element={<AgentProfile />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/jobs" element={<JobTracker />} />
            <Route path="/jobs/:id" element={<JobTracker />} />
            <Route path="/mesh" element={<MeshView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-4 text-center text-xs text-gray-600">
          AgentLance — AI Agent Marketplace on a Mesh Network
        </footer>
      </div>
    </BrowserRouter>
  )
}

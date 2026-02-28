import { useEffect, useState, useCallback, createContext, useContext, useMemo } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/me/`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const value = useMemo(() => ({ user, loading, logout, refresh: fetchMe, setUser }), [user, loading, logout, fetchMe])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default function useAuth() {
  return useContext(AuthContext) || { user: null, loading: true, logout: () => {}, refresh: () => {} }
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../api/auth'

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ─── Helper: compute rank from rating ─────────────────────────────────────────
export function getRank(rating) {
  if (!rating || rating < 1200) return 'Newbie'
  if (rating < 1400) return 'Pupil'
  if (rating < 1600) return 'Specialist'
  if (rating < 1900) return 'Expert'
  if (rating < 2100) return 'Candidate Master'
  if (rating < 2400) return 'Master'
  return 'Grandmaster'
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while checking stored token

  // On mount: if an access token exists, fetch the current user
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then((userData) => setUser(userData))
      .catch(() => {
        // Token is invalid or expired and refresh failed — clear everything
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      })
      .finally(() => setLoading(false))
  }, [])

  /** Login and hydrate user state */
  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    setUser(data.user)
    return data
  }, [])

  /** Register and hydrate user state */
  const register = useCallback(async (username, email, password) => {
    const data = await apiRegister(username, email, password)
    setUser(data.user)
    return data
  }, [])

  /** Logout: clear server session + local state */
  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  /** Refresh user data from server (e.g. after profile update) */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await getMe()
      setUser(userData)
    } catch {
      setUser(null)
    }
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    rank: user ? getRank(user.rating) : null,
    login,
    logout,
    register,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export default AuthContext

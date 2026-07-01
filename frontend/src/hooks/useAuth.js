import { useAuth } from '../contexts/AuthContext'

/**
 * Convenience hook to access the auth context.
 * Provides: user, loading, isAuthenticated, rank, login, logout, register, refreshUser
 */
export default function useAuthHook() {
  return useAuth()
}

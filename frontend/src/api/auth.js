import apiClient from './client'

/**
 * Authenticate an existing user and store JWT tokens.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, accessToken, refreshToken}>}
 */
export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password })
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return data
}

/**
 * Register a new user account.
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, accessToken, refreshToken}>}
 */
export async function register(username, email, password) {
  const { data } = await apiClient.post('/auth/register', { username, email, password })
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return data
}

/**
 * Log out the current user — clears tokens from localStorage.
 * Also notifies the server to invalidate the refresh token.
 */
export async function logout() {
  const refreshToken = localStorage.getItem('refreshToken')
  try {
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken })
    }
  } catch {
    // Ignore errors — we still clear locally
  } finally {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
}

/**
 * Exchange a refresh token for a new access token.
 * @returns {Promise<{accessToken, refreshToken}>}
 */
export async function refreshToken() {
  const token = localStorage.getItem('refreshToken')
  const { data } = await apiClient.post('/auth/refresh', { refreshToken: token })
  localStorage.setItem('accessToken', data.accessToken)
  if (data.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken)
  }
  return data
}

/**
 * Fetch the currently authenticated user's profile.
 * @returns {Promise<User>}
 */
export async function getMe() {
  const { data } = await apiClient.get('/auth/me')
  return data
}

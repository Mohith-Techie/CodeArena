import apiClient from './client'

/**
 * Fetch a paginated global leaderboard.
 * @param {number} page - 1-indexed page number
 * @param {number} limit - results per page (default 50)
 */
export async function getLeaderboard(page = 1, limit = 50) {
  const { data } = await apiClient.get('/leaderboard', { params: { page, limit } })
  return data
}

/**
 * Fetch a user's public profile by username.
 * @param {string} username
 */
export async function getUserProfile(username) {
  const { data } = await apiClient.get(`/users/${username}`)
  return data
}

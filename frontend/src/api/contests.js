import apiClient from './client'

/**
 * Fetch all contests with optional status filter.
 * @param {{ status?: 'UPCOMING'|'LIVE'|'PAST' }} params
 */
export async function getContests(params = {}) {
  const { data } = await apiClient.get('/contests', { params })
  return data
}

/**
 * Fetch a single contest by ID.
 * @param {string} id
 */
export async function getContest(id) {
  const { data } = await apiClient.get(`/contests/${id}`)
  return data
}

/**
 * Register the authenticated user for a contest.
 * @param {string} id - Contest ID
 */
export async function registerForContest(id) {
  const { data } = await apiClient.post(`/contests/${id}/register`)
  return data
}

/**
 * Fetch the real-time standings for a contest.
 * @param {string} id - Contest ID
 */
export async function getContestStandings(id) {
  const { data } = await apiClient.get(`/contests/${id}/standings`)
  return data
}

/**
 * Create a new contest (admin only).
 * @param {Object} contestData
 */
export async function createContest(contestData) {
  const { data } = await apiClient.post('/contests', contestData)
  return data
}

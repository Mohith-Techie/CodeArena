import apiClient from './client'

/**
 * Submit code for a problem.
 * @param {{ problemId: string, language: string, code: string, contestId?: string }} data
 */
export async function submitCode(data) {
  const { data: res } = await apiClient.post('/submissions', data)
  return res
}

/**
 * Fetch submissions with optional filters.
 * @param {{ problemId?: string, userId?: string, page?: number, limit?: number }} params
 */
export async function getSubmissions(params = {}) {
  const { data } = await apiClient.get('/submissions', { params })
  return data
}

/**
 * Fetch a single submission by ID.
 * @param {string} id
 */
export async function getSubmission(id) {
  const { data } = await apiClient.get(`/submissions/${id}`)
  return data
}

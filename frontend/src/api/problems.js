import apiClient from './client'

/**
 * Fetch a paginated, optionally filtered list of problems.
 * @param {{ difficulty?: string, search?: string, tags?: string[], page?: number, limit?: number }} filters
 */
export async function getProblems(filters = {}) {
  const { data } = await apiClient.get('/problems', { params: filters })
  return data
}

/**
 * Fetch a single problem by its URL slug.
 * @param {string} slug
 */
export async function getProblem(slug) {
  const { data } = await apiClient.get(`/problems/${slug}`)
  return data.problem ?? data
}

/**
 * Create a new problem (admin only).
 * @param {Object} problemData
 */
export async function createProblem(problemData) {
  const { data } = await apiClient.post('/problems', problemData)
  return data
}

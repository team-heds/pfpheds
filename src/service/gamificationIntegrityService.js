import { apiClient, normalizeApiError } from '@/service/apiClient'

export async function getGamificationIntegrityReport() {
  try {
    const response = await apiClient.get('/admin/gamification-integrity/report')
    return response.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}

export async function simulateGamificationIntegrityPlan(issueIds) {
  const response = await apiClient.post('/admin/gamification-integrity/plan', { issueIds })
  return response.data
}

import apiClient from '@/service/apiClient'

export async function sendAdminPasswordRecovery(userId) {
  const { data } = await apiClient.post(
    `/admin/users/${encodeURIComponent(userId)}/password-recovery`
  )
  return data
}

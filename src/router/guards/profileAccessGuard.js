import { canViewUserProfile } from '@/service/globalSearchService'

export async function profileAccessGuard(to) {
  try {
    const allowed = await canViewUserProfile(to.params.id)
    return allowed ? true : { path: '/access', query: { reason: 'profile-scope' } }
  } catch (error) {
    console.error('[ProfileAccessGuard] Vérification Supabase impossible:', error)
    return { path: '/access', query: { reason: 'profile-check-failed' } }
  }
}

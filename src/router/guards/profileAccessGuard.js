import { resolveAccessibleUserProfileId } from '@/service/globalSearchService'

export async function profileAccessGuard(to) {
  try {
    const requestedId = String(to.params.id || '').trim()
    const resolvedId = await resolveAccessibleUserProfileId(requestedId)

    if (!resolvedId) {
      return { path: '/access', query: { reason: 'profile-scope' } }
    }

    if (resolvedId !== requestedId) {
      return {
        name: to.name,
        params: { ...to.params, id: resolvedId },
        ...(to.query ? { query: to.query } : {}),
        ...(to.hash ? { hash: to.hash } : {}),
        replace: true
      }
    }

    return true
  } catch (error) {
    console.error('[ProfileAccessGuard] Vérification Supabase impossible:', error)
    return { path: '/access', query: { reason: 'profile-check-failed' } }
  }
}

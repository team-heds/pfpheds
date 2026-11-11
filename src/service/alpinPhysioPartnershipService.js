import { supabase } from '@/supabase'

const TABLE = 'alpinphysio_partnership_requests'

/** Dépose une demande depuis la page publique (aucun compte requis). */
export async function submitPartnershipRequest(form) {
  const { error } = await supabase.rpc('submit_alpinphysio_partnership_request', { p_request: form })
  if (error) throw error
}

export async function listPartnershipRequests() {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false }).limit(200)
  if (error) throw error
  return data || []
}

export async function updatePartnershipRequest(id, changes, userId) {
  const payload = { handled_by: userId || null }
  if (changes.status !== undefined) payload.status = changes.status
  if (changes.internal_notes !== undefined) payload.internal_notes = changes.internal_notes?.trim() || null
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

/** Nombre de nouvelles demandes ; 0 si la table n'est pas encore disponible. */
export async function countNewPartnershipRequests() {
  const { count, error } = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('status', 'new')
  if (error) {
    console.warn('[AlpinPhysio] Demandes de partenariat indisponibles.', error)
    return 0
  }
  return count || 0
}

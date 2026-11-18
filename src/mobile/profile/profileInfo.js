// Informations de profil modifiables par l'étudiant depuis l'application mobile.
// Même règle que sur ordinateur (#251) : ville, langue, canton et photo seulement.
import { supabase } from '@/supabase'
import gamificationIntegration from '@/service/gamificationIntegration'
import { gamificationFeatures } from '@/config/gamificationFeatures'
import { normalizeProfilePreferences } from '@/domain/profile/profilePreferences'

export const PROFILE_INFO_COLUMNS = 'city, preferred_language, canton_of_origin'

/** Valeurs du formulaire à partir d'une ligne user_profiles. */
export function profileInfoForm(profile = {}) {
  return {
    city: profile?.city || '',
    preferredLanguage: profile?.preferred_language || '',
    cantonOfOrigin: profile?.canton_of_origin || '',
  }
}

/**
 * Signale la mise à jour du profil au moteur de gamification (défi « Profil à
 * jour », XP). Comme sur ordinateur ; une panne ne bloque jamais l'enregistrement.
 */
export async function recordProfileUpdate(userId, flags = {}, integration = gamificationIntegration) {
  if (!userId || !gamificationFeatures.userJourney) return null
  try {
    return await integration.onProfileUpdate(userId, {
      profileCompleted: true,
      timestamp: Date.now(),
      ...flags,
    })
  } catch (error) {
    console.warn('[Profil] Progression non enregistrée:', error)
    return null
  }
}

/** Enregistre ville, langue et canton, puis signale la mise à jour. */
export async function saveProfileInfo(userId, form, { client = supabase, integration } = {}) {
  if (!userId) throw new Error('Connectez-vous pour modifier votre profil.')
  const changes = normalizeProfilePreferences(form)
  const { data, error } = await client
    .from('user_profiles')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select(PROFILE_INFO_COLUMNS)
    .single()
  if (error) throw error
  await recordProfileUpdate(userId, { hasCity: Boolean(changes.city) }, integration)
  return data || changes
}

import { supabase } from '@/supabase'

const sanitizeString = (value) => {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export async function createUserProfileFromAuth(user, provider = 'supabase') {
  if (!user?.id) return null

  const metadata = user.user_metadata || {}
  const email = sanitizeString(user.email || metadata.email)

  // Try to infer names from metadata or email
  const forname =
    sanitizeString(metadata.forname || metadata.first_name || metadata.firstname) ||
    (metadata.full_name ? sanitizeString(metadata.full_name.split(' ')[0]) : null)

  const familyName =
    sanitizeString(metadata.family_name || metadata.last_name || metadata.lastname) ||
    (metadata.full_name && metadata.full_name.includes(' ')
      ? sanitizeString(metadata.full_name.split(' ').slice(1).join(' '))
      : null)

  const rawDisplayName =
    metadata.display_name ||
    metadata.full_name ||
    [forname, familyName].filter(Boolean).join(' ').trim() ||
    (email ? email.split('@')[0] : null)

  const displayName = sanitizeString(rawDisplayName) || 'Utilisateur'
  const avatarUrl =
    metadata.avatar_url || metadata.picture || metadata.photoURL || metadata.photo_url || null

  const upsertPayload = {
    user_id: user.id,
    email,
    forname,
    family_name: familyName,
    display_name: displayName,
    avatar_url: avatarUrl,
    metadata: Object.keys(metadata).length ? metadata : null,
    provider,
    last_login: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Remove undefined values (keep nulls to explicitly clear)
  Object.keys(upsertPayload).forEach((key) => {
    if (upsertPayload[key] === undefined) delete upsertPayload[key]
  })

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(upsertPayload, { onConflict: 'user_id' })
    .select()
    .maybeSingle()

  if (error) {
    console.error('❌ [userProfileAutoCreation] upsert failed:', error)
    throw error
  }

  return data
}

export async function updateLastLogin(userId) {
  if (!userId) return

  const { error } = await supabase
    .from('user_profiles')
    .update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) {
    console.error('❌ [userProfileAutoCreation] updateLastLogin failed:', error)
    throw error
  }
}

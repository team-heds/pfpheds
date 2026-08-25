import { supabase } from '@/supabase'

export function normalizeProfileSearchResult(row) {
  return {
    id: row.user_id,
    name: row.display_name || 'Utilisateur',
    avatarUrl: row.avatar_url || null,
    role: row.role_label || 'Utilisateur',
    route: { name: 'Profile', params: { id: row.user_id } },
    type: 'user'
  }
}

export function normalizeModuleSearchResult(module) {
  return {
    id: module.id,
    name: module.title || module.code || 'Module',
    description: module.description || '',
    route: { name: 'ModulesPage', query: { module: module.id } },
    type: 'module'
  }
}

export async function searchAccessibleProfiles(query, limit = 10) {
  const normalizedQuery = String(query || '').trim()
  if (normalizedQuery.length < 2) return []

  const { data, error } = await supabase.rpc('search_accessible_user_profiles', {
    p_query: normalizedQuery,
    p_limit: limit
  })

  if (error) throw error
  return (data || []).map(normalizeProfileSearchResult)
}

export async function searchModules(query, limit = 10) {
  const normalizedQuery = String(query || '')
    .trim()
    .toLowerCase()
  if (normalizedQuery.length < 2) return []

  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, code, title, description')

  if (error) throw error
  return (modules || [])
    .filter((module) =>
      `${module.title || ''} ${module.code || ''} ${module.description || ''}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
    .slice(0, limit)
    .map(normalizeModuleSearchResult)
}

export async function canViewUserProfile(userId) {
  if (!userId) return false
  const { data, error } = await supabase.rpc('app_can_view_user_profile', {
    p_target_user_id: userId
  })
  if (error) throw error
  return data === true
}

export async function resolveAccessibleUserProfileId(identifier) {
  const normalizedIdentifier = String(identifier || '').trim()
  if (!normalizedIdentifier) return null

  const { data, error } = await supabase.rpc('resolve_accessible_user_profile_id', {
    p_target_identifier: normalizedIdentifier
  })

  if (error) throw error
  return data || null
}

import { supabase } from '@/supabase.js'

export const FOR_YOU_FILTER = Object.freeze({ key: 'all', label: 'Pour toi', type: null, value: null })

/** Communautés dont l'utilisateur est membre : [{ id, name }]. */
export async function fetchMyCommunities(userId) {
  if (!userId) return []
  const { data: memberships, error: membershipError } = await supabase
    .from('user_communities')
    .select('community_id')
    .eq('user_id', userId)
  if (membershipError) throw membershipError
  const ids = [...new Set((memberships || []).map((row) => row.community_id).filter(Boolean))]
  if (!ids.length) return []
  const { data, error } = await supabase.from('communities').select('id, name').in('id', ids)
  if (error) throw error
  return (data || []).map((community) => ({ id: community.id, name: community.name }))
}

/** Hashtags les plus utilisés dans les publications déjà chargées. */
export function collectHashtags(posts, limit = 8) {
  const counts = new Map()
  ;(posts || []).forEach((post) => {
    Object.keys(post?.Hashtags || {}).forEach((tag) => {
      if (tag) counts.set(tag, (counts.get(tag) || 0) + 1)
    })
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
    .slice(0, limit)
    .map(([tag]) => tag)
}

/** Pastilles de filtre du fil : « Pour toi », puis communautés, puis hashtags. */
export function buildFeedFilters({ communities = [], hashtags = [] } = {}) {
  return [
    FOR_YOU_FILTER,
    ...communities.map((community) => ({
      key: `community:${community.id}`,
      label: community.name,
      type: 'community',
      value: community.id,
    })),
    ...hashtags.map((tag) => ({ key: `hashtag:${tag}`, label: `#${tag}`, type: 'hashtag', value: tag })),
  ]
}

export const filterScope = (filter) => ({
  communityId: null,
  filter: { type: filter?.type || null, value: filter?.value || null },
})

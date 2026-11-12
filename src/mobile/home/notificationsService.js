import { supabase } from '@/supabase.js'
import { getGamificationHistory } from '@/service/gamificationHistoryService'
import { gamificationFeatures } from '@/config/gamificationFeatures'
import { plainTextExcerpt } from '@/mobile/home/postMedia'

const MY_POSTS_LIMIT = 40
const ACTIVITY_LIMIT = 30

const displayName = (profile) =>
  String(profile?.display_name || '').trim() ||
  [profile?.forname, profile?.family_name].filter(Boolean).join(' ').trim() ||
  'Quelqu’un'

/**
 * Rassemble les événements en une seule liste, du plus récent au plus ancien.
 * Fonction pure : toutes les données sont déjà chargées.
 */
export function buildNotifications({ likes = [], comments = [], profiles = [], posts = [], xp = [] } = {}) {
  const profileById = new Map(profiles.map((profile) => [profile.user_id, profile]))
  const postById = new Map(posts.map((post) => [post.id, post]))
  const excerpt = (postId) => plainTextExcerpt(postById.get(postId)?.content, 60)

  const items = [
    ...likes.map((like) => ({
      id: `like:${like.post_id}:${like.user_id}`,
      kind: 'like',
      icon: 'heart',
      title: `${displayName(profileById.get(like.user_id))} a aimé ta publication`,
      detail: excerpt(like.post_id),
      avatarUrl: profileById.get(like.user_id)?.avatar_url || null,
      at: like.created_at,
      postId: like.post_id,
    })),
    ...comments.map((comment) => ({
      id: `comment:${comment.id}`,
      kind: 'comment',
      icon: 'chat',
      title: `${displayName(profileById.get(comment.user_id))} a commenté ta publication`,
      detail: plainTextExcerpt(comment.content, 80),
      avatarUrl: profileById.get(comment.user_id)?.avatar_url || null,
      at: comment.created_at,
      postId: comment.post_id,
    })),
    ...xp.map((entry) => ({
      id: `xp:${entry.id}`,
      kind: 'xp',
      icon: 'star',
      title: entry.label || 'Points gagnés',
      detail: entry.detail || '',
      badge: entry.points ? `${entry.points > 0 ? '+' : ''}${entry.points} XP` : '',
      avatarUrl: null,
      at: entry.occurredAt,
      postId: null,
    })),
  ]

  return items
    .filter((item) => item.at && Number.isFinite(Date.parse(item.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

async function settle(label, promise, fallback) {
  try {
    return { value: await promise, failed: false }
  } catch (error) {
    console.warn(`[Notifications] ${label} indisponible:`, error)
    return { value: fallback, failed: true }
  }
}

const rows = async (query) => {
  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Activité qui concerne l'utilisateur : j'aime et commentaires reçus sur ses
 * publications, points gagnés. Chaque source est indépendante : une source en
 * panne n'empêche pas d'afficher les autres. `partial` signale une liste incomplète.
 */
export async function fetchNotifications(userId) {
  if (!userId) return { items: [], partial: false }

  const postsResult = await settle('Publications', rows(
    supabase
      .from('posts')
      .select('id, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MY_POSTS_LIMIT),
  ), [])
  const posts = postsResult.value
  const postIds = posts.map((post) => post.id)

  const [likesResult, commentsResult, xpResult] = await Promise.all([
    postIds.length
      ? settle('J’aime', rows(
        supabase
          .from('post_likes')
          .select('post_id, user_id, created_at')
          .in('post_id', postIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(ACTIVITY_LIMIT),
      ), [])
      : { value: [], failed: false },
    postIds.length
      ? settle('Commentaires', rows(
        supabase
          .from('post_comments')
          .select('id, post_id, user_id, content, created_at')
          .in('post_id', postIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(ACTIVITY_LIMIT),
      ), [])
      : { value: [], failed: false },
    gamificationFeatures.userJourney
      ? settle('Points', getGamificationHistory(userId, { pageSize: 15 }).then((page) => page.items), [])
      : { value: [], failed: false },
  ])

  const actorIds = [...new Set([...likesResult.value, ...commentsResult.value].map((row) => row.user_id).filter(Boolean))]
  const profilesResult = actorIds.length
    ? await settle('Profils', rows(
      supabase
        .from('user_profiles')
        .select('user_id, display_name, forname, family_name, avatar_url')
        .in('user_id', actorIds),
    ), [])
    : { value: [], failed: false }

  return {
    items: buildNotifications({
      likes: likesResult.value,
      comments: commentsResult.value,
      profiles: profilesResult.value,
      posts,
      xp: xpResult.value,
    }),
    partial: [postsResult, likesResult, commentsResult, xpResult].some((result) => result.failed),
  }
}

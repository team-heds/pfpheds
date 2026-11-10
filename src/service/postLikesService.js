import { supabase } from '@/supabase.js'

/**
 * Compteur et état « aimé par moi » pour une liste de publications.
 * Retourne un objet { [postId]: { count, liked } }.
 */
export async function fetchLikeSummaries(postIds) {
  const ids = [...new Set((postIds || []).filter(Boolean))]
  if (!ids.length) return {}
  const { data, error } = await supabase.rpc('get_post_like_summaries', { p_post_ids: ids })
  if (error) throw error
  const summaries = {}
  ;(data || []).forEach((row) => {
    summaries[row.post_id] = { count: Number(row.like_count) || 0, liked: Boolean(row.liked_by_me) }
  })
  return summaries
}

/** Aimer : idempotent, un second envoi ne crée pas de doublon. */
export async function likePost(postId, userId) {
  const { error } = await supabase
    .from('post_likes')
    .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id', ignoreDuplicates: true })
  if (error) throw error
}

/** Retirer son j'aime : la RLS limite la suppression à ses propres lignes. */
export async function unlikePost(postId, userId) {
  const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
  if (error) throw error
}

/** Personnes qui ont aimé, plus récentes d'abord. */
export async function fetchPostLikers(postId, limit = 50) {
  const { data, error } = await supabase.rpc('get_post_likers', { p_post_id: postId, p_limit: limit })
  if (error) throw error
  return data || []
}

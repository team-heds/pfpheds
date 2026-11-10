import { supabase } from '@/supabase.js'

/** Nombre de commentaires pour une liste de publications : { [postId]: count }. */
export async function fetchCommentCounts(postIds) {
  const ids = [...new Set((postIds || []).filter(Boolean))]
  if (!ids.length) return {}
  const { data, error } = await supabase.rpc('get_post_comment_counts', { p_post_ids: ids })
  if (error) throw error
  const counts = {}
  ;(data || []).forEach((row) => {
    counts[row.post_id] = Number(row.comment_count) || 0
  })
  return counts
}

/** Commentaires d'une publication avec leur auteur, plus anciens d'abord. */
export async function fetchPostComments(postId, limit = 200) {
  const { data, error } = await supabase.rpc('get_post_comments', { p_post_id: postId, p_limit: limit })
  if (error) throw error
  return data || []
}

/**
 * Enregistre un commentaire. L'id est fourni par le client pour relier la version
 * optimiste à la ligne du serveur ; la date et l'auteur viennent du serveur (RLS).
 */
export async function createPostComment({ id, postId, parentId = null, content }) {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ id, post_id: postId, parent_id: parentId, content })
    .select('id, post_id, parent_id, user_id, content, created_at')
    .single()
  if (error) throw error
  return data
}

/** Supprimer son commentaire : la RLS limite la suppression à ses propres lignes. */
export async function deletePostComment(id) {
  const { data, error } = await supabase.from('post_comments').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Commentaire introuvable ou appartenant à quelqu’un d’autre.')
}

/** Nom et photo affichés pour l'auteur connecté (commentaire optimiste). */
export async function fetchOwnCommentAuthor(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('display_name, forname, family_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const name =
    data.display_name?.trim() || [data.forname, data.family_name].filter(Boolean).join(' ').trim() || null
  return { display_name: name, avatar_url: data.avatar_url || null }
}

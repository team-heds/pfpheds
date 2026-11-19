// Droits de retrait dans le fil d'actualité (logique pure, testée unitairement).
// Ce ne sont que des règles d'affichage : la base applique les mêmes règles par RLS
// (migration 20261119150000_feed_delete_posts_comments.sql).

function realUserId(userId) {
  return userId && userId !== 'guest-user' ? String(userId) : null
}

/** Auteur d'une publication, quel que soit le format (fil hydraté ou ligne brute). */
export function postAuthorId(post) {
  return post?.IdUser || post?.user_id || null
}

/** Une publication ne peut être retirée que par son auteur. */
export function canDeletePost(post, userId) {
  const me = realUserId(userId)
  return Boolean(me && post?.id && postAuthorId(post) === me)
}

/** Un commentaire peut être retiré par son auteur ou par l'auteur de la publication. */
export function canDeleteComment(comment, { userId, postAuthorId: authorOfPost } = {}) {
  const me = realUserId(userId)
  if (!me || !comment?.id || comment.pending) return false
  return comment.user_id === me || authorOfPost === me
}

// Effacement des stories expirées : le média est retiré par l'API Storage (ce qui libère
// réellement le disque, contrairement à une suppression SQL), puis la ligne de story.
// Lancé périodiquement par le worker (workers/pushOutboxWorker.js).

const STORIES_BUCKET = 'stories'
const DEFAULT_GRACE_MS = 60 * 60 * 1000 // une heure après l'expiration
const DEFAULT_BATCH = 200

/**
 * Efface au plus `limit` stories expirées depuis plus de `graceMs`.
 * Une story n'est effacée qu'après la suppression réussie de son média ; un média déjà
 * absent n'empêche pas l'effacement de la ligne.
 * @returns {Promise<{ expired: number, filesRemoved: number, storiesDeleted: number }>}
 */
async function purgeExpiredStories(supabase, { now = new Date(), graceMs = DEFAULT_GRACE_MS, limit = DEFAULT_BATCH } = {}) {
  const cutoff = new Date(now.getTime() - graceMs).toISOString()
  const { data: rows, error } = await supabase
    .from('stories')
    .select('id, media_path')
    .lt('expires_at', cutoff)
    .order('expires_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`lecture des stories expirées impossible : ${error.message}`)
  if (!rows?.length) return { expired: 0, filesRemoved: 0, storiesDeleted: 0 }

  const paths = rows.map(row => row.media_path).filter(Boolean)
  let filesRemoved = 0
  if (paths.length) {
    const { data: removed, error: removeError } = await supabase.storage.from(STORIES_BUCKET).remove(paths)
    if (removeError) throw new Error(`suppression des médias impossible : ${removeError.message}`)
    filesRemoved = removed?.length || 0
  }

  const ids = rows.map(row => row.id)
  const { error: deleteError } = await supabase.from('stories').delete().in('id', ids)
  if (deleteError) throw new Error(`suppression des stories impossible : ${deleteError.message}`)

  return { expired: rows.length, filesRemoved, storiesDeleted: ids.length }
}

module.exports = { purgeExpiredStories, STORIES_BUCKET, DEFAULT_GRACE_MS, DEFAULT_BATCH }

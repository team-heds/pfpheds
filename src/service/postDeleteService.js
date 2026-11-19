import { supabase } from '@/supabase.js'
import { postAuthorId } from '@/service/postPermissions'

const MEDIA_BUCKET = 'post-media'
const PUBLIC_MARKER = `/storage/v1/object/public/${MEDIA_BUCKET}/`

/**
 * Chemins Storage des médias d'une publication, à partir de leurs URL publiques.
 * Seuls les fichiers du dossier de l'auteur (posts/<auteur>/…) sont gardés : c'est le
 * seul dossier que la règle Storage « Users delete own post-media » le laisse vider.
 */
export function mediaStoragePaths(urls, authorId) {
  if (!authorId) return []
  const prefix = `posts/${authorId}/`
  const paths = new Set()
  ;(urls || []).forEach((url) => {
    if (typeof url !== 'string') return
    const at = url.indexOf(PUBLIC_MARKER)
    if (at < 0) return
    let path = url.slice(at + PUBLIC_MARKER.length).split(/[?#]/)[0]
    try {
      path = decodeURIComponent(path)
    } catch {
      return
    }
    if (path.startsWith(prefix) && !path.split('/').includes('..')) paths.add(path)
  })
  return [...paths]
}

function displayedMediaUrls(post) {
  return (Array.isArray(post?.media) ? post.media : [])
    .map((item) => (typeof item === 'string' ? item : item?.url))
    .filter(Boolean)
}

/**
 * Retire une publication de l'utilisateur connecté.
 * La base retire avec elle ses médias (lignes), ses j'aime et ses commentaires
 * (ON DELETE CASCADE) ; la RLS refuse le retrait à toute autre personne que l'auteur.
 * Les fichiers du stockage sont retirés ensuite : un échec laisse des fichiers orphelins
 * mais n'annule pas le retrait de la publication.
 */
export async function deletePost(post) {
  const postId = post?.id
  if (!postId) throw new Error('Publication inconnue.')

  // Lus avant le retrait : la cascade efface les lignes post_media.
  let mediaUrls = displayedMediaUrls(post)
  try {
    const { data, error } = await supabase.from('post_media').select('url').eq('post_id', postId)
    if (error) throw error
    mediaUrls = [...new Set([...mediaUrls, ...(data || []).map((row) => row.url)])]
  } catch (error) {
    console.warn('[Feed] Médias non relus, retrait avec la liste affichée:', error)
  }

  const { data, error } = await supabase.from('posts').delete().eq('id', postId).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Publication introuvable ou appartenant à quelqu’un d’autre.')

  const paths = mediaStoragePaths(mediaUrls, postAuthorId(post))
  let filesRemoved = true
  if (paths.length) {
    try {
      const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove(paths)
      if (storageError) throw storageError
    } catch (storageError) {
      filesRemoved = false
      console.warn('[Feed] Publication retirée, fichiers restés dans le stockage:', storageError)
    }
  }
  return { id: postId, files: paths.length, filesRemoved }
}

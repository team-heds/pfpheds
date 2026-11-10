import { supabase } from '@/supabase.js'
import gamificationIntegration from '@/service/gamificationIntegration'
import { extractPostTags, plainTextFromHtml, safeStorageFileName } from '@/service/postComposer'

const MEDIA_BUCKET = 'post-media'

/** Nom d'auteur enregistré avec la publication. */
export function resolveAuthorName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.id || ''
}

async function uploadFiles(userId, files) {
  const uploaded = []
  for (const [index, file] of files.entries()) {
    const path = `posts/${userId}/${Date.now()}_${index}_${safeStorageFileName(file.name)}`
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined
    })
    if (error) throw error
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    uploaded.push({ url: data.publicUrl, type: file.type, path })
  }
  return uploaded
}

/**
 * Publie une publication du fil : médias envoyés d'abord (rien n'est publié si un envoi échoue),
 * puis la publication et ses médias. Si l'enregistrement des médias échoue, la publication est
 * retirée pour ne pas laisser une publication à moitié vide.
 *
 * La gamification existante est appelée ensuite (action POST : 25 XP, 3 fois par jour, plafond
 * appliqué côté Supabase). Son échec n'annule pas la publication.
 */
export async function publishPost({ user, content, files = [], communityId = null }) {
  if (!user?.id) throw new Error('Utilisateur non connecté')
  const authorName = resolveAuthorName(user)
  const { hashtags, mentions } = extractPostTags(content)

  const media = await uploadFiles(user.id, files)

  const { data: inserted, error: insertError } = await supabase
    .from('posts')
    .insert([
      {
        user_id: user.id,
        author_name: authorName,
        content,
        hashtags,
        mentions,
        community_id: communityId
      }
    ])
    .select('id, created_at')
    .single()
  if (insertError) {
    await removeUploaded(media)
    throw insertError
  }

  if (media.length) {
    const rows = media.map((m) => ({ post_id: inserted.id, url: m.url, type: m.type }))
    const { error: mediaError } = await supabase.from('post_media').insert(rows)
    if (mediaError) {
      await supabase.from('posts').delete().eq('id', inserted.id)
      await removeUploaded(media)
      throw mediaError
    }
  }

  try {
    await gamificationIntegration.onSocialInteraction(user.id, {
      action: 'post',
      targetType: 'post',
      targetId: inserted.id,
      postLength: plainTextFromHtml(content).length,
      hasMedia: media.length > 0,
      hashtagsCount: Object.keys(hashtags).length,
      mentionsCount: Object.keys(mentions).length,
      timestamp: Date.now()
    })
  } catch (error) {
    console.warn('[Feed] Publication enregistrée, XP non attribués:', error)
  }

  return {
    id: inserted.id,
    createdAt: inserted.created_at,
    authorName,
    hashtags,
    mentions,
    communityId,
    media: media.map(({ url, type }) => ({ url, type }))
  }
}

async function removeUploaded(media) {
  if (!media.length) return
  try {
    await supabase.storage.from(MEDIA_BUCKET).remove(media.map((m) => m.path))
  } catch (error) {
    console.warn('[Feed] Médias orphelins non supprimés:', error)
  }
}

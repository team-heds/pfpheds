import { supabase } from '@/supabase.js'

export const STORIES_BUCKET = 'stories'
export const STORY_MAX_BYTES = 30 * 1024 * 1024
export const STORY_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
export const STORY_LIFETIMES = [1, 24]
const SIGNED_URL_SECONDS = 60 * 60

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4' }

function shortText(value, max) {
  return String(value ?? '').trim().slice(0, max)
}

function finiteNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : 0
}

/**
 * Garde uniquement les éléments utiles et légers : textes et emojis (déjà dessinés dans l'image,
 * gardés pour mémoire), quiz et sondages (affichés dans le lecteur). Les fichiers embarqués
 * (audio, carrousel) ne sont pas conservés.
 */
export function sanitizeStoryElements(elements) {
  if (!Array.isArray(elements)) return []
  const out = []
  for (const el of elements) {
    if (!el || typeof el !== 'object') continue
    if (el.type === 'text' || el.type === 'emoji') {
      const value = shortText(el.value, 120)
      if (!value) continue
      out.push({
        type: el.type,
        value,
        x: finiteNumber(el.x),
        y: finiteNumber(el.y),
        ...(el.type === 'text' && el.color ? { color: shortText(el.color, 32) } : {}),
        ...(el.type === 'text' && el.textSize ? { textSize: shortText(el.textSize, 16) } : {})
      })
    } else if (el.type === 'quiz' || el.type === 'poll') {
      const question = shortText(el.question, 200)
      const options = (Array.isArray(el.options) ? el.options : [])
        .map((o) => shortText(o, 100))
        .filter(Boolean)
        .slice(0, 6)
      if (!question || options.length < 2) continue
      const item = { type: el.type, question, options }
      if (el.type === 'quiz') {
        const idx = Number(el.answerIdx)
        item.answerIdx = Number.isInteger(idx) && idx >= 0 && idx < options.length ? idx : 0
      }
      out.push(item)
    }
    if (out.length >= 20) break
  }
  return out
}

/** Chemin du fichier : toujours dans le dossier de l'auteur (exigé par la base). */
export function buildStoryPath(userId, mimeType, now = Date.now(), random = Math.random) {
  const ext = EXTENSIONS[mimeType] || 'bin'
  const suffix = random().toString(36).slice(2, 10) || 'x'
  return `${userId}/${now}_${suffix}.${ext}`
}

/** Vérifie le fichier avant envoi ; renvoie un message d'erreur ou ''. */
export function validateStoryFile(file) {
  if (!file) return 'Choisissez une photo ou une vidéo.'
  if (!STORY_MIME_TYPES.includes(file.type)) {
    return 'Format non pris en charge : choisissez une photo (JPEG, PNG, WebP) ou une vidéo MP4.'
  }
  if (file.size > STORY_MAX_BYTES) return 'Le fichier dépasse 30 Mo.'
  return ''
}

/**
 * Regroupe les stories par auteur pour la barre : la personne connectée d'abord, puis les
 * auteurs avec des stories non vues (les plus récentes d'abord), puis ceux déjà vus.
 * Dans un groupe, les stories se lisent de la plus ancienne à la plus récente.
 */
export function groupStoriesByAuthor(stories, currentUserId) {
  const groups = new Map()
  for (const story of stories || []) {
    if (!story?.user_id) continue
    let group = groups.get(story.user_id)
    if (!group) {
      group = {
        userId: story.user_id,
        displayName: story.display_name || 'Utilisateur',
        avatarUrl: story.avatar_url || null,
        isOwn: story.user_id === currentUserId,
        stories: []
      }
      groups.set(story.user_id, group)
    }
    group.stories.push(story)
  }
  const list = [...groups.values()].map((group) => {
    group.stories.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    const latest = group.stories[group.stories.length - 1]
    return {
      ...group,
      latestAt: latest ? new Date(latest.created_at).getTime() : 0,
      hasUnseen: !group.isOwn && group.stories.some((s) => !s.seen)
    }
  })
  return list.sort((a, b) => {
    if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1
    return b.latestAt - a.latestAt
  })
}

/** Première story non vue d'un groupe (sinon la première). */
export function firstUnseenIndex(group) {
  const idx = (group?.stories || []).findIndex((s) => !s.seen)
  return idx === -1 ? 0 : idx
}

/** « il y a 3 h » à partir d'une date. */
export function formatStoryAge(createdAt, now = Date.now()) {
  const minutes = Math.floor((now - new Date(createdAt).getTime()) / 60000)
  if (!Number.isFinite(minutes) || minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  return `il y a ${Math.floor(minutes / 60)} h`
}

/** Stories actives avec auteur, état « vu » et URL signée du média. */
export async function fetchActiveStories() {
  const { data, error } = await supabase.rpc('get_active_stories', { p_limit: 200 })
  if (error) throw error
  const rows = data || []
  if (!rows.length) return []
  const paths = rows.map((r) => r.media_path)
  const { data: signed, error: signError } = await supabase.storage
    .from(STORIES_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS)
  if (signError) throw signError
  const urls = new Map((signed || []).filter((s) => s?.signedUrl).map((s) => [s.path, s.signedUrl]))
  return rows.filter((r) => urls.has(r.media_path)).map((r) => ({ ...r, media_url: urls.get(r.media_path) }))
}

/**
 * Publie une story : fichier envoyé d'abord, puis la ligne. Si l'enregistrement échoue,
 * le fichier est retiré pour ne pas laisser de fichier orphelin.
 */
export async function publishStory({ userId, file, caption = '', lifetimeHours = 24, elements = [] }) {
  if (!userId || userId === 'guest-user') throw new Error('Session expirée : reconnectez-vous pour publier une story.')
  const invalid = validateStoryFile(file)
  if (invalid) throw new Error(invalid)
  const path = buildStoryPath(userId, file.type)
  const { error: uploadError } = await supabase.storage.from(STORIES_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      media_path: path,
      media_type: file.type.startsWith('video/') ? 'video' : 'image',
      caption: shortText(caption, 100),
      elements: sanitizeStoryElements(elements),
      lifetime_hours: STORY_LIFETIMES.includes(lifetimeHours) ? lifetimeHours : 24
    })
    .select('id, created_at, expires_at')
    .single()
  if (error) {
    await supabase.storage.from(STORIES_BUCKET).remove([path])
    throw error
  }
  return data
}

/** Marque une story comme vue ; une vue déjà enregistrée n'est pas une erreur. */
export async function markStoryViewed(storyId) {
  const { error } = await supabase.from('story_views').insert({ story_id: storyId })
  if (error && error.code !== '23505') throw error
}

/** Supprimer sa story puis son fichier (la RLS limite aux siennes). */
export async function deleteStory(story) {
  const { data, error } = await supabase.from('stories').delete().eq('id', story.id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Story introuvable ou appartenant à quelqu’un d’autre.')
  await supabase.storage.from(STORIES_BUCKET).remove([story.media_path])
}

/** Qui a vu sa story (vide pour les stories des autres). */
export async function fetchStoryViewers(storyId) {
  const { data, error } = await supabase.rpc('get_story_viewers', { p_story_id: storyId })
  if (error) throw error
  return data || []
}

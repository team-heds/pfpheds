// Lecture des médias et des liens intégrables d'une publication (affichage mobile).

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov']

export function mediaUrl(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return typeof item.url === 'string' ? item.url : ''
}

export function mediaExtension(url) {
  if (!url || typeof url !== 'string') return ''
  const path = url.split(/[?#]/)[0]
  return path.includes('.') ? path.split('.').pop().toLowerCase() : ''
}

export function mediaKind(url) {
  const extension = mediaExtension(url)
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image'
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video'
  if (extension === 'pdf') return 'pdf'
  return 'file'
}

export function mediaFileName(url) {
  const path = String(url || '').split(/[?#]/)[0]
  try {
    return decodeURIComponent(path.split('/').pop() || '') || 'Fichier'
  } catch {
    return path.split('/').pop() || 'Fichier'
  }
}

/** Médias d'une publication, rangés par nature : visuels (photos, vidéos) et fichiers. */
export function splitPostMedia(media) {
  const visuals = []
  const files = []
  ;(media || []).forEach((item) => {
    const url = mediaUrl(item)
    if (!url) return
    const kind = mediaKind(url)
    if (kind === 'image' || kind === 'video') visuals.push({ url, kind })
    else files.push({ url, kind, name: kind === 'pdf' ? 'Document PDF' : mediaFileName(url) })
  })
  return { visuals, files }
}

/** Liens YouTube, Spotify et Instagram d'un texte, prêts à intégrer. */
export function extractEmbeds(content) {
  if (!content) return []
  const embeds = []
  const seen = new Set()
  const add = (kind, src) => {
    if (seen.has(src)) return
    seen.add(src)
    embeds.push({ kind, src })
  }
  for (const match of content.matchAll(/https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/g)) {
    add('youtube', `https://www.youtube.com/embed/${match[1]}`)
  }
  for (const match of content.matchAll(/https?:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/g)) {
    add('spotify', `https://open.spotify.com/embed/${match[1]}/${match[2]}`)
  }
  for (const match of content.matchAll(/https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([\w-]+)/g)) {
    add('instagram', `https://www.instagram.com/${match[1]}/${match[2]}/embed`)
  }
  return embeds
}

/** Texte brut d'une publication, pour le partage. */
export function plainTextExcerpt(html, maxLength = 140) {
  const text = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text
}

export function initialsOf(name) {
  const parts = String(name || '').split('@')[0].split(/[\s._-]+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

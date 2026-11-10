// Logique pure du composer de publications (sans Vue ni Supabase), testée unitairement.

export const MAX_POST_MEDIA = 4
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024

// Formats que le fil sait afficher (image, vidéo, PDF) ou ouvrir (audio).
const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'audio/mpeg',
  'application/pdf'
])
export const ACCEPT_ATTRIBUTE = [...ACCEPTED_TYPES].join(',')

/** Texte visible d'un contenu HTML (éditeur riche) : balises retirées, espaces resserrés. */
export function plainTextFromHtml(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h\d)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** #hashtags et @mentions du texte, sous la forme { nom: true } attendue par la table posts. */
export function extractPostTags(text) {
  const plain = plainTextFromHtml(text)
  const hashtags = {}
  const mentions = {}
  ;(plain.match(/[#@][\p{L}\p{N}_-]+/gu) || []).forEach((tag) => {
    const name = tag.slice(1)
    if (tag.startsWith('#')) hashtags[name] = true
    else mentions[name] = true
  })
  return { hashtags, mentions }
}

/** Une publication part si elle a du texte ou au moins un média. */
export function canPublishPost(content, mediaCount = 0) {
  return plainTextFromHtml(content).length > 0 || mediaCount > 0
}

function formatMegabytes(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} Mo`
}

/**
 * Trie les fichiers choisis : ceux qu'on garde et un message par fichier refusé.
 * `alreadySelected` = nombre de médias déjà joints.
 */
export function validateComposerFiles(files, alreadySelected = 0) {
  const accepted = []
  const errors = []
  ;[...(files || [])].forEach((file) => {
    if (!ACCEPTED_TYPES.has(file.type)) {
      errors.push(`« ${file.name} » : format non pris en charge (photo, vidéo MP4, PDF ou MP3).`)
    } else if (file.size > MAX_MEDIA_BYTES) {
      errors.push(`« ${file.name} » dépasse ${formatMegabytes(MAX_MEDIA_BYTES)}.`)
    } else if (alreadySelected + accepted.length >= MAX_POST_MEDIA) {
      errors.push(`${MAX_POST_MEDIA} médias au maximum par publication.`)
    } else {
      accepted.push(file)
    }
  })
  return { accepted, errors: [...new Set(errors)] }
}

/** Nom de fichier sûr pour le stockage : sans accents, espaces ni caractères spéciaux. */
export function safeStorageFileName(name) {
  const clean = String(name || 'media')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-\./g, '.')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(-80)
  return clean || 'media'
}

/** Type d'aperçu affiché dans le composer. */
export function previewKind(type) {
  if (String(type).startsWith('image/')) return 'image'
  if (String(type).startsWith('video/')) return 'video'
  return 'file'
}

/** Message lisible pour une publication refusée. */
export function describePublishError(error) {
  const message = String(error?.message || '')
  if (/row-level security|permission|42501/i.test(message)) {
    return 'Votre session ne permet pas de publier. Reconnectez-vous puis réessayez.'
  }
  if (/fetch|network|Failed to fetch|timeout/i.test(message)) {
    return 'Connexion interrompue. Vérifiez votre réseau puis réessayez.'
  }
  if (/payload too large|413|exceeded the maximum/i.test(message)) {
    return 'Un média est trop lourd pour être envoyé.'
  }
  return 'La publication n’a pas pu être envoyée. Réessayez dans un instant.'
}

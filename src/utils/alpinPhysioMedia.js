// Fonctions pures pour les images Alp'in Physio (sans accès réseau, testables).
import optimizedImages from '@/data/alpinPhysioOptimizedImages.json'

export const ALPIN_MEDIA_BUCKET = 'alpinphysio'
export const ALPIN_LEGACY_IMAGE_ROOT = '/assets/images/heds/AlpinPhysioPhoto/'
export const ALPIN_IMAGE_MAX_SIDE = 1600
export const ALPIN_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
export const ALPIN_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const OPTIMIZED_IMAGES = new Set(optimizedImages.map((path) => path.normalize('NFC')))

/**
 * Adresse affichable d'une image : une adresse complète (photo envoyée depuis
 * l'ordinateur) est gardée telle quelle ; un chemin historique est cherché
 * dans le dossier de photos livré avec l'application.
 */
export function resolveAlpinImage(value) {
  const path = String(value ?? '').trim()
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('/') || path.startsWith('blob:') || path.startsWith('data:image/')) return path
  // Les photos historiques ont une version allégée (WebP) préparée par
  // scripts/optimize-alpinphysio-images.mjs : on la sert quand elle existe.
  const suffix = OPTIMIZED_IMAGES.has(path.normalize('NFC')) ? '.webp' : ''
  return `${ALPIN_LEGACY_IMAGE_ROOT}${path}${suffix}`
}

/** Dimensions réduites pour tenir dans un carré de `maxSide`, sans jamais agrandir. */
export function fitWithin(width, height, maxSide = ALPIN_IMAGE_MAX_SIDE) {
  const w = Math.max(1, Math.round(Number(width) || 1))
  const h = Math.max(1, Math.round(Number(height) || 1))
  const ratio = Math.min(1, maxSide / Math.max(w, h))
  return { width: Math.max(1, Math.round(w * ratio)), height: Math.max(1, Math.round(h * ratio)) }
}

const slugify = (value) => String(value ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

/** Chemin de stockage sûr et unique : dossier/nom-lisible-identifiant.extension */
export function buildAlpinUploadPath(folder, fileName, extension, uniqueId) {
  const safeFolder = ['site', 'events', 'documents'].includes(folder) ? folder : 'site'
  const base = slugify(String(fileName ?? '').replace(/\.[^.]+$/, '')) || 'fichier'
  const ext = slugify(extension) || 'bin'
  return `${safeFolder}/${base}-${slugify(uniqueId) || Date.now()}.${ext}`
}

/** Message d'erreur en clair si le fichier ne convient pas, sinon chaîne vide. */
export function describeUploadProblem(file, { accept = ALPIN_IMAGE_TYPES, maxBytes = 25 * 1024 * 1024 } = {}) {
  if (!file) return 'Aucun fichier sélectionné.'
  if (!accept.includes(file.type)) {
    return accept.includes('application/pdf') ? 'Choisissez un document PDF.' : 'Choisissez une image JPEG, PNG ou WebP.'
  }
  if (file.size > maxBytes) return `Ce fichier est trop lourd (maximum ${Math.round(maxBytes / 1024 / 1024)} Mo).`
  return ''
}

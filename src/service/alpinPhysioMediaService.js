import { supabase } from '@/supabase'
import {
  ALPIN_IMAGE_MAX_SIDE, ALPIN_IMAGE_TYPES, ALPIN_MEDIA_BUCKET, ALPIN_UPLOAD_MAX_BYTES,
  buildAlpinUploadPath, describeUploadProblem, fitWithin,
} from '@/utils/alpinPhysioMedia'

const uniqueId = () => (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0, 13)

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))

/**
 * Réduit une photo à 1600 px de côté au maximum et la convertit en WebP
 * (JPEG si le navigateur ne sait pas écrire du WebP). Une photo de téléphone
 * de plusieurs Mo pèse ainsi quelques centaines de Ko sur la page publique.
 */
export async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file)
  const { width, height } = fitWithin(bitmap.width, bitmap.height, ALPIN_IMAGE_MAX_SIDE)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()
  let blob = await canvasToBlob(canvas, 'image/webp', 0.82)
  let extension = 'webp'
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.84)
    extension = 'jpg'
  }
  if (!blob) throw new Error('Cette image n’a pas pu être préparée.')
  return { blob, extension, contentType: blob.type }
}

async function store(path, body, contentType) {
  const { error } = await supabase.storage.from(ALPIN_MEDIA_BUCKET).upload(path, body, {
    contentType, cacheControl: '31536000', upsert: false,
  })
  if (error) throw error
  return supabase.storage.from(ALPIN_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Envoie une photo (réduite) et renvoie son adresse publique. */
export async function uploadAlpinImage(file, folder = 'site') {
  const problem = describeUploadProblem(file, { accept: ALPIN_IMAGE_TYPES })
  if (problem) throw new Error(problem)
  const { blob, extension, contentType } = await shrinkImage(file)
  if (blob.size > ALPIN_UPLOAD_MAX_BYTES) throw new Error('Cette image reste trop lourde après réduction.')
  return store(buildAlpinUploadPath(folder, file.name, extension, uniqueId()), blob, contentType)
}

/** Envoie un document PDF (contrat de partenariat) et renvoie son adresse publique. */
export async function uploadAlpinDocument(file) {
  const problem = describeUploadProblem(file, { accept: ['application/pdf'], maxBytes: ALPIN_UPLOAD_MAX_BYTES })
  if (problem) throw new Error(problem)
  return store(buildAlpinUploadPath('documents', file.name, 'pdf', uniqueId()), file, 'application/pdf')
}

const INSTITUTIONS_BUCKET = 'institutions'
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function getBackendBaseUrl() {
  const explicit = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL
  if (explicit) {
    return String(explicit).replace(/\/api\/?$/i, '').replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:3000'
    }
    return `${protocol}//${hostname}`
  }

  return ''
}

function validateImages(files) {
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`Format non supporte pour ${file.name}. Utilisez JPG, PNG, GIF ou WEBP.`)
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`Le fichier ${file.name} depasse la limite de 5 MB.`)
    }
  }
}

function getSupabaseStoragePath(url, bucket = INSTITUTIONS_BUCKET) {
  if (!url || typeof url !== 'string') return null

  try {
    const parsedUrl = new URL(url)
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = parsedUrl.pathname.indexOf(marker)

    if (index === -1) return null
    return decodeURIComponent(parsedUrl.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}

async function uploadInstitutionImages(institutionId, files) {
  const validFiles = Array.from(files || []).filter(Boolean)
  if (!institutionId) throw new Error('InstitutionId manquant')
  if (validFiles.length === 0) return []

  validateImages(validFiles)

  const formData = new FormData()
  for (const file of validFiles) {
    formData.append('images', file)
  }

  const response = await fetch(`${getBackendBaseUrl()}/api/institutions/${institutionId}/images`, {
    method: 'POST',
    body: formData
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Erreur lors de l'upload des images.")
  }

  return Array.isArray(payload?.files) ? payload.files : []
}

async function deleteInstitutionImage(institutionId, imageUrl) {
  if (!institutionId) throw new Error('InstitutionId manquant')
  if (!imageUrl) return

  const storagePath = getSupabaseStoragePath(imageUrl)
  if (!storagePath) {
    throw new Error("URL image invalide pour Supabase Storage.")
  }

  const response = await fetch(`${getBackendBaseUrl()}/api/institutions/${institutionId}/images`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: imageUrl })
  })

  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    throw new Error(payload?.error || "Erreur lors de la suppression de l'image.")
  }
}

export default {
  INSTITUTIONS_BUCKET,
  getSupabaseStoragePath,
  uploadInstitutionImages,
  deleteInstitutionImage
}

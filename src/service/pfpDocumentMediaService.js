import { authFetch } from '@/service/apiClient'

function backendBaseUrl() {
  const explicit = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL
  if (explicit) return String(explicit).replace(/\/api\/?$/i, '').replace(/\/+$/, '')
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) return 'http://127.0.0.1:3000'
  return typeof window !== 'undefined' ? window.location.origin : ''
}

async function payload(response) {
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || 'Le document n’a pas pu être chargé.')
  return body
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error()
    return url
  } catch { throw new Error('Adresse du document invalide.') }
}

export async function uploadPfpDocument(kind, id, file) {
  if (!['institutions', 'places'].includes(kind) || !id) throw new Error('Référence du document manquante.')
  if (!file?.size || !/\.pdf$/i.test(file.name)) throw new Error('Sélectionnez un fichier PDF non vide.')
  if (file.size > 20 * 1024 * 1024) throw new Error('Le fichier dépasse la limite de 20 Mo.')
  const body = new FormData()
  body.append('file', file)
  const result = await payload(await authFetch(`${backendBaseUrl()}/api/institutions/documents/upload/${kind}/${encodeURIComponent(id)}`, { method: 'POST', body }))
  if (!result?.file?.url) throw new Error('Le stockage n’a pas renvoyé le document téléversé.')
  return result.file
}

export async function getPfpDocumentDownloadUrl(value) {
  const url = safeUrl(value)
  if (!url.pathname.startsWith('/storage/v1/object/authenticated/pfp-documents/')) return url.href
  const result = await payload(await authFetch(`${backendBaseUrl()}/api/institutions/documents/download?url=${encodeURIComponent(url.href)}`))
  return safeUrl(result?.url).href
}

export async function openPfpDocument(url, browserWindow = window) {
  const destination = browserWindow.open('about:blank', '_blank')
  if (!destination) throw new Error('Autorisez les fenêtres pour ouvrir le document dans un nouvel onglet.')
  destination.opener = null
  try { destination.location.href = await getPfpDocumentDownloadUrl(url) }
  catch (error) { destination.close(); throw error }
}

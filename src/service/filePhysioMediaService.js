import { authFetch } from '@/service/apiClient'

export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024
export const DOCUMENT_ACCEPT = '.pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png,.webp,.txt'

function backendBaseUrl() {
  const explicit = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL
  if (explicit) return String(explicit).replace(/\/api\/?$/i, '').replace(/\/+$/, '')
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) return 'http://127.0.0.1:3000'
  return typeof window !== 'undefined' ? window.location.origin : ''
}

async function readResponse(response) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error || 'Le document n’a pas pu être chargé.')
  return payload
}

export function validateDocumentUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim())
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error()
    return parsed.href
  } catch {
    throw new Error('Saisissez une adresse web valide commençant par https:// ou http://.')
  }
}

export function isPrivateDocument(url) {
  try {
    return new URL(url).pathname.startsWith('/storage/v1/object/authenticated/file-physio/')
  } catch {
    return false
  }
}

export async function uploadFilePhysioDocument(file) {
  if (!file || !file.size) throw new Error('Sélectionnez un fichier non vide.')
  if (file.size > MAX_DOCUMENT_SIZE) throw new Error('Le fichier dépasse la limite de 20 Mo.')
  if (!/\.(pdf|docx|xlsx|pptx|jpe?g|png|webp|txt)$/i.test(file.name)) {
    throw new Error('Format non pris en charge. Utilisez PDF, DOCX, XLSX, PPTX, JPG, PNG, WEBP ou TXT.')
  }
  const body = new FormData()
  body.append('file', file)
  const payload = await readResponse(await authFetch(`${backendBaseUrl()}/api/filePhysio/files/upload`, { method: 'POST', body }))
  if (!payload?.file?.url) throw new Error('Le stockage n’a pas renvoyé le document téléversé.')
  return payload.file
}

export async function getFilePhysioDownloadUrl(file) {
  const url = validateDocumentUrl(file?.url)
  if (!isPrivateDocument(url)) return url
  if (!file?.id) throw new Error('Document introuvable.')
  const payload = await readResponse(await authFetch(`${backendBaseUrl()}/api/filePhysio/files/${encodeURIComponent(file.id)}/download`, { method: 'POST' }))
  return validateDocumentUrl(payload?.url)
}

export async function openFilePhysioDocument(file, browserWindow = window) {
  // Open immediately during the click so the browser does not treat the async
  // signed-URL response as an unsolicited pop-up. Detach the opener before loading.
  const destination = browserWindow.open('about:blank', '_blank')
  if (!destination) throw new Error('Autorisez les fenêtres pour ouvrir le document dans un nouvel onglet.')
  destination.opener = null
  try {
    destination.location.href = await getFilePhysioDownloadUrl(file)
  } catch (error) {
    destination.close()
    throw error
  }
}

import { supabase } from '@/supabase'

// Scan de codes de la plateforme. Aujourd'hui : présence à un événement. Le même
// parcours (lien /scan?c=…, RPC redeem_scan_code) servira à la chasse au trésor.
// Le navigateur ne décide de rien : il transmet le code, le serveur valide et attribue.

export const SCAN_ROUTE_PATH = '/scan'
export const DEFAULT_CHECKIN_XP = 30
export const MIN_CHECKIN_XP = 10
export const MAX_CHECKIN_XP = 100

const TOKEN_PATTERN = /^[0-9a-f]{32}$/i
const SHORT_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/

const cleanShortCode = (value) => String(value || '').replace(/[\s-]/g, '').toUpperCase()

export const isValidShortCode = (value) => SHORT_CODE_PATTERN.test(cleanShortCode(value))

/** Lien encodé dans le QR : il ouvre la plateforme sur la page de scan. */
export function buildScanUrl(token, origin = window.location.origin) {
  return `${origin}${SCAN_ROUTE_PATH}?c=${encodeURIComponent(token)}`
}

/**
 * Extrait le code d'un contenu scanné ou saisi : lien de la plateforme, jeton brut
 * ou code court. Renvoie null pour tout autre QR code (site externe, texte libre).
 */
export function extractScanCode(raw) {
  const value = String(raw || '').trim()
  if (!value) return null
  if (TOKEN_PATTERN.test(value)) return value.toLowerCase()
  if (isValidShortCode(value)) return cleanShortCode(value)

  try {
    const url = new URL(value)
    if (!/^https?:$/.test(url.protocol)) return null
    if (url.pathname.replace(/\/+$/, '') !== SCAN_ROUTE_PATH) return null
    const code = url.searchParams.get('c') || ''
    if (TOKEN_PATTERN.test(code)) return code.toLowerCase()
    if (isValidShortCode(code)) return cleanShortCode(code)
  } catch {
    return null
  }
  return null
}

const RESULT_MESSAGES = Object.freeze({
  already: {
    severity: 'info',
    icon: 'pi pi-check-circle',
    title: 'Présence déjà enregistrée',
    detail: 'Votre présence à cet événement était déjà validée. Rien d’autre à faire.',
  },
  expired: {
    severity: 'warn',
    icon: 'pi pi-clock',
    title: 'Code expiré',
    detail: 'Le QR code change toutes les minutes. Scannez celui qui est affiché en ce moment.',
  },
  invalid: {
    severity: 'error',
    icon: 'pi pi-times-circle',
    title: 'Code non reconnu',
    detail: 'Ce code ne correspond à aucun événement. Vérifiez la saisie ou scannez à nouveau le QR code.',
  },
  event_not_started: {
    severity: 'warn',
    icon: 'pi pi-calendar',
    title: 'Événement pas encore commencé',
    detail: 'La présence s’enregistre à partir de 15 minutes avant le début.',
  },
  event_ended: {
    severity: 'warn',
    icon: 'pi pi-calendar-times',
    title: 'Événement terminé',
    detail: 'La présence ne peut plus être enregistrée pour cet événement.',
  },
  event_unavailable: {
    severity: 'error',
    icon: 'pi pi-ban',
    title: 'Événement indisponible',
    detail: 'Cet événement a été annulé ou n’est plus publié.',
  },
  rate_limited: {
    severity: 'error',
    icon: 'pi pi-lock',
    title: 'Trop d’essais',
    detail: 'Patientez une dizaine de minutes avant de réessayer.',
  },
  unsupported: {
    severity: 'warn',
    icon: 'pi pi-question-circle',
    title: 'Code non pris en charge',
    detail: 'Ce type de code n’est pas encore disponible sur la plateforme.',
  },
  foreign: {
    severity: 'error',
    icon: 'pi pi-times-circle',
    title: 'QR code non reconnu',
    detail: 'Ce QR code n’est pas un code de la plateforme.',
  },
  error: {
    severity: 'error',
    icon: 'pi pi-exclamation-triangle',
    title: 'Validation impossible',
    detail: 'La connexion au serveur a échoué. Vérifiez votre réseau et réessayez.',
  },
})

/** Message à afficher pour un résultat de scan (toujours en français, sans jargon). */
export function describeScanResult(result) {
  const status = result?.status || 'error'
  const eventTitle = result?.event?.title || ''

  if (status === 'ok') {
    const xp = Number(result.xp_gained) || 0
    return {
      status,
      success: true,
      severity: 'success',
      icon: 'pi pi-check-circle',
      title: xp > 0 ? `Présence enregistrée : +${xp} XP` : 'Présence enregistrée',
      detail: xp > 0
        ? 'Les points sont ajoutés à votre progression et à votre maison.'
        : 'Votre présence est notée. Cet événement ne vous rapporte pas de points.',
      eventTitle,
      xp,
    }
  }

  const message = RESULT_MESSAGES[status] || RESULT_MESSAGES.error
  return { status, success: status === 'already', ...message, eventTitle, xp: 0 }
}

async function callRpc(name, params) {
  const { data, error } = await supabase.rpc(name, params)
  if (error) throw error
  return data
}

/** Valide un code (jeton du QR ou code court). Ne lève pas : renvoie toujours un statut. */
export async function redeemScanCode(rawCode) {
  const code = extractScanCode(rawCode)
  if (!code) return { status: 'foreign' }
  try {
    return (await callRpc('redeem_scan_code', { p_code: code })) || { status: 'error' }
  } catch (error) {
    console.error('Validation du code impossible:', error)
    return { status: 'error' }
  }
}

export const getEventCheckinOverview = (eventId) => callRpc('get_event_checkin_overview', { p_event_id: eventId })

export const configureEventCheckin = (eventId, xpReward) => callRpc('configure_event_checkin', {
  p_event_id: eventId,
  p_xp_reward: Math.round(Number(xpReward)),
})

export const issueEventCheckinCode = (eventId) => callRpc('issue_event_checkin_code', { p_event_id: eventId })

export const getEventAttendance = (eventId) => callRpc('get_event_attendance', { p_event_id: eventId })

export async function getMyEventAttendances(limit = 50) {
  return (await callRpc('get_my_event_attendances', { p_limit: limit })) || []
}

const csvCell = (value) => {
  const text = String(value ?? '')
  // Une cellule qui commence par = + - @ serait lue comme une formule par un tableur.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

const formatCsvDate = (value) => value
  ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
  : ''

/** Liste des présents au format CSV (séparateur « ; », lisible directement dans Excel). */
export function attendanceToCsv(attendees = []) {
  const header = ['Nom', 'Classe', 'Heure de validation', 'Mode', 'Points attribués']
  const rows = attendees.map((attendee) => [
    attendee.display_name,
    attendee.classe || '',
    formatCsvDate(attendee.redeemed_at),
    attendee.method === 'code' ? 'Code saisi' : 'QR code',
    Number(attendee.xp_awarded) || 0,
  ])
  return [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')
}

export function downloadAttendanceCsv(eventTitle, attendees) {
  const slug = String(eventTitle || 'evenement')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'evenement'
  const blob = new Blob([String.fromCharCode(0xfeff) + attendanceToCsv(attendees)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `presences-${slug}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

import { supabase } from '@/supabase'

// Chasse au trésor sur le campus. Le navigateur affiche et transmet : le serveur décide
// de tout (chasse ouverte, classe visée, ordre, points, bonus, classement). Les QR codes
// sont ceux de la présence par QR code (lien /scan?c=…, RPC redeem_scan_code).

export const TREASURE_HUNT_PATH = '/chasse-au-tresor'
export const TREASURE_HUNT_MANAGE_PATH = '/chasse-au-tresor/gestion'
export const TREASURE_CLASSES = Object.freeze(['BA24', 'BA25', 'BA26'])
export const MIN_STEP_XP = 5
export const MAX_STEP_XP = 50
export const DEFAULT_STEP_XP = 15
export const COMPLETION_BONUS = 20
export const MAX_STEPS = 30

export const HUNT_STATES = Object.freeze({
  open: { label: 'En cours', severity: 'success' },
  upcoming: { label: 'À venir', severity: 'info' },
  ended: { label: 'Terminée', severity: 'secondary' },
  draft: { label: 'Brouillon', severity: 'warning' },
})

export const huntStateLabel = (state) => HUNT_STATES[state]?.label || 'Indisponible'
export const huntStateSeverity = (state) => HUNT_STATES[state]?.severity || 'secondary'

const dayFormatter = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'long' })
const timeFormatter = new Intl.DateTimeFormat('fr-CH', { hour: '2-digit', minute: '2-digit' })

/** « 16 novembre à 08:00 » */
export function formatHuntDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${dayFormatter.format(date)} à ${timeFormatter.format(date)}`
}

/** « Du 16 novembre à 08:00 au 30 novembre à 18:00 » */
export function formatHuntPeriod(startsAt, endsAt) {
  if (!startsAt || !endsAt) return ''
  return `Du ${formatHuntDate(startsAt)} au ${formatHuntDate(endsAt)}`
}

/** « 3 sur 8 trouvées » */
export function progressLabel(found, total) {
  const done = Math.max(0, Number(found) || 0)
  const all = Math.max(0, Number(total) || 0)
  return `${done} sur ${all} trouvée${done > 1 ? 's' : ''}`
}

export const progressPercent = (found, total) => {
  const all = Number(total) || 0
  return all > 0 ? Math.min(100, Math.round(((Number(found) || 0) / all) * 100)) : 0
}

export const classesLabel = (classes = []) => (classes?.length ? classes.join(', ') : 'Toutes les classes')

// ---------------------------------------------------------------------------
// Messages de scan propres à la chasse
// ---------------------------------------------------------------------------

const TREASURE_MESSAGES = Object.freeze({
  already: {
    severity: 'info',
    icon: 'pi pi-check-circle',
    title: 'Étape déjà trouvée',
    detail: 'Vous aviez déjà validé ce QR code. Cherchez les étapes suivantes !',
  },
  code_revoked: {
    severity: 'error',
    icon: 'pi pi-ban',
    title: 'QR code désactivé',
    detail: 'Ce QR code a été remplacé par l’organisateur. Trouvez l’original sur le campus.',
  },
  not_eligible: {
    severity: 'warn',
    icon: 'pi pi-users',
    title: 'Chasse réservée à d’autres classes',
    detail: 'Cette chasse au trésor ne concerne pas votre classe.',
  },
  hunt_not_started: {
    severity: 'warn',
    icon: 'pi pi-calendar',
    title: 'Chasse pas encore commencée',
    detail: 'Revenez scanner ce QR code quand la chasse aura commencé.',
  },
  hunt_ended: {
    severity: 'warn',
    icon: 'pi pi-calendar-times',
    title: 'Chasse terminée',
    detail: 'Cette chasse au trésor est terminée : ce QR code ne rapporte plus de points.',
  },
  hunt_unavailable: {
    severity: 'error',
    icon: 'pi pi-ban',
    title: 'Chasse indisponible',
    detail: 'Cette chasse au trésor n’est pas publiée.',
  },
})

const TREASURE_STATUSES = new Set(['ok', 'order_required', ...Object.keys(TREASURE_MESSAGES)])

export const isTreasureResult = (result) => result?.kind === 'treasure_hunt' && TREASURE_STATUSES.has(result?.status)

/** Message d'un scan de chasse au trésor (statut renvoyé par redeem_scan_code). */
export function describeTreasureResult(result) {
  const status = result?.status || 'error'
  const hunt = result?.hunt || null
  const base = { status, kind: 'treasure_hunt', huntId: hunt?.id || null, eventTitle: hunt?.title || '', xp: 0 }

  if (status === 'ok') {
    const xp = Number(result.xp_gained) || 0
    const bonus = Number(result.bonus_xp) || 0
    const stepName = result.step?.name || ''
    const progress = progressLabel(result.found, result.total)
    let detail = `${stepName ? `${stepName} : ` : ''}${progress}.`
    if (result.completed) {
      detail = bonus > 0
        ? `Toutes les étapes sont trouvées : bonus de +${bonus} XP pour vous et votre maison !`
        : 'Toutes les étapes sont trouvées. Bravo !'
    } else if (xp > 0) {
      detail += ' Les points comptent aussi pour votre maison.'
    }
    return {
      ...base,
      success: true,
      severity: 'success',
      icon: result.completed ? 'pi pi-trophy' : 'pi pi-check-circle',
      title: xp > 0 ? `Étape trouvée : +${xp} XP` : 'Étape trouvée',
      detail,
      xp: xp + bonus,
      completed: Boolean(result.completed),
    }
  }

  if (status === 'order_required') {
    const expected = Number(result.expected_position) || 1
    return {
      ...base,
      success: false,
      severity: 'warn',
      icon: 'pi pi-sort-numeric-up',
      title: 'Pas encore !',
      detail: `Dans cette chasse, l’ordre est imposé : trouvez d’abord l’étape ${expected}.`,
    }
  }

  const message = TREASURE_MESSAGES[status]
  if (!message) return null
  const detail = status === 'already' && result.total
    ? `${message.detail} (${progressLabel(result.found, result.total)})`
    : message.detail
  return { ...base, success: status === 'already', ...message, detail }
}

/** « Réessayez vers 14:35 » à partir du retry_at renvoyé par le serveur. */
export function retryHint(retryAt) {
  if (!retryAt) return 'Patientez avant de réessayer.'
  const date = new Date(retryAt)
  if (Number.isNaN(date.getTime())) return 'Patientez avant de réessayer.'
  return `Vous pourrez réessayer vers ${timeFormatter.format(date)}.`
}

// ---------------------------------------------------------------------------
// Appels au serveur
// ---------------------------------------------------------------------------

async function callRpc(name, params) {
  const { data, error } = await supabase.rpc(name, params)
  if (error) throw error
  return data
}

/** Message d'erreur lisible : les refus du serveur (code P0001) sont rédigés en français. */
export function treasureErrorMessage(error, fallback = 'L’opération a échoué. Réessayez.') {
  const message = String(error?.message || '').trim()
  if (error?.code === 'P0001' && message && message !== 'Authentication required') return message
  return fallback
}

export const listTreasureHunts = async () => (await callRpc('list_treasure_hunts')) || { hunts: [] }
export const getTreasureHunt = (huntId) => callRpc('get_treasure_hunt', { p_hunt_id: huntId })
export const manageListTreasureHunts = async () => (await callRpc('manage_list_treasure_hunts')) || { allowed: false, hunts: [] }
export const manageGetTreasureHunt = (huntId) => callRpc('manage_get_treasure_hunt', { p_hunt_id: huntId })

const toIso = (value) => (value instanceof Date ? value.toISOString() : value || null)

export const saveTreasureHunt = (hunt) => callRpc('save_treasure_hunt', {
  p_hunt_id: hunt.id || null,
  p_title: hunt.title || '',
  p_description: hunt.description || '',
  p_starts_at: toIso(hunt.starts_at),
  p_ends_at: toIso(hunt.ends_at),
  p_target_classes: hunt.target_classes || [],
  p_ordered: Boolean(hunt.ordered),
})

export const setTreasureHuntPublished = (huntId, published) => callRpc('set_treasure_hunt_published', {
  p_hunt_id: huntId,
  p_published: Boolean(published),
})

export const deleteTreasureHunt = (huntId) => callRpc('delete_treasure_hunt', { p_hunt_id: huntId })

export const saveTreasureHuntStep = (step) => callRpc('save_treasure_hunt_step', {
  p_step_id: step.id || null,
  p_hunt_id: step.hunt_id,
  p_name: step.name || '',
  p_hint: step.hint || '',
  p_xp_reward: Math.round(Number(step.xp_reward)),
})

export const deleteTreasureHuntStep = (stepId) => callRpc('delete_treasure_hunt_step', { p_step_id: stepId })

export const reorderTreasureHuntSteps = (huntId, stepIds) => callRpc('reorder_treasure_hunt_steps', {
  p_hunt_id: huntId,
  p_step_ids: stepIds,
})

/** Remplace le QR code d'une étape (disable = false) ou le désactive (disable = true). */
export const renewTreasureHuntStepCode = (stepId, disable = false) => callRpc('renew_treasure_hunt_step_code', {
  p_step_id: stepId,
  p_disable: Boolean(disable),
})

/** Déplace un élément d'une liste d'une place (direction -1 ou +1). */
export function moveItem(list, index, direction) {
  const target = index + direction
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return [...list]
  const copy = [...list]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item)
  return copy
}

export const PFP_OUTCOMES = Object.freeze({
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed',
  STOPPED: 'stopped',
  INVALID: 'invalid'
})

export const PFP_OUTCOME_OPTIONS = Object.freeze([
  { label: 'En attente', value: PFP_OUTCOMES.PENDING, severity: 'secondary' },
  { label: 'Réussi', value: PFP_OUTCOMES.PASSED, severity: 'success' },
  { label: 'Échec', value: PFP_OUTCOMES.FAILED, severity: 'danger' },
  { label: 'Arrêt', value: PFP_OUTCOMES.STOPPED, severity: 'warn' }
])

const WRITABLE_OUTCOMES = new Set(PFP_OUTCOME_OPTIONS.map((option) => option.value))

export function getPfpOutcome(row = {}) {
  const selected = [
    row.pfp_validee && PFP_OUTCOMES.PASSED,
    row.pfp_echec && PFP_OUTCOMES.FAILED,
    row.pfp_arret && PFP_OUTCOMES.STOPPED
  ].filter(Boolean)

  if (selected.length > 1) return PFP_OUTCOMES.INVALID
  return selected[0] || PFP_OUTCOMES.PENDING
}

export function validatePfpOutcome(outcome, comment = '') {
  if (!WRITABLE_OUTCOMES.has(outcome)) {
    return { valid: false, message: 'Résultat PFP invalide.' }
  }

  if (outcome === PFP_OUTCOMES.STOPPED && !String(comment || '').trim()) {
    return { valid: false, message: "Le motif de l'arrêt est obligatoire." }
  }

  return { valid: true, message: '' }
}

export function buildPfpOutcomePayload(outcome, comment = '') {
  const validation = validatePfpOutcome(outcome, comment)
  if (!validation.valid) throw new TypeError(validation.message)

  const normalizedComment = outcome === PFP_OUTCOMES.STOPPED
    ? String(comment).trim()
    : ''

  return {
    pfp_validee: outcome === PFP_OUTCOMES.PASSED,
    pfp_echec: outcome === PFP_OUTCOMES.FAILED,
    pfp_arret: outcome === PFP_OUTCOMES.STOPPED,
    commentaire_arret: normalizedComment
  }
}

export function createPfpOutcomeDraft(row = {}) {
  return {
    outcome: getPfpOutcome(row),
    comment: String(row.commentaire_arret || '')
  }
}

export function hasPfpOutcomeChanged(row = {}, draft = {}) {
  const current = createPfpOutcomeDraft(row)
  const nextComment = draft.outcome === PFP_OUTCOMES.STOPPED
    ? String(draft.comment || '').trim()
    : ''
  const currentComment = current.outcome === PFP_OUTCOMES.STOPPED
    ? current.comment.trim()
    : ''

  return current.outcome !== draft.outcome || currentComment !== nextComment
}

export default {
  PFP_OUTCOMES,
  PFP_OUTCOME_OPTIONS,
  buildPfpOutcomePayload,
  createPfpOutcomeDraft,
  getPfpOutcome,
  hasPfpOutcomeChanged,
  validatePfpOutcome
}

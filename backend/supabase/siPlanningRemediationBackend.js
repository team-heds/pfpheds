const express = require('express')

const CATEGORIES = new Set(['course', 'teacher', 'room', 'time'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeRemediationPayload(body = {}) {
  const slotId = Number(body.slotId)
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  const expectedValue = body.expectedValue
  const replacementValue = body.replacementValue

  if (!Number.isSafeInteger(slotId) || slotId <= 0) return { error: 'Créneau invalide.' }
  if (!CATEGORIES.has(category)) return { error: "Type d'anomalie invalide." }
  if (!expectedValue || typeof expectedValue !== 'object' || Array.isArray(expectedValue)) {
    return { error: 'Valeur actuelle invalide.' }
  }
  if (!replacementValue || typeof replacementValue !== 'object' || Array.isArray(replacementValue)) {
    return { error: 'Valeur de remplacement invalide.' }
  }
  if (reason.length < 8 || reason.length > 500) {
    return { error: 'La justification doit contenir entre 8 et 500 caractères.' }
  }

  return { slotId, category, expectedValue, replacementValue, reason }
}

function remediationErrorResponse(error) {
  if (error?.code === '42501') return { status: 403, message: 'Action non autorisée.' }
  if (error?.code === 'P0002') return { status: 404, message: 'Correction ou créneau introuvable.' }
  if (error?.code === '40001') {
    return { status: 409, message: 'Le créneau a changé depuis le diagnostic. Rechargez la page.' }
  }
  if (error?.code === '22023' || error?.code === '23514') {
    return { status: 400, message: 'La correction proposée ne peut pas être appliquée.' }
  }
  return { status: 503, message: 'Le service de correction est temporairement indisponible.' }
}

function createSIPlanningRemediationRouter(options = {}) {
  const router = express.Router()
  const client = options.client
  const logger = options.logger || console

  if (!client) throw new Error('A Supabase service-role client is required')

  router.get('/history', async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
    const { data, error } = await client
      .from('si_planning_remediation_history')
      .select('id,slot_id,category,actor_user_id,reason,before_value,after_value,status,created_at,reverted_at,reverted_by')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('[SI_PLANNING_REMEDIATION] History failed', {
        requestId: req.id,
        actorUserId: req.auth.userId,
        code: error.code
      })
      return res.status(503).json({ error: 'Historique temporairement indisponible.' })
    }
    return res.json({ history: data || [] })
  })

  router.post('/', async (req, res) => {
    const payload = normalizeRemediationPayload(req.body)
    if (payload.error) return res.status(400).json({ error: payload.error })

    const { data, error } = await client.rpc('apply_si_planning_remediation', {
      p_actor_user_id: req.auth.userId,
      p_slot_id: payload.slotId,
      p_category: payload.category,
      p_expected_value: payload.expectedValue,
      p_replacement_value: payload.replacementValue,
      p_reason: payload.reason
    })

    if (error) {
      const mapped = remediationErrorResponse(error)
      if (mapped.status >= 500) {
        logger.error('[SI_PLANNING_REMEDIATION] Apply failed', {
          requestId: req.id,
          actorUserId: req.auth.userId,
          slotId: payload.slotId,
          code: error.code
        })
      }
      return res.status(mapped.status).json({ error: mapped.message })
    }
    return res.status(201).json({ remediation: data })
  })

  router.post('/:historyId/revert', async (req, res) => {
    const historyId = String(req.params.historyId || '')
    if (!UUID_PATTERN.test(historyId)) {
      return res.status(400).json({ error: "Identifiant d'historique invalide." })
    }

    const { data, error } = await client.rpc('revert_si_planning_remediation', {
      p_actor_user_id: req.auth.userId,
      p_history_id: historyId
    })
    if (error) {
      const mapped = remediationErrorResponse(error)
      if (mapped.status >= 500) {
        logger.error('[SI_PLANNING_REMEDIATION] Revert failed', {
          requestId: req.id,
          actorUserId: req.auth.userId,
          historyId,
          code: error.code
        })
      }
      return res.status(mapped.status).json({ error: mapped.message })
    }
    return res.json({ remediation: data })
  })

  return router
}

module.exports = {
  createSIPlanningRemediationRouter,
  normalizeRemediationPayload,
  remediationErrorResponse
}

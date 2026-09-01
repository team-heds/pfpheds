const express = require('express')
const { supabaseAdmin } = require('../supabaseClient')

const OUTCOMES = new Set(['pending', 'passed', 'failed', 'stopped'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeOutcomePayload(body = {}) {
  const outcome = typeof body.outcome === 'string' ? body.outcome.trim().toLowerCase() : ''
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''

  if (!OUTCOMES.has(outcome)) {
    return { error: 'Résultat PFP invalide.' }
  }
  if (outcome === 'stopped' && !comment) {
    return { error: "Le motif de l'arrêt est obligatoire." }
  }
  if (comment.length > 2000) {
    return { error: 'Le motif ne peut pas dépasser 2000 caractères.' }
  }

  return { outcome, comment: outcome === 'stopped' ? comment : '' }
}

function createPfpOutcomeRouter(options = {}) {
  const router = express.Router()
  const client = options.client || supabaseAdmin
  const logger = options.logger || console

  router.patch('/:assignmentId', async (req, res) => {
    const assignmentId = String(req.params.assignmentId || '')
    if (!UUID_PATTERN.test(assignmentId)) {
      return res.status(400).json({ error: "Identifiant d'affectation invalide." })
    }

    const payload = normalizeOutcomePayload(req.body)
    if (payload.error) return res.status(400).json({ error: payload.error })

    const { data, error } = await client.rpc('set_pfp_outcome', {
      p_assignment_id: assignmentId,
      p_outcome: payload.outcome,
      p_comment: payload.comment,
      p_actor_user_id: req.auth.userId
    })

    if (error) {
      if (error.code === 'P0002') {
        return res.status(404).json({ error: 'Affectation PFP introuvable.' })
      }
      if (error.code === '22023' || error.code === '23514') {
        return res.status(400).json({ error: 'Le résultat PFP ne peut pas être enregistré.' })
      }
      logger.error('[PFP_OUTCOME] Save failed', {
        requestId: req.id,
        assignmentId,
        actorUserId: req.auth.userId,
        code: error.code
      })
      return res.status(503).json({ error: 'Enregistrement temporairement indisponible.' })
    }

    return res.json({ outcome: data })
  })

  return router
}

module.exports = {
  createPfpOutcomeRouter,
  normalizeOutcomePayload
}

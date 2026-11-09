const { Router } = require('express')
const { supabaseAdmin } = require('../supabaseClient')
const { withTimeout } = require('../observability/health')
const { resolveRecoveryRedirectUrl } = require('./passwordRecoveryRequestBackend')

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createAdminPasswordRecoveryRouter(options = {}) {
  const router = Router()
  const client = options.client || supabaseAdmin
  const authClient = options.authClient || supabaseAdmin.auth
  const logger = options.logger || console
  const timeoutMs = options.timeoutMs || 5000
  const redirectTo = resolveRecoveryRedirectUrl(options.environment || process.env)

  router.post('/:id/password-recovery', async (req, res) => {
    const targetUserId = String(req.params.id || '')
    const context = {
      requestId: req.id,
      actorUserId: req.auth.userId,
      targetUserId
    }

    if (!UUID_PATTERN.test(targetUserId)) {
      return res.status(400).json({ error: 'Identifiant utilisateur invalide.' })
    }

    try {
      const profileQuery = client
        .from('user_profiles')
        .select('user_id,is_active')
        .eq('user_id', targetUserId)
        .maybeSingle()
      const { data: profile, error: profileError } = await withTimeout(profileQuery, timeoutMs)
      if (profileError) throw profileError
      if (!profile) return res.status(404).json({ error: 'Compte introuvable.' })
      if (profile.is_active !== true) {
        return res.status(409).json({ error: 'Ce compte est désactivé.' })
      }

      const authResult = await withTimeout(authClient.admin.getUserById(targetUserId), timeoutMs)
      if (authResult?.error || !authResult?.data?.user) {
        return res.status(409).json({ error: "Le compte d’authentification n’est pas disponible." })
      }
      const email = String(authResult.data.user.email || '').trim().toLowerCase()
      if (!email) {
        return res.status(409).json({ error: "L’adresse du compte n’est pas disponible." })
      }

      const { error } = await withTimeout(
        authClient.resetPasswordForEmail(email, { redirectTo }),
        timeoutMs
      )
      if (error) {
        const status = Number(error.status || 0)
        logger.warn('[ADMIN_PASSWORD_RECOVERY] Delivery rejected', {
          ...context,
          category: status === 429 ? 'rate_limited' : 'delivery_failed',
          ...(status ? { status } : {})
        })
        return res.status(status === 429 ? 429 : 502).json({
          error:
            status === 429
              ? 'Veuillez patienter avant de renvoyer un email.'
              : "L’email de récupération n’a pas pu être envoyé."
        })
      }

      logger.info('[ADMIN_PASSWORD_RECOVERY] Request accepted', {
        ...context,
        category: 'submitted'
      })
      return res.status(202).json({ status: 'sent' })
    } catch (error) {
      logger.error('[ADMIN_PASSWORD_RECOVERY] Service unavailable', {
        ...context,
        category: 'provider_unavailable',
        ...(error?.code === 'UPSTREAM_TIMEOUT' ? { code: 'UPSTREAM_TIMEOUT' } : {})
      })
      return res.status(503).json({ error: 'Le service est temporairement indisponible.' })
    }
  })

  return router
}

module.exports = { createAdminPasswordRecoveryRouter }

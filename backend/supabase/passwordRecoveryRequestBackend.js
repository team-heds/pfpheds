const crypto = require('crypto')
const express = require('express')
const rateLimit = require('express-rate-limit')
const supabase = require('../supabaseClient')

const PUBLIC_RESPONSE = Object.freeze({
  message: 'Si cette adresse est associée à un compte, un email de réinitialisation sera envoyé.'
})

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isValidEmail(value) {
  return value.length <= 254 && EMAIL_PATTERN.test(value)
}

function resolveRecoveryRedirectUrl(environment = process.env) {
  const configured = String(environment.PASSWORD_RECOVERY_REDIRECT_URL || '').trim()
  const fallback =
    environment.NODE_ENV === 'production'
      ? 'https://hedsvs.ch/reset-password?flow=recovery'
      : 'http://localhost:5173/reset-password?flow=recovery'
  const candidate = configured || fallback
  const url = new URL(candidate)

  const localDevelopment = ['localhost', '127.0.0.1'].includes(url.hostname)
  if (url.protocol !== 'https:' && !localDevelopment) {
    throw new Error('PASSWORD_RECOVERY_REDIRECT_URL must use HTTPS outside local development.')
  }
  if (url.pathname !== '/reset-password') {
    throw new Error('PASSWORD_RECOVERY_REDIRECT_URL must target /reset-password.')
  }
  if (url.username || url.password || url.hash) {
    throw new Error('PASSWORD_RECOVERY_REDIRECT_URL contains forbidden URL components.')
  }

  url.search = ''
  url.searchParams.set('flow', 'recovery')
  return url.toString()
}

function sendPublicResponse(res, status = 202) {
  return res.status(status).json(PUBLIC_RESPONSE)
}

function createRecoveryLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => sendPublicResponse(res, 429)
  })
}

function createPasswordRecoveryRequestRouter(options = {}) {
  const router = express.Router()
  const authClient = options.authClient || supabase.auth
  const logger = options.logger || console
  const requestIdFactory = options.requestIdFactory || crypto.randomUUID
  const limiter = options.limiter || createRecoveryLimiter()
  const redirectTo = resolveRecoveryRedirectUrl(options.environment || process.env)

  router.post('/', limiter, async (req, res) => {
    const requestId = requestIdFactory()
    const email = normalizeEmail(req.body?.email)
    res.set('X-Request-ID', requestId)

    if (!isValidEmail(email)) {
      logger.warn('[PASSWORD_RECOVERY] Request rejected', {
        requestId,
        category: 'invalid_input'
      })
      return sendPublicResponse(res)
    }

    try {
      const { error } = await authClient.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      logger.info('[PASSWORD_RECOVERY] Request accepted', {
        requestId,
        category: 'submitted'
      })
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : undefined
      logger.error('[PASSWORD_RECOVERY] Delivery failed', {
        requestId,
        category: 'delivery_failure',
        ...(status ? { status } : {})
      })
    }

    return sendPublicResponse(res)
  })

  return router
}

module.exports = {
  PUBLIC_RESPONSE,
  createPasswordRecoveryRequestRouter,
  isValidEmail,
  normalizeEmail,
  resolveRecoveryRedirectUrl
}

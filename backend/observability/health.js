const express = require('express')
const { logStructured, upstreamErrorContext } = require('./logger')

const DEFAULT_READY_TIMEOUT_MS = 1500

function timeoutError() {
  const error = new Error('Upstream dependency timed out')
  error.code = 'UPSTREAM_TIMEOUT'
  return error
}

function withTimeout(promise, timeoutMs, onTimeout) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      onTimeout?.()
      reject(timeoutError())
    }, timeoutMs)
  })
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer))
}

function createSupabaseReadinessCheck(client, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_READY_TIMEOUT_MS
  return async function checkSupabase() {
    const controller = new AbortController()
    let query = client
      .from('user_profiles')
      .select('user_id', { head: true, count: 'exact' })
      .limit(1)
    if (typeof query.abortSignal === 'function') query = query.abortSignal(controller.signal)
    const result = await withTimeout(query, timeoutMs, () => controller.abort())
    if (result?.error) throw result.error
    return { name: 'supabase-postgrest', status: 'up' }
  }
}

function createHealthRouter(options = {}) {
  const router = express.Router()
  const logger = options.logger || console
  const checkDependency = options.checkDependency
  const now = options.now || (() => new Date())

  const livenessPayload = () => ({
    status: 'healthy',
    timestamp: now().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })

  router.get('/', (_req, res) => res.status(200).json(livenessPayload()))
  router.get('/live', (_req, res) => res.status(200).json(livenessPayload()))
  router.get('/ready', async (req, res) => {
    const startedAt = process.hrtime.bigint()
    try {
      const dependency = await checkDependency()
      return res.status(200).json({
        status: 'ready',
        timestamp: now().toISOString(),
        dependencies: [dependency]
      })
    } catch (error) {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6
      logStructured(
        'error',
        upstreamErrorContext(error, {
          requestId: req.id,
          service: 'supabase-postgrest',
          operation: 'readiness',
          durationMs: Number(durationMs.toFixed(2))
        }),
        logger
      )
      return res.status(503).json({
        status: 'not_ready',
        timestamp: now().toISOString(),
        dependencies: [{ name: 'supabase-postgrest', status: 'down' }]
      })
    }
  })

  return router
}

module.exports = {
  createHealthRouter,
  createSupabaseReadinessCheck,
  timeoutError,
  withTimeout
}

const { Router } = require('express')
const { DASHBOARD_DOMAINS } = require('./adminDashboardContract')
const { createAdminDashboardStatsService } = require('./adminDashboardStatsService')
const { isAdmin } = require('../middleware/auth')
const { logStructured, upstreamErrorContext } = require('../observability/logger')

const DOMAIN_PERMISSIONS = Object.freeze({
  pfp: new Set(['students.read', 'enseignantphysio', 'rmphysio', 'repondanthes']),
  academic: new Set([
    'enseignantphysio',
    'rmphysio',
    'enseignantsoins',
    'rmsoins',
    'repondanthes'
  ])
})

function allowedDashboardDomains(auth) {
  if (isAdmin(auth)) return [...DASHBOARD_DOMAINS]
  const permissions = new Set(
    (auth?.permissions || []).map((permission) => String(permission).toLowerCase())
  )
  return Object.entries(DOMAIN_PERMISSIONS)
    .filter(([, allowed]) => [...permissions].some((permission) => allowed.has(permission)))
    .map(([domain]) => domain)
}

function parseRequestedDomains(value) {
  if (value === undefined || value === null || value === '') return null
  const domains = [...new Set(String(value).split(',').map((domain) => domain.trim()).filter(Boolean))]
  if (!domains.length || domains.some((domain) => !DASHBOARD_DOMAINS.includes(domain))) {
    const error = new Error('Paramètre domains invalide.')
    error.status = 400
    throw error
  }
  return domains
}

function createAdminDashboardStatsRouter(options = {}) {
  const client = options.client
  if (!client) throw new Error('Un client Supabase serveur est obligatoire.')
  const logger = options.logger || console
  const now = options.now
  const router = Router()

  router.get('/v1/stats', async (req, res) => {
    try {
      const allowedDomains = allowedDashboardDomains(req.auth)
      if (!allowedDomains.length) {
        return res.status(403).json({ error: 'Permission dashboard insuffisante.' })
      }

      const requestedDomains = parseRequestedDomains(req.query?.domains) || allowedDomains
      const forbiddenDomains = requestedDomains.filter((domain) => !allowedDomains.includes(domain))
      if (forbiddenDomains.length) {
        return res.status(403).json({
          error: 'Un ou plusieurs domaines dashboard ne sont pas autorisés.',
          forbiddenDomains
        })
      }

      const service = createAdminDashboardStatsService({
        client,
        now,
        onMetricError({ key, domain, source, error }) {
          logStructured(
            'error',
            upstreamErrorContext(error, {
              event: 'admin-dashboard.metric-error',
              requestId: req.id,
              service: 'supabase',
              operation: 'admin-dashboard-stats',
              domain,
              metric: key,
              source
            }),
            logger
          )
        }
      })

      const response = await service.loadStats(requestedDomains)
      const hasErrors = Object.values(response.domains).some((domain) =>
        ['partial', 'error'].includes(domain.status)
      )
      return res.status(hasErrors ? 206 : 200).json(response)
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ error: error.message })
      logStructured(
        'error',
        upstreamErrorContext(error, {
          event: 'admin-dashboard.request-error',
          requestId: req.id,
          service: 'api',
          operation: 'admin-dashboard-stats'
        }),
        logger
      )
      return res.status(500).json({ error: 'Impossible de charger les statistiques admin.' })
    }
  })

  return router
}

module.exports = {
  DOMAIN_PERMISSIONS,
  allowedDashboardDomains,
  createAdminDashboardStatsRouter,
  parseRequestedDomains
}

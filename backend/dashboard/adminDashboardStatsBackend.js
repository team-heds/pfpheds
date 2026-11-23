const { Router } = require('express')
const { DASHBOARD_DOMAINS } = require('./adminDashboardContract')
const {
  createAdminDashboardStatsService,
  loadRecentGamificationActivity
} = require('./adminDashboardStatsService')
const { PERIOD_KEYS, parseReference } = require('./adminDashboardPeriod')
const { loadAdminAlerts, resolveAdminAlert } = require('./adminDashboardAlerts')
const { isAdmin } = require('../middleware/auth')
const { logStructured, upstreamErrorContext } = require('../observability/logger')
const {
  loadDashboardFilterOptions,
  parseDashboardFilters,
  validateFilterCombination
} = require('./adminDashboardFilters')

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

function parsePeriodOptions(query = {}) {
  const key = query.period === undefined || query.period === '' ? 'month' : String(query.period)
  if (!PERIOD_KEYS.includes(key)) {
    const error = new Error('Paramètre period invalide.')
    error.status = 400
    throw error
  }
  if (query.reference !== undefined && query.reference !== '') parseReference(query.reference)
  return { key, reference: query.reference || undefined }
}

function createAdminDashboardStatsRouter(options = {}) {
  const client = options.client
  if (!client) throw new Error('Un client Supabase serveur est obligatoire.')
  const logger = options.logger || console
  const now = options.now
  const router = Router()

  router.get('/v1/filter-options', async (req, res) => {
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
      return res.json(await loadDashboardFilterOptions(client, requestedDomains))
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ error: error.message, code: error.code })
      logStructured(
        'error',
        upstreamErrorContext(error, {
          event: 'admin-dashboard.filter-options-error',
          requestId: req.id,
          service: 'supabase',
          operation: 'admin-dashboard-filter-options'
        }),
        logger
      )
      return res.status(500).json({ error: 'Impossible de charger les filtres admin.' })
    }
  })

  router.get('/v1/stats', async (req, res) => {
    try {
      const allowedDomains = allowedDashboardDomains(req.auth)
      if (!allowedDomains.length) {
        return res.status(403).json({ error: 'Permission dashboard insuffisante.' })
      }

      const requestedDomains = parseRequestedDomains(req.query?.domains) || allowedDomains
      const periodOptions = parsePeriodOptions(req.query)
      const forbiddenDomains = requestedDomains.filter((domain) => !allowedDomains.includes(domain))
      if (forbiddenDomains.length) {
        return res.status(403).json({
          error: 'Un ou plusieurs domaines dashboard ne sont pas autorisés.',
          forbiddenDomains
        })
      }
      const filters = validateFilterCombination(parseDashboardFilters(req.query), requestedDomains)

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

      const response = await service.loadStats(requestedDomains, periodOptions, filters)
      const hasErrors = Object.values(response.domains).some((domain) =>
        ['partial', 'error'].includes(domain.status)
      )
      return res.status(hasErrors ? 206 : 200).json(response)
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ error: error.message, code: error.code })
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

  function alertService(req) {
    return createAdminDashboardStatsService({
      client,
      now,
      onMetricError({ key, domain, source, error }) {
        logStructured(
          'error',
          upstreamErrorContext(error, {
            event: 'admin-dashboard.alert-metric-error',
            requestId: req.id,
            service: 'supabase',
            operation: 'admin-dashboard-alerts',
            domain,
            metric: key,
            source
          }),
          logger
        )
      }
    })
  }

  function sendAlertError(req, res, error) {
    if ([400, 404, 503].includes(error.status)) {
      return res.status(error.status).json({ error: error.message })
    }
    logStructured(
      'error',
      upstreamErrorContext(error, {
        event: 'admin-dashboard.alerts-error',
        requestId: req.id,
        service: 'supabase',
        operation: 'admin-dashboard-alerts'
      }),
      logger
    )
    return res.status(500).json({ error: 'Impossible de charger les alertes admin.' })
  }

  router.get('/v1/alerts', async (req, res) => {
    try {
      const domains = allowedDashboardDomains(req.auth)
      if (!domains.length) return res.status(403).json({ error: 'Permission dashboard insuffisante.' })
      const { key: periodKey } = parsePeriodOptions({ period: req.query?.period })
      return res.json(
        await loadAdminAlerts({
          client,
          statsService: alertService(req),
          domains,
          periodKey,
          onRuleError: ({ key, domain, source, error }) =>
            logStructured(
              'error',
              upstreamErrorContext(error, {
                event: 'admin-dashboard.alert-rule-error',
                requestId: req.id,
                service: 'supabase',
                operation: 'admin-dashboard-alerts',
                domain,
                metric: key,
                source
              }),
              logger
            )
        })
      )
    } catch (error) {
      return sendAlertError(req, res, error)
    }
  })

  router.post('/v1/alerts/:key/resolve', async (req, res) => {
    try {
      if (!isAdmin(req.auth)) {
        return res.status(403).json({ error: 'Seul un administrateur peut résoudre une alerte.' })
      }
      const { key: periodKey } = parsePeriodOptions({ period: req.query?.period })
      return res.json(
        await resolveAdminAlert({
          client,
          statsService: alertService(req),
          domains: allowedDashboardDomains(req.auth),
          periodKey,
          alertKey: String(req.params.key || ''),
          userId: req.auth?.userId
        })
      )
    } catch (error) {
      return sendAlertError(req, res, error)
    }
  })

  router.get('/v1/gamification/activity', async (req, res) => {
    try {
      if (!allowedDashboardDomains(req.auth).includes('gamification')) {
        return res.status(403).json({ error: 'Permission dashboard gamification insuffisante.' })
      }
      const activities = await loadRecentGamificationActivity(client, req.query?.limit)
      return res.json({ version: '1', asOf: new Date().toISOString(), activities })
    } catch (error) {
      logStructured(
        'error',
        upstreamErrorContext(error, {
          event: 'admin-dashboard.gamification-activity-error',
          requestId: req.id,
          service: 'supabase',
          operation: 'admin-dashboard-gamification-activity'
        }),
        logger
      )
      return res.status(500).json({ error: 'Impossible de charger les activités gamification.' })
    }
  })

  return router
}

const SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000

// La capture est rejouable : une exécution par heure garantit une valeur par jour,
// même après un redémarrage, sans dupliquer les formules des KPI en SQL.
function startAdminKpiSnapshotJob({ client, logger = console, intervalMs = SNAPSHOT_INTERVAL_MS }) {
  const service = createAdminDashboardStatsService({ client })
  const run = async () => {
    try {
      await service.captureDailySnapshot()
    } catch (error) {
      if (['42P01', 'PGRST205'].includes(error?.code)) return
      logStructured(
        'error',
        upstreamErrorContext(error, {
          event: 'admin-dashboard.snapshot-error',
          service: 'supabase',
          operation: 'admin-dashboard-snapshot'
        }),
        logger
      )
    }
  }
  run()
  const timer = setInterval(run, intervalMs)
  timer.unref?.()
  return timer
}

module.exports = {
  DOMAIN_PERMISSIONS,
  allowedDashboardDomains,
  createAdminDashboardStatsRouter,
  parsePeriodOptions,
  parseRequestedDomains,
  startAdminKpiSnapshotJob
}

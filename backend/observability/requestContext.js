const crypto = require('node:crypto')
const { logStructured } = require('./logger')

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/

function resolveRequestId(value, requestIdFactory = crypto.randomUUID) {
  const candidate = typeof value === 'string' ? value.trim() : ''
  return REQUEST_ID_PATTERN.test(candidate) ? candidate : requestIdFactory()
}

function normalizedRoute(req) {
  const routePath = typeof req.route?.path === 'string' ? req.route.path : null
  if (routePath) return `${req.baseUrl || ''}${routePath}` || '/'

  const originalPath = String(req.originalUrl || req.path || '/').split('?')[0]
  return originalPath.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id').replace(/\b\d{4,}\b/g, ':id')
}

function createRequestContextMiddleware(options = {}) {
  const logger = options.logger || console
  const requestIdFactory = options.requestIdFactory || crypto.randomUUID
  const clock = options.clock || (() => process.hrtime.bigint())

  return function requestContext(req, res, next) {
    const requestId = resolveRequestId(req.get('x-request-id'), requestIdFactory)
    const startedAt = clock()
    req.id = requestId
    res.set('X-Request-ID', requestId)

    res.once('finish', () => {
      const durationMs = Number(clock() - startedAt) / 1e6
      logStructured(
        'info',
        {
          event: 'request.completed',
          requestId,
          method: req.method,
          route: normalizedRoute(req),
          status: res.statusCode,
          durationMs: Number(durationMs.toFixed(2))
        },
        logger
      )
    })
    next()
  }
}

module.exports = {
  createRequestContextMiddleware,
  normalizedRoute,
  resolveRequestId
}

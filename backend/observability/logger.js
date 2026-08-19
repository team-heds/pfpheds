const SENSITIVE_KEY_PATTERN = /authorization|cookie|password|secret|token|key/i

function sanitizeLogContext(value, depth = 0) {
  if (depth > 3) return '[truncated]'
  if (value === null || value === undefined) return value
  if (['string', 'number', 'boolean'].includes(typeof value)) return value
  if (Array.isArray(value))
    return value.slice(0, 20).map((entry) => sanitizeLogContext(entry, depth + 1))
  if (typeof value !== 'object') return String(value)

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
      .slice(0, 30)
      .map(([key, entry]) => [key, sanitizeLogContext(entry, depth + 1)])
  )
}

function upstreamErrorContext(error, context = {}) {
  return sanitizeLogContext({
    event: 'upstream.error',
    ...context,
    errorName: error?.name || 'Error',
    errorCode: error?.code || null,
    status: Number(error?.status || error?.statusCode) || null,
    timedOut: error?.code === 'UPSTREAM_TIMEOUT' || error?.name === 'AbortError'
  })
}

function logStructured(level, payload, logger = console) {
  const method = typeof logger[level] === 'function' ? logger[level] : logger.log
  method.call(logger, JSON.stringify(sanitizeLogContext(payload)))
}

module.exports = {
  logStructured,
  sanitizeLogContext,
  upstreamErrorContext
}

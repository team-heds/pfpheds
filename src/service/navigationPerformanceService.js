const MAX_METRICS = 50
export const SLOW_NAVIGATION_MS = 1_200

const metrics = []
const now = () => globalThis.performance?.now?.() ?? Date.now()

function safeRouteName(route) {
  return typeof route?.name === 'string' && route.name ? route.name : 'unnamed'
}

export function startNavigationMeasurement(to, from) {
  return {
    startedAt: now(),
    from: safeRouteName(from),
    to: safeRouteName(to)
  }
}

export function finishNavigationMeasurement(measurement, { failed = false } = {}) {
  if (measurement?.startedAt == null) return null

  const durationMs = Math.max(0, Math.round((now() - measurement.startedAt) * 10) / 10)

  const metric = Object.freeze({
    from: measurement.from,
    to: measurement.to,
    durationMs,
    failed: Boolean(failed),
    slow: durationMs >= SLOW_NAVIGATION_MS
  })

  metrics.push(metric)
  if (metrics.length > MAX_METRICS) metrics.splice(0, metrics.length - MAX_METRICS)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('heds:navigation-performance', { detail: metric }))
  }

  if (import.meta.env.DEV && metric.slow) {
    console.warn(`[navigation] ${metric.from} → ${metric.to}: ${metric.durationMs} ms`)
  }

  return metric
}

export function getNavigationMetrics() {
  return metrics.map((metric) => ({ ...metric }))
}

export function resetNavigationMetrics() {
  metrics.length = 0
}

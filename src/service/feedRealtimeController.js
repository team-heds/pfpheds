const FALLBACK_STATUSES = new Set(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'])

export function createFeedRealtimeController({
  refresh,
  intervalMs = 30000,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval
}) {
  let intervalId = null
  let disposed = false

  const stopFallback = () => {
    if (intervalId !== null) clearIntervalFn(intervalId)
    intervalId = null
  }

  const startFallback = () => {
    if (disposed || intervalId !== null) return
    intervalId = setIntervalFn(() => {
      void refresh()
    }, intervalMs)
  }

  const handleStatus = (status) => {
    if (disposed) return
    if (status === 'SUBSCRIBED') stopFallback()
    else if (FALLBACK_STATUSES.has(status)) startFallback()
  }

  const dispose = () => {
    disposed = true
    stopFallback()
  }

  return {
    handleStatus,
    stop: dispose,
    isFallbackActive: () => intervalId !== null
  }
}

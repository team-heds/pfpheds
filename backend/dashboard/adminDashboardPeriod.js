const DASHBOARD_TIMEZONE = 'Europe/Zurich'
const PERIOD_KEYS = Object.freeze(['day', 'week', 'month', 'quarter', 'year'])

const zonedFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: DASHBOARD_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
})

function zonedParts(date) {
  return Object.fromEntries(
    zonedFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  )
}

function normalizeCalendarDate(year, month, day) {
  const normalized = new Date(Date.UTC(year, month - 1, day, 12))
  return {
    year: normalized.getUTCFullYear(),
    month: normalized.getUTCMonth() + 1,
    day: normalized.getUTCDate()
  }
}

function addCalendarDays(value, days) {
  return normalizeCalendarDate(value.year, value.month, value.day + days)
}

function addCalendarMonths(value, months) {
  return normalizeCalendarDate(value.year, value.month + months, 1)
}

function zonedMidnightToUtc(value) {
  const target = Date.UTC(value.year, value.month - 1, value.day, 0, 0, 0)
  let candidate = target

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = zonedParts(new Date(candidate))
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    )
    const correction = target - actualAsUtc
    candidate += correction
    if (correction === 0) break
  }

  const resolved = zonedParts(new Date(candidate))
  if (
    resolved.year !== value.year ||
    resolved.month !== value.month ||
    resolved.day !== value.day ||
    resolved.hour !== 0
  ) {
    throw new Error('Impossible de résoudre la borne calendaire Europe/Zurich.')
  }
  return new Date(candidate)
}

function parseReference(value, now = () => new Date()) {
  if (value === undefined || value === null || value === '') return now()
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw invalidReference()
    return new Date(value.getTime())
  }
  const text = String(value).trim()
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (dateOnly) {
    const localDate = normalizeCalendarDate(
      Number(dateOnly[1]),
      Number(dateOnly[2]),
      Number(dateOnly[3])
    )
    if (
      localDate.year !== Number(dateOnly[1]) ||
      localDate.month !== Number(dateOnly[2]) ||
      localDate.day !== Number(dateOnly[3])
    ) {
      throw invalidReference()
    }
    return zonedMidnightToUtc(localDate)
  }
  const dateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(text)
  if (!dateTime) throw invalidReference()
  const normalizedDate = normalizeCalendarDate(
    Number(dateTime[1]),
    Number(dateTime[2]),
    Number(dateTime[3])
  )
  const offset = dateTime[7] === 'Z' ? null : dateTime[7].slice(1).split(':').map(Number)
  if (
    normalizedDate.year !== Number(dateTime[1]) ||
    normalizedDate.month !== Number(dateTime[2]) ||
    normalizedDate.day !== Number(dateTime[3]) ||
    Number(dateTime[4]) > 23 ||
    Number(dateTime[5]) > 59 ||
    Number(dateTime[6] || 0) > 59 ||
    (offset && (offset[0] > 23 || offset[1] > 59))
  ) {
    throw invalidReference()
  }
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) throw invalidReference()
  return parsed
}

function invalidReference() {
  const error = new Error('Paramètre reference invalide.')
  error.status = 400
  return error
}

function assertPeriodKey(key) {
  if (!PERIOD_KEYS.includes(key)) {
    const error = new Error('Paramètre period invalide.')
    error.status = 400
    throw error
  }
  return key
}

function periodStart(localDate, key) {
  if (key === 'day') return localDate
  if (key === 'week') {
    const weekday = new Date(
      Date.UTC(localDate.year, localDate.month - 1, localDate.day, 12)
    ).getUTCDay()
    return addCalendarDays(localDate, -((weekday + 6) % 7))
  }
  if (key === 'month') return { ...localDate, day: 1 }
  if (key === 'quarter') {
    return { year: localDate.year, month: Math.floor((localDate.month - 1) / 3) * 3 + 1, day: 1 }
  }
  return { year: localDate.year, month: 1, day: 1 }
}

function adjacentBoundary(start, key, direction) {
  if (key === 'day') return addCalendarDays(start, direction)
  if (key === 'week') return addCalendarDays(start, 7 * direction)
  if (key === 'month') return addCalendarMonths(start, direction)
  if (key === 'quarter') return addCalendarMonths(start, 3 * direction)
  return { year: start.year + direction, month: 1, day: 1 }
}

function createPeriod(key, start, end) {
  return Object.freeze({
    key,
    start: zonedMidnightToUtc(start).toISOString(),
    end: zonedMidnightToUtc(end).toISOString(),
    timezone: DASHBOARD_TIMEZONE
  })
}

function resolveDashboardPeriods(options = {}) {
  const key = assertPeriodKey(options.key || 'month')
  const reference = parseReference(options.reference, options.now)
  const parts = zonedParts(reference)
  const localDate = { year: parts.year, month: parts.month, day: parts.day }
  const currentStart = periodStart(localDate, key)
  const currentEnd = adjacentBoundary(currentStart, key, 1)
  const previousStart = adjacentBoundary(currentStart, key, -1)

  return Object.freeze({
    current: createPeriod(key, currentStart, currentEnd),
    previous: createPeriod(key, previousStart, currentStart)
  })
}

module.exports = {
  DASHBOARD_TIMEZONE,
  PERIOD_KEYS,
  parseReference,
  resolveDashboardPeriods,
  zonedParts
}

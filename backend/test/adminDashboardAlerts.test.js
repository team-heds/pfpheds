const test = require('node:test')
const assert = require('node:assert/strict')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const {
  loadAdminAlerts,
  resolveAdminAlert,
  variationAlerts
} = require('../dashboard/adminDashboardAlerts')

function metric(value, previous, percentChange) {
  return {
    status: 'ok',
    value,
    comparison: previous === null
      ? { status: 'unavailable', value: null, percentChange: null }
      : { status: 'ok', value: previous, percentChange }
  }
}

function fakeClient({ counts = {}, profiles = [], states = [], statesError = null } = {}) {
  const writes = []
  return {
    writes,
    from(table) {
      const state = { filters: [], head: false }
      const query = {
        select(_columns, options = {}) { state.head = Boolean(options.head); return query },
        eq(column, value) { state.filters.push(`${column}=${value}`); return query },
        is(column, value) { state.filters.push(`${column} is ${value}`); return query },
        range() { return query },
        upsert(row) { writes.push({ table, row }); states.splice(0, states.length, row); return Promise.resolve({ error: null }) },
        then(resolve, reject) {
          let result
          if (table === 'admin_alert_states') result = { data: statesError ? null : states, error: statesError }
          else if (state.head) result = { count: counts[`${table}:${state.filters.join('&')}`] ?? 0, error: null }
          else result = { data: table === 'user_profiles' ? profiles : [], error: null }
          return Promise.resolve(result).then(resolve, reject)
        }
      }
      return query
    }
  }
}

const statsService = (metrics) => ({
  loadStats: async () => ({
    asOf: '2026-11-23T10:00:00.000Z',
    period: { key: 'month' },
    domains: { academic: { metrics } }
  })
})

test('variation alerts use the 30% drop and 50% rise thresholds', () => {
  const alerts = variationAlerts({
    domains: {
      academic: {
        metrics: {
          modules: metric(60, 100, -40),
          courses: metric(160, 100, 60),
          teachers: metric(90, 100, -10),
          media: metric(5, null, null)
        }
      }
    }
  })
  assert.deepEqual(alerts.map((alert) => alert.key), ['drop.academic.modules', 'rise.academic.courses'])
})

test('a resolved alert comes back when its value changes', async () => {
  const counts = { 'modules:track_id is null': 2 }
  const states = [{ alert_key: 'quality.modules_without_track', resolved_value: 2, resolved_at: '2026-11-22T10:00:00Z' }]
  const base = { statsService: statsService({}), domains: ['academic'], periodKey: 'month' }

  const same = await loadAdminAlerts({ ...base, client: fakeClient({ counts, states }) })
  assert.equal(same.alerts.find((a) => a.key === 'quality.modules_without_track').resolved, true)
  assert.equal(same.stats.resolved, 1)

  counts['modules:track_id is null'] = 3
  const changed = await loadAdminAlerts({ ...base, client: fakeClient({ counts, states }) })
  assert.equal(changed.alerts.find((a) => a.key === 'quality.modules_without_track').resolved, false)
})

test('alerts stay readable when the state table is not migrated yet', async () => {
  const response = await loadAdminAlerts({
    client: fakeClient({ counts: { 'modules:track_id is null': 2 }, statesError: { code: '42P01' } }),
    statsService: statsService({}),
    domains: ['academic'],
    periodKey: 'month'
  })
  assert.equal(response.canPersistResolution, false)
  assert.equal(response.stats.warning, 1)
})

test('resolving stores the observed value and refuses an unknown alert', async () => {
  const client = fakeClient({ counts: { 'modules:track_id is null': 2 } })
  const base = { client, statsService: statsService({}), domains: ['academic'], periodKey: 'month', userId: 'admin-id' }
  const response = await resolveAdminAlert({ ...base, alertKey: 'quality.modules_without_track' })
  assert.equal(client.writes[0].row.resolved_value, 2)
  assert.equal(response.stats.resolved, 1)
  await assert.rejects(resolveAdminAlert({ ...base, alertKey: 'unknown' }), { status: 404 })
})

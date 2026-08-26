const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const fs = require('node:fs')
const path = require('node:path')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const {
  assertNoPersonalData,
  validateDashboardStatsResponse
} = require('../dashboard/adminDashboardContract')
const {
  createAdminDashboardStatsService
} = require('../dashboard/adminDashboardStatsService')
const {
  allowedDashboardDomains,
  createAdminDashboardStatsRouter,
  parseRequestedDomains
} = require('../dashboard/adminDashboardStatsBackend')

function createFakeClient(options = {}) {
  const queries = []
  const counts = {
    user_profiles: 17,
    roles: 5,
    permissions: 23,
    dynamic_routes: 91,
    institutions: 7,
    places: 12,
    student_result_vote: 4,
    courses: 8,
    video_library: 9,
    modules: 6,
    challenges: 3,
    badges: 11,
    gamification_data: 14,
    ...(options.counts || {})
  }
  const rows = {
    user_profiles: [
      { user_id: 'student-1', role: 'EtudiantPhysio', is_active: true },
      { user_id: 'student-2', role: 'user', permissions: ['EtudiantPhysio'], is_active: true },
      { user_id: 'teacher-1', role: 'EnseignantPhysio', is_active: true },
      { user_id: 'teacher-2', role: 'user', permissions: ['EnseignantSoins'], is_active: true },
      { user_id: 'admin-1', role: 'admin', permissions: ['EtudiantPhysio'], is_active: true }
    ],
    quests: [{ completion_count: 2 }, { completion_count: 5 }, { completion_count: null }],
    ...(options.rows || {})
  }
  const errors = options.errors || {}

  function builder(table) {
    const state = { table, columns: null, count: null, head: false, filters: [] }
    const query = {
      select(columns, config = {}) {
        state.columns = columns
        state.count = config.count || null
        state.head = Boolean(config.head)
        return query
      },
      eq(column, value) {
        state.filters.push(['eq', column, value])
        return query
      },
      in(column, value) {
        state.filters.push(['in', column, value])
        return query
      },
      gt(column, value) {
        state.filters.push(['gt', column, value])
        return query
      },
      then(resolve, reject) {
        queries.push({ ...state, filters: [...state.filters] })
        const result = errors[table]
          ? { data: null, count: null, error: errors[table] }
          : state.count === 'exact' && state.head
            ? { data: null, count: counts[table], error: null }
            : { data: rows[table] || [], count: null, error: null }
        return Promise.resolve(result).then(resolve, reject)
      }
    }
    return query
  }

  return { client: { from: builder }, queries }
}

async function listen(app, callback) {
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    return await callback(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
}

test('the v1 contract contains deterministic aggregates from real table sources', async () => {
  const { client, queries } = createFakeClient()
  const service = createAdminDashboardStatsService({
    client,
    now: () => new Date('2026-08-26T08:00:00.000Z')
  })

  const response = await service.loadStats()

  assert.equal(validateDashboardStatsResponse(response), true)
  assert.equal(response.version, '1')
  assert.equal(response.period.timezone, 'Europe/Zurich')
  assert.equal(response.domains.general.metrics.users.value, 17)
  assert.equal(response.domains.general.metrics.permissions.value, 23)
  assert.equal(response.domains.pfp.metrics.students.value, 2)
  assert.equal(response.domains.pfp.metrics.pfpInProgress.value, 4)
  assert.equal(response.domains.academic.metrics.teachers.value, 2)
  assert.equal(response.domains.gamification.metrics.completedQuests.value, 7)
  assert.equal(response.domains.gamification.metrics.activeUsers.value, 14)
  assert.equal(response.domains.general.metrics.routes.source, 'public.dynamic_routes')
  assert.equal(queries.length, 16)

  assert.ok(
    queries.some(
      (query) =>
        query.table === 'student_result_vote' &&
        query.filters.some(([operator, column]) => operator === 'in' && column === 'status')
    )
  )
  assert.ok(
    queries.some(
      (query) =>
        query.table === 'gamification_data' &&
        query.filters.some(
          ([operator, column, value]) => operator === 'gt' && column === 'total_xp' && value === 0
        )
    )
  )
})

test('dashboard aggregate production code contains no random value generator', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', 'dashboard', 'adminDashboardStatsService.js'),
    'utf8'
  )
  assert.doesNotMatch(source, /Math\.random|routes\s*:\s*120|roles\s*\*\s*5/)
})

test('an upstream failure is explicit and never becomes a zero', async () => {
  const events = []
  const { client } = createFakeClient({
    errors: { places: { code: 'PGRST500', message: 'sensitive database detail' } }
  })
  const service = createAdminDashboardStatsService({
    client,
    now: () => new Date('2026-08-26T08:00:00.000Z'),
    onMetricError: (event) => events.push(event)
  })

  const response = await service.loadStats(['pfp'])
  const metric = response.domains.pfp.metrics.places

  assert.equal(response.domains.pfp.status, 'partial')
  assert.equal(metric.value, null)
  assert.equal(metric.status, 'error')
  assert.equal(metric.error, 'PGRST500')
  assert.equal(JSON.stringify(response).includes('sensitive database detail'), false)
  assert.equal(events[0].source, 'public.places')
})

test('the contract rejects personal fields and malformed values', () => {
  assert.throws(
    () => assertNoPersonalData({ domains: { general: { email: 'private@example.test' } } }),
    /Champ personnel interdit/
  )
  assert.equal(
    validateDashboardStatsResponse({
      version: '1',
      asOf: '2026-08-26T08:00:00.000Z',
      period: { timezone: 'Europe/Zurich' },
      domains: { general: { status: 'ok', metrics: { users: { value: -1 } } } }
    }),
    false
  )
})

test('domain authorization is derived from server-side permissions', () => {
  assert.deepEqual(allowedDashboardDomains({ permissions: ['admin'] }), [
    'general',
    'pfp',
    'academic',
    'gamification'
  ])
  assert.deepEqual(allowedDashboardDomains({ permissions: ['EnseignantPhysio'] }), [
    'pfp',
    'academic'
  ])
  assert.deepEqual(allowedDashboardDomains({ permissions: ['EtudiantPhysio'] }), [])
  assert.deepEqual(parseRequestedDomains('pfp,academic,pfp'), ['pfp', 'academic'])
  assert.throws(() => parseRequestedDomains('general,unknown'), /domains invalide/)
})

test('the endpoint filters domains and refuses a forbidden domain', async () => {
  const { client } = createFakeClient()
  const app = express()
  app.use((req, _res, next) => {
    req.auth = { userId: 'teacher', permissions: ['EnseignantPhysio'] }
    next()
  })
  app.use(
    '/api/admin-dashboard',
    createAdminDashboardStatsRouter({
      client,
      now: () => new Date('2026-08-26T08:00:00.000Z'),
      logger: { error() {} }
    })
  )

  await listen(app, async (baseUrl) => {
    const allowed = await fetch(`${baseUrl}/api/admin-dashboard/v1/stats?domains=pfp`)
    assert.equal(allowed.status, 200)
    assert.deepEqual(Object.keys((await allowed.json()).domains), ['pfp'])

    const forbidden = await fetch(`${baseUrl}/api/admin-dashboard/v1/stats?domains=general`)
    assert.equal(forbidden.status, 403)
    assert.deepEqual((await forbidden.json()).forbiddenDomains, ['general'])
  })
})

test('the endpoint fails closed when no dashboard domain is authorized', async () => {
  const { client } = createFakeClient()
  const app = express()
  app.use((req, _res, next) => {
    req.auth = { userId: 'student', permissions: ['EtudiantPhysio'] }
    next()
  })
  app.use('/api/admin-dashboard', createAdminDashboardStatsRouter({ client }))

  await listen(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin-dashboard/v1/stats`)
    assert.equal(response.status, 403)
    assert.equal((await response.json()).error, 'Permission dashboard insuffisante.')
  })
})

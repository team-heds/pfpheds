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
  createAdminDashboardStatsService,
  loadRecentGamificationActivity
} = require('../dashboard/adminDashboardStatsService')
const {
  allowedDashboardDomains,
  createAdminDashboardStatsRouter,
  parsePeriodOptions,
  parseRequestedDomains
} = require('../dashboard/adminDashboardStatsBackend')
const {
  loadDashboardFilterOptions,
  parseDashboardFilters,
  validateFilterCombination
} = require('../dashboard/adminDashboardFilters')

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
    user_quest_progress: 7,
    user_badges: 11,
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
    xp_history: [
      { user_id: 'user-1', action: 'QUEST_COMPLETE', source_type: 'quest', amount: 25, created_at: '2026-08-26T07:00:00Z' },
      { user_id: 'user-1', action: 'LOGIN', source_type: 'login', amount: 5, created_at: '2026-08-25T07:00:00Z' },
      { user_id: 'user-2', action: 'BADGE_UNLOCK', source_type: 'badge', amount: 10, created_at: '2026-08-24T07:00:00Z' },
      { user_id: null }
    ],
    tracks: [{ id: 'physio', label: 'Physiothérapie', is_active: true }],
    roles: [{ slug: 'EtudiantPhysio', label: 'Étudiant physio' }],
    classes: [{ code: 'BA25', name: 'Bachelor 2025' }],
    cohorts: [{ code: 'PFP1A', name: 'PFP 1A' }],
    institutions: [{ Name: 'Clinique Test', is_hidden: false }],
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
      gte(column, value) {
        state.filters.push(['gte', column, value])
        return query
      },
      lt(column, value) {
        state.filters.push(['lt', column, value])
        return query
      },
      not(column, operator, value) {
        state.filters.push(['not', column, operator, value])
        return query
      },
      or(value) {
        state.filters.push(['or', value])
        return query
      },
      order(column, config) {
        state.order = [column, config]
        return query
      },
      limit(value) {
        state.limit = value
        return query
      },
      range(from, to) {
        state.range = [from, to]
        return query
      },
      then(resolve, reject) {
        queries.push({ ...state, filters: [...state.filters] })
        const resolvedCount = options.resolveCount?.(state, counts[table]) ?? counts[table]
        const resolvedError = options.resolveError?.(state) || errors[table]
        const result = resolvedError
          ? { data: null, count: null, error: resolvedError }
          : state.count === 'exact' && state.head
            ? { data: null, count: resolvedCount, error: null }
            : {
                data: (rows[table] || []).slice(
                  state.range?.[0] || 0,
                  state.limit || (state.range ? state.range[1] + 1 : undefined)
                ),
                count: null,
                error: null
              }
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
  assert.equal(response.period.key, 'month')
  assert.equal(response.period.start, '2026-07-31T22:00:00.000Z')
  assert.equal(response.previousPeriod.start, '2026-06-30T22:00:00.000Z')
  assert.equal(response.period.timezone, 'Europe/Zurich')
  assert.equal(response.domains.general.metrics.users.value, 17)
  assert.equal(response.domains.general.metrics.permissions.value, 23)
  assert.equal(response.domains.pfp.metrics.students.value, 2)
  assert.equal(response.domains.pfp.metrics.pfpInProgress.value, 4)
  assert.equal(response.domains.academic.metrics.teachers.value, 2)
  assert.equal(response.domains.gamification.metrics.completedQuests.value, 7)
  assert.equal(response.domains.gamification.metrics.activeUsers.value, 2)
  assert.equal(response.domains.general.metrics.routes.source, 'public.dynamic_routes')
  assert.equal(queries.length, 28)
  assert.equal(response.domains.general.metrics.users.semantics, 'flow')
  assert.equal(response.domains.general.metrics.users.comparison.value, 17)
  assert.equal(response.domains.general.metrics.users.comparison.percentChange, 0)
  assert.equal(response.domains.general.metrics.roles.semantics, 'snapshot')
  assert.equal(response.domains.general.metrics.roles.comparison.status, 'unavailable')

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
        query.table === 'xp_history' &&
        query.filters.some(
          ([operator, column]) => operator === 'gte' && column === 'created_at'
        )
    )
  )
})

test('period selection changes real query bounds and comparison values', async () => {
  const { client, queries } = createFakeClient({
    resolveCount(state, fallback) {
      const lowerBound = state.filters.find(([operator]) => operator === 'gte')?.[2]
      if (state.table === 'courses' && lowerBound === '2026-08-25T22:00:00.000Z') return 3
      if (state.table === 'courses' && lowerBound === '2026-08-24T22:00:00.000Z') return 2
      return fallback
    }
  })
  const service = createAdminDashboardStatsService({
    client,
    now: () => new Date('2026-08-26T08:00:00.000Z')
  })

  const response = await service.loadStats(['academic'], {
    key: 'day',
    reference: '2026-08-26T08:00:00.000Z'
  })
  const courses = response.domains.academic.metrics.courses

  assert.equal(courses.value, 3)
  assert.equal(courses.comparison.value, 2)
  assert.equal(courses.comparison.absoluteChange, 1)
  assert.equal(courses.comparison.percentChange, 50)
  assert.ok(
    queries.some(
      (query) =>
        query.table === 'courses' &&
        query.filters.some(
          ([operator, column, value]) =>
            operator === 'gte' && column === 'created_at' && value === response.period.start
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

test('recent gamification activity is bounded, real and contains no personal identifier', async () => {
  const { client, queries } = createFakeClient()
  const activities = await loadRecentGamificationActivity(client, 2)

  assert.equal(activities.length, 2)
  assert.deepEqual(activities[0], {
    type: 'quest',
    title: 'Quête terminée',
    xp: 25,
    occurredAt: '2026-08-26T07:00:00Z'
  })
  assert.equal(JSON.stringify(activities).includes('user-1'), false)
  const query = queries.find((entry) => entry.table === 'xp_history')
  assert.equal(query.limit, 2)
  assert.deepEqual(query.order, ['created_at', { ascending: false }])
  assert.equal(query.columns, 'action,source_type,amount,created_at')
})

test('active users pagination is not capped by the PostgREST default page size', async () => {
  const xpRows = Array.from({ length: 1005 }, (_, index) => ({ user_id: `user-${index}` }))
  const { client, queries } = createFakeClient({ rows: { xp_history: xpRows } })
  const service = createAdminDashboardStatsService({
    client,
    now: () => new Date('2026-08-26T08:00:00.000Z')
  })

  const response = await service.loadStats(['gamification'])

  assert.equal(response.domains.gamification.metrics.activeUsers.value, 1005)
  assert.ok(queries.some((query) => query.table === 'xp_history' && query.range?.[0] === 1000))
  assert.ok(queries.some((query) => query.table === 'user_badges' && query.columns === 'badge_id'))
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

test('a previous-period failure preserves the current value and marks comparison error', async () => {
  const events = []
  const { client } = createFakeClient({
    resolveError(state) {
      const lowerBound = state.filters.find(([operator]) => operator === 'gte')?.[2]
      if (state.table === 'courses' && lowerBound === '2026-07-31T22:00:00.000Z') {
        return { code: 'PGRST500', message: 'sensitive previous period detail' }
      }
      return null
    }
  })
  const service = createAdminDashboardStatsService({
    client,
    now: () => new Date('2026-09-15T08:00:00.000Z'),
    onMetricError: (event) => events.push(event)
  })

  const response = await service.loadStats(['academic'], { key: 'month' })
  const metric = response.domains.academic.metrics.courses

  assert.equal(metric.value, 8)
  assert.equal(metric.status, 'ok')
  assert.equal(metric.comparison.status, 'error')
  assert.equal(metric.comparison.error, 'PGRST500')
  assert.equal(metric.comparison.value, null)
  assert.equal(response.domains.academic.status, 'partial')
  assert.equal(events[0].key, 'courses.previous')
  assert.equal(JSON.stringify(response).includes('sensitive previous period detail'), false)
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
  assert.deepEqual(parsePeriodOptions({}), { key: 'month', reference: undefined })
  assert.deepEqual(parsePeriodOptions({ period: 'quarter', reference: '2026-08-26' }), {
    key: 'quarter',
    reference: '2026-08-26'
  })
  assert.throws(() => parsePeriodOptions({ period: '90d' }), /period invalide/)
  assert.throws(() => parsePeriodOptions({ reference: 'invalid' }), /reference invalide/)
})

test('dashboard filters are canonical, bounded and domain-aware', () => {
  assert.deepEqual(parseDashboardFilters({ class: ['BA25', 'BA24', 'BA25'], pfp: 'PFP2' }), {
    class: ['BA24', 'BA25'],
    pfp: ['PFP2']
  })
  assert.throws(() => parseDashboardFilters({ pfp: 'PFP9' }), /PFP est invalide/)
  assert.throws(() => parseDashboardFilters({ unexpected: 'value' }), /paramètre de filtre/)
  assert.throws(
    () => validateFilterCombination({ institution: ['Clinique Test'] }, ['academic']),
    (error) => error.code === 'FILTER_COMBINATION_INVALID'
  )
})

test('profile and PFP filters are applied to current and previous queries', async () => {
  const { client, queries } = createFakeClient({
    rows: {
      user_profiles: [
        {
          user_id: 'student-1',
          role: 'EtudiantPhysio',
          is_active: true,
          classe: 'BA25',
          pfp_cohort: 'PFP1A',
          primary_track_id: 'physio'
        },
        {
          user_id: 'student-2',
          role: 'EtudiantPhysio',
          is_active: true,
          classe: 'BA24',
          pfp_cohort: 'PFP1B',
          primary_track_id: 'physio'
        }
      ]
    }
  })
  const service = createAdminDashboardStatsService({
    client,
    now: () => new Date('2026-08-26T08:00:00.000Z')
  })
  const filters = {
    class: ['BA25'],
    pfp: ['PFP2'],
    institution: ['Clinique Test'],
    status: ['assigned']
  }
  const response = await service.loadStats(['pfp'], { key: 'month' }, filters)

  assert.equal(response.domains.pfp.metrics.students.value, 1)
  assert.deepEqual(response.appliedFilters, filters)
  const resultQueries = queries.filter((query) => query.table === 'student_result_vote')
  assert.equal(resultQueries.length, 2)
  assert.ok(
    resultQueries.every((query) =>
      [
        ['eq', 'pfp_type', 'PFP2'],
        ['eq', 'assigned_institution_name', 'Clinique Test'],
        ['eq', 'status', 'assigned']
      ].every((filter) => query.filters.some((entry) => JSON.stringify(entry) === JSON.stringify(filter)))
    )
  )
  assert.ok(
    queries
      .filter((query) => query.table === 'places')
      .every((query) => query.filters.some(([operator, column]) => operator === 'not' && column === 'PFP2'))
  )
})

test('filter options contain authorized references and no personal data', async () => {
  const { client } = createFakeClient()
  const result = await loadDashboardFilterOptions(client, ['pfp'])

  assert.equal(result.version, '1')
  assert.deepEqual(result.options.institutions, [
    { value: 'Clinique Test', label: 'Clinique Test' }
  ])
  assert.equal(result.options.pfpTypes.length, 5)
  assert.equal(JSON.stringify(result).includes('email'), false)
  assert.deepEqual(result.applicability.status.domains, ['pfp'])
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
    const allowed = await fetch(
      `${baseUrl}/api/admin-dashboard/v1/stats?domains=pfp&period=week&reference=2026-08-26`
    )
    assert.equal(allowed.status, 200)
    const allowedBody = await allowed.json()
    assert.deepEqual(Object.keys(allowedBody.domains), ['pfp'])
    assert.equal(allowedBody.period.key, 'week')

    const forbidden = await fetch(`${baseUrl}/api/admin-dashboard/v1/stats?domains=general`)
    assert.equal(forbidden.status, 403)
    assert.deepEqual((await forbidden.json()).forbiddenDomains, ['general'])

    const invalid = await fetch(`${baseUrl}/api/admin-dashboard/v1/stats?period=90d`)
    assert.equal(invalid.status, 400)

    const options = await fetch(`${baseUrl}/api/admin-dashboard/v1/filter-options?domains=pfp`)
    assert.equal(options.status, 200)
    const optionsBody = await options.json()
    assert.deepEqual(optionsBody.domains, ['pfp'])
    assert.equal(optionsBody.options.institutions[0].value, 'Clinique Test')

    const forbiddenOptions = await fetch(
      `${baseUrl}/api/admin-dashboard/v1/filter-options?domains=general`
    )
    assert.equal(forbiddenOptions.status, 403)
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

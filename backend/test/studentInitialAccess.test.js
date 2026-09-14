const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const {
  ACCESS_TTL_MS,
  StudentInitialAccessError,
  createStudentInitialAccessService,
  isEligibleClass,
  publicState,
  resolveInitialAccessRedirectUrl
} = require('../supabase/studentInitialAccessService')
const { createStudentInitialAccessRouters } = require('../supabase/studentInitialAccessBackend')

const STUDENT_ID = '10000000-0000-4000-8000-000000000001'
const ADMIN_ID = '20000000-0000-4000-8000-000000000001'

function createFakeClient(profileOverrides = {}) {
  const profiles = new Map([
    [
      STUDENT_ID,
      {
        user_id: STUDENT_ID,
        role: 'student',
        permissions: [],
        is_active: true,
        classe: 'BA26',
        ...profileOverrides
      }
    ]
  ])
  const states = new Map()
  const events = []
  const operations = []

  function createQuery(table) {
    const state = { table, action: 'select', payload: null, filter: null, columns: null }
    const query = {
      select(columns) {
        state.columns = columns
        return query
      },
      eq(column, value) {
        state.filter = [column, value]
        return query
      },
      order() {
        return query
      },
      maybeSingle() {
        state.single = true
        return query
      },
      insert(payload) {
        state.action = 'insert'
        state.payload = payload
        return query
      },
      upsert(payload) {
        state.action = 'upsert'
        state.payload = payload
        return query
      },
      update(payload) {
        state.action = 'update'
        state.payload = payload
        return query
      },
      then(resolve, reject) {
        operations.push({ ...state })
        try {
          let data = null
          if (table === 'user_profiles') {
            data = profiles.get(state.filter?.[1]) || null
          } else if (table === 'student_initial_access_events' && state.action === 'insert') {
            events.push({ ...state.payload })
          } else if (table === 'student_initial_access') {
            if (state.action === 'upsert') {
              states.set(state.payload.user_id, {
                ...(states.get(state.payload.user_id) || {}),
                ...state.payload
              })
            } else if (state.action === 'update') {
              const userId = state.filter?.[1]
              states.set(userId, { ...(states.get(userId) || {}), ...state.payload })
              data = states.get(userId)
            } else if (state.single) {
              data = states.get(state.filter?.[1]) || null
            } else {
              data = [...states.entries()].map(([user_id, row]) => ({ user_id, ...row }))
            }
          }
          return Promise.resolve({ data, error: null }).then(resolve, reject)
        } catch (error) {
          return Promise.reject(error).then(resolve, reject)
        }
      }
    }
    return query
  }

  return {
    client: { from: createQuery },
    events,
    operations,
    profiles,
    states
  }
}

function createFixture(options = {}) {
  const database = createFakeClient(options.profile)
  const authCalls = []
  const authClient = {
    admin: {
      async getUserById(userId) {
        if (options.authLookupError) return { data: null, error: options.authLookupError }
        return {
          data: {
            user:
              options.authUser === null
                ? null
                : { id: userId, email: 'student@hevs.ch', ...options.authUser }
          },
          error: null
        }
      }
    },
    async resetPasswordForEmail(...args) {
      authCalls.push(args)
      return { error: options.deliveryError || null }
    }
  }
  const service = createStudentInitialAccessService({
    client: database.client,
    authClient,
    now: () => new Date('2026-09-14T09:00:00.000Z'),
    idFactory: () => 'generated-request-id',
    environment: { NODE_ENV: 'production' },
    timeoutMs: options.timeoutMs || 100
  })
  return { ...database, authCalls, authClient, service }
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

test('eligibility is strict for BA26/BAC26 student profiles', () => {
  assert.equal(isEligibleClass('BA26'), true)
  assert.equal(isEligibleClass('bac-26'), true)
  assert.equal(isEligibleClass('BA25'), false)
  assert.equal(isEligibleClass('BA260'), false)
})

test('initial access uses the fixed reset screen with a distinct server-owned flow', () => {
  assert.equal(
    resolveInitialAccessRedirectUrl({ NODE_ENV: 'production' }),
    'https://hedsvs.ch/reset-password?flow=initial-access'
  )
})

test('send resolves the address from Auth and stores only a safe current state', async () => {
  const fixture = createFixture()
  const result = await fixture.service.send({
    userId: STUDENT_ID,
    actorUserId: ADMIN_ID,
    requestId: 'request-1'
  })

  assert.deepEqual(fixture.authCalls, [
    ['student@hevs.ch', { redirectTo: 'https://hedsvs.ch/reset-password?flow=initial-access' }]
  ])
  assert.equal(result.status, 'sent')
  assert.equal(result.attemptCount, 1)
  assert.equal(
    new Date(result.expiresAt).getTime() - new Date(result.lastSentAt).getTime(),
    ACCESS_TTL_MS
  )
  assert.equal(fixture.states.size, 1)
  assert.deepEqual(
    fixture.events.map((event) => event.event_type),
    ['pending', 'sent']
  )
  assert.doesNotMatch(
    JSON.stringify([...fixture.states.values(), ...fixture.events]),
    /student@|token|password/i
  )
})

test('resend updates one row, increments attempts and records a resent event', async () => {
  const fixture = createFixture()
  await fixture.service.send({ userId: STUDENT_ID, actorUserId: ADMIN_ID })
  await fixture.service.send({ userId: STUDENT_ID, actorUserId: ADMIN_ID })

  assert.equal(fixture.states.size, 1)
  assert.equal(fixture.states.get(STUDENT_ID).attempt_count, 2)
  assert.equal(fixture.authCalls.length, 2)
  assert.deepEqual(
    fixture.events.map((event) => event.event_type),
    ['pending', 'sent', 'pending', 'resent']
  )
})

test('an already used initial access cannot be sent again', async () => {
  const fixture = createFixture()
  fixture.states.set(STUDENT_ID, {
    status: 'used',
    attempt_count: 1,
    used_at: '2026-09-14T08:00:00.000Z'
  })

  await assert.rejects(
    fixture.service.send({ userId: STUDENT_ID, actorUserId: ADMIN_ID }),
    (error) => error.code === 'access_already_used'
  )
  assert.equal(fixture.authCalls.length, 0)
})

for (const [label, profile] of [
  ['non-student role', { role: 'teacher' }],
  ['inactive profile', { is_active: false }],
  ['another cohort', { classe: 'BA25' }]
]) {
  test(`send rejects ${label} before calling Auth`, async () => {
    const fixture = createFixture({ profile })
    await assert.rejects(
      fixture.service.send({ userId: STUDENT_ID, actorUserId: ADMIN_ID }),
      (error) => error instanceof StudentInitialAccessError && error.code === 'student_ineligible'
    )
    assert.equal(fixture.authCalls.length, 0)
  })
}

test('missing Auth account and address use allow-listed error codes without provider details', async () => {
  const absent = createFixture({ authUser: null })
  await assert.rejects(
    absent.service.send({ userId: STUDENT_ID, actorUserId: ADMIN_ID }),
    (error) => error.code === 'auth_account_missing' && !error.message.includes('student@')
  )
  assert.equal(absent.states.get(STUDENT_ID).last_error_code, 'auth_account_missing')

  const noEmail = createFixture({ authUser: { email: '' } })
  await assert.rejects(
    noEmail.service.send({ userId: STUDENT_ID, actorUserId: ADMIN_ID }),
    (error) => error.code === 'auth_email_missing'
  )
  assert.equal(noEmail.states.get(STUDENT_ID).last_error_code, 'auth_email_missing')
})

test('provider failures are recorded and never expose raw errors', async () => {
  const fixture = createFixture({
    deliveryError: { status: 503, message: 'SMTP failed student@hevs.ch token=secret' }
  })
  await assert.rejects(
    fixture.service.send({ userId: STUDENT_ID, actorUserId: ADMIN_ID }),
    (error) => {
      assert.equal(error.code, 'provider_unavailable')
      assert.doesNotMatch(JSON.stringify(error), /student@|secret|SMTP/i)
      return true
    }
  )
  assert.equal(fixture.states.get(STUDENT_ID).last_error_code, 'provider_unavailable')
})

test('a sent state becomes expired at read time', () => {
  assert.equal(
    publicState(
      { status: 'sent', attempt_count: 1, expires_at: '2026-09-14T08:59:59.000Z' },
      new Date('2026-09-14T09:00:00.000Z')
    ).status,
    'expired'
  )
})

test('markUsed is self-scoped by the router and idempotent', async () => {
  const fixture = createFixture()
  await fixture.service.send({ userId: STUDENT_ID, actorUserId: ADMIN_ID })
  const { selfRouter } = createStudentInitialAccessRouters({ service: fixture.service })
  const app = express()
  app.use((req, _res, next) => {
    req.auth = { userId: STUDENT_ID }
    req.id = 'self-request'
    next()
  })
  app.use('/api/auth', selfRouter)

  await listen(app, async (baseUrl) => {
    const first = await fetch(`${baseUrl}/api/auth/initial-access/used`, { method: 'POST' })
    const second = await fetch(`${baseUrl}/api/auth/initial-access/used`, { method: 'POST' })
    assert.equal(first.status, 200)
    assert.equal(second.status, 200)
    assert.equal((await first.json()).state.status, 'used')
    assert.equal((await second.json()).state.status, 'used')
  })

  assert.equal(fixture.events.filter((event) => event.event_type === 'used').length, 1)
})

test('markUsed does not turn pending or error attempts into successful access', async () => {
  const fixture = createFixture()
  fixture.states.set(STUDENT_ID, { status: 'pending', attempt_count: 1 })

  const result = await fixture.service.markUsed({ userId: STUDENT_ID })

  assert.equal(result.state.status, 'pending')
  assert.equal(fixture.events.filter((event) => event.event_type === 'used').length, 0)
})

test('admin router ignores body email and actor identifiers', async () => {
  const calls = []
  const service = {
    async send(payload) {
      calls.push(payload)
      return { userId: payload.userId, status: 'sent', attemptCount: 1 }
    },
    async listStates() {
      return []
    }
  }
  const { adminRouter } = createStudentInitialAccessRouters({ service })
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.auth = { userId: ADMIN_ID }
    req.id = 'server-request-id'
    next()
  })
  app.use('/api/admin/users', adminRouter)

  await listen(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users/${STUDENT_ID}/initial-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'attacker@example.com', actorUserId: STUDENT_ID })
    })
    assert.equal(response.status, 202)
  })

  assert.deepEqual(calls, [
    { userId: STUDENT_ID, actorUserId: ADMIN_ID, requestId: 'server-request-id' }
  ])
})

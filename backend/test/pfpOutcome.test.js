const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const { requireAnyPermission } = require('../middleware/auth')
const { createPfpOutcomeRouter, normalizeOutcomePayload } = require('../supabase/pfpOutcomeBackend')

const ASSIGNMENT_ID = '123e4567-e89b-42d3-a456-426614174000'

async function listen(app, callback) {
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    await callback(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

function createClient(result = { data: { id: ASSIGNMENT_ID, pfp_validee: true }, error: null }) {
  const calls = []
  return {
    calls,
    async rpc(name, payload) {
      calls.push({ name, payload })
      return result
    }
  }
}

function createApp({ auth, client }) {
  const app = express()
  app.use(express.json())
  if (auth) app.use((req, _res, next) => { req.auth = auth; next() })
  app.use(
    '/api/pfp-outcomes',
    requireAnyPermission('page1.access', 'AdminPhysio', 'SECRETARIAT'),
    createPfpOutcomeRouter({ client, logger: { error() {} } })
  )
  return app
}

async function patchOutcome(baseUrl, body = { outcome: 'passed' }) {
  return fetch(`${baseUrl}/api/pfp-outcomes/${ASSIGNMENT_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

test('normalizes outcomes and requires a stop reason', () => {
  assert.deepEqual(normalizeOutcomePayload({ outcome: ' PASSED ', comment: 'ignored' }), {
    outcome: 'passed', comment: ''
  })
  assert.match(normalizeOutcomePayload({ outcome: 'stopped' }).error, /obligatoire/)
  assert.match(normalizeOutcomePayload({ outcome: 'unknown' }).error, /invalide/)
})

test('rejects anonymous and unauthorized users before the mutation', async () => {
  const client = createClient()
  await listen(createApp({ client }), async (baseUrl) => {
    assert.equal((await patchOutcome(baseUrl)).status, 401)
  })
  await listen(createApp({ client, auth: { userId: 'student', permissions: ['EtudiantPhysio'] } }), async (baseUrl) => {
    assert.equal((await patchOutcome(baseUrl)).status, 403)
  })
  assert.equal(client.calls.length, 0)
})

test('uses the authenticated actor and the exact assignment id', async () => {
  const client = createClient()
  const auth = { userId: 'actor-id', permissions: ['page1.access'] }
  await listen(createApp({ client, auth }), async (baseUrl) => {
    const response = await patchOutcome(baseUrl, { outcome: 'stopped', comment: '  Accident  ' })
    assert.equal(response.status, 200)
  })
  assert.deepEqual(client.calls, [{
    name: 'set_pfp_outcome',
    payload: {
      p_assignment_id: ASSIGNMENT_ID,
      p_outcome: 'stopped',
      p_comment: 'Accident',
      p_actor_user_id: 'actor-id'
    }
  }])
})

test('maps invalid ids, missing rows and upstream failures', async () => {
  const auth = { userId: 'admin', permissions: ['admin'] }
  const client = createClient({ data: null, error: { code: 'P0002' } })
  await listen(createApp({ client, auth }), async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/pfp-outcomes/not-an-id`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}'
    })
    assert.equal(invalid.status, 400)
    assert.equal((await patchOutcome(baseUrl)).status, 404)
  })

  const unavailable = createClient({ data: null, error: { code: 'XX000' } })
  await listen(createApp({ client: unavailable, auth }), async (baseUrl) => {
    assert.equal((await patchOutcome(baseUrl)).status, 503)
  })
})

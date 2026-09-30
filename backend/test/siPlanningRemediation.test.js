const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const { requireAnyPermission } = require('../middleware/auth')
const {
  createSIPlanningRemediationRouter,
  normalizeRemediationPayload
} = require('../supabase/siPlanningRemediationBackend')

const HISTORY_ID = '123e4567-e89b-42d3-a456-426614174000'

async function listen(app, callback) {
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  try {
    await callback(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

function createClient(rpcResult = { data: { historyId: HISTORY_ID }, error: null }) {
  const calls = []
  return {
    calls,
    async rpc(name, payload) {
      calls.push({ name, payload })
      return rpcResult
    },
    from() {
      return {
        select() { return this },
        order() { return this },
        async limit() { return { data: [], error: null } }
      }
    }
  }
}

function createApp({ auth, client }) {
  const app = express()
  app.use(express.json())
  if (auth) app.use((req, _res, next) => { req.auth = auth; next() })
  app.use(
    '/api/si/planning-remediations',
    requireAnyPermission('page2.access', 'AdminSoins'),
    createSIPlanningRemediationRouter({ client, logger: { error() {} } })
  )
  return app
}

function applyRequest(baseUrl, body = {}) {
  return fetch(`${baseUrl}/api/si/planning-remediations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slotId: 42,
      category: 'room',
      expectedValue: { value: '' },
      replacementValue: { value: 'A101' },
      reason: 'Salle vérifiée dans le planning source.',
      ...body
    })
  })
}

test('validates the remediation payload before any write', () => {
  assert.match(normalizeRemediationPayload({}).error, /Créneau/)
  assert.match(normalizeRemediationPayload({ slotId: 1, category: 'bad' }).error, /anomalie/)
  assert.match(normalizeRemediationPayload({
    slotId: 1, category: 'room', expectedValue: {}, replacementValue: {}, reason: 'court'
  }).error, /justification/)
})

test('rejects anonymous and unauthorized callers', async () => {
  const client = createClient()
  await listen(createApp({ client }), async baseUrl => {
    assert.equal((await applyRequest(baseUrl)).status, 401)
  })
  await listen(createApp({ client, auth: { userId: 'student', permissions: ['EtudiantSoins'] } }), async baseUrl => {
    assert.equal((await applyRequest(baseUrl)).status, 403)
  })
  assert.equal(client.calls.length, 0)
})

test('passes the authenticated actor and exact optimistic values to the RPC', async () => {
  const client = createClient()
  await listen(createApp({ client, auth: { userId: 'admin-id', permissions: ['AdminSoins'] } }), async baseUrl => {
    assert.equal((await applyRequest(baseUrl)).status, 201)
  })
  assert.deepEqual(client.calls, [{
    name: 'apply_si_planning_remediation',
    payload: {
      p_actor_user_id: 'admin-id',
      p_slot_id: 42,
      p_category: 'room',
      p_expected_value: { value: '' },
      p_replacement_value: { value: 'A101' },
      p_reason: 'Salle vérifiée dans le planning source.'
    }
  }])
})

test('maps concurrent changes to a conflict and reverts by history id', async () => {
  const auth = { userId: 'admin-id', permissions: ['page2.access'] }
  const conflict = createClient({ data: null, error: { code: '40001' } })
  await listen(createApp({ client: conflict, auth }), async baseUrl => {
    assert.equal((await applyRequest(baseUrl)).status, 409)
  })

  const client = createClient()
  await listen(createApp({ client, auth }), async baseUrl => {
    const response = await fetch(`${baseUrl}/api/si/planning-remediations/${HISTORY_ID}/revert`, { method: 'POST' })
    assert.equal(response.status, 200)
  })
  assert.deepEqual(client.calls[0], {
    name: 'revert_si_planning_remediation',
    payload: { p_actor_user_id: 'admin-id', p_history_id: HISTORY_ID }
  })
})

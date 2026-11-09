const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const { createAdminPasswordRecoveryRouter } = require('../supabase/adminPasswordRecoveryBackend')

const targetId = '11111111-1111-4111-8111-111111111111'
function fixture({ profile = { user_id: targetId, is_active: true }, authError = null, resetError = null } = {}) {
  const calls = []
  const entries = []
  const query = {
    select() { return this }, eq() { return this },
    then(resolve) { return Promise.resolve({ data: profile, error: null }).then(resolve) }
  }
  query.maybeSingle = () => query
  const router = createAdminPasswordRecoveryRouter({
    client: { from: () => query },
    authClient: {
      admin: { getUserById: async () => ({ data: { user: authError ? null : { id: targetId, email: 'Student@HEVS.CH' } }, error: authError }) },
      resetPasswordForEmail: async (...args) => { calls.push(args); return { error: resetError } }
    },
    logger: {
      info: (message, details) => entries.push({ message, details }),
      warn: (message, details) => entries.push({ message, details }),
      error: (message, details) => entries.push({ message, details })
    },
    environment: { NODE_ENV: 'production' }
  })
  return { router, calls, entries }
}

async function request(router, id = targetId, body = {}) {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => { req.auth = { userId: 'admin-id' }; req.id = 'request-id'; next() })
  app.use('/api/admin/users', router)
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/users/${id}/password-recovery`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    return { status: response.status, body: await response.json() }
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

test('sends recovery for an active account without class or role eligibility', async () => {
  const value = fixture()
  assert.deepEqual(await request(value.router, targetId, { email: 'attacker@example.invalid', redirectTo: 'https://attacker.invalid' }), {
    status: 202, body: { status: 'sent' }
  })
  assert.deepEqual(value.calls, [['student@hevs.ch', { redirectTo: 'https://hedsvs.ch/reset-password?flow=recovery' }]])
})

test('rejects invalid ids, inactive profiles and missing auth accounts', async () => {
  const invalid = fixture()
  assert.equal((await request(invalid.router, 'bad')).status, 400)
  assert.equal(invalid.calls.length, 0)
  const inactive = fixture({ profile: { user_id: targetId, is_active: false } })
  assert.equal((await request(inactive.router)).status, 409)
  const missing = fixture({ authError: { status: 404 } })
  assert.equal((await request(missing.router)).status, 409)
})

test('maps provider throttling and never logs email, redirect, token or raw error', async () => {
  const value = fixture({ resetError: { status: 429, message: 'secret Student@HEVS.CH token=private' } })
  assert.equal((await request(value.router)).status, 429)
  const serialized = JSON.stringify(value.entries)
  assert.doesNotMatch(serialized, /student@|private|attacker|reset-password/i)
  assert.match(serialized, /rate_limited/)
  assert.match(serialized, /admin-id/)
  assert.match(serialized, new RegExp(targetId))
})

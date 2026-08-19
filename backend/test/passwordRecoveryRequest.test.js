const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const {
  PUBLIC_RESPONSE,
  createPasswordRecoveryRequestRouter,
  resolveRecoveryRedirectUrl
} = require('../supabase/passwordRecoveryRequestBackend')

function createLogger() {
  const entries = []
  return {
    entries,
    info(message, details) {
      entries.push({ level: 'info', message, details })
    },
    warn(message, details) {
      entries.push({ level: 'warn', message, details })
    },
    error(message, details) {
      entries.push({ level: 'error', message, details })
    }
  }
}

async function withServer(router, callback) {
  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json())
  app.use('/api/auth/password-recovery', router)
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    await callback(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
}

function createRouter({ resetResult = { error: null }, logger = createLogger() } = {}) {
  const calls = []
  const router = createPasswordRecoveryRequestRouter({
    authClient: {
      async resetPasswordForEmail(...args) {
        calls.push(args)
        return resetResult
      }
    },
    logger,
    requestIdFactory: () => 'recovery-request-id',
    environment: { NODE_ENV: 'production' }
  })
  return { calls, logger, router }
}

async function requestRecovery(baseUrl, email) {
  const response = await fetch(`${baseUrl}/api/auth/password-recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirectTo: 'https://attacker.invalid/steal' })
  })
  return { response, body: await response.json() }
}

test('known and unknown addresses receive the exact same public response', async () => {
  const success = createRouter()
  const failure = createRouter({ resetResult: { error: { status: 422, message: 'User not found' } } })

  let known
  let unknown
  await withServer(success.router, async (baseUrl) => {
    known = await requestRecovery(baseUrl, 'Known.Student@hevs.ch')
  })
  await withServer(failure.router, async (baseUrl) => {
    unknown = await requestRecovery(baseUrl, 'unknown@example.invalid')
  })

  assert.equal(known.response.status, 202)
  assert.equal(unknown.response.status, 202)
  assert.deepEqual(known.body, PUBLIC_RESPONSE)
  assert.deepEqual(unknown.body, PUBLIC_RESPONSE)
  assert.deepEqual(known.body, unknown.body)
})

test('the server owns the redirect URL and normalizes the email', async () => {
  const fixture = createRouter()
  await withServer(fixture.router, async (baseUrl) => {
    await requestRecovery(baseUrl, '  Known.Student@HEVS.CH  ')
  })

  assert.deepEqual(fixture.calls, [
    [
      'known.student@hevs.ch',
      { redirectTo: 'https://hedsvs.ch/reset-password?flow=recovery' }
    ]
  ])
})

test('invalid input stays generic and does not call GoTrue', async () => {
  const fixture = createRouter()
  await withServer(fixture.router, async (baseUrl) => {
    const result = await requestRecovery(baseUrl, 'not-an-email')
    assert.equal(result.response.status, 202)
    assert.deepEqual(result.body, PUBLIC_RESPONSE)
  })

  assert.equal(fixture.calls.length, 0)
})

test('delivery logs contain no email, token, redirect or provider message', async () => {
  const logger = createLogger()
  const fixture = createRouter({
    logger,
    resetResult: {
      error: {
        status: 503,
        message: 'SMTP failed for secret.student@hevs.ch with token=secret-token'
      }
    }
  })
  await withServer(fixture.router, async (baseUrl) => {
    await requestRecovery(baseUrl, 'secret.student@hevs.ch')
  })

  const serialized = JSON.stringify(logger.entries)
  assert.doesNotMatch(serialized, /secret\.student|secret-token|attacker|SMTP failed/i)
  assert.match(serialized, /delivery_failure/)
  assert.match(serialized, /recovery-request-id/)
})

test('the dedicated limiter blocks the sixth request from one IP', async () => {
  const fixture = createRouter()
  await withServer(fixture.router, async (baseUrl) => {
    const statuses = []
    for (let index = 0; index < 6; index += 1) {
      const result = await requestRecovery(baseUrl, `student${index}@example.ch`)
      statuses.push(result.response.status)
    }
    assert.deepEqual(statuses, [202, 202, 202, 202, 202, 429])
  })
})

test('redirect configuration rejects unsafe destinations', () => {
  assert.throws(
    () =>
      resolveRecoveryRedirectUrl({
        NODE_ENV: 'production',
        PASSWORD_RECOVERY_REDIRECT_URL: 'https://attacker.invalid/callback'
      }),
    /must target \/reset-password/
  )
  assert.throws(
    () =>
      resolveRecoveryRedirectUrl({
        NODE_ENV: 'production',
        PASSWORD_RECOVERY_REDIRECT_URL: 'http://hedsvs.ch/reset-password'
      }),
    /must use HTTPS/
  )
})

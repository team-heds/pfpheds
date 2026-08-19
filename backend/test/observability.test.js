const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const { createHealthRouter, withTimeout } = require('../observability/health')
const { sanitizeLogContext, upstreamErrorContext } = require('../observability/logger')
const {
  createRequestContextMiddleware,
  resolveRequestId
} = require('../observability/requestContext')

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

test('request IDs are propagated only when they use the bounded safe format', () => {
  assert.equal(
    resolveRequestId('client-request_42', () => 'generated'),
    'client-request_42'
  )
  assert.equal(
    resolveRequestId('Bearer secret value', () => 'generated'),
    'generated'
  )
  assert.equal(
    resolveRequestId('x'.repeat(129), () => 'generated'),
    'generated'
  )
})

test('request completion logs are structured and omit query strings', async () => {
  const entries = []
  const app = express()
  app.use(
    createRequestContextMiddleware({
      requestIdFactory: () => 'generated-request-id',
      logger: { info: (entry) => entries.push(JSON.parse(entry)) }
    })
  )
  app.get('/items/:id', (_req, res) => res.status(204).end())

  await listen(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/items/123456?token=must-not-be-logged`, {
      headers: { 'X-Request-ID': 'caller-request-id' }
    })
    assert.equal(response.headers.get('x-request-id'), 'caller-request-id')
  })

  assert.equal(entries.length, 1)
  assert.deepEqual(
    {
      event: entries[0].event,
      requestId: entries[0].requestId,
      method: entries[0].method,
      route: entries[0].route,
      status: entries[0].status
    },
    {
      event: 'request.completed',
      requestId: 'caller-request-id',
      method: 'GET',
      route: '/items/:id',
      status: 204
    }
  )
  assert.equal(typeof entries[0].durationMs, 'number')
})

test('structured upstream context never includes credential-bearing fields or raw messages', () => {
  const error = Object.assign(new Error('request failed with token=super-secret'), {
    code: 'ECONNRESET',
    status: 502
  })
  const context = upstreamErrorContext(error, {
    service: 'supabase',
    authorization: 'Bearer super-secret',
    apiKey: 'super-secret'
  })

  assert.equal(context.service, 'supabase')
  assert.equal(context.errorCode, 'ECONNRESET')
  assert.equal(context.status, 502)
  assert.equal(JSON.stringify(context).includes('super-secret'), false)
  assert.deepEqual(sanitizeLogContext({ password: 'hidden', safe: 'visible' }), { safe: 'visible' })
})

test('health endpoints distinguish liveness from dependency readiness', async () => {
  const app = express()
  app.use(createRequestContextMiddleware({ logger: { info() {} } }))
  app.use(
    '/health',
    createHealthRouter({
      checkDependency: async () => ({ name: 'supabase-postgrest', status: 'up' })
    })
  )

  await listen(app, async (baseUrl) => {
    const live = await fetch(`${baseUrl}/health/live`)
    assert.equal(live.status, 200)
    assert.equal((await live.json()).status, 'healthy')

    const compatible = await fetch(`${baseUrl}/health`)
    assert.equal(compatible.status, 200)

    const ready = await fetch(`${baseUrl}/health/ready`)
    assert.equal(ready.status, 200)
    assert.deepEqual((await ready.json()).dependencies, [
      { name: 'supabase-postgrest', status: 'up' }
    ])
  })
})

test('readiness fails closed and does not expose upstream error details', async () => {
  const errors = []
  const app = express()
  app.use(createRequestContextMiddleware({ logger: { info() {} } }))
  app.use(
    '/health',
    createHealthRouter({
      checkDependency: () => withTimeout(new Promise(() => {}), 15),
      logger: { error: (entry) => errors.push(JSON.parse(entry)) }
    })
  )

  await listen(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health/ready`)
    assert.equal(response.status, 503)
    const payload = await response.json()
    assert.deepEqual(payload.dependencies, [{ name: 'supabase-postgrest', status: 'down' }])
    assert.equal(JSON.stringify(payload).includes('timed out'), false)
  })

  assert.equal(errors[0].event, 'upstream.error')
  assert.equal(errors[0].timedOut, true)
})

const test = require('node:test')
const assert = require('node:assert/strict')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const {
  createAuthenticate,
  createAuthorizationCache,
  requireAnyPermission
} = require('../middleware/auth')

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.payload = payload
      return this
    }
  }
}

test('authorization reads are coalesced per user and cached values cannot be mutated by callers', async () => {
  let calls = 0
  let resolveFetch
  const fetchAuthorization = () => {
    calls += 1
    return new Promise((resolve) => {
      resolveFetch = resolve
    })
  }
  let now = 100
  const load = createAuthorizationCache(fetchAuthorization, { ttlMs: 50, now: () => now })

  const first = load('user-1')
  const second = load('user-1')
  assert.equal(calls, 1)
  resolveFetch(['students.read'])

  const [permissionsA, permissionsB] = await Promise.all([first, second])
  permissionsA.push('admin')
  assert.deepEqual(permissionsB, ['students.read'])
  assert.deepEqual(await load('user-1'), ['students.read'])
  assert.equal(calls, 1)

  now = 151
  const afterExpiry = load('user-1')
  assert.equal(calls, 2)
  resolveFetch(['students.read'])
  await afterExpiry
})

test('failed authorization reads are never cached', async () => {
  let calls = 0
  const load = createAuthorizationCache(
    async () => {
      calls += 1
      if (calls === 1) throw new Error('temporary upstream failure')
      return ['students.read']
    },
    { ttlMs: 1000 }
  )

  await assert.rejects(load('user-1'))
  assert.deepEqual(await load('user-1'), ['students.read'])
  assert.equal(calls, 2)
})

test('authentication upstream calls are bounded and fail closed', async () => {
  const errors = []
  const authenticate = createAuthenticate({
    authClient: { getUser: () => new Promise(() => {}) },
    authorizationLoader: async () => ['admin'],
    timeoutMs: 15,
    logger: { error: (entry) => errors.push(JSON.parse(entry)) }
  })
  const req = {
    id: 'request-1',
    get: (header) => (header === 'authorization' ? 'Bearer valid-shape-token' : undefined)
  }
  const res = responseRecorder()
  let nextCalled = false

  await authenticate(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.payload, { error: 'Service d’authentification indisponible.' })
  assert.equal(errors[0].requestId, 'request-1')
  assert.equal(errors[0].timedOut, true)
})

test('retryable Supabase auth failures are availability errors, not invalid sessions', async () => {
  const authenticate = createAuthenticate({
    authClient: {
      getUser: async () => ({
        data: { user: null },
        error: { name: 'AuthRetryableFetchError', status: 503 }
      })
    },
    authorizationLoader: async () => ['admin'],
    timeoutMs: 50,
    logger: { error() {} }
  })
  const req = {
    id: 'request-2',
    get: (header) => (header === 'authorization' ? 'Bearer valid-shape-token' : undefined)
  }
  const res = responseRecorder()

  await authenticate(req, res, () => assert.fail('authentication must fail closed'))
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.payload, { error: 'Service d’authentification indisponible.' })
})

test('server-side authorization remains the only source used by permission guards', async () => {
  const authenticate = createAuthenticate({
    authClient: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null })
    },
    authorizationLoader: async () => ['students.read'],
    timeoutMs: 50,
    logger: { error() {} }
  })
  const req = {
    headers: { permissions: 'admin' },
    get: (header) => (header === 'authorization' ? 'Bearer server-validated-token' : undefined)
  }
  const res = responseRecorder()

  await authenticate(req, res, () => undefined)
  assert.deepEqual(req.auth.permissions, ['students.read'])

  let allowed = false
  requireAnyPermission('admin')(req, res, () => {
    allowed = true
  })
  assert.equal(allowed, false)
  assert.equal(res.statusCode, 403)
})

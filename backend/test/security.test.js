const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const { isAdmin, normalizePermissions, parseBearerToken } = require('../middleware/auth')

test('Bearer tokens require the complete scheme', () => {
  assert.equal(parseBearerToken('Bearer signed.jwt.token'), 'signed.jwt.token')
  assert.equal(parseBearerToken('signed.jwt.token'), null)
  assert.equal(parseBearerToken('Bearer'), null)
})

test('permissions are normalized from legacy shapes', () => {
  assert.deepEqual(normalizePermissions(['admin', 'editor']), ['admin', 'editor'])
  assert.deepEqual(normalizePermissions({ admin: true, editor: false }), ['admin'])
  assert.deepEqual(normalizePermissions('["admin","editor"]'), ['admin', 'editor'])
})

test('admin checks are case-insensitive and fail closed', () => {
  assert.equal(isAdmin({ permissions: ['AdminPhysio'] }), true)
  assert.equal(isAdmin({ permissions: ['editor'] }), false)
  assert.equal(isAdmin(null), false)
})

test('frontend source contains no service-role or hardcoded Google API key', () => {
  const root = path.resolve(__dirname, '..', '..', 'src')
  const files = []
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(target)
      else if (/\.(js|vue|mjs)$/.test(entry.name)) files.push(target)
    }
  }
  walk(root)
  const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
  assert.doesNotMatch(source, /VITE_SUPABASE_SERVICE_ROLE_KEY/)
  assert.doesNotMatch(source, /import\.meta[^\n]*VITE_VIMEO_ACCESS_TOKEN/)
  assert.doesNotMatch(source, /localStorage\.(getItem|setItem)\([^\n]*(github_token|vimeo_token|VIMEO_TOKEN_OVERRIDE)/i)
  assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]{30,}/)
})

test('sensitive API routes reject anonymous requests', async () => {
  const app = require('../index')
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  try {
    for (const [pathname, method] of [
      ['/api/posts', 'GET'],
      ['/api/feedbacka', 'GET'],
      ['/api/feedbacka', 'POST'],
      ['/api/institutions', 'POST'],
      ['/api/communities', 'POST'],
      ['/api/ftp/diagnostic', 'GET'],
      ['/api/chat', 'POST'],
      ['/api/admin/users', 'POST'],
      ['/api/integrations/vimeo/videos', 'GET'],
      ['/api/integrations/github/status', 'GET'],
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? '{}' : undefined,
      })
      assert.equal(response.status, 401, `${method} ${pathname} must require authentication`)
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

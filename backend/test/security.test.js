const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const { isAdmin, normalizePermissions, parseBearerToken } = require('../middleware/auth')
const { detectMimeType } = require('../uploads/fileValidation')

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
  assert.doesNotMatch(
    source,
    /localStorage\.(getItem|setItem)\([^\n]*(github_token|vimeo_token|VIMEO_TOKEN_OVERRIDE)/i
  )
  assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]{30,}/)
})

test('every business API is behind the global JWT middleware', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'index.js'), 'utf8')
  const authIndex = source.indexOf("app.use('/api', authenticate)")
  const firstBusinessRoute = source.indexOf("app.use('/api/institutions'")
  assert.ok(authIndex > 0, 'global API authentication middleware is required')
  assert.ok(authIndex < firstBusinessRoute, 'global authentication must run before business routes')
})

test('every admin frontend route declares authentication and a permission or redirects', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'src', 'router', 'routes', 'admin.js'),
    'utf8'
  )
  const routeMatches = [...source.matchAll(/path:\s*['"](\/admin[^'"]*)['"]/g)]
  assert.ok(routeMatches.length > 20, 'admin route inventory unexpectedly small')
  for (let index = 0; index < routeMatches.length; index += 1) {
    const start = routeMatches[index].index
    const end = routeMatches[index + 1]?.index ?? source.length
    const routeDefinition = source.slice(start, end)
    if (/redirect\s*:/.test(routeDefinition)) continue
    assert.match(
      routeDefinition,
      /requiresAuth\s*:\s*true/,
      `${routeMatches[index][1]} must require authentication`
    )
    assert.match(routeDefinition, /need\s*:/, `${routeMatches[index][1]} must declare a permission`)
  }
})

test('uploaded files are identified from their binary signature', async () => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pfpheds-security-test-'))
  const fakePdf = path.join(directory, 'fake.pdf')
  const realPdf = path.join(directory, 'real.pdf')
  try {
    await fs.promises.writeFile(fakePdf, Buffer.from([0, 1, 2, 3, 4]))
    await fs.promises.writeFile(realPdf, Buffer.from('%PDF-1.7\n'))
    assert.equal(await detectMimeType(fakePdf), null)
    assert.equal(await detectMimeType(realPdf), 'application/pdf')
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true })
  }
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
      ['/api/resultat-votation/student/test-user/PFP1A/2026', 'GET']
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? '{}' : undefined
      })
      assert.equal(response.status, 401, `${method} ${pathname} must require authentication`)
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
})

test('only operational probes are public', async () => {
  const app = require('../index')
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/ping`, {
      headers: { 'X-Forwarded-For': '203.0.113.42' }
    })
    assert.equal(response.status, 200)
    assert.equal(await response.text(), 'pingpong')
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
})

test('the production reverse proxy is trusted by exactly one hop', () => {
  const app = require('../index')
  assert.equal(app.get('trust proxy'), 1)
})

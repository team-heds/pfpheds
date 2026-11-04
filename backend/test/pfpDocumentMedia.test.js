const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'
const { createPfpDocumentMediaRouter, documentPath } = require('../supabase/pfpDocumentMediaBackend')

const base = 'https://api.heds.test/storage/v1/object/public/pfp-documents/'
const path = 'institutions/inst-1/12345678-1234-1234-1234-123456789012.pdf'
const url = base.replace('/public/', '/authenticated/') + path

function clientFixture(row, institution = row) {
  const calls = []
  return {
    calls,
    storage: { from: () => ({
      getPublicUrl: p => ({ data: { publicUrl: base + p } }),
      upload: async (...args) => { calls.push(['upload', ...args]); return { error: null } },
      createSignedUrl: async (...args) => { calls.push(['sign', ...args]); return { data: { signedUrl: 'http://gateway:8080/storage/v1/object/sign/pfp-documents/file.pdf?token=secret' } } }
    }) },
    from: table => ({ select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: table === 'places' ? row : institution, error: null }) })
  }
}
async function request(client, auth, callback) {
  const app = express()
  if (auth) app.use((req, _res, next) => { req.auth = auth; next() })
  app.use('/documents', createPfpDocumentMediaRouter({ client, publicStorageBaseUrl: 'https://api.heds.test' }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  try { await callback(`http://127.0.0.1:${server.address().port}`) }
  finally { await new Promise(resolve => server.close(resolve)) }
}
const student = { userId: 'student', permissions: ['EtudiantPhysio'] }
const admin = { userId: 'admin', permissions: ['AdminPhysio'] }

test('private document paths reject other hosts, buckets, tokens and traversal', () => {
  assert.equal(documentPath(url, base), path)
  assert.equal(documentPath(url.replace('api.heds.test', 'evil.test'), base), null)
  assert.equal(documentPath(url + '?token=x', base), null)
  assert.equal(documentPath(url.replace('inst-1', '%2e%2e'), base), null)
  assert.equal(documentPath(url.replace('pfp-documents', 'student-documents'), base), null)
})

test('authentication and admin upload privileges are enforced before storage writes', async () => {
  const client = clientFixture(null)
  await request(client, null, async baseUrl => {
    assert.equal((await fetch(`${baseUrl}/documents/download?url=${encodeURIComponent(url)}`)).status, 401)
  })
  await request(client, student, async baseUrl => {
    assert.equal((await fetch(`${baseUrl}/documents/upload/institutions/inst-1`, { method: 'POST' })).status, 403)
  })
  assert.equal(client.calls.length, 0)
})

test('only a currently referenced visible institution document can be signed', async () => {
  for (const row of [null, { CyberleanURL: 'https://other.test/file.pdf' }, { CyberleanURL: url, is_hidden: true }]) {
    const client = clientFixture(row)
    await request(client, student, async baseUrl => {
      assert.equal((await fetch(`${baseUrl}/documents/download?url=${encodeURIComponent(url)}`)).status, 404)
    })
    assert.equal(client.calls.length, 0)
  }
  const client = clientFixture({ CyberleanURL: url, is_hidden: false })
  await request(client, student, async baseUrl => {
    const response = await fetch(`${baseUrl}/documents/download?url=${encodeURIComponent(url)}`)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    const result = await response.json()
    assert.equal(result.expiresIn, 300)
    assert.equal(result.url, 'https://api.heds.test/storage/v1/object/sign/pfp-documents/file.pdf?token=secret')
  })
  assert.deepEqual(client.calls, [['sign', path, 300]])
})

test('admin upload validates PDF binary and creates a unique private reference', async () => {
  const client = clientFixture(null)
  await request(client, admin, async baseUrl => {
    const invalid = new FormData()
    invalid.append('file', new Blob(['<html>bad</html>'], { type: 'application/pdf' }), 'bad.pdf')
    assert.equal((await fetch(`${baseUrl}/documents/upload/institutions/inst-1`, { method: 'POST', body: invalid })).status, 400)
    assert.equal(client.calls.length, 0)
    const valid = new FormData()
    valid.append('file', new Blob(['%PDF-1.4\nPDF'], { type: 'application/pdf' }), 'concept.pdf')
    const response = await fetch(`${baseUrl}/documents/upload/institutions/inst-1`, { method: 'POST', body: valid })
    assert.equal(response.status, 201)
    const result = await response.json()
    assert.match(result.file.url, /\/object\/authenticated\/pfp-documents\/institutions\/inst-1\//)
    assert.equal(client.calls[0][3].upsert, false)
    assert.equal(client.calls[0][3].contentType, 'application/pdf')
  })
})

test('a place PDF cannot expose documents from a hidden institution', async () => {
  const placeUrl = url.replace('/institutions/inst-1/', '/places/place-1/')
  for (const institution of [null, { is_hidden: true }]) {
    const client = clientFixture({ fileurl: placeUrl, InstitutionId: 'inst-1' }, institution)
    await request(client, student, async baseUrl => {
      assert.equal((await fetch(`${baseUrl}/documents/download?url=${encodeURIComponent(placeUrl)}`)).status, 404)
    })
    assert.equal(client.calls.length, 0)
  }
  const client = clientFixture({ fileurl: placeUrl, InstitutionId: 'inst-1' }, { is_hidden: false })
  await request(client, student, async baseUrl => {
    assert.equal((await fetch(`${baseUrl}/documents/download?url=${encodeURIComponent(placeUrl)}`)).status, 200)
  })
})

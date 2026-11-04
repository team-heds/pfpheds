const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const { createFilePhysioMediaRouter, privateDocumentPath } = require('../supabase/filePhysioMediaBackend')
const { detectOfficeMimeType } = require('../uploads/documentValidation')
const XLSX = require('xlsx')
const baseUrl = 'https://storage.example.invalid/storage/v1/object/public/file-physio/'

function fixture({ storedUrl = baseUrl.replace('/public/', '/authenticated/') + 'legacy/form.pdf', signingError = null } = {}) {
  const uploads = []
  const signatures = []
  const storage = {
    getPublicUrl: path => ({ data: { publicUrl: baseUrl + path } }),
    upload: async (...args) => { uploads.push(args); return { error: null } },
    createSignedUrl: async (...args) => {
      signatures.push(args)
      return { data: { signedUrl: 'http://gateway:8080/storage/v1/object/sign/file-physio/form.pdf?token=private' }, error: signingError }
    }
  }
  const query = {
    select() { return this }, eq() { return this },
    maybeSingle: async () => ({ data: storedUrl ? { id: 'file1', url: storedUrl } : null, error: null })
  }
  return { uploads, signatures, router: createFilePhysioMediaRouter({
    publicStorageBaseUrl: 'https://storage.example.invalid',
    client: { storage: { from: () => storage }, from: () => query }
  }) }
}

async function request(router, path, { auth = { userId: 'admin', permissions: ['admin'] }, body } = {}) {
  const app = express()
  app.use((req, _res, next) => { req.auth = auth; next() })
  app.use(router)
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: 'POST', body })
    return { status: response.status, body: await response.json(), headers: response.headers }
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

function multipart(content, name = 'test.pdf', type = 'application/pdf') {
  const body = new FormData()
  body.append('file', new Blob([content], { type }), name)
  return body
}

test('upload requires authentication and admin rights before parsing/storing the file', async () => {
  const value = fixture()
  assert.equal((await request(value.router, '/files/upload', { auth: null, body: multipart('%PDF-1.7') })).status, 401)
  assert.equal((await request(value.router, '/files/upload', { auth: { userId: 'student', permissions: [] }, body: multipart('%PDF-1.7') })).status, 403)
  assert.equal(value.uploads.length, 0)
})

test('upload stores a new object with detected MIME and returns a permanent private URL', async () => {
  const value = fixture()
  const response = await request(value.router, '/files/upload', { body: multipart('%PDF-1.7\nfile', 'image.png', 'image/png') })
  assert.equal(response.status, 201)
  assert.equal(value.uploads.length, 1)
  assert.match(value.uploads[0][0], /^documents\/[a-f0-9-]+\.pdf$/)
  assert.deepEqual(value.uploads[0][2], { contentType: 'application/pdf', cacheControl: '300', upsert: false })
  assert.match(response.body.file.url, /\/object\/authenticated\/file-physio\/documents\/.+\.pdf$/)
  assert.doesNotMatch(response.body.file.url, /token=/)
})

test('rejects an executable disguised as PDF and missing/empty files', async () => {
  const value = fixture()
  assert.equal((await request(value.router, '/files/upload', { body: multipart(Buffer.from([0x4d, 0x5a, 0, 0]), 'safe.pdf') })).status, 400)
  assert.equal((await request(value.router, '/files/upload', { body: multipart('') })).status, 400)
  assert.equal((await request(value.router, '/files/upload')).status, 400)
  assert.equal(value.uploads.length, 0)
})

test('recognizes an actual Excel Office archive without trusting its MIME header', async () => {
  const value = fixture()
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Titre'], ['Document PFP']]), 'Feuille1')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  const response = await request(value.router, '/files/upload', { body: multipart(buffer, 'form.xlsx', 'application/octet-stream') })
  assert.equal(response.status, 201)
  assert.match(value.uploads[0][0], /\.xlsx$/)
  assert.equal(value.uploads[0][2].contentType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
})

test('signs only an existing registered private document for a short lifetime', async () => {
  const value = fixture()
  const response = await request(value.router, '/files/file1/download', { auth: { userId: 'student', permissions: [] } })
  assert.equal(response.status, 200)
  assert.deepEqual(value.signatures, [['legacy/form.pdf', 300]])
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.body.expiresIn, 300)
  assert.match(response.body.url, /^https:\/\/storage.example.invalid\/storage\/v1\/object\/sign\//)
  assert.doesNotMatch(response.body.url, /gateway/)
})

test('cannot sign another host, bucket, traversal path, missing file or provider failure', async () => {
  for (const storedUrl of [
    'https://evil.invalid/storage/v1/object/authenticated/file-physio/form.pdf',
    baseUrl.replace('/public/file-physio/', '/authenticated/student-documents/') + 'private.pdf',
    baseUrl.replace('/public/', '/authenticated/') + '%2e%2e%2fprivate.pdf',
    baseUrl.replace('/public/', '/authenticated/') + 'form.pdf?token=old'
  ]) {
    const value = fixture({ storedUrl })
    assert.equal((await request(value.router, '/files/file1/download')).status, 400)
    assert.equal(value.signatures.length, 0)
  }
  assert.equal((await request(fixture({ storedUrl: null }).router, '/files/missing/download')).status, 404)
  assert.equal((await request(fixture({ signingError: { message: 'secret' } }).router, '/files/file1/download')).status, 502)
})

test('path parser and Office detector reject malformed files without throwing', () => {
  assert.equal(privateDocumentPath('invalid', baseUrl), null)
  assert.equal(detectOfficeMimeType(Buffer.from('not a zip')), null)
  assert.equal(detectOfficeMimeType(Buffer.from([0x50, 0x4b, 3, 4])), null)
})

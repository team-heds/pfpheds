// Test-only, disposable end-to-end proof. Never accepts another target and
// never prints credentials, personal data, object URLs or signed tokens.
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const env = Object.fromEntries((await fs.readFile(new URL('.env', directory), 'utf8'))
  .split(/\r?\n/).map(line => line.trim())
  .filter(line => line && !line.startsWith('#') && line.includes('='))
  .map(line => {
    const separator = line.indexOf('=')
    return [line.slice(0, separator), line.slice(separator + 1).replace(/^(['"])(.*)\1$/, '$2')]
  }))
const saved = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory), 'utf8'))
if (saved.url !== base || !env.STAGING_ANON_KEY || !env.STAGING_SERVICE_ROLE_KEY) {
  throw new Error('Configuration de test incomplète ou environnement refusé.')
}
const runId = `media-smoke-${randomUUID()}`
const createdRows = []
const createdObjects = []
const sessions = []
const checks = []
const cleanupFailures = []
let currentCheck = 'configuration'
let failureAt = null

const serviceHeaders = {
  apikey: env.STAGING_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.STAGING_SERVICE_ROLE_KEY}`,
}
function requireCondition(condition) {
  if (!condition) throw new Error('Vérification échouée.')
}
async function request(path, options = {}) {
  const url = new URL(path, base)
  requireCondition(url.origin === base)
  return fetch(url, {
    ...options,
    headers: { ...(url.pathname.startsWith('/api/') ? { Origin: base } : {}), ...options.headers },
    redirect: 'error', signal: AbortSignal.timeout(30_000),
  })
}
async function jsonRequest(path, options = {}) {
  const response = await request(path, options)
  const body = await response.json().catch(() => null)
  return { response, body }
}
async function check(name, operation) {
  currentCheck = name
  await operation()
  checks.push(name)
}
async function signIn(account) {
  requireCondition(account?.email && account?.password)
  const { response, body } = await jsonRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: env.STAGING_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, password: account.password }),
  })
  requireCondition(response.status === 200 && body?.access_token)
  const headers = { apikey: env.STAGING_ANON_KEY, Authorization: `Bearer ${body.access_token}` }
  sessions.push(headers)
  return headers
}
const samplePdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n')
const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV2kAAAAASUVORK5CYII=', 'base64')
function formData(bytes = samplePdf, field = 'file', type = 'application/pdf', filename = 'smoke.pdf') {
  const form = new FormData()
  form.append(field, new Blob([bytes], { type }), filename)
  return form
}
function assertStoredFile(file, bucket, pathPrefix) {
  requireCondition(file?.path?.startsWith(pathPrefix))
  requireCondition(!file.path.includes('..') && !file.path.includes('\\'))
  // Track an uploaded object before any further assertion can fail.
  createdObjects.push({ bucket, path: file.path })
  const url = new URL(file.url)
  requireCondition(url.origin === base && !url.search && !url.hash)
  requireCondition(url.pathname.startsWith(`/storage/v1/object/authenticated/${bucket}/`))
}
async function insertRow(table, key, id, row) {
  // Even if the response is interrupted after commit, cleanup remains scoped to
  // this run's random identifier and cannot target any pre-existing row.
  createdRows.push({ table, key, id })
  const { response } = await jsonRequest(`/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...serviceHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  })
  requireCondition(response.status === 201)
}
async function patchFixture(table, key, id, patch) {
  requireCondition(id === runId && createdRows.some(row => row.table === table && row.id === id))
  const { response } = await jsonRequest(`/rest/v1/${table}?${encodeURIComponent(key)}=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: { ...serviceHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  })
  requireCondition(response.status === 204)
}
async function assertPdfDownloaded(signedUrl) {
  const url = new URL(signedUrl)
  requireCondition(url.origin === base && url.pathname.startsWith('/storage/v1/object/sign/'))
  const response = await request(url.href)
  requireCondition(response.status === 200 && response.headers.get('content-type')?.includes('application/pdf'))
  const bytes = Buffer.from(await response.arrayBuffer())
  requireCondition(bytes.equals(samplePdf))
}
async function assertObjectPrivate(bucket, path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const response = await request(`/storage/v1/object/public/${bucket}/${encodedPath}`)
  requireCondition([400, 401, 403, 404].includes(response.status))
}

try {
  let admin, student, uploadedFile, folderId
  await check('admin_and_student_login', async () => {
    admin = await signIn(saved.accounts.admin)
    student = await signIn(saved.accounts.student)
  })
  await check('document_buckets_private', async () => {
    for (const bucket of ['file-physio', 'pfp-documents']) {
      const { response, body } = await jsonRequest(`/storage/v1/bucket/${bucket}`, { headers: serviceHeaders })
      requireCondition(response.status === 200 && body?.id === bucket && body.public === false)
    }
  })
  await check('anonymous_401_student_upload_403', async () => {
    for (const [headers, expected] of [[{}, 401], [student, 403]]) {
      const response = await request('/api/filePhysio/files/upload', { method: 'POST', headers, body: formData() })
      requireCondition(response.status === expected)
      const pfp = await request(`/api/institutions/documents/upload/institutions/${runId}`, { method: 'POST', headers, body: formData() })
      requireCondition(pfp.status === expected)
    }
    requireCondition((await request(`/api/filePhysio/files/${runId}/download`, { method: 'POST' })).status === 401)
  })
  await check('admin_filephysio_upload_private_public_origin', async () => {
    const { response, body } = await jsonRequest('/api/filePhysio/files/upload', { method: 'POST', headers: admin, body: formData() })
    requireCondition(response.status === 201)
    requireCondition(response.headers.get('access-control-allow-origin') === base)
    uploadedFile = body.file
    assertStoredFile(uploadedFile, 'file-physio', 'documents/')
    requireCondition((await request(`/api/filePhysio/files/${runId}/download`, { method: 'POST', headers: student })).status === 404)
    await assertObjectPrivate('file-physio', uploadedFile.path)
  })
  await check('disposable_filephysio_row', async () => {
    const { response, body } = await jsonRequest('/rest/v1/file_physio_folders?select=id&limit=1', { headers: serviceHeaders })
    requireCondition(response.status === 200 && body?.[0]?.id)
    folderId = body[0].id
    await insertRow('file_physio_files', 'id', runId, { id: runId, name: '[SMOKE] Vérification temporaire stockage', url: uploadedFile.url, folder_id: folderId })
  })
  await check('student_registered_file_download_signature_300s', async () => {
    const { response, body } = await jsonRequest(`/api/filePhysio/files/${runId}/download`, { method: 'POST', headers: student })
    requireCondition(response.status === 200 && body.expiresIn === 300 && response.headers.get('cache-control') === 'no-store')
    await assertPdfDownloaded(body.url)
  })
  await check('disposable_institution_and_place', async () => {
    await insertRow('institutions', 'InstitutionId', runId, { InstitutionId: runId, Name: '[SMOKE] Institution temporaire stockage', is_hidden: false })
    await insertRow('places', 'PlaceId', runId, { PlaceId: runId, InstitutionId: runId, NomPlace: '[SMOKE] Place temporaire stockage' })
  })
  for (const kind of ['institutions', 'places']) {
    await check(`${kind}_private_pdf_upload_and_student_download`, async () => {
      const { response, body } = await jsonRequest(`/api/institutions/documents/upload/${kind}/${runId}`, { method: 'POST', headers: admin, body: formData() })
      requireCondition(response.status === 201)
      const file = body.file
      assertStoredFile(file, 'pfp-documents', `${kind}/${runId}/`)
      const downloadPath = `/api/institutions/documents/download?url=${encodeURIComponent(file.url)}`
      // Uploads do not become readable until registered to the matching record.
      requireCondition((await request(downloadPath, { headers: student })).status === 404)
      await patchFixture(kind, kind === 'institutions' ? 'InstitutionId' : 'PlaceId', runId, kind === 'institutions' ? { CyberleanURL: file.url, CyberlearnURL: file.url } : { fileurl: file.url })
      const signed = await jsonRequest(downloadPath, { headers: student })
      requireCondition(signed.response.status === 200 && signed.body.expiresIn === 300)
      await assertPdfDownloaded(signed.body.url)
      await assertObjectPrivate('pfp-documents', file.path)
    })
  }
  await check('institution_image_public_upload_origin_and_read', async () => {
    const { response, body } = await jsonRequest(`/api/institutions/${runId}/images`, { method: 'POST', headers: admin, body: formData(samplePng, 'images', 'image/png', 'smoke.png') })
    requireCondition(response.status === 201 && body.files?.length === 1)
    const file = body.files[0]
    requireCondition(file.path?.startsWith(`${runId}/`))
    createdObjects.push({ bucket: 'institutions', path: file.path })
    const url = new URL(file.url)
    requireCondition(url.origin === base && url.pathname.startsWith('/storage/v1/object/public/institutions/'))
    const downloaded = await request(url.href)
    requireCondition(downloaded.status === 200 && downloaded.headers.get('content-type')?.includes('image/png'))
    requireCondition(Buffer.from(await downloaded.arrayBuffer()).equals(samplePng))
  })
} catch {
  failureAt = currentCheck
  process.exitCode = 1
} finally {
  // Exact disposable rows only, child place before institution, no broad deletes.
  for (const row of [...createdRows].reverse()) {
    try {
      requireCondition(row.id === runId)
      const response = await request(`/rest/v1/${row.table}?${encodeURIComponent(row.key)}=eq.${encodeURIComponent(row.id)}`, { method: 'DELETE', headers: { ...serviceHeaders, Prefer: 'return=minimal' } })
      requireCondition(response.status === 204)
      const checkResponse = await jsonRequest(`/rest/v1/${row.table}?${encodeURIComponent(row.key)}=eq.${encodeURIComponent(row.id)}&select=${encodeURIComponent(row.key)}`, { headers: serviceHeaders })
      requireCondition(checkResponse.response.status === 200 && checkResponse.body.length === 0)
    } catch { cleanupFailures.push(`row:${row.table}`) }
  }
  for (const object of createdObjects) {
    try {
      requireCondition(['file-physio', 'pfp-documents', 'institutions'].includes(object.bucket))
      const response = await request(`/storage/v1/object/${object.bucket}`, {
        method: 'DELETE', headers: { ...serviceHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [object.path] }),
      })
      requireCondition(response.status === 200)
      const path = object.path.split('/').map(encodeURIComponent).join('/')
      const verify = await request(`/storage/v1/object/authenticated/${object.bucket}/${path}`, { headers: serviceHeaders })
      requireCondition([400, 404].includes(verify.status))
    } catch { cleanupFailures.push(`object:${object.bucket}`) }
  }
  for (const headers of sessions) {
    try { await request('/auth/v1/logout?scope=local', { method: 'POST', headers }) } catch { /* expires normally */ }
  }
  if (cleanupFailures.length) process.exitCode = 1
  console.log(JSON.stringify({
    environment: 'test', checksPassed: checks, failureAt,
    cleanup: { rows: createdRows.length, objects: createdObjects.length, failures: cleanupFailures },
    productionTouched: false, credentialsPrinted: false,
  }, null, 2))
}

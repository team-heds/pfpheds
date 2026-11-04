// Run only inside the production backend container after explicit approval:
// docker exec -e ALLOW_PRODUCTION_STORAGE_SMOKE=1 -i pfpheds-backend node < this-file
// Creates only three uniquely named disposable Storage objects. It never logs
// in a user, creates a session, changes a profile or writes application rows.
const { randomUUID } = require('crypto')

if (process.env.ALLOW_PRODUCTION_STORAGE_SMOKE !== '1') {
  throw new Error('Exécution non autorisée: activation explicite requise.')
}
const base = 'https://api2.hedsvs.ch'
if (String(process.env.SUPABASE_URL || '').replace(/\/$/, '') !== base) {
  throw new Error('Environnement refusé: ce script cible exclusivement la production attendue.')
}
const { supabaseAdmin: client } = require('/app/supabaseClient')
const { getPublicStorageBaseUrl, toPublicStorageUrl } = require('/app/supabase/storageUrls')
const runId = `media-smoke-${randomUUID()}`
const created = []
const checks = []
const cleanupFailures = []
const cleanupDetails = []
let currentCheck = 'configuration'
let failureAt = null
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n')
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV2kAAAAASUVORK5CYII=', 'base64')
const assert = condition => { if (!condition) throw new Error('Vérification échouée.') }
const fetchSafe = async (path, options = {}) => {
  const url = new URL(path, base)
  assert(url.origin === base)
  return fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30_000) })
}
async function check(name, operation) {
  currentCheck = name
  await operation()
  checks.push(name)
}

;(async () => {
  try {
    await check('public_storage_origin_configuration', async () => {
      assert(getPublicStorageBaseUrl() === base)
      assert(typeof require('/app/supabase/filePhysioMediaBackend').createFilePhysioMediaRouter === 'function')
      assert(typeof require('/app/supabase/pfpDocumentMediaBackend').createPfpDocumentMediaRouter === 'function')
      const mapped = toPublicStorageUrl('http://gateway:8080/storage/v1/object/sign/file-physio/form.pdf?token=example')
      assert(new URL(mapped).origin === base)
    })
    await check('bucket_privacy_and_20MiB_limits', async () => {
      for (const name of ['file-physio', 'pfp-documents', 'institutions']) {
        const { data, error } = await client.storage.getBucket(name)
        assert(!error && data?.id === name)
        assert(data.public === (name === 'institutions'))
        if (name !== 'institutions') assert(Number(data.file_size_limit ?? data.fileSizeLimit) === 20 * 1024 * 1024)
      }
    })
    await check('anonymous_api_401_and_production_CORS', async () => {
      for (const path of ['/api/filePhysio/files/upload', '/api/filePhysio/files/media-smoke-missing/download', '/api/institutions/documents/upload/institutions/media-smoke-missing']) {
        const response = await fetchSafe(path, { method: 'POST', headers: { Origin: 'https://www.hedsvs.ch' } })
        assert(response.status === 401)
        assert(response.headers.get('access-control-allow-origin') === 'https://www.hedsvs.ch')
      }
      const preflight = await fetchSafe('/api/filePhysio/files/upload', {
        method: 'OPTIONS', headers: { Origin: 'https://www.hedsvs.ch', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' },
      })
      assert([200, 204].includes(preflight.status) && preflight.headers.get('access-control-allow-origin') === 'https://www.hedsvs.ch')
    })
    for (const bucket of ['file-physio', 'pfp-documents', 'institutions']) {
      await check(`${bucket}_disposable_upload_and_download`, async () => {
        const path = bucket === 'file-physio' ? `documents/${runId}.pdf`
          : bucket === 'pfp-documents' ? `institutions/${runId}/${randomUUID()}.pdf`
            : `${runId}/pixel.png`
        const bytes = bucket === 'institutions' ? png : pdf
        const type = bucket === 'institutions' ? 'image/png' : 'application/pdf'
        const storage = client.storage.from(bucket)
        // A failed HTTP response could follow a committed upload. Track the exact
        // random path before uploading so finally can recover that case too.
        created.push({ bucket, path })
        const uploaded = await storage.upload(path, bytes, { contentType: type, upsert: false, cacheControl: '0' })
        assert(!uploaded.error)
        const publicUrl = toPublicStorageUrl(storage.getPublicUrl(path).data.publicUrl)
        const publicResponse = await fetchSafe(publicUrl)
        if (bucket === 'institutions') {
          assert(publicResponse.status === 200 && publicResponse.headers.get('content-type')?.includes(type))
          assert(Buffer.from(await publicResponse.arrayBuffer()).equals(bytes))
        } else {
          assert([400, 401, 403, 404].includes(publicResponse.status))
          const signed = await storage.createSignedUrl(path, 300)
          assert(!signed.error && signed.data?.signedUrl)
          const signedUrl = toPublicStorageUrl(signed.data.signedUrl)
          const parsed = new URL(signedUrl)
          assert(parsed.origin === base && parsed.pathname.startsWith('/storage/v1/object/sign/'))
          const response = await fetchSafe(signedUrl)
          assert(response.status === 200 && response.headers.get('content-type')?.includes(type))
          assert(Buffer.from(await response.arrayBuffer()).equals(bytes))
        }
      })
    }
  } catch {
    failureAt = currentCheck
    process.exitCode = 1
  } finally {
    for (const object of created) {
      let phase = 'scope-validation'
      try {
        assert(object.path.includes(runId) && ['file-physio', 'pfp-documents', 'institutions'].includes(object.bucket))
        const storage = client.storage.from(object.bucket)
        phase = 'storage-api-remove'
        const removed = await storage.remove([object.path])
        if (removed.error) throw removed.error
        phase = 'verify-absence'
        const path = object.path.split('/').map(encodeURIComponent).join('/')
        const response = await fetchSafe(`/storage/v1/object/authenticated/${object.bucket}/${path}`, {
          headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
        })
        if (![400, 404].includes(response.status)) {
          const error = new Error('Objet toujours accessible après suppression.')
          error.status = response.status
          throw error
        }
      } catch (error) {
        cleanupFailures.push(object.bucket)
        cleanupDetails.push({ bucket: object.bucket, path: object.path, phase, errorName: error.name, status: error.status || error.statusCode || null })
      }
    }
    if (cleanupFailures.length) process.exitCode = 1
    console.log(JSON.stringify({
      environment: 'production', smokeRunId: runId, checksPassed: checks, failureAt,
      cleanup: { createdObjects: created.length, failures: cleanupFailures, failedObjects: cleanupDetails },
      applicationRowsWritten: 0, realProfilesChanged: 0, userLoginsPerformed: 0,
      productionAdminUploadApi: 'not_exercised_without_synthetic_account',
      productionStudent403: 'covered_by_test_environment_and_unit_tests',
      credentialsPrinted: false,
    }, null, 2))
  }
})().catch(() => { console.error('Échec du contrôle du stockage de production.'); process.exitCode = 1 })

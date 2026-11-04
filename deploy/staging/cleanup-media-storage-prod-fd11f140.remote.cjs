// Cleanup-only recovery for the exact three disposable objects recorded by the
// first production smoke. This script does not upload or touch application rows.
if (process.env.ALLOW_PRODUCTION_STORAGE_SMOKE !== '1' ||
    String(process.env.SUPABASE_URL || '').replace(/\/$/, '') !== 'https://api2.hedsvs.ch') {
  throw new Error('Environnement ou autorisation de nettoyage refusé.')
}
const { supabaseAdmin: client } = require('/app/supabaseClient')
const objects = [
  { bucket: 'file-physio', path: 'documents/media-smoke-fd11f140-0b10-4562-a790-5810882c6391.pdf' },
  { bucket: 'pfp-documents', path: 'institutions/media-smoke-fd11f140-0b10-4562-a790-5810882c6391/a6df0202-cc8e-4d35-a63a-583fd6b1c6ec.pdf' },
  { bucket: 'institutions', path: 'media-smoke-fd11f140-0b10-4562-a790-5810882c6391/pixel.png' },
]
;(async () => {
  const results = []
  for (const object of objects) {
    const { error } = await client.storage.from(object.bucket).remove([object.path])
    if (error) {
      results.push({ bucket: object.bucket, removed: false, status: error.status || error.statusCode || null })
      process.exitCode = 1
      continue
    }
    const prefix = object.path.slice(0, object.path.lastIndexOf('/'))
    const filename = object.path.slice(object.path.lastIndexOf('/') + 1)
    const listed = await client.storage.from(object.bucket).list(prefix, { search: filename, limit: 100 })
    const absent = !listed.error && !listed.data.some(item => item.name === filename)
    if (!absent) process.exitCode = 1
    results.push({ bucket: object.bucket, removed: true, absenceVerified: absent })
  }
  console.log(JSON.stringify({ environment: 'production', exactDisposableObjectsOnly: true, results, applicationRowsWritten: 0 }, null, 2))
})().catch(() => { console.error('Le nettoyage exact des objets de test a échoué.'); process.exitCode = 1 })

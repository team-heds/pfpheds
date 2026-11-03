const { supabaseAdmin } = require('/app/supabaseClient')
async function main() {
  if (process.env.SUPABASE_URL !== 'https://api2.hedsvs.ch') throw new Error('Production origin mismatch; stopped.')
  const buckets = [
    { id: 'file-physio', types: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'] },
    { id: 'pfp-documents', types: ['application/pdf'] }
  ]
  const { data: inventory, error: inventoryError } = await supabaseAdmin.storage.listBuckets()
  if (inventoryError || !Array.isArray(inventory)) throw new Error('Production Storage inventory unavailable.')
  for (const { id, types } of buckets) {
    const existing = inventory.find(bucket => bucket.id === id)
    if (existing) {
      if (existing.public || Number(existing.file_size_limit) !== 20971520) throw new Error(`Unexpected existing bucket settings: ${id}`)
    } else {
      const { error } = await supabaseAdmin.storage.createBucket(id, { public: false, fileSizeLimit: 20971520, allowedMimeTypes: types })
      if (error) throw new Error(`Cannot create ${id}: ${error.message}`)
    }
    const { data, error } = await supabaseAdmin.storage.getBucket(id)
    if (error || !data || data.public || Number(data.file_size_limit) !== 20971520) throw new Error(`Bucket verification failed: ${id}`)
    console.log(JSON.stringify({ bucket: id, private: true, maxBytes: data.file_size_limit }))
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })

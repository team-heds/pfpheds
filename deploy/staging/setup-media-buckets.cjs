// Run inside the TEST backend. No credentials or signed URLs are logged.
const { supabaseAdmin } = require('/app/supabaseClient')
async function main() {
  if (process.env.SUPABASE_PUBLIC_URL !== 'https://test.hedsvs.ch') throw new Error('TEST only')
  const buckets = [
    { id: 'file-physio', types: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'] },
    { id: 'pfp-documents', types: ['application/pdf'] }
  ]
  // The API process can be ready before the separately recreated Storage API.
  let inventory
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data, error } = await supabaseAdmin.storage.listBuckets()
    if (!error && Array.isArray(data)) { inventory = data; break }
    if (attempt === 19) throw new Error('TEST Storage API did not become ready.')
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
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

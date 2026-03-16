/**
 * Migration script: Upload AlpinPhysioPhoto images to Supabase Storage
 * 
 * Prerequisites:
 *   1. Create a public bucket "alpinphysio" in Supabase Storage
 *   2. Set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 
 * Usage:
 *   node scripts/migrate-alpinphysio-to-storage.mjs
 * 
 * What it does:
 *   - Reads all files from public/assets/images/heds/AlpinPhysioPhoto/
 *   - Uploads them to Supabase Storage bucket "alpinphysio" preserving folder structure
 *   - Outputs a JSON mapping of old paths → new public URLs
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Read .env file ───────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env')
  if (!fs.existsSync(envPath)) return {}
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  const env = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    let val = trimmed.substring(idx + 1).trim()
    // Strip inline comments (# ...) but not if inside the JWT token
    const hashIdx = val.indexOf('#')
    if (hashIdx > 0 && val[hashIdx - 1] !== '/') {
      val = val.substring(0, hashIdx).trim()
    }
    env[trimmed.substring(0, idx).trim()] = val
  }
  return env
}

const dotenv = loadEnv()

// ── Config ───────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || dotenv.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || dotenv.SUPABASE_SERVICE_ROLE_KEY
const BUCKET_NAME = 'alpinphysio'
const SOURCE_DIR = path.resolve(__dirname, '../public/assets/images/heds/AlpinPhysioPhoto')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Set them in .env or as environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ── Helpers ──────────────────────────────────────────
function getAllFiles(dir, baseDir = dir) {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir))
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
      results.push({ fullPath, relativePath })
    }
  }
  return results
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const mimes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  }
  return mimes[ext] || 'application/octet-stream'
}

// ── Main ─────────────────────────────────────────────
async function main() {
  console.log(`📂 Source: ${SOURCE_DIR}`)
  console.log(`🪣 Bucket: ${BUCKET_NAME}`)
  console.log(`🔗 Supabase: ${SUPABASE_URL}`)
  console.log()

  // 1. Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.find(b => b.name === BUCKET_NAME)
  if (!exists) {
    console.log(`Creating bucket "${BUCKET_NAME}"...`)
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    })
    if (error) {
      console.error('❌ Failed to create bucket:', error.message)
      process.exit(1)
    }
    console.log('✅ Bucket created')
  } else {
    console.log('✅ Bucket already exists')
  }

  // 2. Collect all files
  const files = getAllFiles(SOURCE_DIR)
  console.log(`\n📸 Found ${files.length} files to upload\n`)

  // 3. Upload each file
  const mapping = {}
  let uploaded = 0
  let failed = 0

  for (const file of files) {
    const fileBuffer = fs.readFileSync(file.fullPath)
    const contentType = getMimeType(file.fullPath)

    // Sanitize path for Supabase Storage (no spaces, special chars)
    const storagePath = file.relativePath

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '31536000', // 1 year (immutable images)
        upsert: true,
      })

    if (error) {
      console.error(`  ❌ ${storagePath}: ${error.message}`)
      failed++
      continue
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    mapping[file.relativePath] = urlData.publicUrl
    uploaded++

    if (uploaded % 10 === 0) {
      console.log(`  ⬆️  ${uploaded}/${files.length} uploaded...`)
    }
  }

  console.log(`\n✅ Done: ${uploaded} uploaded, ${failed} failed`)

  // 4. Save mapping to JSON
  const mappingPath = path.resolve(__dirname, 'alpinphysio-url-mapping.json')
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2))
  console.log(`\n📄 URL mapping saved to: ${mappingPath}`)

  // 5. Print the base URL for updating Vue component
  const sampleUrl = Object.values(mapping)[0]
  if (sampleUrl) {
    const baseUrl = sampleUrl.split('/storage/v1/object/public/alpinphysio/')[0]
    console.log(`\n🔗 Base URL for Vue component:`)
    console.log(`   ${baseUrl}/storage/v1/object/public/${BUCKET_NAME}/`)
    console.log(`\n   Update getImagePath in AlpinPhysioView.vue:`)
    console.log(`   const STORAGE_BASE = '${baseUrl}/storage/v1/object/public/${BUCKET_NAME}'`)
    console.log(`   const getImagePath = (relativePath) => \`\${STORAGE_BASE}/\${relativePath}\``)
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

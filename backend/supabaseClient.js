const { createClient } = require('@supabase/supabase-js')
const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '.env') })

function isPlaceholder(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return !normalized || normalized.includes('your-test-project') || normalized.includes('your_test_supabase')
}

function firstConfigured(...values) {
  return values.find((value) => !isPlaceholder(value)) || values.find(Boolean)
}

const supabaseUrl = firstConfigured(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL)
const supabaseKey = firstConfigured(process.env.SUPABASE_KEY, process.env.VITE_SUPABASE_KEY)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const baseClientKey = supabaseKey || supabaseServiceKey

if (!supabaseUrl || !baseClientKey) {
  console.error('[SUPABASE] Missing SUPABASE_URL and SUPABASE_KEY configuration.')
  process.exit(1)
}

if (process.env.NODE_ENV === 'production' && !supabaseServiceKey) {
  console.error('[SUPABASE] SUPABASE_SERVICE_ROLE_KEY is required in production.')
  process.exit(1)
}

const clientOptions = { auth: { autoRefreshToken: false, persistSession: false } }
const supabase = createClient(supabaseUrl, baseClientKey, clientOptions)
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, clientOptions)
  : supabase

// Never log credentials or decoded service-role claims.
console.log('[SUPABASE] Configuration loaded:', {
  urlConfigured: Boolean(supabaseUrl),
  anonKeyConfigured: Boolean(supabaseKey),
  serviceRoleConfigured: Boolean(supabaseServiceKey),
})

module.exports = supabase
module.exports.supabaseAdmin = supabaseAdmin

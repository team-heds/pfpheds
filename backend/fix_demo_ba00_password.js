/**
 * fix_demo_ba00_password.js
 * Force-reset le mot de passe et confirme les emails des comptes démo BA00
 * À lancer si "Invalid login credentials" après seed_demo_ba00.js
 *
 * Usage:
 *   cd backend
 *   node fix_demo_ba00_password.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variables manquantes: VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DEMO_PASSWORD = 'Demo2026!'
const DEMO_EMAILS = Array.from({ length: 10 }, (_, i) =>
  `ba00.demo${String(i + 1).padStart(2, '0')}@test-heds.ch`
)

async function main() {
  console.log('\n🔧 Fix passwords démo BA00\n')

  // Récupérer tous les users pour trouver nos comptes
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) { console.error('❌ listUsers:', listErr.message); process.exit(1) }

  const demoUsers = users.filter(u => DEMO_EMAILS.includes(u.email))
  console.log(`🔍 ${demoUsers.length}/10 comptes démo trouvés dans auth.users\n`)

  if (demoUsers.length === 0) {
    console.log('⚠️  Aucun compte trouvé. Lance d\'abord: node seed_demo_ba00.js')
    return
  }

  let fixed = 0
  for (const user of demoUsers) {
    process.stdout.write(`  [${user.email}] `)

    // Force-update password + confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    })

    if (error) {
      console.log(`❌ ${error.message}`)
    } else {
      const confirmed = data.user.email_confirmed_at ? '✅' : '⚠️ non confirmé'
      console.log(`✅ password reset — email_confirmed_at: ${data.user.email_confirmed_at || 'NULL'} ${confirmed}`)
      fixed++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ ${fixed}/${demoUsers.length} comptes mis à jour`)
  console.log(`\n🔑 Connexion:`)
  DEMO_EMAILS.forEach(e => console.log(`   ${e}  /  ${DEMO_PASSWORD}`))

  // Si toujours NULL après updateUserById, faire le fix SQL direct
  const stillUnconfirmed = demoUsers.length - fixed
  if (stillUnconfirmed > 0 || fixed < demoUsers.length) {
    console.log('\n⚠️  Si le login échoue encore, exécute ce SQL dans Supabase SQL Editor:')
    console.log(`\n   UPDATE auth.users`)
    console.log(`   SET email_confirmed_at = now(), updated_at = now()`)
    console.log(`   WHERE email LIKE 'ba00.demo%@test-heds.ch';\n`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

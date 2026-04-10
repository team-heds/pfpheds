/**
 * cleanup_demo_ba00.js
 * Supprime les 10 comptes démo BA00 (auth + user_profiles + StudentsPhysio + votes)
 *
 * Usage:
 *   cd backend
 *   node cleanup_demo_ba00.js
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

const DEMO_EMAILS = Array.from({ length: 10 }, (_, i) =>
  `ba00.demo${String(i + 1).padStart(2, '0')}@test-heds.ch`
)

async function main() {
  console.log('\n🧹 Cleanup démo BA00\n')

  // 1. Récupérer les user_ids via user_profiles
  const { data: profiles, error: profErr } = await supabase
    .from('user_profiles')
    .select('user_id, email')
    .in('email', DEMO_EMAILS)
  if (profErr) { console.error('❌ Erreur user_profiles:', profErr.message); process.exit(1) }

  const userIds = profiles.map(p => p.user_id)
  console.log(`🔍 ${userIds.length} comptes démo trouvés\n`)

  if (userIds.length === 0) {
    console.log('Rien à supprimer.')
    return
  }

  // 2. Nettoyer les votes / résultats liés
  const tables = ['student_result_vote', 'student_votes', 'votation_results']
  for (const tbl of tables) {
    const { error } = await supabase.from(tbl).delete().in('user_id', userIds)
    if (error && !error.message.includes('does not exist')) {
      console.warn(`  ⚠️  ${tbl}: ${error.message}`)
    } else if (!error) {
      console.log(`  🗑  ${tbl} — votes supprimés`)
    }
  }

  // 3. Supprimer StudentsPhysio
  const { error: physioErr } = await supabase
    .from('StudentsPhysio')
    .delete()
    .in('user_id', userIds)
  if (physioErr) console.warn(`  ⚠️  StudentsPhysio: ${physioErr.message}`)
  else console.log(`  🗑  StudentsPhysio — entrées supprimées`)

  // 4. Supprimer user_profiles
  const { error: profDelErr } = await supabase
    .from('user_profiles')
    .delete()
    .in('user_id', userIds)
  if (profDelErr) console.warn(`  ⚠️  user_profiles: ${profDelErr.message}`)
  else console.log(`  🗑  user_profiles — profils supprimés`)

  // 5. Supprimer les comptes auth
  let authDeleted = 0
  for (const uid of userIds) {
    const { error } = await supabase.auth.admin.deleteUser(uid)
    if (error) console.warn(`  ⚠️  auth ${uid}: ${error.message}`)
    else authDeleted++
  }
  console.log(`  🗑  auth.users — ${authDeleted} comptes supprimés`)

  // 6. Nettoyer la table de tracking démo si elle existe
  const { error: trackErr } = await supabase
    .from('demo_ba00_seed_users')
    .delete()
    .in('user_id', userIds)
  if (!trackErr) console.log(`  🗑  demo_ba00_seed_users — nettoyé`)

  console.log('\n✅ Cleanup terminé. Base propre.\n')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

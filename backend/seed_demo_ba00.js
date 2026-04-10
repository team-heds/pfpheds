/**
 * seed_demo_ba00.js
 * Crée 10 comptes démo BA00 dans Supabase (auth + user_profiles + StudentsPhysio)
 *
 * Usage:
 *   cd backend
 *   node seed_demo_ba00.js
 *
 * Cleanup:
 *   node cleanup_demo_ba00.js
 *
 * Comptes créés:
 *   ba00.demo01@test-heds.ch ... ba00.demo10@test-heds.ch
 *   Mot de passe: Demo2026!
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
const DEMO_YEAR = '2026'
const DEMO_CLASS = 'BA00'

const STUDENTS = [
  { idx: 1,  forname: 'Lucas',  family_name: 'Martin'   },
  { idx: 2,  forname: 'Emma',   family_name: 'Bernard'  },
  { idx: 3,  forname: 'Noah',   family_name: 'Petit'    },
  { idx: 4,  forname: 'Lina',   family_name: 'Robert'   },
  { idx: 5,  forname: 'Ethan',  family_name: 'Richard'  },
  { idx: 6,  forname: 'Jade',   family_name: 'Durand'   },
  { idx: 7,  forname: 'Nathan', family_name: 'Moreau'   },
  { idx: 8,  forname: 'Chloe',  family_name: 'Simon'    },
  { idx: 9,  forname: 'Milo',   family_name: 'Laurent'  },
  { idx: 10, forname: 'Lena',   family_name: 'Michel'   },
]

async function getOrCreateAuthUser(email, forname, family_name) {
  // Vérifier si le compte existe déjà
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) throw new Error('Erreur listUsers: ' + listErr.message)

  const existing = users.find(u => u.email === email)
  if (existing) {
    console.log(`  ⚠️  Compte existant: ${email} (${existing.id})`)
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { forname, family_name }
  })
  if (error) throw new Error('Erreur createUser: ' + error.message)
  const userId = data.user.id

  // Force-confirm email in case email_confirm: true is not honored on this instance
  await supabase.auth.admin.updateUserById(userId, { email_confirm: true })

  console.log(`  ✅ Compte créé: ${email} (${userId})`)
  return userId
}

async function upsertUserProfile(userId, email, forname, family_name) {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    email,
    forname,
    family_name,
    display_name: `${forname} ${family_name}`,
    role: 'student',
    classe: DEMO_CLASS,
  }, { onConflict: 'user_id' })
  if (error) throw new Error('Erreur user_profiles: ' + error.message)
}

async function upsertStudentsPhysio(userId) {
  // Detect table name casing
  const tblQuoted = '"StudentsPhysio"'

  const { error } = await supabase.from('StudentsPhysio').upsert({
    user_id: userId,
    class: DEMO_CLASS,
    year: DEMO_YEAR,
    sae: 0,
    cas_particulier: 0,
  }, { onConflict: 'user_id,year' })

  if (error) {
    // Fallback: try integer false → 0 already used; try without sae/cas_particulier
    const { error: err2 } = await supabase.from('StudentsPhysio').upsert({
      user_id: userId,
      class: DEMO_CLASS,
      year: DEMO_YEAR,
    }, { onConflict: 'user_id,year' })
    if (err2) throw new Error('Erreur StudentsPhysio: ' + err2.message)
  }
}

async function main() {
  console.log(`\n🧪 Seed démo BA00 — ${STUDENTS.length} comptes\n`)
  console.log(`   URL:      ${SUPABASE_URL}`)
  console.log(`   Classe:   ${DEMO_CLASS}`)
  console.log(`   Année:    ${DEMO_YEAR}`)
  console.log(`   Password: ${DEMO_PASSWORD}\n`)

  const createdIds = []

  for (const student of STUDENTS) {
    const email = `ba00.demo${String(student.idx).padStart(2, '0')}@test-heds.ch`
    console.log(`[${student.idx}/10] ${student.forname} ${student.family_name} — ${email}`)
    try {
      const userId = await getOrCreateAuthUser(email, student.forname, student.family_name)
      await upsertUserProfile(userId, email, student.forname, student.family_name)
      await upsertStudentsPhysio(userId)
      createdIds.push({ email, userId })
    } catch (err) {
      console.error(`  ❌ Erreur pour ${email}: ${err.message}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ ${createdIds.length}/${STUDENTS.length} comptes prêts\n`)
  console.log('🔑 Connexion démo:')
  createdIds.forEach(({ email }) => console.log(`   ${email}  /  ${DEMO_PASSWORD}`))
  console.log('\n📌 Après la démo → node cleanup_demo_ba00.js\n')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

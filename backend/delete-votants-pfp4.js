// Script temporaire: supprime les assignations PFP4 des votants uniquement
// Garde les pré-assignés BA25 (qui n'ont pas voté)
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // Parse PFP4 voter user_ids from SQL dump
  const sql = fs.readFileSync('C:/Users/antoine.quarroz/Downloads/student_votes_rows (2).sql', 'utf8')
  const valuesStr = sql.substring(sql.indexOf('VALUES') + 6).trim().replace(/;$/, '')
  
  const rows = []
  let i = 0
  function parseRow() {
    if (valuesStr[i] !== '(') return null
    i++
    const fields = []
    let field = ''
    let inStr = false
    while (i < valuesStr.length) {
      const ch = valuesStr[i]
      if (inStr) {
        if (ch === "'" && valuesStr[i + 1] === "'") { field += "'"; i += 2; continue }
        if (ch === "'") { inStr = false; i++; continue }
        field += ch; i++
      } else {
        if (ch === "'") { inStr = true; i++; continue }
        if (ch === ',' && fields.length < 4) { fields.push(field.trim()); field = ''; i++; continue }
        if (ch === ')') { fields.push(field.trim()); i++; return fields }
        field += ch; i++
      }
    }
    return null
  }
  while (i < valuesStr.length) {
    if (valuesStr[i] === '(') {
      const r = parseRow()
      if (r) rows.push(r)
      continue
    }
    i++
  }

  const pfp4Voters = rows.filter(r => r[2] === 'PFP4' && r[3] === '2026').map(r => r[1])
  console.log(`📊 ${pfp4Voters.length} votants PFP4 2026 trouvés dans le dump`)

  // Check current PFP4 assignments
  const { data: allPfp4, error: fetchErr } = await supabaseAdmin
    .from('student_result_vote')
    .select('id, user_id, notes')
    .eq('pfp_type', 'PFP4')
    .eq('year', '2026')

  if (fetchErr) { console.error('Erreur fetch:', fetchErr.message); process.exit(1) }
  console.log(`🗃️ ${allPfp4.length} assignations PFP4 2026 dans la DB`)

  // Only delete those who are voters
  const voterSet = new Set(pfp4Voters)
  const toDelete = allPfp4.filter(a => voterSet.has(a.user_id))
  const toKeep = allPfp4.filter(a => !voterSet.has(a.user_id))

  console.log(`🗑️ ${toDelete.length} assignations à SUPPRIMER (votants)`)
  console.log(`🛡️ ${toKeep.length} assignations à GARDER (pré-assignés)`)
  
  // Show who we keep
  console.log('\nPré-assignés conservés:')
  for (const a of toKeep) {
    console.log(`  - ${a.user_id}: ${a.notes || 'N/A'}`)
  }

  if (toDelete.length === 0) {
    console.log('\nRien à supprimer.')
    process.exit(0)
  }

  // Delete
  const idsToDelete = toDelete.map(a => a.id)
  const { error: delErr } = await supabaseAdmin
    .from('student_result_vote')
    .delete()
    .in('id', idsToDelete)

  if (delErr) {
    console.error('❌ Erreur suppression:', delErr.message)
    process.exit(1)
  }

  console.log(`\n✅ ${toDelete.length} assignations PFP4 votants supprimées`)
  console.log(`🛡️ ${toKeep.length} pré-assignés conservés`)
  process.exit(0)
}

main().catch(err => { console.error('❌', err); process.exit(1) })

// Export PFP4 assignments with missing criteria per student and place criteria
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const CRIT_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

async function main() {
  // Load all data (same as PlacesAssignedView)
  const [assignRes, placesRes, profilesRes, studentsRes] = await Promise.all([
    supabaseAdmin.from('student_result_vote').select('*').eq('pfp_type', 'PFP4').eq('year', '2026'),
    supabaseAdmin.from('places').select('*'),
    supabaseAdmin.from('user_profiles').select('user_id, forname, family_name, classe'),
    supabaseAdmin.from('StudentsPhysio').select('user_id, pfp_valided')
  ])

  const assignments = assignRes.data || []
  const places = placesRes.data || []
  const profiles = profilesRes.data || []
  const students = studentsRes.data || []

  console.log(`📋 ${assignments.length} assignations PFP4 2026`)
  console.log(`🏢 ${places.length} places`)
  console.log(`👤 ${profiles.length} profils`)
  console.log(`🏥 ${students.length} StudentsPhysio`)

  // Lookups
  const placesById = new Map()
  places.forEach(p => { if (p.PlaceId) placesById.set(p.PlaceId, p) })

  const profileById = new Map()
  profiles.forEach(p => profileById.set(p.user_id, p))

  const studentById = new Map()
  students.forEach(s => studentById.set(s.user_id, s))

  // All assignments (for criteria from other PFPs)
  const allAssignRes = await supabaseAdmin.from('student_result_vote').select('user_id, pfp_type, assigned_place_id')
  const allAssignments = allAssignRes.data || []

  // Compute missing criteria per student
  const getStudentCriteria = (userId) => {
    const validated = {}
    CRIT_KEYS.forEach(c => { validated[c] = 0 })

    // From pfp_valided
    const s = studentById.get(userId)
    if (s) {
      let pv = s.pfp_valided || []
      if (typeof pv === 'string') try { pv = JSON.parse(pv) } catch { pv = [] }
      if (pv && !Array.isArray(pv)) pv = Object.values(pv)
      if (Array.isArray(pv)) {
        pv.forEach(entry => {
          const pid = entry.PlaceId || entry.ID_PFP
          if (pid) {
            const pl = placesById.get(pid)
            if (pl) CRIT_KEYS.forEach(c => { if (pl[c] === true || pl[c] === 'true' || pl[c] === 1) validated[c]++ })
          }
        })
      }
    }

    // From other PFP assignments (not PFP4)
    allAssignments.forEach(a => {
      if (a.user_id === userId && a.pfp_type !== 'PFP4' && a.assigned_place_id) {
        const pl = placesById.get(a.assigned_place_id)
        if (pl) CRIT_KEYS.forEach(c => { if (pl[c] === true || pl[c] === 'true' || pl[c] === 1) validated[c]++ })
      }
    })

    const missing = CRIT_KEYS.filter(c => validated[c] === 0)
    const validatedList = CRIT_KEYS.filter(c => validated[c] > 0)
    return { missing, validated: validatedList }
  }

  const getPlaceCriteria = (place) => {
    if (!place) return []
    return CRIT_KEYS.filter(c => place[c] === true || place[c] === 'true' || place[c] === 1)
  }

  // Build rows
  const rows = assignments.map(a => {
    const profile = profileById.get(a.user_id)
    const place = a.assigned_place_id ? placesById.get(a.assigned_place_id) : null
    const { missing, validated } = getStudentCriteria(a.user_id)
    const placeCrit = getPlaceCriteria(place)
    const coveredMissing = placeCrit.filter(c => missing.includes(c))

    const nom = profile?.family_name || ''
    const prenom = profile?.forname || ''
    const classe = profile?.classe || ''

    // Source
    const notes = (a.notes || '').toLowerCase()
    let source = 'Algorithme'
    if (notes.includes('manuel') || notes.includes('manual')) source = 'Manuel'
    else if (a.assigned_rank === 99) source = 'Hors choix'
    else if (notes.includes('restored')) source = 'Manuel (restauré)'

    return {
      'Nom': nom.toUpperCase(),
      'Prénom': prenom,
      'Classe': classe,
      'Source': source,
      'Place': a.assigned_place_name || place?.NomPlace || '',
      'Institution': a.assigned_institution_name || '',
      'Critères manquants étudiant': missing.join(', '),
      'Nb critères manquants': missing.length,
      'Critères validés par la place': placeCrit.join(', '),
      'Critères manquants couverts par la place': coveredMissing.join(', '),
      'Nb couverts': coveredMissing.length,
      'Critères déjà validés': validated.join(', '),
      'Rang': a.assigned_rank === 99 ? 'Hors choix' : (a.assigned_rank != null ? `${a.assigned_rank} crit.` : ''),
      'Statut': a.status || 'draft'
    }
  })

  // Sort by name
  rows.sort((a, b) => (a['Nom'] + a['Prénom']).localeCompare(b['Nom'] + b['Prénom']))

  // Write Excel
  const ws = XLSX.utils.json_to_sheet(rows)
  
  // Auto-width columns
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length)) + 2
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'PFP4 2026')

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const outputPath = path.resolve(__dirname, `../export-PFP4-criteres-${ts}.xlsx`)
  XLSX.writeFile(wb, outputPath)

  console.log(`\n✅ Excel généré: ${outputPath}`)
  console.log(`📊 ${rows.length} étudiants PFP4`)
  console.log(`   Manuels: ${rows.filter(r => r.Source.includes('Manuel')).length}`)
  console.log(`   Algorithme: ${rows.filter(r => r.Source === 'Algorithme').length}`)
  console.log(`   Hors choix: ${rows.filter(r => r.Source === 'Hors choix').length}`)

  process.exit(0)
}

main().catch(err => { console.error('❌', err); process.exit(1) })

/**
 * test-algo-v4.js — Simulation de l'algorithme v4.0 PFP4 avec données réelles
 * Génère un fichier Excel avec les résultats simulés
 * 
 * Usage: cd backend && npm install xlsx && node test-algo-v4.js
 */
const XLSX = require('xlsx')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY

// Client admin (service_role) pour la plupart des tables
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
})
// Client anon pour student_votes (GRANT manquant sur service_role)
const supabaseAnon = createClient(supabaseUrl, anonKey, {
  db: { schema: 'public' }
})

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
const PFP_TYPE = 'PFP4'
const YEAR = '2026'

// Helper: fetch via REST API directement si le client JS échoue
async function fetchTable(table, filters = {}) {
  const restUrl = supabaseUrl.replace(/\/$/, '') + '/rest/v1'
  let url = `${restUrl}/${table}?select=*`
  for (const [key, val] of Object.entries(filters)) {
    url += `&${key}=eq.${val}`
  }
  const resp = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    }
  })
  if (!resp.ok) throw new Error(`REST ${table}: ${resp.status} ${await resp.text()}`)
  return resp.json()
}

async function main() {
  console.log('🚀 Test Algo v4.0 — PFP4 2026\n')

  // ── 1. Charger les votes PFP4 via le client anon (frontend .env) ──
  // Le service_role n'a pas le GRANT sur student_votes, mais le client anon
  // y accède via RLS. On essaie les deux.
  let votes

  // Utiliser le client anon pour student_votes (service_role n'a pas le GRANT)
  const { data: votesData, error: votesErr } = await supabaseAnon
    .from('student_votes').select('*').eq('pfp_type', PFP_TYPE).eq('year', YEAR)

  if (votesErr) {
    console.error('❌ Impossible de lire student_votes:', votesErr.message)
    return
  }
  votes = votesData
  if (!votes || votes.length === 0) { console.error('❌ Aucun vote PFP4 2026 trouvé'); return }
  console.log(`📊 ${votes.length} votes PFP4 2026 chargés`)

  // ── 2. Charger les profils étudiants (user_profiles) ──
  const { data: profiles, error: profErr } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, email, forname, family_name, display_name, classe')

  if (profErr) { console.error('❌ Profiles:', profErr.message); return }
  const profileMap = new Map()
  profiles.forEach(p => profileMap.set(p.user_id, p))
  console.log(`👤 ${profiles.length} profils chargés`)

  // ── 3. Charger StudentsPhysio (critères validés + pfp_valided) ──
  const { data: physioData, error: physioErr } = await supabaseAdmin
    .from('StudentsPhysio')
    .select('user_id, pfp_valided, sae, cas_particulier')

  if (physioErr) { console.error('❌ Physio:', physioErr.message); return }
  console.log(`🏥 ${physioData.length} StudentsPhysio chargés`)

  // ── 4. Charger student_result_vote (assignations existantes) ──
  const { data: existingAssignments, error: assignErr } = await supabaseAdmin
    .from('student_result_vote')
    .select('user_id, pfp_type, assigned_place_id, pfp_validee')

  if (assignErr) { console.error('❌ Assignments:', assignErr.message); return }
  console.log(`📋 ${existingAssignments.length} assignations existantes`)

  // ── 5. Charger les places ──
  const { data: allPlaces, error: placesErr } = await supabaseAdmin
    .from('places')
    .select('*')

  if (placesErr) { console.error('❌ Places:', placesErr.message); return }
  console.log(`🏢 ${allPlaces.length} places chargées`)

  // ── 6. Charger les institutions ──
  const { data: institutions, error: instErr } = await supabaseAdmin
    .from('institutions')
    .select('InstitutionId, Name')

  if (instErr) { console.error('❌ Institutions:', instErr.message); return }
  const instMap = new Map()
  institutions.forEach(i => instMap.set(i.InstitutionId, i.Name))

  // ══════════════════════════════════════════════════════════════
  // CONSTRUIRE LES DONNÉES COMME LE FRONTEND LE FAIT
  // ══════════════════════════════════════════════════════════════

  const placesLookup = new Map()
  allPlaces.forEach(p => placesLookup.set(p.PlaceId, p))

  // Construire critères validés + donePlaceIds par étudiant
  const studentCriteriaMap = new Map()
  const studentDonePlaceIds = new Map()

  // Source 1: pfp_valided
  physioData.forEach(physio => {
    const validatedCriteria = {}
    CRITERIA_KEYS.forEach(k => { validatedCriteria[k] = 0 })
    const donePlaces = new Set()

    let pfpArray = []
    if (physio.pfp_valided) {
      try {
        pfpArray = typeof physio.pfp_valided === 'string' ? JSON.parse(physio.pfp_valided) : physio.pfp_valided
        if (!Array.isArray(pfpArray)) pfpArray = Object.values(pfpArray)
      } catch { pfpArray = [] }
    }

    pfpArray.forEach(stage => {
      CRITERIA_KEYS.forEach(c => {
        if (stage[c] === true || stage[c] === 'true' || stage[c] === 1 || (stage[c.toLowerCase()] === true)) {
          validatedCriteria[c]++
        }
      })
      const placeId = stage.PlaceId || stage.ID_PFP || stage.id_pfp
      if (placeId) donePlaces.add(placeId)
    })

    studentCriteriaMap.set(physio.user_id, {
      criteria: validatedCriteria,
      sae: !!physio.sae,
      casParticulier: !!physio.cas_particulier,
      stagesCount: pfpArray.length
    })
    studentDonePlaceIds.set(physio.user_id, donePlaces)
  })

  // Source 2: student_result_vote
  existingAssignments.forEach(a => {
    if (a.assigned_place_id) {
      if (!studentDonePlaceIds.has(a.user_id)) studentDonePlaceIds.set(a.user_id, new Set())
      studentDonePlaceIds.get(a.user_id).add(a.assigned_place_id)
    }
    if (a.pfp_validee && a.assigned_place_id) {
      const placeInfo = placesLookup.get(a.assigned_place_id)
      if (placeInfo) {
        const existing = studentCriteriaMap.get(a.user_id) || {
          criteria: Object.fromEntries(CRITERIA_KEYS.map(k => [k, 0])),
          sae: false, casParticulier: false, stagesCount: 0
        }
        CRITERIA_KEYS.forEach(c => {
          if (placeInfo[c] === true || placeInfo[c] === 'true' || placeInfo[c] === 1) {
            existing.criteria[c]++
          }
        })
        studentCriteriaMap.set(a.user_id, existing)
      }
    }
  })

  // Étudiants déjà assignés PFP4
  const alreadyAssignedPFP4 = new Set()
  const alreadyAssignedPlaceCounts = new Map()
  existingAssignments
    .filter(a => a.pfp_type === PFP_TYPE && a.assigned_place_id)
    .forEach(a => {
      alreadyAssignedPFP4.add(a.user_id)
      alreadyAssignedPlaceCounts.set(a.assigned_place_id, (alreadyAssignedPlaceCounts.get(a.assigned_place_id) || 0) + 1)
    })

  console.log(`\n🛡️ ${alreadyAssignedPFP4.size} étudiants déjà assignés PFP4 (exclus)`)

  // Priority score (même calcul que le frontend)
  const computePriorityScore = (userId) => {
    const profile = studentCriteriaMap.get(userId)
    if (!profile) return Math.round(Math.random() * 100) / 100

    const missingCriteria = CRITERIA_KEYS.filter(c => profile.criteria[c] === 0)
    const missingCount = missingCriteria.length
    const missingGlobalScore = (missingCount / CRITERIA_KEYS.length) * 40
    const bonusDE = profile.criteria.DE === 0 ? 15 : 0
    const bonusSYSINT = profile.criteria.SYSINT === 0 ? 10 : 0
    const bonusSae = profile.sae ? 12 : 0
    const bonusCas = profile.casParticulier ? 8 : 0
    const pfpMultiplier = 1.15 // PFP4
    const tiebreaker = Math.random() * 1
    const rawScore = missingGlobalScore + bonusDE + bonusSYSINT + bonusSae + bonusCas + tiebreaker
    return Math.round(rawScore * pfpMultiplier * 100) / 100
  }

  // Filtrer votes éligibles
  const eligibleVotes = votes.filter(v => {
    const choices = v.choices || []
    if (choices.length === 0) return false
    if (alreadyAssignedPFP4.has(v.user_id)) return false
    return true
  })

  console.log(`📊 ${votes.length} votes → ${eligibleVotes.length} éligibles`)

  // Préparer les étudiants
  const students = eligibleVotes.map(v => {
    const profile = studentCriteriaMap.get(v.user_id)
    const missing = profile ? CRITERIA_KEYS.filter(c => profile.criteria[c] === 0) : [...CRITERIA_KEYS]
    const donePlaces = studentDonePlaceIds.get(v.user_id)
    const choices = (v.choices || []).map(c => c.placeId).filter(Boolean)
    const userProfile = profileMap.get(v.user_id)

    return {
      userId: v.user_id,
      nom: userProfile?.family_name || 'N/A',
      prenom: userProfile?.forname || 'N/A',
      classe: userProfile?.classe || 'N/A',
      choices,
      missingCriteria: missing,
      donePlaceIds: donePlaces ? [...donePlaces] : [],
      priorityScore: computePriorityScore(v.user_id)
    }
  })

  // Préparer les places PFP4
  const places = allPlaces
    .map(place => {
      let capacity = 0
      if (place[PFP_TYPE] && place[PFP_TYPE][YEAR]) {
        capacity = parseInt(place[PFP_TYPE][YEAR])
      }
      if (!capacity || isNaN(capacity) || capacity < 1) return null

      const alreadyAssigned = alreadyAssignedPlaceCounts.get(place.PlaceId) || 0
      const remainingCapacity = capacity - alreadyAssigned
      if (remainingCapacity < 1) return null

      const placeCriteria = {}
      CRITERIA_KEYS.forEach(c => {
        placeCriteria[c] = !!(place[c] === true || place[c] === 'true' || place[c] === 1)
      })

      return {
        PlaceId: place.PlaceId,
        NomPlace: place.NomPlace,
        InstitutionName: instMap.get(place.InstitutionId) || 'Inconnu',
        Capacity: remainingCapacity,
        criteria: placeCriteria,
        criteriaCovered: CRITERIA_KEYS.filter(c => placeCriteria[c])
      }
    })
    .filter(Boolean)

  console.log(`🏢 ${places.length} places PFP4 avec capacité restante`)

  // ══════════════════════════════════════════════════════════════
  // ALGORITHME v4.0 (identique au backend)
  // ══════════════════════════════════════════════════════════════

  const placesMap = new Map()
  places.forEach(p => {
    placesMap.set(p.PlaceId, { ...p, remainingCapacity: p.Capacity, assignedStudents: [], voteCount: 0 })
  })

  const computeCriteriaCovered = (studentMissing, placeCrit) => {
    if (!studentMissing || !placeCrit) return 0
    return placeCrit.filter(c => studentMissing.includes(c)).length
  }

  // Popularité
  students.forEach(student => {
    const donePlaces = new Set(student.donePlaceIds)
    student.choices.forEach(placeId => {
      if (donePlaces.has(placeId)) return
      const p = placesMap.get(placeId)
      if (p) p.voteCount++
    })
  })

  const sortedPlaces = Array.from(placesMap.values()).sort((a, b) => a.voteCount - b.voteCount)

  const results = []
  const assignedStudents = new Set()

  // ÉTAPE 2: Attribution par places
  for (const placeData of sortedPlaces) {
    if (placeData.remainingCapacity <= 0) continue

    const candidates = []
    students.forEach(student => {
      if (assignedStudents.has(student.userId)) return
      const donePlaces = new Set(student.donePlaceIds)
      if (student.choices.includes(placeData.PlaceId) && !donePlaces.has(placeData.PlaceId)) {
        candidates.push({
          student,
          criteriaCovered: computeCriteriaCovered(student.missingCriteria, placeData.criteriaCovered),
          priorityScore: student.priorityScore
        })
      }
    })
    if (candidates.length === 0) continue

    candidates.sort((a, b) => {
      if (a.criteriaCovered !== b.criteriaCovered) return b.criteriaCovered - a.criteriaCovered
      if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore
      return Math.random() - 0.5
    })

    const toAssign = Math.min(candidates.length, placeData.remainingCapacity)
    for (let i = 0; i < toAssign; i++) {
      const c = candidates[i]
      assignedStudents.add(c.student.userId)
      placeData.remainingCapacity--
      placeData.assignedStudents.push(c.student.userId)

      const coveredList = placeData.criteriaCovered.filter(cr => c.student.missingCriteria.includes(cr))
      results.push({
        userId: c.student.userId,
        nom: c.student.nom,
        prenom: c.student.prenom,
        classe: c.student.classe,
        placeName: placeData.NomPlace,
        institutionName: placeData.InstitutionName,
        source: 'Choix',
        criteriaCovered: c.criteriaCovered,
        criteresCouvertsDetail: coveredList.join(', '),
        criteresManquants: c.student.missingCriteria.join(', '),
        priorityScore: c.priorityScore,
        nbChoix: c.student.choices.length,
        donePlaces: c.student.donePlaceIds.length,
        placeCriteres: placeData.criteriaCovered.join(', ')
      })
    }
  }

  // ÉTAPE 3: Attribution restants
  const remaining = students.filter(s => !assignedStudents.has(s.userId))
  for (const student of remaining) {
    const donePlaces = new Set(student.donePlaceIds)
    const available = Array.from(placesMap.values())
      .filter(p => p.remainingCapacity > 0 && !donePlaces.has(p.PlaceId))
      .map(p => ({ place: p, critCovered: computeCriteriaCovered(student.missingCriteria, p.criteriaCovered) }))
      .sort((a, b) => b.critCovered - a.critCovered || Math.random() - 0.5)

    const best = available[0]
    if (best) {
      assignedStudents.add(student.userId)
      best.place.remainingCapacity--
      best.place.assignedStudents.push(student.userId)

      const coveredList = best.place.criteriaCovered.filter(c => student.missingCriteria.includes(c))
      results.push({
        userId: student.userId,
        nom: student.nom,
        prenom: student.prenom,
        classe: student.classe,
        placeName: best.place.NomPlace,
        institutionName: best.place.InstitutionName,
        source: 'Hors choix',
        criteriaCovered: best.critCovered,
        criteresCouvertsDetail: coveredList.join(', '),
        criteresManquants: student.missingCriteria.join(', '),
        priorityScore: student.priorityScore,
        nbChoix: student.choices.length,
        donePlaces: student.donePlaceIds.length,
        placeCriteres: best.place.criteriaCovered.join(', ')
      })
    }
  }

  // ══════════════════════════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════════════════════════
  const fromChoices = results.filter(r => r.source === 'Choix')
  const fromRandom = results.filter(r => r.source === 'Hors choix')
  const leses = results.filter(r => r.criteriaCovered === 0)
  const unassigned = students.filter(s => !assignedStudents.has(s.userId))

  console.log('\n══════════════════════════════════════════════')
  console.log('📊 RÉSULTATS ALGO v4.0 — SIMULATION')
  console.log('══════════════════════════════════════════════')
  console.log(`   Étudiants éligibles: ${students.length}`)
  console.log(`   Assignés depuis choix: ${fromChoices.length}`)
  console.log(`   Assignés hors choix: ${fromRandom.length}`)
  console.log(`   Non assignés: ${unassigned.length}`)
  console.log(`   Lésés (0 critères couverts): ${leses.length}`)
  if (fromChoices.length > 0) {
    const avg = fromChoices.reduce((s, r) => s + r.criteriaCovered, 0) / fromChoices.length
    console.log(`   Moy. critères couverts (choix): ${avg.toFixed(2)}`)
  }
  console.log('══════════════════════════════════════════════')

  // ══════════════════════════════════════════════════════════════
  // GÉNÉRER L'EXCEL
  // ══════════════════════════════════════════════════════════════

  // Sheet 1: Résultats par étudiant
  const sheet1 = results.map(r => ({
    'Nom': r.nom,
    'Prénom': r.prenom,
    'Classe': r.classe,
    'Place attribuée': r.placeName,
    'Institution': r.institutionName,
    'Source': r.source,
    'Critères couverts': r.criteriaCovered,
    'Critères couverts (détail)': r.criteresCouvertsDetail,
    'Critères manquants': r.criteresManquants,
    'Critères de la place': r.placeCriteres,
    'Priority Score': r.priorityScore,
    'Nb choix faits': r.nbChoix,
    'Nb places déjà faites': r.donePlaces
  }))

  // Sheet 2: Statistiques
  const sheet2 = [
    { 'Métrique': 'Étudiants éligibles', 'Valeur': students.length },
    { 'Métrique': 'Assignés depuis choix', 'Valeur': fromChoices.length },
    { 'Métrique': 'Assignés hors choix', 'Valeur': fromRandom.length },
    { 'Métrique': 'Non assignés', 'Valeur': unassigned.length },
    { 'Métrique': 'Lésés (0 critères)', 'Valeur': leses.length },
    { 'Métrique': 'Moy. critères couverts (choix)', 'Valeur': fromChoices.length > 0 ? (fromChoices.reduce((s, r) => s + r.criteriaCovered, 0) / fromChoices.length).toFixed(2) : 0 },
    { 'Métrique': 'Moy. critères couverts (total)', 'Valeur': results.length > 0 ? (results.reduce((s, r) => s + r.criteriaCovered, 0) / results.length).toFixed(2) : 0 }
  ]

  // Sheet 3: Places utilisées
  const placesUsed = Array.from(placesMap.values())
    .filter(p => p.assignedStudents.length > 0)
    .sort((a, b) => b.assignedStudents.length - a.assignedStudents.length)
    .map(p => ({
      'Place': p.NomPlace,
      'Institution': p.InstitutionName,
      'Capacité initiale': p.Capacity,
      'Étudiants assignés': p.assignedStudents.length,
      'Places restantes': p.remainingCapacity,
      'Critères': p.criteriaCovered.join(', '),
      'Popularité (votes)': p.voteCount
    }))

  // Sheet 4: Lésés détaillés
  const sheet4 = leses.map(r => ({
    'Nom': r.nom,
    'Prénom': r.prenom,
    'Classe': r.classe,
    'Place attribuée': r.placeName,
    'Institution': r.institutionName,
    'Source': r.source,
    'Critères manquants': r.criteresManquants,
    'Critères de la place': r.placeCriteres,
    'Priority Score': r.priorityScore
  }))

  // Écrire le fichier
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet1), 'Résultats')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet2), 'Statistiques')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(placesUsed), 'Places utilisées')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet4.length > 0 ? sheet4 : [{ 'Info': 'Aucun lésé 🎉' }]), 'Lésés')

  // Sheet 5: Non assignés
  if (unassigned.length > 0) {
    const sheet5 = unassigned.map(s => ({
      'Nom': s.nom,
      'Prénom': s.prenom,
      'Classe': s.classe,
      'Critères manquants': s.missingCriteria.join(', '),
      'Nb choix': s.choices.length,
      'Nb places déjà faites': s.donePlaceIds.length,
      'Priority Score': s.priorityScore
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet5), 'Non assignés')
  }

  const outputPath = path.resolve(__dirname, `../test-algo-v4-PFP4-${YEAR}.xlsx`)
  XLSX.writeFile(wb, outputPath)

  console.log(`\n✅ Excel généré: ${outputPath}`)
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})

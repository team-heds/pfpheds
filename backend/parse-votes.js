/**
 * parse-votes.js — Parse le SQL dump de student_votes et extrait les PFP4
 * Puis charge les données réelles depuis Supabase et génère l'Excel
 */
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
const PFP_TYPE = 'PFP4'
const YEAR = '2026'

// ── Parse SQL dump ──
function parseSQLDump(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8')
  
  // Split by '), (' pattern to get individual rows
  // First remove the INSERT INTO ... VALUES prefix
  const valuesStart = sql.indexOf("VALUES ")
  if (valuesStart === -1) { console.error('No VALUES found'); return [] }
  
  let valuesStr = sql.substring(valuesStart + 7).trim()
  // Remove trailing semicolon/closing paren
  if (valuesStr.endsWith(';')) valuesStr = valuesStr.slice(0, -1)
  
  // Parse each row manually - track parenthesis depth and quotes
  const rows = []
  let inQuote = false
  let escaped = false
  let depth = 0
  let rowStart = -1
  
  for (let i = 0; i < valuesStr.length; i++) {
    const ch = valuesStr[i]
    
    if (escaped) { escaped = false; continue }
    
    if (ch === "'" && !escaped) {
      // Check for escaped quote ''
      if (i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
        escaped = true
        continue
      }
      inQuote = !inQuote
      continue
    }
    
    if (inQuote) continue
    
    if (ch === '(') {
      if (depth === 0) rowStart = i + 1
      depth++
    } else if (ch === ')') {
      depth--
      if (depth === 0 && rowStart >= 0) {
        rows.push(valuesStr.substring(rowStart, i))
        rowStart = -1
      }
    }
  }
  
  console.log(`📄 ${rows.length} total rows parsed from SQL`)
  
  // Parse each row to extract fields
  const pfp4Votes = []
  for (const row of rows) {
    // Extract fields: id, user_id, pfp_type, year, choices (JSON), created_at, updated_at
    // Fields are separated by ', ' but choices contains commas inside JSON
    // Strategy: find the pfp_type field first
    
    // Find all quoted strings
    const fields = []
    let inQ = false
    let esc = false
    let fieldStart = -1
    
    for (let i = 0; i < row.length; i++) {
      const c = row[i]
      if (esc) { esc = false; continue }
      if (c === "'" && !esc) {
        if (i + 1 < row.length && row[i + 1] === "'") { esc = true; continue }
        if (!inQ) { fieldStart = i + 1; inQ = true }
        else { fields.push(row.substring(fieldStart, i).replace(/''/g, "'")); inQ = false }
      }
    }
    
    // fields: [id, user_id, pfp_type, year, choices_json, created_at, updated_at]
    if (fields.length < 5) continue
    if (fields[2] !== PFP_TYPE) continue
    if (fields[3] !== YEAR) continue
    
    try {
      const choices = JSON.parse(fields[4])
      pfp4Votes.push({
        user_id: fields[1],
        pfp_type: fields[2],
        year: fields[3],
        choices
      })
    } catch (e) {
      console.warn(`⚠️ JSON parse error for user ${fields[1]}:`, e.message)
    }
  }
  
  return pfp4Votes
}

async function main() {
  console.log('🚀 Test Algo v4.0 — PFP4 2026 (données réelles)\n')
  
  // ── 1. Parse votes from SQL dump ──
  const sqlPath = path.resolve('C:/Users/antoine.quarroz/Downloads/student_votes_rows (2).sql')
  const votes = parseSQLDump(sqlPath)
  console.log(`📊 ${votes.length} votes PFP4 2026 extraits du dump SQL`)
  
  if (votes.length === 0) { console.error('❌ Aucun vote PFP4'); return }
  
  // ── 2. Load profiles ──
  const { data: profiles, error: profErr } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, email, forname, family_name, display_name, classe')
  if (profErr) { console.error('❌ Profiles:', profErr.message); return }
  const profileMap = new Map()
  profiles.forEach(p => profileMap.set(p.user_id, p))
  console.log(`👤 ${profiles.length} profils chargés`)
  
  // ── 3. Load StudentsPhysio ──
  const { data: physioData, error: physioErr } = await supabaseAdmin
    .from('StudentsPhysio')
    .select('user_id, pfp_valided, sae, cas_particulier')
  if (physioErr) { console.error('❌ Physio:', physioErr.message); return }
  console.log(`🏥 ${physioData.length} StudentsPhysio chargés`)
  
  // ── 4. Load existing assignments ──
  const { data: existingAssignments, error: assignErr } = await supabaseAdmin
    .from('student_result_vote')
    .select('user_id, pfp_type, assigned_place_id, pfp_validee')
  if (assignErr) { console.error('❌ Assignments:', assignErr.message); return }
  console.log(`📋 ${existingAssignments.length} assignations existantes`)
  
  // ── 5. Load places ──
  const { data: allPlaces, error: placesErr } = await supabaseAdmin
    .from('places')
    .select('*')
  if (placesErr) { console.error('❌ Places:', placesErr.message); return }
  console.log(`🏢 ${allPlaces.length} places chargées`)
  
  // ── 6. Load institutions ──
  const { data: institutions, error: instErr } = await supabaseAdmin
    .from('institutions')
    .select('InstitutionId, Name')
  if (instErr) { console.error('❌ Institutions:', instErr.message); return }
  const instMap = new Map()
  institutions.forEach(i => instMap.set(i.InstitutionId, i.Name))
  
  // ══════════════════════════════════════════════════════════════
  // BUILD STUDENT DATA (same logic as frontend)
  // ══════════════════════════════════════════════════════════════
  
  const placesLookup = new Map()
  allPlaces.forEach(p => placesLookup.set(p.PlaceId, p))
  
  // Build validated criteria + donePlaceIds per student
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
        const key = c
        if (stage[key] === true || stage[key] === 'true' || stage[key] === 1) {
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
  
  // Source 2: student_result_vote (places already assigned via algo or manual)
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
  
  // ── SIMULATION À BLANC : ignorer TOUTES les assignations PFP4 manuelles ──
  // Ni les étudiants ni les places ne sont exclus (on simule un tirage from scratch)
  // Sur la plateforme, les assignations manuelles seront supprimées avant le tirage réel
  const pfp4ManualCount = existingAssignments.filter(a => a.pfp_type === PFP_TYPE).length
  const alreadyAssignedPFP4 = new Map() // vide
  const alreadyAssignedPlaceCounts = new Map() // vide
  
  console.log(`\n🔄 SIMULATION À BLANC — ${pfp4ManualCount} assignations PFP4 manuelles IGNORÉES (étudiants + places)`)
  
  // Priority score
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
    const tiebreaker = Math.random()
    const rawScore = missingGlobalScore + bonusDE + bonusSYSINT + bonusSae + bonusCas + tiebreaker
    return Math.round(rawScore * 1.15 * 100) / 100
  }
  
  // Simulation à blanc : tous les votants participent
  const eligibleVotes = votes
  console.log(`📊 ${votes.length} votes → ${eligibleVotes.length} éligibles (simulation à blanc)`)
  
  // Prepare students
  const students = eligibleVotes.map(v => {
    const profile = studentCriteriaMap.get(v.user_id)
    const missing = profile ? CRITERIA_KEYS.filter(c => profile.criteria[c] === 0) : [...CRITERIA_KEYS]
    const donePlaces = studentDonePlaceIds.get(v.user_id)
    const choices = (v.choices || []).map(c => c.placeId).filter(Boolean)
    const userProfile = profileMap.get(v.user_id)
    const validated = profile ? CRITERIA_KEYS.filter(c => profile.criteria[c] > 0) : []
    
    return {
      userId: v.user_id,
      nom: userProfile?.family_name || 'N/A',
      prenom: userProfile?.forname || 'N/A',
      classe: userProfile?.classe || 'N/A',
      choices,
      missingCriteria: missing,
      donePlaceIds: donePlaces ? [...donePlaces] : [],
      priorityScore: computePriorityScore(v.user_id),
      _validated: validated,
      _sae: profile?.sae || false,
      _casParticulier: profile?.casParticulier || false
    }
  })
  
  // ── Préparer les places PFP4 : UNIQUEMENT les places votées (= ouvertes pour cette votation) ──
  // Extraire tous les PlaceIds distincts présents dans les votes PFP4
  const votedPlaceIds = new Set()
  votes.forEach(v => v.choices.forEach(c => { if (c.placeId) votedPlaceIds.add(c.placeId) }))
  console.log(`\n🔍 ${votedPlaceIds.size} places distinctes dans les votes PFP4 (= places ouvertes)`)
  
  const pfp4Places = []
  votedPlaceIds.forEach(pid => {
    const place = placesLookup.get(pid)
    if (!place) { console.warn(`  ⚠️ Place ${pid} votée mais absente de la table places`); return }
    
    // Capacité: pfp4_proposition EN PRIORITÉ (= places proposées pour le tirage)
    // Fallback sur PFP4 (offre) seulement si proposition absente
    let capacity = 0
    if (place.pfp4_proposition) {
      if (typeof place.pfp4_proposition === 'object' && place.pfp4_proposition[YEAR]) {
        capacity = parseInt(place.pfp4_proposition[YEAR])
      } else if (typeof place.pfp4_proposition === 'number') {
        capacity = place.pfp4_proposition
      }
    }
    if (!capacity && place.PFP4) {
      if (typeof place.PFP4 === 'object' && place.PFP4[YEAR]) capacity = parseInt(place.PFP4[YEAR])
      else if (typeof place.PFP4 === 'number') capacity = place.PFP4
      else if (typeof place.PFP4 === 'string') capacity = parseInt(place.PFP4)
    }
    if (!capacity || isNaN(capacity) || capacity < 1) {
      console.log(`  ⚠️ ${place.NomPlace} — capacité proposition=0, ignorée`)
      return
    }
    
    const alreadyAssigned = alreadyAssignedPlaceCounts.get(pid) || 0
    const remainingCapacity = capacity - alreadyAssigned
    if (remainingCapacity < 1) {
      console.log(`  ℹ️ ${place.NomPlace} — pleine (${alreadyAssigned}/${capacity} déjà assignés)`)
      return
    }
    
    const placeCriteria = {}
    CRITERIA_KEYS.forEach(c => {
      placeCriteria[c] = !!(place[c] === true || place[c] === 'true' || place[c] === 1)
    })
    
    pfp4Places.push({
      PlaceId: pid,
      NomPlace: place.NomPlace || 'Inconnu',
      InstitutionId: place.InstitutionId,
      InstitutionName: instMap.get(place.InstitutionId) || 'Inconnu',
      Capacity: capacity,
      RemainingCapacity: remainingCapacity,
      AlreadyAssigned: alreadyAssigned,
      criteria: placeCriteria,
      criteriaCovered: CRITERIA_KEYS.filter(c => placeCriteria[c])
    })
  })
  
  console.log(`🏢 ${pfp4Places.length} places PFP4 ouvertes avec capacité restante (total: ${pfp4Places.reduce((s, p) => s + p.RemainingCapacity, 0)} places)`)
  
  if (pfp4Places.length === 0) {
    console.error('❌ Aucune place PFP4 disponible')
    return
  }
  
  // ══════════════════════════════════════════════════════════════
  // ALGO v4.0
  // ══════════════════════════════════════════════════════════════
  
  const placesMap = new Map()
  pfp4Places.forEach(p => {
    placesMap.set(p.PlaceId, { ...p, remainingCapacity: p.RemainingCapacity, assignedStudents: [], voteCount: 0 })
  })
  
  const computeCriteriaCovered = (studentMissing, placeCrit) => {
    if (!studentMissing || !placeCrit) return 0
    return placeCrit.filter(c => studentMissing.includes(c)).length
  }
  
  const results = []
  const assignedStudents = new Set()
  
  // Popularity
  students.forEach(student => {
    const donePlaces = new Set(student.donePlaceIds)
    student.choices.forEach(placeId => {
      if (donePlaces.has(placeId)) return
      const p = placesMap.get(placeId)
      if (p) p.voteCount++
    })
  })
  
  const sortedPlaces = Array.from(placesMap.values()).sort((a, b) => a.voteCount - b.voteCount)
  
  // STEP 2: Assign by place (least popular first)
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
        ...c.student,
        placeName: placeData.NomPlace,
        placeId: placeData.PlaceId,
        institutionName: placeData.InstitutionName,
        source: 'Choix',
        criteriaCovered: c.criteriaCovered,
        criteresCouvertsDetail: coveredList.join(', '),
        placeCriteres: placeData.criteriaCovered.join(', '),
        placePopularite: placeData.voteCount
      })
    }
  }
  
  // STEP 3: Random assignment (optimize criteria)
  const remaining = students.filter(s => !assignedStudents.has(s.userId))
  console.log(`\n🎲 ${remaining.length} étudiants restants pour attribution hors-choix`)
  
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
        ...student,
        placeName: best.place.NomPlace,
        placeId: best.place.PlaceId,
        institutionName: best.place.InstitutionName,
        source: 'Hors choix',
        criteriaCovered: best.critCovered,
        criteresCouvertsDetail: coveredList.join(', '),
        placeCriteres: best.place.criteriaCovered.join(', '),
        placePopularite: best.place.voteCount
      })
    } else {
      results.push({
        ...student,
        placeName: '❌ AUCUNE PLACE DISPO',
        placeId: '',
        institutionName: '',
        source: 'Non assigné',
        criteriaCovered: 0,
        criteresCouvertsDetail: '',
        placeCriteres: '',
        placePopularite: 0
      })
    }
  }
  
  // ══════════════════════════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════════════════════════
  const fromChoices = results.filter(r => r.source === 'Choix')
  const fromRandom = results.filter(r => r.source === 'Hors choix')
  const unassigned = results.filter(r => r.source === 'Non assigné')
  const leses = results.filter(r => r.source === 'Hors choix')
  
  console.log('\n══════════════════════════════════════════════')
  console.log('📊 RÉSULTATS ALGO v4.0 — DONNÉES RÉELLES')
  console.log('══════════════════════════════════════════════')
  console.log(`   Votes PFP4 total: ${votes.length}`)
  console.log(`   Déjà assignés (exclus): ${alreadyAssignedPFP4.size}`)
  console.log(`   Étudiants éligibles: ${students.length}`)
  console.log(`   ✅ Assignés depuis choix: ${fromChoices.length}`)
  console.log(`   🎲 Assignés hors choix: ${fromRandom.length}`)
  console.log(`   ❌ Non assignés: ${unassigned.length}`)
  console.log(`   ⚠️ Lésés (0 critères): ${leses.length}`)
  if (fromChoices.length > 0) {
    const avg = fromChoices.reduce((s, r) => s + r.criteriaCovered, 0) / fromChoices.length
    console.log(`   📈 Moy. critères couverts (choix): ${avg.toFixed(2)}`)
  }
  if (results.filter(r => r.source !== 'Non assigné').length > 0) {
    const assigned = results.filter(r => r.source !== 'Non assigné')
    const avgAll = assigned.reduce((s, r) => s + r.criteriaCovered, 0) / assigned.length
    console.log(`   📈 Moy. critères couverts (total): ${avgAll.toFixed(2)}`)
  }
  console.log('══════════════════════════════════════════════')
  
  // ══════════════════════════════════════════════════════════════
  // EXCEL
  // ══════════════════════════════════════════════════════════════
  const wb = XLSX.utils.book_new()
  
  // Sheet 1: Résultats algo
  const s1 = results
    .sort((a, b) => a.nom.localeCompare(b.nom) || a.prenom.localeCompare(b.prenom))
    .map(r => ({
      'Nom': r.nom,
      'Prénom': r.prenom,
      'Classe': r.classe,
      'Place attribuée': r.placeName,
      'Institution': r.institutionName,
      'Source': r.source,
      'Nb critères couverts': r.criteriaCovered,
      'Critères couverts (détail)': r.criteresCouvertsDetail,
      'Critères manquants': r.missingCriteria.join(', '),
      'Critères validés': r._validated.join(', '),
      'Critères de la place': r.placeCriteres,
      'Priority Score': r.priorityScore,
      'SAE': r._sae ? 'Oui' : 'Non',
      'Cas particulier': r._casParticulier ? 'Oui' : 'Non',
      'Nb choix': r.choices.length,
      'Places déjà faites': r.donePlaceIds.length,
      'Popularité place': r.placePopularite
    }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1), 'Résultats Algo')
  
  // Sheet 2: Déjà assignés PFP4
  const s2rows = []
  alreadyAssignedPFP4.forEach((a, userId) => {
    const prof = profileMap.get(userId)
    const place = placesLookup.get(a.assigned_place_id)
    s2rows.push({
      'Nom': prof?.family_name || 'N/A',
      'Prénom': prof?.forname || 'N/A',
      'Classe': prof?.classe || 'N/A',
      'Place assignée': place?.NomPlace || a.assigned_place_id,
      'Institution': instMap.get(place?.InstitutionId) || 'N/A',
      'Source': 'Pré-assigné (exclu de l\'algo)'
    })
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2rows.length > 0 ? s2rows : [{ Info: 'Aucun pré-assigné' }]), 'Déjà assignés')
  
  // Sheet 3: Stats
  const s3 = [
    { 'Métrique': 'Votes PFP4 total', 'Valeur': votes.length },
    { 'Métrique': 'Déjà assignés (exclus)', 'Valeur': alreadyAssignedPFP4.size },
    { 'Métrique': 'Étudiants éligibles', 'Valeur': students.length },
    { 'Métrique': 'Places PFP4 disponibles', 'Valeur': pfp4Places.length },
    { 'Métrique': 'Capacité restante totale', 'Valeur': pfp4Places.reduce((s, p) => s + p.RemainingCapacity, 0) },
    { 'Métrique': 'Assignés depuis choix', 'Valeur': fromChoices.length },
    { 'Métrique': 'Assignés hors choix', 'Valeur': fromRandom.length },
    { 'Métrique': 'Non assignés', 'Valeur': unassigned.length },
    { 'Métrique': 'Lésés (0 critères)', 'Valeur': leses.length },
    { 'Métrique': 'Moy. critères (choix)', 'Valeur': fromChoices.length > 0 ? (fromChoices.reduce((s, r) => s + r.criteriaCovered, 0) / fromChoices.length).toFixed(2) : 'N/A' },
    { 'Métrique': '% depuis choix', 'Valeur': students.length > 0 ? Math.round(fromChoices.length / students.length * 100) + '%' : 'N/A' },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s3), 'Statistiques')
  
  // Sheet 4: Places
  const s4 = Array.from(placesMap.values())
    .sort((a, b) => b.voteCount - a.voteCount)
    .map(p => ({
      'Place': p.NomPlace,
      'Institution': p.InstitutionName,
      'Capacité totale': p.Capacity,
      'Déjà pris (pré-assignés)': p.AlreadyAssigned || 0,
      'Capacité restante (avant algo)': p.RemainingCapacity,
      'Assignés par algo': p.assignedStudents.length,
      'Places encore libres': p.remainingCapacity,
      'Critères': p.criteriaCovered.join(', '),
      'Popularité (votes)': p.voteCount
    }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s4), 'Places')
  
  // Sheet 5: Lésés
  const s5 = leses.length > 0 ? leses.map(r => ({
    'Nom': r.nom,
    'Prénom': r.prenom,
    'Place': r.placeName,
    'Source': r.source,
    'Critères manquants': r.missingCriteria.join(', '),
    'Critères place': r.placeCriteres,
    'Score': r.priorityScore
  })) : [{ 'Info': 'Aucun lésé 🎉' }]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s5), 'Lésés')
  
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const outputPath = path.resolve(__dirname, `../test-algo-v4-PFP4-${ts}.xlsx`)
  XLSX.writeFile(wb, outputPath)
  
  console.log(`\n✅ Excel généré: ${outputPath}`)
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})

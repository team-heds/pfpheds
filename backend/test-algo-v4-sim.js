/**
 * test-algo-v4-sim.js — Simulation algo v4.0 PFP4 avec données réalistes
 * Pas besoin de connexion Supabase — données générées localement
 * 
 * Usage: cd backend && node test-algo-v4-sim.js
 */
const XLSX = require('xlsx')
const path = require('path')

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

// ══════════════════════════════════════════════════════════════
// DONNÉES SIMULÉES RÉALISTES (42 étudiants BA23, 22 places PFP4)
// ══════════════════════════════════════════════════════════════

const NOMS = ['Bonvin','Carron','Favre','Germanier','Luyet','Maret','Morand','Roh','Salamin','Vouillamoz',
  'Besse','Clerc','Darbellay','Fellay','Fournier','Guex','Héritier','Jacquier','Kolly','Lathion',
  'Métrailler','Nanchen','Oggier','Pannatier','Rudaz','Savioz','Thurre','Udry','Vaudan','Zufferey',
  'Abbet','Bruchez','Clivaz','Délèze','Epiney','Fumeaux','Gaspoz','Hofer','Imesch','Juon','Kuonen','Lagger']
const PRENOMS = ['Emma','Léa','Chloé','Manon','Julie','Laura','Sarah','Noémie','Camille','Marie',
  'Lucas','Nathan','Hugo','Théo','Enzo','Maxime','Louis','Arthur','Noah','Ethan',
  'Lina','Alice','Jade','Louise','Anna','Clara','Inès','Eva','Zoé','Mila',
  'Raphaël','Gabriel','Léo','Adam','Jules','Sacha','Tom','Liam','Aaron','Mathis','Elio','Nolan']

function generatePlaces() {
  const places = [
    { id: 'P001', nom: 'Hôpital du Valais - Sion Médecine', inst: 'Hôpital du Valais', criteria: { MSQ: true, AIGU: true, FR: true } },
    { id: 'P002', nom: 'Hôpital du Valais - Sion Chirurgie', inst: 'Hôpital du Valais', criteria: { MSQ: true, AIGU: true, FR: true } },
    { id: 'P003', nom: 'Hôpital du Valais - Sion Neuro', inst: 'Hôpital du Valais', criteria: { NEUROGER: true, FR: true } },
    { id: 'P004', nom: 'Hôpital du Valais - Sion Gériatrie', inst: 'Hôpital du Valais', criteria: { NEUROGER: true, FR: true } },
    { id: 'P005', nom: 'CRR Suva - Sion', inst: 'CRR Suva', criteria: { REHAB: true, MSQ: true, FR: true } },
    { id: 'P006', nom: 'Clinique Bernoise - Montana', inst: 'Clinique Bernoise', criteria: { REHAB: true, DE: true } },
    { id: 'P007', nom: 'Luzerner Kantonsspital', inst: 'LUKS', criteria: { AIGU: true, SYSINT: true, DE: true } },
    { id: 'P008', nom: 'Inselspital Bern - Ortho', inst: 'Inselspital', criteria: { MSQ: true, REHAB: true, DE: true } },
    { id: 'P009', nom: 'Spitalzentrum Oberwallis - Visp', inst: 'SZO Visp', criteria: { AIGU: true, DE: true } },
    { id: 'P010', nom: 'Physio-Santé Martigny', inst: 'Physio-Santé', criteria: { AMBU: true, MSQ: true, FR: true } },
    { id: 'P011', nom: 'Cabinet PhysioVS - Sierre', inst: 'PhysioVS', criteria: { AMBU: true, FR: true } },
    { id: 'P012', nom: 'Praxis Physio Brig', inst: 'Praxis Brig', criteria: { AMBU: true, DE: true } },
    { id: 'P013', nom: 'Centre Thérapeutique Monthey', inst: 'CT Monthey', criteria: { AMBU: true, MSQ: true, FR: true } },
    { id: 'P014', nom: 'Hôpital Riviera-Chablais', inst: 'HRC', criteria: { SYSINT: true, AIGU: true, FR: true } },
    { id: 'P015', nom: 'CHUV - Réhabilitation', inst: 'CHUV', criteria: { REHAB: true, SYSINT: true, FR: true } },
    { id: 'P016', nom: 'Hôpital de Nyon - Soins intensifs', inst: 'Hôpital Nyon', criteria: { SYSINT: true, AIGU: true, FR: true } },
    { id: 'P017', nom: 'EMS Les Crêtes - Sion', inst: 'EMS Les Crêtes', criteria: { NEUROGER: true, FR: true } },
    { id: 'P018', nom: 'Altersheim Leukerbad', inst: 'Altersheim LB', criteria: { NEUROGER: true, DE: true } },
    { id: 'P019', nom: 'Cabinet Physiobrig+', inst: 'Physiobrig+', criteria: { AMBU: true, MSQ: true, DE: true } },
    { id: 'P020', nom: 'Spital Wallis - Brig Rehab', inst: 'Spital Wallis', criteria: { REHAB: true, MSQ: true, DE: true } },
    { id: 'P021', nom: 'Clinique de Valère', inst: 'Clinique Valère', criteria: { REHAB: true, FR: true } },
    { id: 'P022', nom: 'HFR Fribourg - Neurologie', inst: 'HFR', criteria: { NEUROGER: true, SYSINT: true, FR: true } },
  ]

  return places.map(p => {
    const cap = p.id === 'P005' || p.id === 'P015' ? 3 : (Math.random() < 0.4 ? 1 : 2)
    const criteria = {}
    CRITERIA_KEYS.forEach(c => { criteria[c] = !!p.criteria[c] })
    return {
      PlaceId: p.id,
      NomPlace: p.nom,
      InstitutionName: p.inst,
      Capacity: cap,
      criteria,
      criteriaCovered: CRITERIA_KEYS.filter(c => criteria[c])
    }
  })
}

function generateStudents(places) {
  const students = []
  for (let i = 0; i < 42; i++) {
    // Simuler 1-4 critères déjà validés (les étudiants PFP4 ont déjà fait PFP1-3)
    const nbValidated = 3 + Math.floor(Math.random() * 4) // 3-6 validés
    const shuffled = [...CRITERIA_KEYS].sort(() => Math.random() - 0.5)
    const validated = shuffled.slice(0, nbValidated)
    const missing = CRITERIA_KEYS.filter(c => !validated.includes(c))

    // 1-3 places déjà faites
    const nbDone = 1 + Math.floor(Math.random() * 3)
    const donePlaceIds = places
      .sort(() => Math.random() - 0.5)
      .slice(0, nbDone)
      .map(p => p.PlaceId)

    // 5 choix parmi les places (excluant déjà faites)
    const availableForChoice = places
      .filter(p => !donePlaceIds.includes(p.PlaceId))
      .sort(() => Math.random() - 0.5)
    const choices = availableForChoice.slice(0, Math.min(5, availableForChoice.length)).map(p => p.PlaceId)

    // SAE: 15% des étudiants
    const sae = Math.random() < 0.15
    const casParticulier = Math.random() < 0.08

    // Priority score (même formule que le vrai algo)
    const missingGlobalScore = (missing.length / CRITERIA_KEYS.length) * 40
    const bonusDE = missing.includes('DE') ? 15 : 0
    const bonusSYSINT = missing.includes('SYSINT') ? 10 : 0
    const bonusSae = sae ? 12 : 0
    const bonusCas = casParticulier ? 8 : 0
    const tiebreaker = Math.random()
    const priorityScore = Math.round((missingGlobalScore + bonusDE + bonusSYSINT + bonusSae + bonusCas + tiebreaker) * 1.15 * 100) / 100

    students.push({
      userId: `user-${String(i + 1).padStart(3, '0')}`,
      nom: NOMS[i],
      prenom: PRENOMS[i],
      classe: 'BA23',
      choices,
      missingCriteria: missing,
      donePlaceIds,
      priorityScore,
      _sae: sae,
      _casParticulier: casParticulier,
      _validated: validated
    })
  }
  return students
}

// ══════════════════════════════════════════════════════════════
// ALGORITHME v4.0 (copie exacte du backend)
// ══════════════════════════════════════════════════════════════
function runAlgoV4(students, places) {
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

  // ÉTAPE 2: Attribution par places (moins populaires d'abord)
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
      const coveredList = placeData.criteriaCovered.filter(cr => c.student.missingCriteria.includes(cr))
      results.push({
        ...c.student,
        placeName: placeData.NomPlace,
        institutionName: placeData.InstitutionName,
        source: 'Choix',
        criteriaCovered: c.criteriaCovered,
        criteresCouvertsDetail: coveredList.join(', '),
        placeCriteres: placeData.criteriaCovered.join(', '),
        placePopularite: placeData.voteCount
      })
    }
  }

  // ÉTAPE 3: Attribution restants (optimisé critères)
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
      const coveredList = best.place.criteriaCovered.filter(c => student.missingCriteria.includes(c))
      results.push({
        ...student,
        placeName: best.place.NomPlace,
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
        placeName: '❌ AUCUNE PLACE',
        institutionName: '',
        source: 'Non assigné',
        criteriaCovered: 0,
        criteresCouvertsDetail: '',
        placeCriteres: '',
        placePopularite: 0
      })
    }
  }

  return { results, placesMap }
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
console.log('🚀 Simulation Algo v4.0 — PFP4 2026 (données simulées)\n')

const places = generatePlaces()
const students = generateStudents(places)
const { results, placesMap } = runAlgoV4(students, places)

// Stats
const fromChoices = results.filter(r => r.source === 'Choix')
const fromRandom = results.filter(r => r.source === 'Hors choix')
const unassigned = results.filter(r => r.source === 'Non assigné')
const leses = results.filter(r => r.criteriaCovered === 0 && r.source !== 'Non assigné')

console.log('══════════════════════════════════════════════')
console.log('📊 RÉSULTATS ALGO v4.0')
console.log('══════════════════════════════════════════════')
console.log(`   Étudiants: ${students.length}`)
console.log(`   Places PFP4: ${places.length} (capacité totale: ${places.reduce((s, p) => s + p.Capacity, 0)})`)
console.log(`   ✅ Depuis choix: ${fromChoices.length}`)
console.log(`   🎲 Hors choix: ${fromRandom.length}`)
console.log(`   ❌ Non assignés: ${unassigned.length}`)
console.log(`   ⚠️ Lésés (0 critères): ${leses.length}`)
if (fromChoices.length > 0) {
  const avg = fromChoices.reduce((s, r) => s + r.criteriaCovered, 0) / fromChoices.length
  console.log(`   📈 Moy. critères couverts (choix): ${avg.toFixed(2)}`)
}
if (results.length > 0) {
  const avgAll = results.filter(r => r.source !== 'Non assigné').reduce((s, r) => s + r.criteriaCovered, 0) / results.filter(r => r.source !== 'Non assigné').length
  console.log(`   📈 Moy. critères couverts (total): ${avgAll.toFixed(2)}`)
}
console.log('══════════════════════════════════════════════\n')

// ══════════════════════════════════════════════════════════════
// EXCEL
// ══════════════════════════════════════════════════════════════
const wb = XLSX.utils.book_new()

// Sheet 1: Résultats
const s1 = results.map(r => ({
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
  'Nb choix faits': r.choices.length,
  'Nb places déjà faites': r.donePlaceIds.length,
  'Popularité place': r.placePopularite
}))
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1), 'Résultats')

// Sheet 2: Stats
const s2 = [
  { 'Métrique': 'Étudiants', 'Valeur': students.length },
  { 'Métrique': 'Places PFP4', 'Valeur': places.length },
  { 'Métrique': 'Capacité totale', 'Valeur': places.reduce((s, p) => s + p.Capacity, 0) },
  { 'Métrique': 'Assignés depuis choix', 'Valeur': fromChoices.length },
  { 'Métrique': 'Assignés hors choix', 'Valeur': fromRandom.length },
  { 'Métrique': 'Non assignés', 'Valeur': unassigned.length },
  { 'Métrique': 'Lésés (0 critères)', 'Valeur': leses.length },
  { 'Métrique': 'Moy. critères (choix)', 'Valeur': fromChoices.length > 0 ? (fromChoices.reduce((s, r) => s + r.criteriaCovered, 0) / fromChoices.length).toFixed(2) : 0 },
  { 'Métrique': 'Moy. critères (total)', 'Valeur': results.filter(r => r.source !== 'Non assigné').length > 0 ? (results.filter(r => r.source !== 'Non assigné').reduce((s, r) => s + r.criteriaCovered, 0) / results.filter(r => r.source !== 'Non assigné').length).toFixed(2) : 0 },
  { 'Métrique': '% depuis choix', 'Valeur': `${Math.round(fromChoices.length / students.length * 100)}%` },
]
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2), 'Statistiques')

// Sheet 3: Places
const s3 = Array.from(placesMap.values())
  .sort((a, b) => b.assignedStudents?.length - a.assignedStudents?.length || a.NomPlace.localeCompare(b.NomPlace))
  .map(p => ({
    'Place': p.NomPlace,
    'Institution': p.InstitutionName,
    'Capacité': p.Capacity,
    'Assignés': (p.Capacity - p.remainingCapacity),
    'Restant': p.remainingCapacity,
    'Critères': p.criteriaCovered.join(', '),
    'Popularité': p.voteCount
  }))
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s3), 'Places')

// Sheet 4: Lésés
const s4 = leses.length > 0 ? leses.map(r => ({
  'Nom': r.nom,
  'Prénom': r.prenom,
  'Place': r.placeName,
  'Source': r.source,
  'Critères manquants': r.missingCriteria.join(', '),
  'Critères place': r.placeCriteres,
  'Score': r.priorityScore
})) : [{ 'Info': 'Aucun lésé 🎉' }]
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s4), 'Lésés')

// Sheet 5: Données brutes étudiants (avant algo)
const s5 = students.map(s => ({
  'Nom': s.nom,
  'Prénom': s.prenom,
  'Critères validés': s._validated.join(', '),
  'Critères manquants': s.missingCriteria.join(', '),
  'Nb manquants': s.missingCriteria.length,
  'SAE': s._sae ? 'Oui' : 'Non',
  'Cas particulier': s._casParticulier ? 'Oui' : 'Non',
  'Priority Score': s.priorityScore,
  'Choix 1': s.choices[0] || '',
  'Choix 2': s.choices[1] || '',
  'Choix 3': s.choices[2] || '',
  'Choix 4': s.choices[3] || '',
  'Choix 5': s.choices[4] || '',
  'Places déjà faites': s.donePlaceIds.join(', ')
}))
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s5), 'Étudiants (avant)')

const outputPath = path.resolve(__dirname, `../test-algo-v4-SIMULATION.xlsx`)
XLSX.writeFile(wb, outputPath)

console.log(`✅ Excel généré: ${outputPath}`)

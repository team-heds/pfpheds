const { Router } = require('express')
const supabase = require('../supabaseClient')
const { supabaseAdmin } = require('../supabaseClient')
const { v4: uuidv4 } = require('uuid')

const router = Router()

const getAcademicYearKeys = (year) => {
  const y = Number(year)
  if (!Number.isFinite(y)) return [String(year)]
  return [String(y), `${y - 1}-${y}`]
}

const parsePfpValided = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : Object.values(parsed || {})
    } catch (error) {
      return []
    }
  }
  if (typeof value === 'object') return Object.values(value)
  return []
}

const getPlaceIdFromStage = (stage) => {
  return stage?.PlaceId || stage?.IDPlace || stage?.ID_PFP || stage?.id_pfp || null
}

const normalizeClass = (value) => {
  if (value === null || value === undefined) return ''
  return String(value).trim().toUpperCase()
}

const getCompletedPlaceIdsForUser = async (userId) => {
  const completed = new Set()
  if (!userId) return completed

  const [{ data: physioRows, error: physioError }, { data: resultRows, error: resultError }] =
    await Promise.all([
      supabaseAdmin.from('StudentsPhysio').select('pfp_valided, pfp2_data').eq('user_id', userId),
      supabaseAdmin
        .from('student_result_vote')
        .select('assigned_place_id, pfp_validee')
        .eq('user_id', userId)
        .eq('pfp_validee', true)
        .not('assigned_place_id', 'is', null)
    ])

  if (physioError) {
    console.warn(`⚠️ StudentsPhysio inaccessible pour ${userId}:`, physioError.message)
  }
  if (resultError) {
    console.warn(`⚠️ student_result_vote inaccessible pour ${userId}:`, resultError.message)
  }

  ;(physioRows || []).forEach((row) => {
    ;[...parsePfpValided(row?.pfp_valided), ...parsePfpValided(row?.pfp2_data)].forEach((stage) => {
      const placeId = getPlaceIdFromStage(stage)
      if (placeId) completed.add(String(placeId))
    })
  })
  ;(resultRows || []).forEach((row) => {
    if (row?.assigned_place_id) completed.add(String(row.assigned_place_id))
  })

  return completed
}

// Middleware pour extraire le user depuis le token JWT
const setUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    req.user = null
    return next()
  }
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error) throw error
    req.user = data.user
  } catch (e) {
    req.user = null
  }
  next()
}

// Appliquer le middleware
router.use(setUser)

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' })
  }

  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', req.user.id)
      .single()

    if (error || !profile || !['admin', 'superadmin'].includes(profile.role)) {
      return res.status(403).json({ ok: false, error: 'Admin access required' })
    }

    next()
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}

/**
 * POST /api/resultat-votation/run-algorithm
 * Lance l'algorithme d'attribution des places
 */
router.post('/run-algorithm', requireAdmin, async (req, res) => {
  try {
    const { pfpType, year, students, places, persist = true } = req.body

    if (!pfpType || !year || !students || !places) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: pfpType, year, students, places'
      })
    }

    // Générer un ID unique pour cette exécution de l'algorithme
    const algorithmRunId = uuidv4()
    const errors = []

    console.log(`🚀 Démarrage algorithme d'attribution: ${pfpType} - ${year}`)
    console.log(`   Étudiants à traiter: ${students.length}`)
    console.log(`   Places disponibles: ${places.length}`)

    // 🛡️ ÉTAPE 0: Charger les assignations existantes (manuelles, prioritaires, etc.)
    // pour ne pas les écraser et respecter la capacité déjà utilisée
    const { data: existingAssignments, error: existingError } = await supabaseAdmin
      .from('student_result_vote')
      .select('user_id, assigned_place_id, assigned_place_name, assigned_institution_name, assigned_rank, status, notes, priority_score, original_choices, algorithm_run_id')
      .eq('pfp_type', pfpType)
      .in('year', getAcademicYearKeys(year))

    if (existingError) {
      console.warn('⚠️ Impossible de charger les assignations existantes:', existingError.message)
    }

    const preAssigned = new Set()
    const preAssignedByPlace = new Map() // PlaceId → count
    const preAssignedResults = []
    if (existingAssignments && existingAssignments.length > 0) {
      existingAssignments.forEach((a) => {
        if (a.assigned_place_id && a.user_id) {
          preAssigned.add(a.user_id)
          preAssignedByPlace.set(
            a.assigned_place_id,
            (preAssignedByPlace.get(a.assigned_place_id) || 0) + 1
          )
          preAssignedResults.push({
            user_id: a.user_id,
            pfp_type: pfpType,
            year: year,
            assigned_place_id: a.assigned_place_id,
            assigned_place_name: a.assigned_place_name || '',
            assigned_institution_name: a.assigned_institution_name || '',
            assigned_rank: Number.isFinite(Number(a.assigned_rank)) ? Number(a.assigned_rank) : 0,
            algorithm_run_id: a.algorithm_run_id || algorithmRunId,
            original_choices: Array.isArray(a.original_choices) ? a.original_choices : [],
            priority_score: a.priority_score ?? null,
            notes: a.notes || 'Assignation existante conservée'
          })
        }
      })
      console.log(
        `🛡️ ${preAssigned.size} étudiants déjà assignés conservés`
      )
      console.log(`🛡️ ${preAssignedByPlace.size} places ont déjà des assignations`)
    }

    // Filtrer les étudiants : ne recalculer que ceux non déjà assignés
    const eligibleStudents = students.filter((s) => !preAssigned.has(s.userId))
    console.log(
      `   Étudiants à recalculer: ${eligibleStudents.length}/${students.length}`
    )

    // Créer un mapping des places disponibles avec leur capacité et critères
    const placesMap = new Map()
    const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

    places.forEach((place) => {
      const alreadyUsed = preAssignedByPlace.get(place.PlaceId) || 0
      placesMap.set(place.PlaceId, {
        ...place,
        remainingCapacity: Math.max(0, (place.Capacity || 1) - alreadyUsed),
        assignedStudents: [],
        voteCount: 0,
        // Critères couverts par cette place (envoyés par le frontend)
        criteriaCovered: CRITERIA_KEYS.filter((c) => place.criteria && place.criteria[c])
      })
    })

    preAssignedResults.forEach((assignment) => {
      const placeData = placesMap.get(assignment.assigned_place_id)
      if (placeData) {
        placeData.assignedStudents.push(assignment.user_id)
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // ALGORITHME v4.0 — Optimisation par critères manquants
    //
    // Principe: les 5 choix sont un POOL (pas de rang 1-5).
    // Pour chaque place, on trie les candidats par:
    //   1. Nombre de critères manquants couverts (DESC) → l'étudiant qui en a le plus BESOIN
    //   2. Priority Score (DESC) → SAE, cas particulier, critères globaux
    //   3. Random → départager les ex-aequo
    //
    // On exclut les choix correspondant à une place déjà faite (même PlaceId).
    // L'attribution aléatoire optimise aussi les critères manquants.
    // ══════════════════════════════════════════════════════════════════

    // Helper: calculer combien de critères manquants d'un étudiant sont couverts par une place
    const computeCriteriaCovered = (studentMissingCriteria, placeCriteriaCovered) => {
      if (!studentMissingCriteria || !placeCriteriaCovered) return 0
      return placeCriteriaCovered.filter((c) => studentMissingCriteria.includes(c)).length
    }

    const getPriorityMissingCriteria = (student) => {
      const missing = Array.isArray(student.missingCriteria) ? [...student.missingCriteria] : []
      const completedStageCount = Number(student.completedStageCount || 0)
      if (completedStageCount === 1) return missing
      if (completedStageCount < 2) return missing.filter((criteria) => criteria !== 'DE')
      return missing
    }

    const buildGenericCandidatePlaces = (student) => {
      const donePlaces = new Set(student.donePlaceIds || [])
      const allAvailablePlaces = Array.from(placesMap.values()).filter(
        (place) => place.remainingCapacity > 0 && !donePlaces.has(place.PlaceId)
      )

      const completedStageCount = Number(student.completedStageCount || 0)
      const priorityMissingCriteria = getPriorityMissingCriteria(student)
      const prioritizeGerman = completedStageCount === 1 && priorityMissingCriteria.includes('DE')
      const countCovered = (place) =>
        place.criteriaCovered.filter((c) => priorityMissingCriteria.includes(c)).length

      if (pfpType !== 'PFP3' || priorityMissingCriteria.length === 0) {
        return allAvailablePlaces.map((place) => ({
          ...place,
          _coveredCount: countCovered(place),
          _fallbackType: 'all',
          _prioritizeGerman: prioritizeGerman
        }))
      }

      const missingDE = completedStageCount >= 2 && priorityMissingCriteria.includes('DE')
      const MIN_PLACES = 5
      let proposedPlaces = []

      if (missingDE) {
        proposedPlaces = allAvailablePlaces
          .filter((place) => place.criteriaCovered.includes('DE'))
          .map((place) => ({
            ...place,
            _coveredCount: countCovered(place),
            _fallbackType: 'de_only',
            _prioritizeGerman: prioritizeGerman
          }))
      } else {
        proposedPlaces = allAvailablePlaces
          .filter((place) => countCovered(place) > 0)
          .map((place) => ({
            ...place,
            _coveredCount: countCovered(place),
            _fallbackType: 'criteria',
            _prioritizeGerman: prioritizeGerman
          }))

        if (proposedPlaces.length < MIN_PLACES) {
          const currentIds = new Set(proposedPlaces.map((place) => place.PlaceId))
          const sysintPlaces = allAvailablePlaces
            .filter(
              (place) =>
                !currentIds.has(place.PlaceId) && place.criteriaCovered.includes('SYSINT')
            )
            .map((place) => ({
              ...place,
              _coveredCount: countCovered(place),
              _fallbackType: 'sysint',
              _prioritizeGerman: prioritizeGerman
            }))
          proposedPlaces.push(...sysintPlaces)
        }

        if (proposedPlaces.length < MIN_PLACES) {
          const currentIds = new Set(proposedPlaces.map((place) => place.PlaceId))
          const remainingPlaces = allAvailablePlaces
            .filter((place) => !currentIds.has(place.PlaceId))
            .slice(0, MIN_PLACES - proposedPlaces.length)
            .map((place) => ({
              ...place,
              _coveredCount: countCovered(place),
              _fallbackType: 'rest',
              _prioritizeGerman: prioritizeGerman
            }))
          proposedPlaces.push(...remainingPlaces)
        }
      }

      return proposedPlaces
    }

    const sortCandidatePlaces = (a, b) => {
      const aSection = a._coveredCount >= 2 ? 0 : a._coveredCount === 1 ? 1 : 2
      const bSection = b._coveredCount >= 2 ? 0 : b._coveredCount === 1 ? 1 : 2
      if (aSection !== bSection) return aSection - bSection

      if (a._prioritizeGerman || b._prioritizeGerman) {
        const germanDiff = Number(Boolean(b.criteriaCovered.includes('DE'))) - Number(Boolean(a.criteriaCovered.includes('DE')))
        if (germanDiff !== 0) return germanDiff
      }

      if (a._coveredCount !== b._coveredCount) return b._coveredCount - a._coveredCount
      if (a.voteCount !== b.voteCount) return a.voteCount - b.voteCount
      if (a.remainingCapacity !== b.remainingCapacity) return b.remainingCapacity - a.remainingCapacity
      return (a.NomPlace || '').localeCompare(b.NomPlace || '')
    }

    // 🎯 ÉTAPE 1: Calculer la popularité (nombre de votes) — utilisé uniquement comme tie-break
    eligibleStudents.forEach((student) => {
      const choices = student.choices || []
      const donePlaces = new Set(student.donePlaceIds || [])
      choices.forEach((placeId) => {
        if (donePlaces.has(placeId)) return // Exclure place déjà faite
        const placeData = placesMap.get(placeId)
        if (placeData) placeData.voteCount++
      })
    })

    console.log('📊 Popularité des places calculée:')
    const sortedPlacesByPopularity = Array.from(placesMap.values()).sort(
      (a, b) => a.voteCount - b.voteCount
    )

    console.log('   🟢 Top 5 places MOINS populaires:')
    sortedPlacesByPopularity.slice(0, 5).forEach((p) => {
      console.log(
        `      - ${p.NomPlace}: ${p.voteCount} votes, capacité: ${p.Capacity}, critères: [${p.criteriaCovered.join(',')}]`
      )
    })
    console.log('   🔴 Top 5 places PLUS populaires:')
    sortedPlacesByPopularity
      .slice(-5)
      .reverse()
      .forEach((p) => {
        console.log(
          `      - ${p.NomPlace}: ${p.voteCount} votes, capacité: ${p.Capacity}, critères: [${p.criteriaCovered.join(',')}]`
        )
      })

    const resultsToInsert = []
    const assignedStudents = new Set()
    const sortedStudents = [...eligibleStudents].sort((a, b) => {
      if ((a.priorityScore || 0) !== (b.priorityScore || 0)) {
        return (b.priorityScore || 0) - (a.priorityScore || 0)
      }
      return `${a.nom || ''} ${a.prenom || ''}`.localeCompare(`${b.nom || ''} ${b.prenom || ''}`)
    })

    console.log('🔄 Attribution par étudiant (logique votation générique → meilleure place disponible)...')

    let randomAssignmentCount = 0

    for (const student of sortedStudents) {
      if (assignedStudents.has(student.userId)) continue

      const candidatePlaces = buildGenericCandidatePlaces(student).sort(sortCandidatePlaces)
      const best = candidatePlaces[0]

      if (!best) {
        console.warn(`⚠️ Aucune place disponible pour ${student.nom} ${student.prenom}`)
        errors.push({ userId: student.userId, error: 'No available place' })
        continue
      }

      assignedStudents.add(student.userId)
      const livePlace = placesMap.get(best.PlaceId)
      if (!livePlace || livePlace.remainingCapacity <= 0) {
        console.warn(`⚠️ Capacité expirée pour ${best.NomPlace} lors de l'attribution de ${student.nom} ${student.prenom}`)
        errors.push({ userId: student.userId, error: 'Place capacity exhausted' })
        continue
      }

      livePlace.remainingCapacity--
      livePlace.assignedStudents.push(student.userId)

      const criteriaCovered = computeCriteriaCovered(
        student.missingCriteria,
        livePlace.criteriaCovered
      )
      const fallbackAssignment = criteriaCovered === 0
      if (fallbackAssignment) randomAssignmentCount++

      resultsToInsert.push({
        user_id: student.userId,
        pfp_type: pfpType,
        year: year,
        assigned_place_id: livePlace.PlaceId,
        assigned_place_name: livePlace.NomPlace,
        assigned_institution_name: livePlace.InstitutionName || '',
        assigned_rank: fallbackAssignment ? 99 : criteriaCovered,
        algorithm_run_id: algorithmRunId,
        original_choices: student.choices || [],
        priority_score: student.priorityScore || null,
        notes: `${fallbackAssignment ? '⚠️ HORS CIBLAGE' : 'Algo v5.0'} — logique votation générique — ${criteriaCovered} critères couverts [${livePlace.criteriaCovered.filter((c) => (student.missingCriteria || []).includes(c)).join(',')}] | manquants=[${(student.missingCriteria || []).join(',')}] | fallback=${best._fallbackType} | score=${student.priorityScore}`
      })

      console.log(
        `   ✅ ${student.nom} ${student.prenom} → ${livePlace.NomPlace} (${criteriaCovered} crit. couverts, fallback=${best._fallbackType})`
      )
    }

    if (randomAssignmentCount > 0) {
      console.log(
        `   ✅ ${randomAssignmentCount} étudiants assignés en fallback (0 critère couvert)`
      )
    }

    if (persist) {
      console.log(`💾 Enregistrement de ${resultsToInsert.length} résultats...`)

      const rows = resultsToInsert.map((r) => ({
        user_id: r.user_id,
        pfp_type: r.pfp_type,
        year: r.year,
        assigned_place_id: r.assigned_place_id,
        assigned_place_name: r.assigned_place_name,
        assigned_institution_name: r.assigned_institution_name,
        assigned_rank: r.assigned_rank,
        algorithm_run_id: r.algorithm_run_id,
        original_choices: r.original_choices,
        priority_score: r.priority_score,
        notes: r.notes,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      }))

      if (rows.length > 0) {
        const { data: upsertData, error: upsertError } = await supabaseAdmin
          .from('student_result_vote')
          .upsert(rows, { onConflict: 'user_id,pfp_type,year' })
          .select()

        if (upsertError) {
          console.error('❌ Erreur upsert:', upsertError)
          return res.status(500).json({
            ok: false,
            error: 'Failed to save results: ' + upsertError.message
          })
        }

        console.log(`✅ Upsert réussi: ${upsertData.length} résultats enregistrés`)
      }
    } else {
      console.log(`👁️ Aperçu généré: ${resultsToInsert.length} résultats non enregistrés`)
    }

    // Statistiques finales
    const placesUsedCount = Array.from(placesMap.values()).filter(
      (p) => p.assignedStudents.length > 0
    ).length
    const fromChoices = resultsToInsert.filter((r) => r.assigned_rank !== 99)
    const fromRandom = resultsToInsert.filter((r) => r.assigned_rank === 99)
    const avgCritCoveredChoices =
      fromChoices.length > 0
        ? (fromChoices.reduce((s, r) => s + r.assigned_rank, 0) / fromChoices.length).toFixed(2)
        : 0
    const studentsWithZeroCrit = resultsToInsert.filter((r) => {
      const crit = r.assigned_rank === 99 ? 0 : r.assigned_rank
      return crit === 0
    }).length

    const combinedResults = [...preAssignedResults, ...resultsToInsert]

    const stats = {
      totalStudents: students.length + preAssignedResults.length,
      preAssignedCount: preAssigned.size,
      eligibleStudents: eligibleStudents.length,
      successfulAssignments: combinedResults.length,
      generatedAssignments: resultsToInsert.length,
      preservedAssignments: preAssignedResults.length,
      failedAssignments: errors.length,
      placesUsed: placesUsedCount,
      fromChoicesCount: fromChoices.length,
      randomAssignmentCount: fromRandom.length,
      avgCriteriaCoveredFromChoices: avgCritCoveredChoices,
      studentsWithZeroCriteriaCovered: studentsWithZeroCrit,
      lesedCount: studentsWithZeroCrit // Nombre de "lésés" (0 critères couverts)
    }

    // 📋 Places avec assignations
    const placesWithAssignments = Array.from(placesMap.values())
      .map((place) => {
        const assignments = combinedResults.filter((r) => r.assigned_place_id === place.PlaceId)
        return {
          placeId: place.PlaceId,
          placeName: place.NomPlace,
          institutionId: place.InstitutionId,
          institutionName: place.InstitutionName,
          totalCapacity: place.Capacity,
          remainingCapacity: place.remainingCapacity,
          criteriaCovered: place.criteriaCovered,
          assignedCount: assignments.length,
          assignedStudents: assignments.map((a) => ({
            userId: a.user_id,
            criteriaCovered: a.assigned_rank === 99 ? 'random' : a.assigned_rank,
            priorityScore: a.priority_score
          }))
        }
      })
      .sort((a, b) => {
        if (b.assignedCount !== a.assignedCount) return b.assignedCount - a.assignedCount
        return (a.placeName || '').localeCompare(b.placeName || '')
      })

    console.log(`✅ Algorithme v5.0 terminé:`, stats)
    console.log(
      `📋 Places avec assignations: ${placesWithAssignments.filter((p) => p.assignedCount > 0).length}/${placesWithAssignments.length}`
    )
    console.log(`🎯 Lésés (0 critères couverts): ${studentsWithZeroCrit}/${resultsToInsert.length}`)

    return res.json({
      ok: true,
      algorithmRunId,
      persisted: !!persist,
      results: combinedResults,
      placesWithAssignments,
      errors,
      stats
    })
  } catch (error) {
    console.error('❌ Erreur run-algorithm:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * POST /api/resultat-votation/confirm-algorithm
 * Persiste un aperçu d'attribution déjà calculé
 */
router.post('/confirm-algorithm', requireAdmin, async (req, res) => {
  try {
    const { results } = req.body

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required field: results'
      })
    }

    const rows = results.map((r) => ({
      user_id: r.user_id,
      pfp_type: r.pfp_type,
      year: r.year,
      assigned_place_id: r.assigned_place_id,
      assigned_place_name: r.assigned_place_name,
      assigned_institution_name: r.assigned_institution_name,
      assigned_rank: r.assigned_rank,
      algorithm_run_id: r.algorithm_run_id || null,
      original_choices: Array.isArray(r.original_choices) ? r.original_choices : [],
      priority_score: r.priority_score ?? null,
      notes: r.notes || null,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    }))

    const { data, error } = await supabaseAdmin
      .from('student_result_vote')
      .upsert(rows, { onConflict: 'user_id,pfp_type,year' })
      .select()

    if (error) {
      console.error('❌ Erreur confirm-algorithm:', error)
      return res.status(500).json({
        ok: false,
        error: 'Failed to confirm results: ' + error.message
      })
    }

    console.log(`✅ confirm-algorithm: ${data.length} résultats enregistrés`)
    return res.json({
      ok: true,
      persisted: true,
      count: data.length
    })
  } catch (error) {
    console.error('❌ Erreur confirm-algorithm:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * GET /api/resultat-votation/pfp3-proposals/:year
 * Récupère les propositions PFP3 sauvegardées pour un étudiant (via session)
 */
router.get('/pfp3-proposals/:year', setUser, async (req, res) => {
  try {
    const { year } = req.params
    const targetClass = normalizeClass(req.query?.targetClass)
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Authentication required' })
    }

    console.log(`🔍 GET pfp3-proposals: userId=${userId}, year=${year}`)

    let sessionsQuery = supabaseAdmin
      .from('votation_sessions')
      .select('id, pfp4_proposals, status, is_priority, target_class')
      .eq('pfp_type', 'PFP3')
      .eq('year', year)
      .not('pfp4_proposals', 'is', null)

    if (targetClass) {
      sessionsQuery = sessionsQuery.eq('target_class', targetClass)
    }

    const { data: sessions, error } = await sessionsQuery

    if (error) {
      console.error('❌ Erreur query votation_sessions PFP3:', error)
      throw error
    }

    let proposedPlaceIds = null
    let missingCriteria = null
    let appliedRule = null
    let assignCounts = null
    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const proposals = session.pfp4_proposals
        if (proposals && proposals[userId]) {
          const userData = proposals[userId]
          if (Array.isArray(userData)) {
            proposedPlaceIds = userData
          } else {
            proposedPlaceIds = userData.placeIds || []
            missingCriteria = userData.missingCriteria || []
            appliedRule = userData.appliedRule || null
          }
          assignCounts = proposals._assignCounts || null
          break
        }
      }
    }

    if (Array.isArray(proposedPlaceIds) && proposedPlaceIds.length > 0) {
      const completedPlaceIds = await getCompletedPlaceIdsForUser(userId)
      proposedPlaceIds = proposedPlaceIds.filter(
        (placeId) => !completedPlaceIds.has(String(placeId))
      )
    }

    return res.json({
      ok: true,
      proposedPlaceIds,
      missingCriteria,
      appliedRule,
      assignCounts
    })
  } catch (error) {
    console.error('❌ Erreur get pfp3-proposals:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * GET /api/resultat-votation/assignment-counts/:pfpType/:year
 * Renvoie le nombre de places déjà assignées par place pour un PFP/année
 */
router.get('/assignment-counts/:pfpType/:year', setUser, async (req, res) => {
  try {
    const { pfpType, year } = req.params

    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' })
    }

    const { data, error } = await supabaseAdmin
      .from('student_result_vote')
      .select('assigned_place_id, user_id')
      .eq('pfp_type', pfpType)
      .in('year', getAcademicYearKeys(year))
      .not('assigned_place_id', 'is', null)

    if (error) {
      throw error
    }

    const counts = {}
    ;(data || []).forEach((row) => {
      const placeId = row.assigned_place_id
      if (!placeId) return
      counts[placeId] = (counts[placeId] || 0) + 1
    })

    return res.json({ ok: true, counts })
  } catch (error) {
    console.error('❌ Erreur assignment-counts:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * POST /api/resultat-votation/save-pfp3-proposals
 * Sauvegarde les propositions PFP3 validées par l'admin
 * Stocke dans la table votation_sessions avec les propositions par étudiant
 */
router.post('/save-pfp3-proposals', requireAdmin, async (req, res) => {
  try {
    const { year, targetClass, proposals, assignCounts } = req.body

    if (!year || !proposals) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: year, proposals' })
    }

    const classe = targetClass || 'BA23'

    const proposalsMap = {}
    proposals.forEach((p) => {
      proposalsMap[p.userId] = {
        placeIds: p.proposedPlaceIds || [],
        missingCriteria: p.missingCriteria || [],
        appliedRule: p.appliedRule || ''
      }
    })

    if (assignCounts && Object.keys(assignCounts).length > 0) {
      proposalsMap._assignCounts = assignCounts
    }

    console.log(
      `🔍 SAVE pfp3-proposals: year=${year} class=${classe} students=${Object.keys(proposalsMap).length}`
    )

    const { data: existingSessions, error: findError } = await supabaseAdmin
      .from('votation_sessions')
      .select('id, is_priority, status')
      .eq('pfp_type', 'PFP3')
      .eq('year', year)
      .eq('target_class', classe)

    if (findError && findError.code !== 'PGRST116') {
      console.warn('⚠️ Erreur recherche sessions PFP3:', findError.message)
    }

    const updatePayload = {
      pfp4_proposals: proposalsMap
    }

    let savedSession
    if (existingSessions && existingSessions.length > 0) {
      for (const session of existingSessions) {
        const { error } = await supabaseAdmin
          .from('votation_sessions')
          .update(updatePayload)
          .eq('id', session.id)
        if (error) {
          console.warn(`⚠️ Erreur update session PFP3 ${session.id}:`, error.message)
        } else {
          console.log(
            `✅ Session PFP3 ${session.id} mise à jour avec ${Object.keys(proposalsMap).length} propositions`
          )
        }
      }
      savedSession = existingSessions[0]
      console.log(`✅ Propositions PFP3 mises à jour dans ${existingSessions.length} session(s)`)
    } else {
      console.log("📝 Aucune session PFP3 existante, création d'une nouvelle...")
      const { data, error } = await supabaseAdmin
        .from('votation_sessions')
        .insert({
          pfp_type: 'PFP3',
          year,
          target_class: classe,
          pfp4_proposals: proposalsMap,
          status: 'closed',
          is_priority: false
        })
        .select()
        .single()
      if (error) throw error
      savedSession = data
      console.log(`✅ Nouvelle session PFP3 créée: ${savedSession.id}`)
    }

    return res.json({
      ok: true,
      sessionId: savedSession.id,
      savedCount: Object.keys(proposalsMap).length
    })
  } catch (error) {
    console.error('❌ Erreur save-pfp3-proposals:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * POST /api/resultat-votation/generate-pfp4-proposals
 * Génère les propositions de places PFP4 pour chaque étudiant BA23
 * basé sur leurs critères manquants (MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE)
 *
 * Règles de filtrage PFP4:
 * 1. Manque DE uniquement → proposer uniquement les places DE
 * 2. Manque DE + SYSINT → proposer toutes les places SYSINT + toutes les places DE
 * 3. Manque SYSINT uniquement → proposer uniquement les places SYSINT
 * 4. Manque SYSINT + autre(s) → proposer toutes les places SYSINT + toutes les places matchant les autres critères manquants
 * 5. Manque autre(s) sans SYSINT ni DE → proposer toutes les places matchant n'importe quel critère manquant
 */
router.post('/generate-pfp4-proposals', requireAdmin, async (req, res) => {
  try {
    const { year, targetClass } = req.body

    if (!year) {
      return res.status(400).json({ ok: false, error: 'Missing required field: year' })
    }

    const classe = targetClass || 'BA23'
    console.log(`🎯 Génération des propositions PFP4 pour ${classe} - ${year}`)

    const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

    // ── 1. Charger les étudiants de la classe cible ──
    const { data: studentsData, error: studentsError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, email, forname, family_name, display_name, classe')
      .eq('classe', classe)

    if (studentsError) throw studentsError

    // Filtrer pour ne garder que les étudiants (pas les admins qui seraient dans BA23)
    const studentUsers = (studentsData || []).filter((u) => {
      const role = (u.role || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      return (
        role.includes('student') ||
        role.includes('etudiant') ||
        role.includes('étudiant') ||
        email.includes('@students.hevs.ch')
      )
    })

    console.log(
      `   📋 ${studentsData.length} profils ${classe}, ${studentUsers.length} étudiants filtrés`
    )

    // ── 2. Charger les critères validés depuis StudentsPhysio.pfp_valided ──
    const { data: physioData, error: physioError } = await supabaseAdmin
      .from('StudentsPhysio')
      .select('user_id, pfp_valided, sae, cas_particulier')

    if (physioError) console.warn('⚠️ StudentsPhysio non accessible:', physioError.message)

    // ── 3. Charger les assignations validées (pfp_validee=true) depuis student_result_vote ──
    const { data: assignmentsData, error: assignmentsError } = await supabaseAdmin
      .from('student_result_vote')
      .select('user_id, pfp_type, assigned_place_id, pfp_validee')

    if (assignmentsError)
      console.warn('⚠️ student_result_vote non accessible:', assignmentsError.message)

    // ── 4. Charger toutes les places avec leurs critères ──
    const { data: placesData, error: placesError } = await supabaseAdmin
      .from('places')
      .select(
        'PlaceId, NomPlace, InstitutionId, InstitutionName, MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE, PFP4, selectedOut'
      )

    if (placesError) throw placesError

    // Filtrer les places PFP4 avec capacité > 0 pour l'année et non exclues
    const pfp4Places = (placesData || [])
      .filter((place) => {
        if (place.selectedOut) return false
        const pfp4Data = place.PFP4
        if (!pfp4Data) return false
        const capacity = parseInt(pfp4Data[year] || pfp4Data['default'] || '0')
        return !isNaN(capacity) && capacity >= 1
      })
      .map((place) => ({
        PlaceId: place.PlaceId,
        NomPlace: place.NomPlace,
        InstitutionId: place.InstitutionId,
        InstitutionName: place.InstitutionName || '',
        Capacity: parseInt(place.PFP4[year] || place.PFP4['default'] || '0'),
        MSQ: !!place.MSQ,
        SYSINT: !!place.SYSINT,
        NEUROGER: !!place.NEUROGER,
        AIGU: !!place.AIGU,
        REHAB: !!place.REHAB,
        AMBU: !!place.AMBU,
        FR: !!place.FR,
        DE: !!place.DE
      }))

    console.log(`   🏥 ${pfp4Places.length} places PFP4 disponibles (capacité > 0) pour ${year}`)

    // ── 5. Construire les critères validés par étudiant ──
    // Source 1: StudentsPhysio.pfp_valided
    const criteriaMap = new Map()

    if (physioData && physioData.length > 0) {
      physioData.forEach((physio) => {
        const scores = {}
        CRITERIA_KEYS.forEach((k) => {
          scores[k] = 0
        })

        let pfpArray = []
        if (physio.pfp_valided) {
          try {
            pfpArray =
              typeof physio.pfp_valided === 'string'
                ? JSON.parse(physio.pfp_valided)
                : physio.pfp_valided
            if (!Array.isArray(pfpArray)) pfpArray = Object.values(pfpArray)
          } catch (e) {
            pfpArray = []
          }
        }

        pfpArray.forEach((stage) => {
          CRITERIA_KEYS.forEach((c) => {
            if (
              stage[c] === true ||
              stage[c] === 'true' ||
              stage[c] === 1 ||
              stage[c.toLowerCase()] === true
            ) {
              scores[c]++
            }
          })
        })

        criteriaMap.set(physio.user_id, {
          scores,
          sae: !!physio.sae,
          casParticulier: !!physio.cas_particulier
        })
      })
    }

    // Source 2: enrichir avec les assignations validées dans student_result_vote
    const placesLookup = new Map()
    ;(placesData || []).forEach((p) => placesLookup.set(p.PlaceId, p))

    if (assignmentsData && assignmentsData.length > 0) {
      assignmentsData.forEach((a) => {
        if (a.pfp_validee && a.assigned_place_id) {
          const placeInfo = placesLookup.get(a.assigned_place_id)
          if (placeInfo) {
            const existing = criteriaMap.get(a.user_id) || {
              scores: Object.fromEntries(CRITERIA_KEYS.map((k) => [k, 0])),
              sae: false,
              casParticulier: false
            }
            CRITERIA_KEYS.forEach((c) => {
              if (placeInfo[c] === true) existing.scores[c]++
            })
            criteriaMap.set(a.user_id, existing)
          }
        }
      })
    }

    console.log(`   📊 ${criteriaMap.size} étudiants avec critères connus`)

    // DEBUG: Afficher les critères de chaque étudiant de la classe
    for (const student of studentsData || []) {
      const uid = student.user_id
      const crit = criteriaMap.get(uid)
      if (crit) {
        const validated = CRITERIA_KEYS.filter((c) => crit.scores[c] > 0)
        const missing = CRITERIA_KEYS.filter((c) => crit.scores[c] === 0)
        console.log(
          `   👤 ${student.family_name} ${student.forname}: validés=${validated.join(',')} | manquants=${missing.join(',')} | scores=${JSON.stringify(crit.scores)}`
        )
      } else {
        console.log(
          `   👤 ${student.family_name} ${student.forname}: ⚠️ AUCUN CRITÈRE CONNU (pas dans StudentsPhysio ni student_result_vote)`
        )
      }
    }

    // DEBUG: Afficher les critères de chaque place PFP4
    pfp4Places.forEach((p) => {
      const crit = CRITERIA_KEYS.filter((c) => p[c])
      console.log(
        `   🏥 ${p.NomPlace} (${p.InstitutionName}): ${crit.join(',')} | cap=${p.Capacity}`
      )
    })

    // ── 6. Générer les propositions par étudiant ──
    const proposals = []

    for (const student of studentsData || []) {
      const userId = student.user_id
      const studentCriteria = criteriaMap.get(userId)
      const scores = studentCriteria
        ? studentCriteria.scores
        : Object.fromEntries(CRITERIA_KEYS.map((k) => [k, 0]))
      const completedPlaceIds = await getCompletedPlaceIdsForUser(userId)

      // Déterminer les critères manquants (score === 0)
      const missingCriteria = CRITERIA_KEYS.filter((c) => scores[c] === 0)
      const validatedStageCount = completedPlaceIds.size
      const deprioritizeDE = validatedStageCount < 2
      const priorityMissingCriteria = deprioritizeDE
        ? missingCriteria.filter((c) => c !== 'DE')
        : missingCriteria
      const missingDE = !deprioritizeDE && priorityMissingCriteria.includes('DE')
      const missingSYSINT = missingCriteria.includes('SYSINT')
      // Autres critères manquants (hors DE et SYSINT)
      const otherMissing = priorityMissingCriteria.filter((c) => c !== 'SYSINT')

      let proposedPlaces = []

      if (missingDE && !missingSYSINT && otherMissing.length === 0) {
        // ── Règle 1: Manque uniquement DE → proposer uniquement les places DE ──
        proposedPlaces = pfp4Places.filter((p) => p.DE)
      } else if (missingDE && missingSYSINT) {
        // ── Règle 2: Manque DE + SYSINT (+ éventuellement autres) → toutes SYSINT + toutes DE ──
        proposedPlaces = pfp4Places.filter((p) => p.SYSINT || p.DE)
      } else if (missingSYSINT && !missingDE && otherMissing.length === 0) {
        // ── Règle 3: Manque uniquement SYSINT → proposer uniquement les places SYSINT ──
        proposedPlaces = pfp4Places.filter((p) => p.SYSINT)
      } else if (missingSYSINT && otherMissing.length > 0) {
        // ── Règle 4: Manque SYSINT + autre(s) → toutes SYSINT + places matchant les autres critères manquants ──
        proposedPlaces = pfp4Places.filter((p) => {
          if (p.SYSINT) return true
          return otherMissing.some((c) => p[c])
        })
      } else if (priorityMissingCriteria.length > 0) {
        // ── Règle 5: Manque autre(s) sans SYSINT ni DE → toutes les places matchant un critère manquant ──
        proposedPlaces = pfp4Places.filter((p) => {
          return priorityMissingCriteria.some((c) => p[c])
        })
      } else {
        // ── Aucun critère manquant → proposer toutes les places PFP4 ──
        proposedPlaces = [...pfp4Places]
      }

      // Dédupliquer par PlaceId
      const uniquePlaceIds = new Set()
      proposedPlaces = proposedPlaces.filter((p) => {
        if (completedPlaceIds.has(String(p.PlaceId))) return false
        if (uniquePlaceIds.has(p.PlaceId)) return false
        uniquePlaceIds.add(p.PlaceId)
        return true
      })

      // Déterminer la règle appliquée pour le debug
      let appliedRule = ''
      if (missingDE && !missingSYSINT && otherMissing.length === 0) appliedRule = 'DE_ONLY'
      else if (missingDE && missingSYSINT) appliedRule = 'DE_AND_SYSINT'
      else if (missingSYSINT && !missingDE && otherMissing.length === 0) appliedRule = 'SYSINT_ONLY'
      else if (missingSYSINT && otherMissing.length > 0) appliedRule = 'SYSINT_AND_OTHER'
      else if (priorityMissingCriteria.length > 0)
        appliedRule = deprioritizeDE ? 'UNDER2_NO_DE_PRIORITY' : 'OTHER_MISSING'
      else appliedRule = 'ALL_COMPLETE'

      proposals.push({
        userId,
        nom: student.family_name || '',
        prenom: student.forname || '',
        email: student.email || '',
        classe,
        scores,
        missingCriteria,
        appliedRule,
        sae: studentCriteria?.sae || false,
        casParticulier: studentCriteria?.casParticulier || false,
        proposedPlaceIds: proposedPlaces.map((p) => p.PlaceId),
        proposedPlacesCount: proposedPlaces.length,
        proposedPlaces: proposedPlaces.map((p) => ({
          PlaceId: p.PlaceId,
          NomPlace: p.NomPlace,
          InstitutionName: p.InstitutionName,
          Capacity: p.Capacity,
          criteria: CRITERIA_KEYS.filter((c) => p[c])
        }))
      })
    }

    // Trier par nom
    proposals.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))

    // Statistiques
    const ruleStats = {}
    proposals.forEach((p) => {
      ruleStats[p.appliedRule] = (ruleStats[p.appliedRule] || 0) + 1
    })

    const stats = {
      totalStudents: proposals.length,
      totalPfp4Places: pfp4Places.length,
      totalCapacity: pfp4Places.reduce((sum, p) => sum + p.Capacity, 0),
      averageProposedPlaces:
        proposals.length > 0
          ? Math.round(
              proposals.reduce((sum, p) => sum + p.proposedPlacesCount, 0) / proposals.length
            )
          : 0,
      ruleDistribution: ruleStats,
      studentsWithNoCriteria: proposals.filter((p) => !criteriaMap.has(p.userId)).length
    }

    console.log(`✅ Propositions PFP4 générées:`, stats)

    return res.json({
      ok: true,
      proposals,
      allPfp4Places: pfp4Places,
      stats
    })
  } catch (error) {
    console.error('❌ Erreur generate-pfp4-proposals:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * POST /api/resultat-votation/save-pfp4-proposals
 * Sauvegarde les propositions PFP4 validées par l'admin
 * Stocke dans la table votation_sessions avec les propositions par étudiant
 */
router.post('/save-pfp4-proposals', requireAdmin, async (req, res) => {
  try {
    const { year, targetClass, proposals, assignCounts } = req.body
    if (!year || !proposals) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: year, proposals' })
    }

    const classe = targetClass || 'BA23'

    // Construire un map userId → { placeIds, missingCriteria, appliedRule } + _assignCounts
    const proposalsMap = {}
    proposals.forEach((p) => {
      proposalsMap[p.userId] = {
        placeIds: p.proposedPlaceIds || [],
        missingCriteria: p.missingCriteria || [],
        appliedRule: p.appliedRule || ''
      }
    })
    // Stocker les assign counts pour que les étudiants puissent soustraire les sièges pris
    if (assignCounts && Object.keys(assignCounts).length > 0) {
      proposalsMap._assignCounts = assignCounts
    }

    console.log(
      `🔍 SAVE pfp4-proposals: year=${year} class=${classe} students=${Object.keys(proposalsMap).length}`
    )

    // Utiliser supabaseAdmin (service_role) pour bypasser la RLS sur votation_sessions
    // Sauvegarder les propositions dans TOUTES les sessions PFP4 existantes pour cette année/classe
    const { data: existingSessions, error: findError } = await supabaseAdmin
      .from('votation_sessions')
      .select('id, is_priority, status')
      .eq('pfp_type', 'PFP4')
      .eq('year', year)
      .eq('target_class', classe)

    if (findError && findError.code !== 'PGRST116') {
      console.warn('⚠️ Erreur recherche sessions:', findError.message)
    }

    console.log(
      `🔍 Sessions PFP4 existantes pour ${classe}/${year}: ${existingSessions?.length || 0}`
    )
    if (existingSessions) {
      existingSessions.forEach((s) =>
        console.log(`   Session ${s.id}: status=${s.status} priority=${s.is_priority}`)
      )
    }

    const updatePayload = {
      pfp4_proposals: proposalsMap
    }

    let savedSession
    if (existingSessions && existingSessions.length > 0) {
      for (const session of existingSessions) {
        const { error } = await supabaseAdmin
          .from('votation_sessions')
          .update(updatePayload)
          .eq('id', session.id)
        if (error) {
          console.warn(`⚠️ Erreur update session ${session.id}:`, error.message)
        } else {
          console.log(
            `✅ Session ${session.id} mise à jour avec ${Object.keys(proposalsMap).length} propositions`
          )
        }
      }
      savedSession = existingSessions[0]
      console.log(`✅ Propositions mises à jour dans ${existingSessions.length} session(s)`)
    } else {
      console.log("📝 Aucune session existante, création d'une nouvelle...")
      const { data, error } = await supabaseAdmin
        .from('votation_sessions')
        .insert({
          pfp_type: 'PFP4',
          year,
          target_class: classe,
          pfp4_proposals: proposalsMap,
          status: 'closed',
          is_priority: false
        })
        .select()
        .single()
      if (error) throw error
      savedSession = data
      console.log(`✅ Nouvelle session créée: ${savedSession.id}`)
    }

    console.log(`✅ Propositions PFP4 sauvegardées: ${Object.keys(proposalsMap).length} étudiants`)

    return res.json({
      ok: true,
      sessionId: savedSession.id,
      savedCount: Object.keys(proposalsMap).length
    })
  } catch (error) {
    console.error('❌ Erreur save-pfp4-proposals:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * GET /api/resultat-votation/pfp4-proposals/:year
 * Récupère les propositions PFP4 sauvegardées pour un étudiant (via session)
 */
router.get('/pfp4-proposals/:year', setUser, async (req, res) => {
  try {
    const { year } = req.params
    const targetClass = normalizeClass(req.query?.targetClass)
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Authentication required' })
    }

    console.log(`🔍 GET pfp4-proposals: userId=${userId}, year=${year}`)

    // Utiliser supabaseAdmin (service_role) pour bypasser la RLS sur votation_sessions
    let sessionsQuery = supabaseAdmin
      .from('votation_sessions')
      .select('id, pfp4_proposals, status, is_priority, target_class')
      .eq('pfp_type', 'PFP4')
      .eq('year', year)
      .not('pfp4_proposals', 'is', null)

    if (targetClass) {
      sessionsQuery = sessionsQuery.eq('target_class', targetClass)
    }

    const { data: sessions, error } = await sessionsQuery

    if (error) {
      console.error('❌ Erreur query votation_sessions:', error)
      throw error
    }

    console.log(`🔍 Sessions PFP4 avec propositions: ${sessions?.length || 0}`)
    if (sessions && sessions.length > 0) {
      sessions.forEach((s) => {
        const proposalKeys = s.pfp4_proposals ? Object.keys(s.pfp4_proposals) : []
        console.log(
          `   Session ${s.id}: status=${s.status} priority=${s.is_priority} class=${s.target_class} proposals_count=${proposalKeys.length}`
        )
        // Vérifier si userId est dans les propositions
        const hasUser = s.pfp4_proposals && s.pfp4_proposals[userId]
        console.log(
          `   userId ${userId.substring(0, 8)}... found: ${!!hasUser}${hasUser ? ' (' + hasUser.length + ' places)' : ''}`
        )
      })
    }

    // Chercher les propositions pour cet étudiant
    let proposedPlaceIds = null
    let missingCriteria = null
    let appliedRule = null
    let assignCounts = null
    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const proposals = session.pfp4_proposals
        if (proposals && proposals[userId]) {
          const userData = proposals[userId]
          // Rétro-compatibilité : ancien format = array, nouveau format = { placeIds, missingCriteria, appliedRule }
          if (Array.isArray(userData)) {
            proposedPlaceIds = userData
          } else {
            proposedPlaceIds = userData.placeIds || []
            missingCriteria = userData.missingCriteria || []
            appliedRule = userData.appliedRule || null
          }
          assignCounts = proposals._assignCounts || null
          console.log(
            `✅ Propositions trouvées pour ${userId.substring(0, 8)}: ${proposedPlaceIds.length} places, missing=[${(missingCriteria || []).join(',')}], rule=${appliedRule}, assignCounts: ${assignCounts ? Object.keys(assignCounts).length + ' places' : 'aucun'}`
          )
          break
        }
      }
    }

    if (Array.isArray(proposedPlaceIds) && proposedPlaceIds.length > 0) {
      const completedPlaceIds = await getCompletedPlaceIdsForUser(userId)
      proposedPlaceIds = proposedPlaceIds.filter(
        (placeId) => !completedPlaceIds.has(String(placeId))
      )
    }

    if (!proposedPlaceIds) {
      console.log(`⚠️ Aucune proposition trouvée pour ${userId.substring(0, 8)}`)
    }

    return res.json({
      ok: true,
      proposedPlaceIds,
      missingCriteria,
      appliedRule,
      assignCounts
    })
  } catch (error) {
    console.error('❌ Erreur get pfp4-proposals:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * GET /api/resultat-votation/results/:pfpType/:year
 * Récupère tous les résultats pour un PFP et une année
 */
router.get('/results/:pfpType/:year', requireAdmin, async (req, res) => {
  try {
    const { pfpType, year } = req.params
    const { algorithmRunId } = req.query

    const { data, error } = await supabase.rpc('get_algorithm_results', {
      p_pfp_type: pfpType,
      p_year: year,
      p_algorithm_run_id: algorithmRunId || null
    })

    if (error) throw error

    return res.json({ ok: true, results: data || [] })
  } catch (error) {
    console.error('❌ Erreur get results:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * GET /api/resultat-votation/student/:userId/:pfpType/:year
 * Récupère le résultat d'un étudiant spécifique
 */
router.get('/student/:userId/:pfpType/:year', setUser, async (req, res) => {
  try {
    const { userId, pfpType, year } = req.params

    // Vérifier que l'utilisateur peut accéder à ce résultat
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' })
    }

    // L'utilisateur peut voir son propre résultat ou un admin peut voir tous les résultats
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', req.user.id)
      .single()

    const isAdmin = profile && ['admin', 'superadmin'].includes(profile.role)
    const isOwnResult = req.user.id === userId

    if (!isAdmin && !isOwnResult) {
      return res.status(403).json({ ok: false, error: 'Access denied' })
    }

    const { data, error } = await supabase.rpc('get_student_result', {
      p_user_id: userId,
      p_pfp_type: pfpType,
      p_year: year
    })

    if (error) throw error

    return res.json({ ok: true, result: data })
  } catch (error) {
    console.error('❌ Erreur get student result:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * GET /api/resultat-votation/statistics/:pfpType/:year
 * Récupère les statistiques des résultats
 */
router.get('/statistics/:pfpType/:year', requireAdmin, async (req, res) => {
  try {
    const { pfpType, year } = req.params

    const { data, error } = await supabase
      .from('result_statistics')
      .select('*')
      .eq('pfp_type', pfpType)
      .eq('year', year)

    if (error) throw error

    return res.json({ ok: true, statistics: data || [] })
  } catch (error) {
    console.error('❌ Erreur get statistics:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * PUT /api/resultat-votation/status/:resultId
 * Met à jour le statut d'un résultat
 */
router.put('/status/:resultId', requireAdmin, async (req, res) => {
  try {
    const { resultId } = req.params
    const { status, notes } = req.body

    if (!status || !['assigned', 'pending', 'rejected', 'confirmed'].includes(status)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid status. Must be: assigned, pending, rejected, or confirmed'
      })
    }

    const updateData = { status, updated_at: new Date().toISOString() }
    if (notes) updateData.notes = notes

    const { data, error } = await supabase
      .from('student_result_vote')
      .update(updateData)
      .eq('id', resultId)
      .select()
      .single()

    if (error) throw error

    return res.json({ ok: true, result: data })
  } catch (error) {
    console.error('❌ Erreur update status:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * DELETE /api/resultat-votation/:resultId
 * Supprime un résultat d'attribution
 */
router.delete('/:resultId', requireAdmin, async (req, res) => {
  try {
    const { resultId } = req.params

    const { error } = await supabase.from('student_result_vote').delete().eq('id', resultId)

    if (error) throw error

    return res.json({ ok: true, message: 'Result deleted successfully' })
  } catch (error) {
    console.error('❌ Erreur delete result:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

/**
 * DELETE /api/resultat-votation/algorithm-run/:algorithmRunId
 * Supprime tous les résultats d'une exécution d'algorithme
 */
router.delete('/algorithm-run/:algorithmRunId', requireAdmin, async (req, res) => {
  try {
    const { algorithmRunId } = req.params

    const { data, error } = await supabase
      .from('student_result_vote')
      .delete()
      .eq('algorithm_run_id', algorithmRunId)
      .select()

    if (error) throw error

    return res.json({
      ok: true,
      message: 'Algorithm run results deleted successfully',
      deletedCount: data?.length || 0
    })
  } catch (error) {
    console.error('❌ Erreur delete algorithm run:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

module.exports = router

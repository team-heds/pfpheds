const { Router } = require('express')
const supabase = require('../supabaseClient')
const { v4: uuidv4 } = require('uuid')

const router = Router()

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
    const { pfpType, year, students, places } = req.body

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
    const { data: existingAssignments, error: existingError } = await supabase
      .from('student_result_vote')
      .select('user_id, assigned_place_id, assigned_rank, status, notes')
      .eq('pfp_type', pfpType)
      .eq('year', year)

    if (existingError) {
      console.warn('⚠️ Impossible de charger les assignations existantes:', existingError.message)
    }

    const preAssigned = new Set()
    const preAssignedByPlace = new Map() // PlaceId → count
    if (existingAssignments && existingAssignments.length > 0) {
      existingAssignments.forEach(a => {
        if (a.assigned_place_id && a.user_id) {
          preAssigned.add(a.user_id)
          preAssignedByPlace.set(
            a.assigned_place_id,
            (preAssignedByPlace.get(a.assigned_place_id) || 0) + 1
          )
        }
      })
      console.log(`🛡️ ${preAssigned.size} étudiants déjà assignés (manuel/prioritaire/précédent) — exclus de l'algorithme`)
      console.log(`🛡️ ${preAssignedByPlace.size} places ont déjà des assignations`)
    }

    // Filtrer les étudiants : exclure ceux déjà assignés
    const eligibleStudents = students.filter(s => !preAssigned.has(s.userId))
    console.log(`   Étudiants éligibles (après exclusion): ${eligibleStudents.length}/${students.length}`)

    // Créer un mapping des places disponibles avec leur capacité
    const placesMap = new Map()
    places.forEach(place => {
      const alreadyUsed = preAssignedByPlace.get(place.PlaceId) || 0
      placesMap.set(place.PlaceId, {
        ...place,
        remainingCapacity: Math.max(0, (place.Capacity || 1) - alreadyUsed),
        assignedStudents: [],
        voteCount: 0 // Compteur de votes pour cette place
      })
    })

    // 🎯 ÉTAPE 1: Calculer la popularité de chaque place (nombre de fois qu'elle apparaît dans les votes)
    eligibleStudents.forEach(student => {
      const choices = student.choices || []
      choices.forEach(choice => {
        const placeData = placesMap.get(choice.placeId)
        if (placeData) {
          placeData.voteCount++
        }
      })
    })

    console.log('📊 Popularité des places calculée:')
    const sortedPlacesByPopularity = Array.from(placesMap.values())
      .sort((a, b) => a.voteCount - b.voteCount) // Tri croissant = places MOINS populaires d'abord
    
    console.log('   🟢 Top 5 places MOINS populaires (traitées en premier):')
    sortedPlacesByPopularity.slice(0, 5).forEach(p => {
      console.log(`      - ${p.NomPlace}: ${p.voteCount} votes, capacité: ${p.Capacity}`)
    })
    
    console.log('   🔴 Top 5 places PLUS populaires (traitées en dernier):')
    sortedPlacesByPopularity.slice(-5).reverse().forEach(p => {
      console.log(`      - ${p.NomPlace}: ${p.voteCount} votes, capacité: ${p.Capacity}`)
    })

    // 🚀 OPTIMISATION: Collecter tous les résultats puis faire un batch insert
    const resultsToInsert = []
    const assignedStudents = new Set() // Suivre les étudiants déjà assignés par cet algorithme

    // 🎯 ÉTAPE 2: Traiter les places par ordre de popularité croissante (moins demandées d'abord)
    console.log('🔄 Attribution par places (moins populaires → plus populaires)...')
    
    for (const placeData of sortedPlacesByPopularity) {
      // Ignorer les places sans capacité restante (déjà remplies par assignations manuelles)
      if (placeData.remainingCapacity <= 0) continue

      // Trouver tous les étudiants qui ont choisi cette place et qui ne sont pas encore assignés
      const candidatesForPlace = []
      
      eligibleStudents.forEach(student => {
        // Ignorer si déjà assigné par cet algorithme
        if (assignedStudents.has(student.userId)) return
        
        const choices = student.choices || []
        const choiceRank = choices.findIndex(c => c.placeId === placeData.PlaceId)
        
        if (choiceRank !== -1) {
          candidatesForPlace.push({
            student,
            rank: choiceRank + 1,
            priorityScore: student.priorityScore || 0
          })
        }
      })

      if (candidatesForPlace.length === 0) continue

      // Trier les candidats : 
      // 1. Par rang de choix (1er choix prioritaire)
      // 2. Par score de priorité
      // 3. Aléatoire
      candidatesForPlace.sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank
        if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore
        return Math.random() - 0.5
      })

      // Assigner jusqu'à la capacité restante de la place
      const toAssign = Math.min(candidatesForPlace.length, placeData.remainingCapacity)
      
      for (let i = 0; i < toAssign; i++) {
        const candidate = candidatesForPlace[i]
        const student = candidate.student
        
        // Marquer comme assigné
        assignedStudents.add(student.userId)
        placeData.remainingCapacity--
        placeData.assignedStudents.push(student.userId)

        // Ajouter à la liste pour batch insert
        resultsToInsert.push({
          user_id: student.userId,
          pfp_type: pfpType,
          year: year,
          assigned_place_id: placeData.PlaceId,
          assigned_place_name: placeData.NomPlace,
          assigned_institution_name: placeData.InstitutionName || '',
          assigned_rank: candidate.rank,
          algorithm_run_id: algorithmRunId,
          original_choices: student.choices || [],
          priority_score: student.priorityScore || null,
          notes: `Attributed by algorithm v3.0 (optimized by place popularity) on ${new Date().toISOString()}`
        })
      }

      if (toAssign > 0) {
        console.log(`   ✅ ${placeData.NomPlace}: ${toAssign}/${candidatesForPlace.length} candidats assignés (${placeData.voteCount} votes totaux)`)
      }
    }

    // 🎯 ÉTAPE 3: Assigner aléatoirement les étudiants restants aux places vides
    console.log('🎲 Attribution aléatoire des étudiants restants aux places vides...')
    
    // Trouver les places avec capacité restante
    const placesAvecCapacite = Array.from(placesMap.values())
      .filter(p => p.remainingCapacity > 0)
      .sort(() => Math.random() - 0.5) // Mélanger aléatoirement
    
    // Trouver les étudiants non assignés (parmi les éligibles uniquement)
    const studentsNonAssignes = eligibleStudents
      .filter(s => !assignedStudents.has(s.userId))
      .sort(() => Math.random() - 0.5) // Mélanger aléatoirement
    
    console.log(`   📊 ${placesAvecCapacite.length} places avec capacité restante`)
    console.log(`   📊 ${studentsNonAssignes.length} étudiants non assignés`)
    
    let randomAssignmentCount = 0
    
    // Assigner aléatoirement
    for (const student of studentsNonAssignes) {
      // Trouver une place disponible
      const placeDisponible = placesAvecCapacite.find(p => p.remainingCapacity > 0)
      
      if (placeDisponible) {
        // Assigner
        assignedStudents.add(student.userId)
        placeDisponible.remainingCapacity--
        placeDisponible.assignedStudents.push(student.userId)
        randomAssignmentCount++
        
        resultsToInsert.push({
          user_id: student.userId,
          pfp_type: pfpType,
          year: year,
          assigned_place_id: placeDisponible.PlaceId,
          assigned_place_name: placeDisponible.NomPlace,
          assigned_institution_name: placeDisponible.InstitutionName || '',
          assigned_rank: 99, // Rang spécial pour attribution aléatoire
          algorithm_run_id: algorithmRunId,
          original_choices: student.choices || [],
          priority_score: student.priorityScore || null,
          notes: `⚠️ ATTRIBUTION ALÉATOIRE (place non dans les choix) - Algorithm v3.0 on ${new Date().toISOString()}`
        })
        
        console.log(`   🎲 Attribution aléatoire: ${student.userId} → ${placeDisponible.NomPlace}`)
      } else {
        // Vraiment aucune place disponible
        console.warn(`⚠️ Aucune place disponible pour ${student.userId} (même en aléatoire)`)
        errors.push({
          userId: student.userId,
          error: 'No available place (including random assignment)'
        })
      }
    }
    
    if (randomAssignmentCount > 0) {
      console.log(`   ✅ ${randomAssignmentCount} étudiants assignés aléatoirement`)
    }

    // 🚀 BATCH INSERT: Insérer tous les résultats en une seule transaction
    console.log(`💾 Enregistrement de ${resultsToInsert.length} résultats en batch...`)
    
    if (resultsToInsert.length > 0) {
      const { data: batchResult, error: batchError } = await supabase.rpc('batch_upsert_student_results', {
        p_results: resultsToInsert
      })

      if (batchError) {
        console.error('❌ Erreur batch insert:', batchError)
        return res.status(500).json({ 
          ok: false, 
          error: 'Failed to save results: ' + batchError.message 
        })
      }

      console.log(`✅ Batch insert: ${batchResult[0].success_count} succès, ${batchResult[0].error_count} erreurs`)
      
      // Ajouter les erreurs du batch
      if (batchResult[0].errors && batchResult[0].errors.length > 0) {
        errors.push(...batchResult[0].errors)
      }
    }

    // Statistiques finales optimisées
    const placesUsedCount = Array.from(placesMap.values()).filter(p => p.assignedStudents.length > 0).length
    const randomAssignments = resultsToInsert.filter(r => r.assigned_rank === 99)
    const normalAssignments = resultsToInsert.filter(r => r.assigned_rank < 99)
    
    const stats = {
      totalStudents: students.length,
      preAssignedCount: preAssigned.size,
      eligibleStudents: eligibleStudents.length,
      successfulAssignments: resultsToInsert.length,
      failedAssignments: errors.length,
      placesUsed: placesUsedCount,
      firstChoiceCount: resultsToInsert.filter(r => r.assigned_rank === 1).length,
      secondChoiceCount: resultsToInsert.filter(r => r.assigned_rank === 2).length,
      thirdChoiceCount: resultsToInsert.filter(r => r.assigned_rank === 3).length,
      randomAssignmentCount: randomAssignments.length, // 🆕 Attributions aléatoires
      averageRank: normalAssignments.length > 0 
        ? (normalAssignments.reduce((sum, r) => sum + r.assigned_rank, 0) / normalAssignments.length).toFixed(2)
        : 0
    }

    // 📋 Construire la liste des places avec leurs assignations
    const placesWithAssignments = Array.from(placesMap.values()).map(place => {
      const assignments = resultsToInsert.filter(r => r.assigned_place_id === place.PlaceId)
      
      return {
        placeId: place.PlaceId,
        placeName: place.NomPlace,
        institutionId: place.InstitutionId,
        institutionName: place.InstitutionName,
        totalCapacity: place.Capacity,
        remainingCapacity: place.remainingCapacity,
        assignedCount: assignments.length,
        assignedStudents: assignments.map(a => ({
          userId: a.user_id,
          rank: a.assigned_rank,
          priorityScore: a.priority_score
        }))
      }
    }).sort((a, b) => {
      // Trier par nombre d'assignations (décroissant), puis par nom de place
      if (b.assignedCount !== a.assignedCount) {
        return b.assignedCount - a.assignedCount
      }
      return (a.placeName || '').localeCompare(b.placeName || '')
    })

    console.log(`✅ Algorithme terminé:`, stats)
    console.log(`📋 Places avec assignations: ${placesWithAssignments.filter(p => p.assignedCount > 0).length}/${placesWithAssignments.length}`)

    return res.json({ 
      ok: true, 
      algorithmRunId,
      results: resultsToInsert,
      placesWithAssignments, // 🆕 Liste des places avec étudiants assignés
      errors,
      stats
    })
  } catch (error) {
    console.error('❌ Erreur run-algorithm:', error)
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

    const { error } = await supabase
      .from('student_result_vote')
      .delete()
      .eq('id', resultId)

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

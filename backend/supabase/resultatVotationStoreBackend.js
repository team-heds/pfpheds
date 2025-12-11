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

    // Créer un mapping des places disponibles avec leur capacité
    const placesMap = new Map()
    places.forEach(place => {
      placesMap.set(place.PlaceId, {
        ...place,
        remainingCapacity: place.Capacity || 1,
        assignedStudents: []
      })
    })

    // 🎯 OPTIMISATION: Tri intelligent des étudiants
    // 1. Priorité aux étudiants avec moins de choix (plus difficile à placer)
    // 2. Puis par score de priorité si disponible
    // 3. Puis aléatoire pour équité
    const sortedStudents = [...students].sort((a, b) => {
      const aChoicesCount = (a.choices || []).length
      const bChoicesCount = (b.choices || []).length
      
      // Priorité aux étudiants avec moins de choix
      if (aChoicesCount !== bChoicesCount) {
        return aChoicesCount - bChoicesCount
      }
      
      // Ensuite par score de priorité
      if (a.priorityScore && b.priorityScore) {
        return b.priorityScore - a.priorityScore
      }
      
      // Sinon aléatoire
      return Math.random() - 0.5
    })

    // 🚀 OPTIMISATION: Collecter tous les résultats puis faire un batch insert
    const resultsToInsert = []
    
    // Attribution des places
    for (const student of sortedStudents) {
      try {
        const choices = student.choices || []
        let assigned = false
        let assignedRank = null
        let assignedPlace = null

        // Parcourir les choix de l'étudiant dans l'ordre
        for (let i = 0; i < choices.length && !assigned; i++) {
          const choice = choices[i]
          const placeData = placesMap.get(choice.placeId)

          if (placeData && placeData.remainingCapacity > 0) {
            // Place disponible, on l'attribue
            assignedPlace = placeData
            assignedRank = i + 1
            assigned = true

            // Décrémenter la capacité
            placeData.remainingCapacity--
            placeData.assignedStudents.push(student.userId)

            // Ajouter à la liste pour batch insert
            resultsToInsert.push({
              user_id: student.userId,
              pfp_type: pfpType,
              year: year,
              assigned_place_id: assignedPlace.PlaceId,
              assigned_place_name: assignedPlace.NomPlace,
              assigned_institution_name: assignedPlace.InstitutionName || '',
              assigned_rank: assignedRank,
              algorithm_run_id: algorithmRunId,
              original_choices: choices,
              priority_score: student.priorityScore || null,
              notes: `Attributed by algorithm v2.0 (batch) on ${new Date().toISOString()}`
            })
          }
        }

        if (!assigned) {
          console.warn(`⚠️ Aucune place disponible pour ${student.userId}`)
          errors.push({
            userId: student.userId,
            error: 'No available place matching student choices'
          })
        }
      } catch (studentError) {
        console.error(`❌ Erreur traitement étudiant ${student.userId}:`, studentError)
        errors.push({
          userId: student.userId,
          error: studentError.message
        })
      }
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
    const stats = {
      totalStudents: students.length,
      successfulAssignments: resultsToInsert.length,
      failedAssignments: errors.length,
      placesUsed: placesUsedCount,
      firstChoiceCount: resultsToInsert.filter(r => r.assigned_rank === 1).length,
      secondChoiceCount: resultsToInsert.filter(r => r.assigned_rank === 2).length,
      thirdChoiceCount: resultsToInsert.filter(r => r.assigned_rank === 3).length,
      averageRank: resultsToInsert.length > 0 
        ? (resultsToInsert.reduce((sum, r) => sum + r.assigned_rank, 0) / resultsToInsert.length).toFixed(2)
        : 0
    }

    console.log(`✅ Algorithme terminé:`, stats)

    return res.json({ 
      ok: true, 
      algorithmRunId,
      results: resultsToInsert,
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

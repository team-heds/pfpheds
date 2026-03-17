import { ref } from 'vue'
import { supabase } from '@/supabase'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import resultatVotationService from '@/service/resultatVotationService'

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

export function useVotationAlgorithm(toast) {
  const algorithmResults = ref([])
  const algorithmStats = ref(null)
  const placesWithAssignments = ref([])
  const algorithmLoading = ref(false)

  const placesStore = usePlacesStore()
  const institutionsStore = useInstitutionsStore()

  const startAlgorithm = async (filterPFP, filterYear, filterClasse, canShowResults, filteredVotationsList, excludedStudentIds, loadData) => {
    // eslint-disable-next-line no-constant-condition
    if ("a" === "a") {
      toast.add({
        severity: 'warning',
        summary: 'Stop',
        detail: 'Refais pas un algo',
        life: 3000
      })
      return
    }

    if (!canShowResults) {
      toast.add({
        severity: 'warning',
        summary: 'Sélection incomplète',
        detail: 'Veuillez sélectionner une année et un PFP',
        life: 3000
      })
      return
    }

    if (filteredVotationsList.length === 0) {
      toast.add({
        severity: 'warning',
        summary: 'Aucun étudiant',
        detail: 'Aucun étudiant avec des choix à traiter',
        life: 3000
      })
      return
    }

    algorithmLoading.value = true

    try {
      console.log('🚀 Démarrage de l\'algorithme d\'attribution')
      console.log('Configuration:', {
        year: filterYear,
        pfp: filterPFP,
        studentsCount: filteredVotationsList.length
      })

      toast.add({
        severity: 'info',
        summary: 'Algorithme en cours',
        detail: `Traitement de ${filteredVotationsList.length} étudiants ${filterClasse}...`,
        life: 5000
      })

      // ══════════════════════════════════════════════════════════════════
      // PRIORITY SCORE v2.0 — Calcul basé sur critères métier
      // ══════════════════════════════════════════════════════════════════

      // Source 1: StudentsPhysio.pfp_valided
      const { data: physioData } = await supabase
        .from('StudentsPhysio')
        .select('user_id, pfp_valided, sae, cas_particulier')

      // Source 2: student_result_vote (stages validés = pfp_validee true)
      const { data: validatedAssignments } = await supabase
        .from('student_result_vote')
        .select('user_id, pfp_type, assigned_place_id, pfp_validee')

      // Charger les places pour résoudre les critères des stages validés
      await placesStore.fetchPlaces()
      const placesLookupForScore = new Map()
      placesStore.places.forEach(p => placesLookupForScore.set(p.PlaceId, p))

      // Construire un map userId → critères validés + places déjà faites (fusion des 2 sources)
      const studentCriteriaMap = new Map()
      const studentDonePlaceIds = new Map()

      // Source 1: pfp_valided
      if (physioData) {
        physioData.forEach(physio => {
          const validatedCriteria = { MSQ: 0, SYSINT: 0, NEUROGER: 0, AIGU: 0, REHAB: 0, AMBU: 0, FR: 0, DE: 0 }
          const donePlaces = new Set()
          let pfpArray = []
          if (physio.pfp_valided) {
            try {
              pfpArray = typeof physio.pfp_valided === 'string' ? JSON.parse(physio.pfp_valided) : physio.pfp_valided
              if (!Array.isArray(pfpArray)) pfpArray = Object.values(pfpArray)
            } catch (e) { pfpArray = [] }
          }
          pfpArray.forEach(stage => {
            CRITERIA_KEYS.forEach(c => {
              if (stage[c] === true || stage[c] === 'true' || stage[c] === 1 || stage[c.toLowerCase()] === true) {
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
      }

      // Source 2: enrichir avec student_result_vote (stages validés)
      if (validatedAssignments) {
        validatedAssignments.forEach(a => {
          if (a.assigned_place_id) {
            if (!studentDonePlaceIds.has(a.user_id)) studentDonePlaceIds.set(a.user_id, new Set())
            studentDonePlaceIds.get(a.user_id).add(a.assigned_place_id)
          }
          if (a.pfp_validee && a.assigned_place_id) {
            const placeInfo = placesLookupForScore.get(a.assigned_place_id)
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
      }

      console.log(`📊 Critères chargés pour ${studentCriteriaMap.size} étudiants (pfp_valided + student_result_vote)`)

      // ══════════════════════════════════════════════════════════════════
      // computePriorityScore v2.0
      // ══════════════════════════════════════════════════════════════════
      const currentPfp = filterPFP

      const computePriorityScore = (userId) => {
        const profile = studentCriteriaMap.get(userId)
        if (!profile) {
          console.warn(`   ⚠️ Pas de profil pour ${userId} → score minimal`)
          return Math.round(Math.random() * 100) / 100
        }

        const missingCriteria = CRITERIA_KEYS.filter(c => profile.criteria[c] === 0)
        const missingCount = missingCriteria.length
        const missingGlobalScore = (missingCount / CRITERIA_KEYS.length) * 40
        const bonusDE = profile.criteria.DE === 0 ? 15 : 0
        const bonusSYSINT = profile.criteria.SYSINT === 0 ? 10 : 0
        const bonusSae = profile.sae ? 12 : 0
        const bonusCas = profile.casParticulier ? 8 : 0

        let pfpMultiplier = 1.0
        if (currentPfp === 'PFP4') pfpMultiplier = 1.15
        else if (currentPfp === 'PFP3') pfpMultiplier = 1.05

        const tiebreaker = Math.random() * 1
        const rawScore = missingGlobalScore + bonusDE + bonusSYSINT + bonusSae + bonusCas + tiebreaker
        const finalScore = Math.round(rawScore * pfpMultiplier * 100) / 100

        return finalScore
      }

      // ── Exclure les étudiants déjà assignés et ceux exclus manuellement ──
      const { data: existingAssignments } = await supabase
        .from('student_result_vote')
        .select('user_id, assigned_place_id')
        .eq('pfp_type', filterPFP)
      
      const alreadyAssignedUserIds = new Set()
      const alreadyAssignedPlaceCounts = new Map()
      if (existingAssignments) {
        existingAssignments.forEach(a => {
          if (a.assigned_place_id) {
            alreadyAssignedUserIds.add(a.user_id)
            alreadyAssignedPlaceCounts.set(a.assigned_place_id, (alreadyAssignedPlaceCounts.get(a.assigned_place_id) || 0) + 1)
          }
        })
      }
      const manualExclusions = new Set(excludedStudentIds || [])

      const eligibleVotations = filteredVotationsList.filter(student => {
        if (alreadyAssignedUserIds.has(student.userId)) {
          console.log(`   ❌ Exclu (déjà assigné ${filterPFP}): ${student.nom} ${student.prenom}`)
          return false
        }
        if (manualExclusions.has(student.userId)) {
          console.log(`   ❌ Exclu (manuellement): ${student.nom} ${student.prenom}`)
          return false
        }
        return true
      })

      console.log(`📊 ${filteredVotationsList.length} votants → ${eligibleVotations.length} éligibles (${filteredVotationsList.length - eligibleVotations.length} exclus)`)

      if (eligibleVotations.length === 0) {
        toast.add({ severity: 'warn', summary: 'Aucun étudiant éligible', detail: 'Tous les étudiants sont déjà assignés ou exclus', life: 5000 })
        return
      }

      // Préparer les données des étudiants pour l'algorithme
      const studentsData = eligibleVotations.map(student => {
        const profile = studentCriteriaMap.get(student.userId)
        const score = computePriorityScore(student.userId)
        const missing = profile ? CRITERIA_KEYS.filter(c => profile.criteria[c] === 0) : [...CRITERIA_KEYS]
        const donePlaces = studentDonePlaceIds.get(student.userId)
        return {
          userId: student.userId,
          nom: student.nom,
          prenom: student.prenom,
          classe: student.classe,
          choices: [
            student.choice1PlaceId,
            student.choice2PlaceId,
            student.choice3PlaceId,
            student.choice4PlaceId,
            student.choice5PlaceId
          ].filter(Boolean),
          missingCriteria: missing,
          donePlaceIds: donePlaces ? [...donePlaces] : [],
          priorityScore: score,
          _debug: profile ? {
            missing,
            validated: CRITERIA_KEYS.filter(c => profile.criteria[c] > 0),
            sae: profile.sae,
            casParticulier: profile.casParticulier,
            donePlaceIds: donePlaces ? donePlaces.size : 0
          } : null
        }
      })

      // Log détaillé du breakdown des scores
      const sortedForLog = [...studentsData].sort((a, b) => b.priorityScore - a.priorityScore)
      console.log('══════════════════════════════════════════════')
      console.log(`📊 PRIORITY SCORES v2.0 — ${currentPfp} ${filterYear} (×${currentPfp === 'PFP4' ? '1.15' : currentPfp === 'PFP3' ? '1.05' : '1.0'})`)
      console.log('══════════════════════════════════════════════')
      sortedForLog.forEach((s, i) => {
        const d = s._debug
        if (d) {
          console.log(`   ${i + 1}. ${s.nom} ${s.prenom}: ${s.priorityScore} pts | manquants=[${d.missing.join(',')}] validés=[${d.validated.join(',')}]${d.sae ? ' SAE' : ''}${d.casParticulier ? ' CAS_PART' : ''}`)
        } else {
          console.log(`   ${i + 1}. ${s.nom} ${s.prenom}: ${s.priorityScore} pts | ⚠️ PAS DE PROFIL`)
        }
      })
      console.log('══════════════════════════════════════════════')

      // Récupérer toutes les places disponibles
      await placesStore.fetchPlaces()
      await institutionsStore.fetchInstitutions()

      const institutionMap = new Map()
      institutionsStore.institutions.forEach(inst => {
        institutionMap.set(inst.InstitutionId, inst)
      })

      // Filtrer les places selon le PFP sélectionné
      const placesData = placesStore.places
        .map(place => {
          const institution = institutionMap.get(place.InstitutionId)
          
          const propositionKey = `${filterPFP.toLowerCase()}_proposition`
          let capacity = 0
          if (place[propositionKey] && place[propositionKey][filterYear]) {
            capacity = parseInt(place[propositionKey][filterYear])
          }
          
          if (!capacity || isNaN(capacity) || capacity < 1) {
            return null
          }

          const alreadyAssigned = alreadyAssignedPlaceCounts.get(place.PlaceId) || 0
          const remainingCapacity = capacity - alreadyAssigned
          if (remainingCapacity < 1) {
            console.log(`   ❌ Place pleine: ${place.NomPlace} (${alreadyAssigned}/${capacity} assignés)`)
            return null
          }
          
          const placeCriteria = {}
          CRITERIA_KEYS.forEach(c => {
            placeCriteria[c] = !!(place[c] === true || place[c] === 'true' || place[c] === 1)
          })

          return {
            PlaceId: place.PlaceId,
            NomPlace: place.NomPlace,
            InstitutionId: place.InstitutionId,
            InstitutionName: institution?.Name || 'Inconnu',
            Capacity: remainingCapacity,
            criteria: placeCriteria
          }
        })
        .filter(Boolean)

      console.log('📊 Données préparées:', {
        students: studentsData.length,
        places: placesData.length
      })

      // Lancer l'algorithme via le backend
      const result = await resultatVotationService.runAlgorithm(
        filterPFP,
        filterYear,
        studentsData,
        placesData
      )

      console.log('✅ Résultat de l\'algorithme:', result)

      algorithmResults.value = result.results || []
      algorithmStats.value = result.stats || {}
      placesWithAssignments.value = result.placesWithAssignments || []

      const stats = result.stats || {}
      toast.add({
        severity: 'success',
        summary: 'Algorithme v4.0 terminé',
        detail: `${stats.successfulAssignments || 0} attributions (${stats.fromChoicesCount || 0} depuis choix, ${stats.randomAssignmentCount || 0} hors choix)`,
        life: 8000
      })

      toast.add({
        severity: stats.lesedCount > 0 ? 'warn' : 'info',
        summary: 'Couverture critères',
        detail: `Moy. critères couverts: ${stats.avgCriteriaCoveredFromChoices || 0} | Lésés (0 critères): ${stats.lesedCount || 0}`,
        life: 8000
      })

      if (result.errors && result.errors.length > 0) {
        toast.add({
          severity: 'warn',
          summary: 'Avertissements',
          detail: `${result.errors.length} étudiants n'ont pas pu être attribués`,
          life: 5000
        })
      }

      // Recharger les données pour afficher les résultats
      if (loadData) await loadData()

    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution de l\'algorithme:', error)
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible d\'exécuter l\'algorithme: ' + error.message,
        life: 8000
      })
    } finally {
      algorithmLoading.value = false
    }
  }

  const resetAlgorithm = () => {
    algorithmResults.value = []
    algorithmStats.value = null
    placesWithAssignments.value = []
  }

  return {
    algorithmResults,
    algorithmStats,
    placesWithAssignments,
    algorithmLoading,
    startAlgorithm,
    resetAlgorithm
  }
}

import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import resultatVotationService from '@/service/resultatVotationService'

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

export function usePfp4Proposals(toast, excludedStudentIds, votationsList) {
  const pfp4Proposals = ref([])
  const pfp4AllPlaces = ref([])
  const pfp4Stats = ref(null)
  const pfp4Loading = ref(false)
  const pfp4Saved = ref(false)
  const pfp4SearchQuery = ref('')
  const pfp4FilterRule = ref(null)

  const pfp4RuleLabels = {
    DE_ONLY: 'Manque DE uniquement',
    DE_AND_SYSINT: 'Manque DE + SYSINT',
    SYSINT_ONLY: 'Manque SYSINT uniquement',
    SYSINT_AND_OTHER: 'Manque SYSINT + autre',
    OTHER_MISSING: 'Autres critères manquants',
    ALL_COMPLETE: 'Tous critères validés'
  }

  const pfp4RuleSeverity = {
    DE_ONLY: 'warning',
    DE_AND_SYSINT: 'danger',
    SYSINT_ONLY: 'info',
    SYSINT_AND_OTHER: 'warning',
    OTHER_MISSING: 'secondary',
    ALL_COMPLETE: 'success'
  }

  const filteredPfp4Proposals = computed(() => {
    let filtered = [...pfp4Proposals.value]
    if (pfp4SearchQuery.value && pfp4SearchQuery.value.trim()) {
      const q = pfp4SearchQuery.value.toLowerCase().trim()
      filtered = filtered.filter(p => 
        (p.nom || '').toLowerCase().includes(q) || 
        (p.prenom || '').toLowerCase().includes(q)
      )
    }
    if (pfp4FilterRule.value) {
      filtered = filtered.filter(p => p.appliedRule === pfp4FilterRule.value)
    }
    return filtered
  })

  const generatePfp4Proposals = async (filterYear, filterClasse) => {
    if (!filterYear || !filterClasse) {
      toast.add({ severity: 'warn', summary: 'Sélection incomplète', detail: 'Veuillez sélectionner une classe et une année', life: 3000 })
      return
    }
    pfp4Loading.value = true
    pfp4Saved.value = false
    try {
      const year = filterYear
      const classe = filterClasse

      // ── 1. Charger toutes les données (même approche que VerificationCriteresEtudiants) ──
      const [allStudentsData, physioResult, assignmentsResult, placesResult] = await Promise.all([
        getAllStudents(),
        supabase.from('StudentsPhysio').select('user_id, pfp_valided, sae, cas_particulier'),
        supabase.from('student_result_vote').select('*').order('year', { ascending: false }),
        supabase.from('places').select('*')
      ])

      console.log('══════════════════════════════════════════════')
      console.log('📦 PFP4 PROPOSALS — Données chargées:')
      console.log(`   Étudiants (getAllStudents): ${allStudentsData.length}`)
      console.log(`   StudentsPhysio: ${physioResult.data?.length || 0} ${physioResult.error ? '⚠️ ' + physioResult.error.message : '✅'}`)
      console.log(`   student_result_vote: ${assignmentsResult.data?.length || 0} ${assignmentsResult.error ? '⚠️ ' + assignmentsResult.error.message : '✅'}`)
      console.log(`   places: ${placesResult.data?.length || 0} ${placesResult.error ? '⚠️ ' + placesResult.error.message : '✅'}`)

      const allClassStudents = allStudentsData.filter(s => (s.Classe || s.classe || '') === classe)
      console.log(`   Étudiants ${classe}: ${allClassStudents.length}`)

      // ── 1b. Exclure les étudiants déjà assignés en PFP4 et ceux exclus manuellement ──
      const pfp4AssignedUserIds = new Set()
      if (assignmentsResult.data) {
        assignmentsResult.data.forEach(a => {
          if (a.pfp_type === 'PFP4' && a.assigned_place_id) {
            pfp4AssignedUserIds.add(a.user_id)
          }
        })
      }
      const manuallyExcludedIds = new Set(excludedStudentIds.value || [])

      const classStudents = allClassStudents.filter(s => {
        const uid = s.id || s.user_id
        if (pfp4AssignedUserIds.has(uid)) return false
        if (manuallyExcludedIds.has(uid)) return false
        // Exclure les profils fantômes (pas de nom = pas un vrai étudiant)
        const nom = s.Nom || s.nom || s.family_name || ''
        if (!nom || nom === 'Nom non disponible') {
          console.log(`   👻 Ghost exclu: user_id=${uid} (pas de nom)`)
          return false
        }
        return true
      })

      const excludedAssigned = allClassStudents.filter(s => pfp4AssignedUserIds.has(s.id || s.user_id))
      const excludedManual = allClassStudents.filter(s => manuallyExcludedIds.has(s.id || s.user_id) && !pfp4AssignedUserIds.has(s.id || s.user_id))
      console.log(`   ❌ Exclus (déjà assignés PFP4): ${excludedAssigned.length}`)
      excludedAssigned.forEach(s => console.log(`      - ${s.Nom || s.nom} ${s.Prenom || s.prenom}`))
      console.log(`   ❌ Exclus (manuellement): ${excludedManual.length}`)
      excludedManual.forEach(s => console.log(`      - ${s.Nom || s.nom} ${s.Prenom || s.prenom}`))
      console.log(`   → ${classStudents.length} étudiants restants pour la génération`)

      // ── 2. Map des places (avec critères) ──
      const placesMap = new Map()
      ;(placesResult.data || []).forEach(p => {
        placesMap.set(p.PlaceId, {
          name: p.NomPlace,
          institution: p.InstitutionName || '',
          MSQ: !!p.MSQ, SYSINT: !!p.SYSINT, NEUROGER: !!p.NEUROGER,
          AIGU: !!p.AIGU, REHAB: !!p.REHAB, AMBU: !!p.AMBU, FR: !!p.FR, DE: !!p.DE,
          _raw: p
        })
      })

      // ── 3. Helper extractCrit (même logique que VerificationCriteresEtudiants) ──
      const extractCrit = (obj) => {
        if (!obj) return {}
        const r = {}
        CRITERIA_KEYS.forEach(c => { r[c] = !!(obj[c] || obj[c.toLowerCase()]) })
        return r
      }

      const parsePfpValided = (pfpVal) => {
        if (!pfpVal) return []
        if (Array.isArray(pfpVal)) return pfpVal
        if (typeof pfpVal === 'string') {
          try { const p = JSON.parse(pfpVal); return Array.isArray(p) ? p : [] } catch (e) { return [] }
        }
        if (typeof pfpVal === 'object') return Object.values(pfpVal)
        return []
      }

      // ── 4. Construire criteriaMap depuis pfp_valided ──
      const criteriaMap = new Map()
      const stagesMap = new Map()
      if (physioResult.data) {
        physioResult.data.forEach(physio => {
          if (!physio.pfp_valided) return
          const scores = {}
          CRITERIA_KEYS.forEach(k => { scores[k] = 0 })
          const pfpArray = parsePfpValided(physio.pfp_valided)
          pfpArray.forEach(place => {
            const crit = extractCrit(place)
            CRITERIA_KEYS.forEach(c => { if (crit[c]) scores[c]++ })
          })
          criteriaMap.set(physio.user_id, { scores, totalStages: pfpArray.length, sae: !!physio.sae, casParticulier: !!physio.cas_particulier })
          const enrichedStages = pfpArray.map((stage, idx) => ({
            _placeId: stage.PlaceId || stage.ID_PFP || stage.id_pfp || null,
            pfp_type: stage.pfp_type || stage.pfpLevel || ['PFP1', 'PFP2', 'PFP3', 'PFP4'][idx] || null
          }))
          stagesMap.set(physio.user_id, enrichedStages)
        })
      }
      console.log(`   Critères depuis pfp_valided: ${criteriaMap.size} étudiants`)

      // DEBUG BONVIN: afficher les données brutes
      if (physioResult.data) {
        const bonvinPhysio = physioResult.data.filter(p => {
          const student = classStudents.find(s => s.id === p.user_id && (s.Nom || '').toLowerCase().includes('bonvin'))
          return !!student
        })
        console.log(`🔍 DEBUG BONVIN — StudentsPhysio entries: ${bonvinPhysio.length}`)
        bonvinPhysio.forEach(p => {
          const pfpArray = parsePfpValided(p.pfp_valided)
          console.log(`   pfp_valided raw type: ${typeof p.pfp_valided}, isArray: ${Array.isArray(p.pfp_valided)}`)
          console.log(`   pfp_valided parsed: ${pfpArray.length} stages`)
          pfpArray.forEach((stage, i) => {
            const crit = extractCrit(stage)
            const activeCrit = CRITERIA_KEYS.filter(c => crit[c])
            console.log(`   Stage ${i}: PlaceId=${stage.PlaceId || stage.ID_PFP || 'N/A'} pfp_type=${stage.pfp_type || stage.pfpLevel || 'N/A'} critères=[${activeCrit.join(',')}]`)
          })
        })
      }

      // ── 5. Enrichir avec student_result_vote (anti-doublon comme VerificationCriteresEtudiants) ──
      const assignedPlacesMap = new Map()
      if (assignmentsResult.data) {
        assignmentsResult.data.forEach(a => {
          if (a.assigned_place_id) {
            if (!assignedPlacesMap.has(a.user_id)) assignedPlacesMap.set(a.user_id, new Set())
            assignedPlacesMap.get(a.user_id).add(a.assigned_place_id)
          }

          if (a.pfp_validee && a.assigned_place_id) {
            const placeInfo = placesMap.get(a.assigned_place_id)
            if (placeInfo) {
              const existingStages = stagesMap.get(a.user_id) || []
              const alreadyExists = existingStages.some(s =>
                (s._placeId && s._placeId === a.assigned_place_id) ||
                (s.pfp_type && s.pfp_type === a.pfp_type)
              )
              if (!alreadyExists) {
                const existing = criteriaMap.get(a.user_id) || { scores: Object.fromEntries(CRITERIA_KEYS.map(k => [k, 0])), totalStages: 0, sae: false, casParticulier: false }
                CRITERIA_KEYS.forEach(c => { if (placeInfo[c]) existing.scores[c]++ })
                existing.totalStages++
                criteriaMap.set(a.user_id, existing)
              }
            }
          }
        })
      }
      console.log(`   Critères enrichis (+ student_result_vote): ${criteriaMap.size} étudiants`)
      console.log(`   Places assignées trackées: ${assignedPlacesMap.size} étudiants`)

      if (assignmentsResult.data?.length > 0) {
        const sample = assignmentsResult.data.slice(0, 5)
        sample.forEach(a => console.log(`   [srv] user=${a.user_id?.substring(0,8)} pfp=${a.pfp_type} place=${a.assigned_place_id?.substring(0,15)} validee=${a.pfp_validee}(${typeof a.pfp_validee})`))
      }

      // DEBUG BONVIN: afficher les assignations
      if (assignmentsResult.data) {
        const bonvinStudentIds = new Set(classStudents.filter(s => (s.Nom || '').toLowerCase().includes('bonvin')).map(s => s.id))
        const bonvinAssignments = assignmentsResult.data.filter(a => bonvinStudentIds.has(a.user_id))
        console.log(`🔍 DEBUG BONVIN — student_result_vote entries: ${bonvinAssignments.length}`)
        bonvinAssignments.forEach(a => {
          const placeInfo = placesMap.get(a.assigned_place_id)
          const placeCrit = placeInfo ? CRITERIA_KEYS.filter(c => placeInfo[c]) : []
          console.log(`   pfp=${a.pfp_type} place=${a.assigned_place_name || a.assigned_place_id?.substring(0,15)} validee=${a.pfp_validee}(${typeof a.pfp_validee}) critères_place=[${placeCrit.join(',')}]`)
        })
        bonvinStudentIds.forEach(uid => {
          const crit = criteriaMap.get(uid)
          const assigned = assignedPlacesMap.get(uid)
          console.log(`🔍 DEBUG BONVIN — criteriaMap pour ${uid.substring(0,8)}: ${crit ? JSON.stringify(crit.scores) : 'NON TROUVÉ'}`)
          console.log(`🔍 DEBUG BONVIN — assignedPlaces: ${assigned ? [...assigned].join(', ') : 'aucune'}`)
        })
      }

      // ── 6a. Compter les assignations PFP4 existantes par place ──
      const pfp4AssignCountByPlace = new Map()
      if (assignmentsResult.data) {
        assignmentsResult.data.forEach(a => {
          if (a.pfp_type === 'PFP4' && a.assigned_place_id) {
            pfp4AssignCountByPlace.set(a.assigned_place_id, (pfp4AssignCountByPlace.get(a.assigned_place_id) || 0) + 1)
          }
        })
      }
      console.log(`   Places PFP4 déjà assignées: ${pfp4AssignCountByPlace.size} places distinctes`)

      // ── 6b. Places PFP4 depuis pfp4_proposition, en excluant les places pleines ──
      const allPlaces = placesResult.data || []
      const getCapacity = (propData) => {
        if (propData.hasOwnProperty(year) && propData[year] !== '' && propData[year] !== null && propData[year] !== undefined) {
          return parseInt(propData[year]) || 0
        }
        const defVal = parseInt(propData['default'] || '0')
        return !isNaN(defVal) ? defVal : 0
      }
      const allPfp4Places = allPlaces.filter(place => {
        const propData = place.pfp4_proposition
        if (!propData) return false
        const capacity = getCapacity(propData)
        if (isNaN(capacity) || capacity < 1) return false
        const assignedCount = pfp4AssignCountByPlace.get(place.PlaceId) || 0
        if (assignedCount >= capacity) return false
        return true
      }).map(place => {
        const capacity = getCapacity(place.pfp4_proposition)
        const assignedCount = pfp4AssignCountByPlace.get(place.PlaceId) || 0
        return {
          PlaceId: place.PlaceId,
          NomPlace: place.NomPlace,
          InstitutionId: place.InstitutionId,
          InstitutionName: place.InstitutionName || '',
          Capacity: capacity,
          RemainingSeats: capacity - assignedCount,
          MSQ: !!place.MSQ, SYSINT: !!place.SYSINT, NEUROGER: !!place.NEUROGER,
          AIGU: !!place.AIGU, REHAB: !!place.REHAB, AMBU: !!place.AMBU,
          FR: !!place.FR, DE: !!place.DE,
          criteria: CRITERIA_KEYS.filter(c => !!place[c])
        }
      })
      const excludedFullPlaces = allPlaces.filter(p => {
        const propData = p.pfp4_proposition
        if (!propData) return false
        const cap = getCapacity(propData)
        const assigned = pfp4AssignCountByPlace.get(p.PlaceId) || 0
        return cap >= 1 && assigned >= cap
      })
      console.log(`   Places PFP4 (pfp4_proposition): ${allPfp4Places.length} disponibles (${excludedFullPlaces.length} pleines exclues)`)
      excludedFullPlaces.forEach(p => console.log(`   ❌ Pleine: ${p.NomPlace} (${p.InstitutionName}) — ${pfp4AssignCountByPlace.get(p.PlaceId)}/${getCapacity(p.pfp4_proposition)} assignées`))
      console.log(`   Places DE: ${allPfp4Places.filter(p => p.DE).length}, Places SYSINT: ${allPfp4Places.filter(p => p.SYSINT).length}`)
      console.log('══════════════════════════════════════════════')

      // ── 7. Appliquer les règles de filtrage PFP4 ──
      const proposals = []
      for (const student of classStudents) {
        const userId = student.id
        const studentCrit = criteriaMap.get(userId)
        const scores = studentCrit ? { ...studentCrit.scores } : Object.fromEntries(CRITERIA_KEYS.map(k => [k, 0]))
        const missingCriteria = CRITERIA_KEYS.filter(c => scores[c] === 0)
        const missingDE = missingCriteria.includes('DE')
        const missingSYSINT = missingCriteria.includes('SYSINT')
        const otherMissing = missingCriteria.filter(c => c !== 'DE' && c !== 'SYSINT')

        const studentAssignedPlaces = assignedPlacesMap.get(userId) || new Set()

        // Helper : compte combien de critères manquants une place couvre
        const countMissingCovered = (place, missing) => missing.filter(c => place[c]).length

        let proposedPlaces = []
        let appliedRule = ''
        const MIN_PLACES = 5

        // Toutes les places disponibles (non assignées à cet étudiant)
        const availablePlaces = allPfp4Places.filter(p => !studentAssignedPlaces.has(p.PlaceId))
        const excludedCount = allPfp4Places.length - availablePlaces.length

        if (missingDE) {
          // ═══ DE MANQUANT : UNIQUEMENT PLACES DE (obligatoire pour diplôme) ═══
          proposedPlaces = availablePlaces
            .filter(p => p.DE)
            .sort((a, b) => countMissingCovered(b, missingCriteria) - countMissingCovered(a, missingCriteria))
          appliedRule = 'DE_MISSING'

        } else if (missingCriteria.length > 0) {
          // ═══ DE OK, CRITÈRES MANQUANTS : maximiser la couverture ═══
          proposedPlaces = availablePlaces
            .filter(p => missingCriteria.some(c => p[c]))
            .sort((a, b) => countMissingCovered(b, missingCriteria) - countMissingCovered(a, missingCriteria))
          appliedRule = missingSYSINT ? (otherMissing.length > 0 ? 'SYSINT_AND_OTHER' : 'SYSINT_ONLY') : 'OTHER_MISSING'

          // Minimum 5 places : élargir si nécessaire
          if (proposedPlaces.length < MIN_PLACES) {
            const currentIds = new Set(proposedPlaces.map(p => p.PlaceId))
            const rest = availablePlaces.filter(p => !currentIds.has(p.PlaceId))
            const sysintPlaces = rest.filter(p => p.SYSINT)
            proposedPlaces.push(...sysintPlaces)
            appliedRule += '_WIDENED'
          }

          if (proposedPlaces.length < MIN_PLACES) {
            const currentIds = new Set(proposedPlaces.map(p => p.PlaceId))
            const rest = availablePlaces.filter(p => !currentIds.has(p.PlaceId))
            const needed = MIN_PLACES - proposedPlaces.length
            proposedPlaces.push(...rest.slice(0, needed))
          }

        } else {
          // ═══ TOUT VALIDÉ : toutes les places ═══
          proposedPlaces = [...availablePlaces]
          appliedRule = 'ALL_COMPLETE'
        }

        const displayNom = student.Nom || student.nom || student.family_name || 'Nom non disponible'
        const displayPrenom = student.Prenom || student.prenom || student.forname || 'Prénom non disponible'
        const isGhost = displayNom === 'Nom non disponible'
        console.log(`👤 ${displayNom} ${displayPrenom}${isGhost ? ` [GHOST user_id=${userId}]` : ''} | scores=${JSON.stringify(scores)} | manquants=[${missingCriteria.join(',')}] | règle=${appliedRule} | ${proposedPlaces.length} places${excludedCount > 0 ? ` (-${excludedCount} déjà assignées)` : ''}${!studentCrit ? ' ⚠️ PAS DE CRITÈRES TROUVÉS' : ''}`)

        proposals.push({
          userId,
          nom: student.Nom || student.family_name || '',
          prenom: student.Prenom || student.forname || '',
          email: student.Email || student.email || '',
          classe,
          scores,
          missingCriteria,
          appliedRule,
          sae: studentCrit?.sae || false,
          casParticulier: studentCrit?.casParticulier || false,
          proposedPlaceIds: proposedPlaces.map(p => p.PlaceId),
          proposedPlacesCount: proposedPlaces.length,
          proposedPlaces: proposedPlaces.map(p => ({
            PlaceId: p.PlaceId, NomPlace: p.NomPlace, InstitutionName: p.InstitutionName,
            Capacity: p.Capacity, criteria: p.criteria
          }))
        })
      }

      // ── 8. Places orphelines : jamais proposées à aucun étudiant ──
      const allProposedPlaceIds = new Set()
      proposals.forEach(p => (p.proposedPlaceIds || []).forEach(id => allProposedPlaceIds.add(id)))
      const orphanPlaces = allPfp4Places.filter(p => !allProposedPlaceIds.has(p.PlaceId))

      if (orphanPlaces.length > 0) {
        console.log(`🔄 ${orphanPlaces.length} places orphelines (jamais proposées):`)
        orphanPlaces.forEach(p => console.log(`   ${p.NomPlace} (${p.InstitutionName}) critères=[${p.criteria.join(',')}]`))

        const allCompleteStudents = proposals.filter(p => p.appliedRule === 'ALL_COMPLETE')
        const targets = allCompleteStudents.length > 0 ? allCompleteStudents : proposals

        console.log(`   → Ajout aux ${targets.length} étudiants ${allCompleteStudents.length > 0 ? 'ALL_COMPLETE' : '(tous, aucun ALL_COMPLETE)'}`)

        for (const student of targets) {
          const studentAssigned = assignedPlacesMap.get(student.userId) || new Set()
          const currentIds = new Set(student.proposedPlaceIds)
          let added = 0
          for (const op of orphanPlaces) {
            if (!currentIds.has(op.PlaceId) && !studentAssigned.has(op.PlaceId)) {
              student.proposedPlaceIds.push(op.PlaceId)
              student.proposedPlaces.push({
                PlaceId: op.PlaceId, NomPlace: op.NomPlace, InstitutionName: op.InstitutionName,
                Capacity: op.Capacity, criteria: op.criteria
              })
              student.proposedPlacesCount++
              added++
            }
          }
          if (added > 0) console.log(`   +${added} places pour ${student.nom} ${student.prenom}`)
        }
      }

      proposals.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))

      const ruleStats = {}
      proposals.forEach(p => { ruleStats[p.appliedRule] = (ruleStats[p.appliedRule] || 0) + 1 })

      pfp4Proposals.value = proposals
      pfp4AllPlaces.value = allPfp4Places
      pfp4Stats.value = {
        totalStudents: proposals.length,
        totalPfp4Places: allPfp4Places.length,
        totalCapacity: allPfp4Places.reduce((sum, p) => sum + p.Capacity, 0),
        averageProposedPlaces: proposals.length > 0 ? Math.round(proposals.reduce((sum, p) => sum + p.proposedPlacesCount, 0) / proposals.length) : 0,
        ruleDistribution: ruleStats,
        assignCounts: Object.fromEntries(pfp4AssignCountByPlace)
      }

      console.log('📊 Distribution des règles:', ruleStats)

      toast.add({
        severity: 'success',
        summary: 'Propositions générées',
        detail: `${proposals.length} étudiants traités, moyenne ${pfp4Stats.value.averageProposedPlaces} places/étudiant`,
        life: 5000
      })
    } catch (error) {
      console.error('❌ Erreur génération propositions PFP4:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
    } finally {
      pfp4Loading.value = false
    }
  }

  const savePfp4Proposals = async (filterYear, filterClasse) => {
    if (pfp4Proposals.value.length === 0) return
    pfp4Loading.value = true
    try {
      await resultatVotationService.savePfp4Proposals(filterYear, filterClasse, pfp4Proposals.value, pfp4Stats.value.assignCounts)
      pfp4Saved.value = true
      toast.add({
        severity: 'success',
        summary: 'Propositions sauvegardées',
        detail: `${pfp4Proposals.value.length} propositions sauvegardées. Les étudiants verront uniquement leurs places proposées lors du vote.`,
        life: 8000
      })
    } catch (error) {
      console.error('❌ Erreur sauvegarde propositions PFP4:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
    } finally {
      pfp4Loading.value = false
    }
  }

  // ============================================
  // EXPORT CSV BILAN PFP4
  // ============================================
  const exportPfp4BilanCSV = (filterYear, filterClasse, allStudents) => {
    const BOM = '\uFEFF'
    const sep = ';'
    
    // --- Feuille 1: Étudiants ---
    let csvEtudiants = BOM + ['Nom', 'Prénom', 'Email', 'Assigné PFP4', 'Place assignée', 'Institution', 'Rang', 'Nb propositions', 'Statut'].join(sep) + '\n'
    
    const classe = filterClasse
    const allClassStudents = allStudents
    const assignedIds = new Set()
    const assignmentMap = new Map()
    votationsList.value.forEach(v => {
      if (v.assignedPlaceId) {
        assignedIds.add(v.userId)
        assignmentMap.set(v.userId, v)
      }
    })
    pfp4Proposals.value.forEach(p => {
      if (!assignmentMap.has(p.userId)) {
        // student in proposals but maybe assigned
      }
    })
    
    const manualExcluded = new Set(excludedStudentIds.value)
    const proposalMap = new Map()
    pfp4Proposals.value.forEach(p => {
      proposalMap.set(p.userId, p)
    })
    
    const sortedStudents = [...allClassStudents].sort((a, b) => 
      ((a.Nom || a.nom || '').toUpperCase()).localeCompare((b.Nom || b.nom || '').toUpperCase())
    )
    
    let countAssigned = 0, countExcludedManual = 0, countEligible = 0
    
    sortedStudents.forEach(s => {
      const uid = s.id || s.user_id
      const nom = (s.Nom || s.nom || s.family_name || '').replace(/;/g, ',')
      const prenom = (s.Prenom || s.prenom || s.forname || '').replace(/;/g, ',')
      const email = (s.Mail || s.email || '').replace(/;/g, ',')
      
      const votation = votationsList.value.find(v => v.userId === uid)
      const isAssigned = votation && votation.assignedPlaceId
      const proposal = proposalMap.get(uid)
      
      let statut = 'Éligible votation'
      let placeName = '', instName = '', rank = '', nbProposals = ''
      
      if (isAssigned) {
        statut = 'Assigné PFP4'
        placeName = (votation.assignedPlaceName || '').replace(/;/g, ',')
        instName = (votation.assignedInstitutionName || '').replace(/;/g, ',')
        rank = votation.assignedRank || ''
        countAssigned++
      } else if (manualExcluded.has(uid)) {
        statut = 'Exclu manuellement'
        countExcludedManual++
      } else {
        countEligible++
        if (proposal) {
          nbProposals = proposal.places?.length || proposal.placeIds?.length || ''
        }
      }
      
      csvEtudiants += [nom, prenom, email, isAssigned ? 'OUI' : 'NON', placeName, instName, rank, nbProposals, statut].join(sep) + '\n'
    })
    
    csvEtudiants += '\n'
    csvEtudiants += ['TOTAL ' + classe, sortedStudents.length].join(sep) + '\n'
    csvEtudiants += ['Assignés PFP4', countAssigned].join(sep) + '\n'
    csvEtudiants += ['Exclus manuellement', countExcludedManual].join(sep) + '\n'
    csvEtudiants += ['Éligibles votation', countEligible].join(sep) + '\n'
    
    // --- Feuille 2: Places PFP4 ---
    let csvPlaces = BOM + ['Place', 'Institution', 'Capacité 2026', 'Sièges pris', 'Sièges restants', 'Statut', 'MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE'].join(sep) + '\n'
    
    const placesStore = usePlacesStore()
    const institutionsStore2 = useInstitutionsStore()
    const instMap = new Map()
    if (institutionsStore2.institutions) {
      institutionsStore2.institutions.forEach(i => instMap.set(i.InstitutionId, i.Name))
    }
    
    const placeAssignCounts = new Map()
    votationsList.value.forEach(v => {
      if (v.assignedPlaceId) {
        placeAssignCounts.set(v.assignedPlaceId, (placeAssignCounts.get(v.assignedPlaceId) || 0) + 1)
      }
    })
    
    const getExportCapacity = (propData) => {
      if (!propData || typeof propData !== 'object') return 0
      const yr = filterYear
      if (propData.hasOwnProperty(yr) && propData[yr] !== '' && propData[yr] !== null && propData[yr] !== undefined) {
        return parseInt(propData[yr]) || 0
      }
      const defVal = parseInt(propData['default'] || '0')
      return !isNaN(defVal) ? defVal : 0
    }
    const pfp4PlacesList = placesStore.places
      .filter(p => p.pfp4_proposition && getExportCapacity(p.pfp4_proposition) > 0)
      .sort((a, b) => (instMap.get(a.InstitutionId) || '').localeCompare(instMap.get(b.InstitutionId) || ''))
    
    let totalCap = 0, totalUsed = 0, totalLeft = 0, placesFull = 0, placesOpen = 0
    const boolStr = (v) => v === true || v === 'true' || v === 1 || v === '1' ? 'X' : ''
    
    pfp4PlacesList.forEach(p => {
      const cap = getExportCapacity(p.pfp4_proposition)
      const used = placeAssignCounts.get(p.PlaceId) || 0
      const remaining = Math.max(0, cap - used)
      totalCap += cap
      totalUsed += used
      totalLeft += remaining
      if (remaining > 0) placesOpen++
      else placesFull++
      
      const nom = (p.NomPlace || '').replace(/;/g, ',')
      const inst = (instMap.get(p.InstitutionId) || 'N/A').replace(/;/g, ',')
      const statut = remaining > 0 ? 'Disponible' : 'PLEINE'
      
      csvPlaces += [nom, inst, cap, used, remaining, statut, boolStr(p.MSQ), boolStr(p.SYSINT), boolStr(p.NEUROGER), boolStr(p.AIGU), boolStr(p.REHAB), boolStr(p.AMBU), boolStr(p.FR), boolStr(p.DE)].join(sep) + '\n'
    })
    
    csvPlaces += '\n'
    csvPlaces += ['TOTAL', '', totalCap, totalUsed, totalLeft].join(sep) + '\n'
    csvPlaces += ['Places pleines', '', placesFull].join(sep) + '\n'
    csvPlaces += ['Places disponibles', '', placesOpen].join(sep) + '\n'
    
    // --- Feuille 3: Bilan ---
    let csvBilan = BOM + ['Métrique', 'Valeur'].join(sep) + '\n'
    csvBilan += ['Classe', classe].join(sep) + '\n'
    csvBilan += ['Année', filterYear].join(sep) + '\n'
    csvBilan += ['Date export', new Date().toLocaleString('fr-CH')].join(sep) + '\n'
    csvBilan += '\n'
    csvBilan += ['Étudiants total', sortedStudents.length].join(sep) + '\n'
    csvBilan += ['Déjà assignés PFP4', countAssigned].join(sep) + '\n'
    csvBilan += ['Exclus manuellement', countExcludedManual].join(sep) + '\n'
    csvBilan += ['Éligibles votation', countEligible].join(sep) + '\n'
    csvBilan += '\n'
    csvBilan += ['Places PFP4 totales', pfp4PlacesList.length].join(sep) + '\n'
    csvBilan += ['Sièges totaux', totalCap].join(sep) + '\n'
    csvBilan += ['Sièges pris', totalUsed].join(sep) + '\n'
    csvBilan += ['Sièges restants', totalLeft].join(sep) + '\n'
    csvBilan += ['Places pleines', placesFull].join(sep) + '\n'
    csvBilan += ['Places disponibles', placesOpen].join(sep) + '\n'
    csvBilan += '\n'
    csvBilan += ['Ratio', `${countEligible} étudiants / ${totalLeft} sièges`].join(sep) + '\n'
    csvBilan += ['Marge', totalLeft >= countEligible ? `+${totalLeft - countEligible} sièges` : `DEFICIT ${countEligible - totalLeft} sièges!`].join(sep) + '\n'
    
    // --- Feuille 4: Détail propositions par étudiant ---
    let csvPropositions = BOM + ['Nom', 'Prénom', 'Règle', 'Critères manquants', 'Place', 'Institution', 'Capacité', 'MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE'].join(sep) + '\n'
    
    const sortedProposals = [...pfp4Proposals.value].sort((a, b) => 
      (a.nom || '').toUpperCase().localeCompare((b.nom || '').toUpperCase())
    )
    
    sortedProposals.forEach(p => {
      const nom = (p.nom || '').replace(/;/g, ',')
      const prenom = (p.prenom || '').replace(/;/g, ',')
      const regle = p.appliedRule || ''
      const manquants = (p.missingCriteria || []).join(', ')
      
      if (p.proposedPlaces && p.proposedPlaces.length > 0) {
        p.proposedPlaces.forEach(place => {
          const placeName = (place.NomPlace || '').replace(/;/g, ',')
          const instName = (place.InstitutionName || '').replace(/;/g, ',')
          const cap = place.Capacity || ''
          const c = place.criteria || {}
          csvPropositions += [nom, prenom, regle, manquants, placeName, instName, cap, boolStr(c.MSQ), boolStr(c.SYSINT), boolStr(c.NEUROGER), boolStr(c.AIGU), boolStr(c.REHAB), boolStr(c.AMBU), boolStr(c.FR), boolStr(c.DE)].join(sep) + '\n'
        })
      } else {
        csvPropositions += [nom, prenom, regle, manquants, 'AUCUNE PLACE', '', ''].join(sep) + '\n'
      }
    })

    // Download files
    const date = new Date().toISOString().split('T')[0]
    const downloadCSV = (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    }
    
    downloadCSV(csvBilan, `PFP4_Bilan_${classe}_${date}.csv`)
    setTimeout(() => downloadCSV(csvEtudiants, `PFP4_Etudiants_${classe}_${date}.csv`), 200)
    setTimeout(() => downloadCSV(csvPlaces, `PFP4_Places_${date}.csv`), 400)
    setTimeout(() => downloadCSV(csvPropositions, `PFP4_Propositions_${classe}_${date}.csv`), 600)
    
    toast.add({ severity: 'success', summary: 'Export CSV', detail: '4 fichiers téléchargés', life: 3000 })
  }

  const resetPfp4 = () => {
    pfp4Proposals.value = []
    pfp4AllPlaces.value = []
    pfp4Stats.value = null
    pfp4Saved.value = false
    pfp4SearchQuery.value = ''
    pfp4FilterRule.value = null
  }

  return {
    pfp4Proposals,
    pfp4AllPlaces,
    pfp4Stats,
    pfp4Loading,
    pfp4Saved,
    pfp4SearchQuery,
    pfp4FilterRule,
    pfp4RuleLabels,
    pfp4RuleSeverity,
    filteredPfp4Proposals,
    generatePfp4Proposals,
    savePfp4Proposals,
    exportPfp4BilanCSV,
    resetPfp4,
    CRITERIA_KEYS
  }
}

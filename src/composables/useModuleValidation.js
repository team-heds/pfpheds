import { ref, computed } from 'vue'
import { supabase } from '@/supabase'

export function useModuleValidation(toast, moduleRef, selectedClassRef, filteredPlanningRef, totalPlanningHoursRef) {
  // Historique et validation
  const planningHistory = ref([])
  const loadingHistory = ref(false)
  const currentValidation = ref(null)
  const hoursBudget = ref({
    planned_hours: 0,
    lecture_hours: 0,
    tp_hours: 0,
    td_hours: 0
  })

  // Différence heures prévues vs planifiées
  const hoursDifference = computed(() => {
    return Math.round((totalPlanningHoursRef.value - (hoursBudget.value.planned_hours || 0)) * 10) / 10
  })

  // Statut de validation
  const validationStatus = computed(() => {
    if (!currentValidation.value) {
      return { status: 'draft', label: 'Brouillon', severity: 'secondary' }
    }
    const statusMap = {
      'draft': { label: 'Brouillon', severity: 'secondary' },
      'pending': { label: 'En attente', severity: 'warning' },
      'validated': { label: 'Validé', severity: 'success' },
      'rejected': { label: 'Rejeté', severity: 'danger' }
    }
    return { status: currentValidation.value.status, ...statusMap[currentValidation.value.status] }
  })

  // Charger l'historique des modifications
  const loadPlanningHistory = async () => {
    if (!moduleRef.value?.code) return

    loadingHistory.value = true
    try {
      const { data, error } = await supabase
        .from('planning_history')
        .select('*')
        .eq('module_code', moduleRef.value.code)
        .order('changed_at', { ascending: false })
        .limit(50)

      if (error) {
        console.warn('Erreur chargement historique:', error)
        planningHistory.value = []
        return
      }

      planningHistory.value = data || []
    } catch (error) {
      console.error('Erreur historique:', error)
      planningHistory.value = []
    } finally {
      loadingHistory.value = false
    }
  }

  // Charger la validation actuelle
  const loadCurrentValidation = async () => {
    if (!moduleRef.value?.code) return

    try {
      const classCode = selectedClassRef.value || 'ALL'
      const { data } = await supabase
        .from('planning_validations')
        .select('*')
        .eq('module_code', moduleRef.value.code)
        .eq('class_code', classCode)
        .maybeSingle()

      currentValidation.value = data || null
    } catch (error) {
      console.error('Erreur validation:', error)
      currentValidation.value = null
    }
  }

  // Charger le budget heures
  const loadHoursBudget = async () => {
    if (!moduleRef.value?.code) return

    try {
      const { data } = await supabase
        .from('module_hours_budget')
        .select('*')
        .eq('module_code', moduleRef.value.code)
        .maybeSingle()

      if (data) {
        hoursBudget.value = data
      } else {
        hoursBudget.value = { planned_hours: moduleRef.value?.heures_contact || 0 }
      }
    } catch (error) {
      hoursBudget.value = { planned_hours: moduleRef.value?.heures_contact || 0 }
    }
  }

  // Sauvegarder le budget heures
  const saveHoursBudget = async () => {
    if (!moduleRef.value?.code) return

    try {
      const { error } = await supabase
        .from('module_hours_budget')
        .upsert({
          module_code: moduleRef.value.code,
          planned_hours: hoursBudget.value.planned_hours || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'module_code' })

      if (error) throw error

      toast.add({
        severity: 'success',
        summary: 'Budget sauvegardé',
        detail: `${hoursBudget.value.planned_hours}h prévues`,
        life: 3000
      })
    } catch (error) {
      console.error('Erreur sauvegarde budget:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder le budget', life: 3000 })
    }
  }

  // Valider le planning
  const validatePlanning = async () => {
    if (!moduleRef.value?.code) return

    try {
      const classCode = selectedClassRef.value || 'ALL'
      const { error } = await supabase
        .from('planning_validations')
        .upsert({
          module_code: moduleRef.value.code,
          class_code: classCode,
          status: 'validated',
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'module_code,class_code' })

      if (error) throw error

      await loadCurrentValidation()

      toast.add({
        severity: 'success',
        summary: 'Planning validé',
        detail: `${filteredPlanningRef.value.length} séances validées`,
        life: 3000
      })
    } catch (error) {
      console.error('Erreur validation:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de valider le planning', life: 3000 })
    }
  }

  // Retirer la validation
  const unvalidatePlanning = async () => {
    if (!moduleRef.value?.code || !currentValidation.value) return

    try {
      const { error } = await supabase
        .from('planning_validations')
        .update({
          status: 'draft',
          validated_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentValidation.value.id)

      if (error) throw error

      await loadCurrentValidation()

      toast.add({ severity: 'info', summary: 'Validation retirée', detail: 'Le planning est de nouveau en brouillon', life: 3000 })
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Soumettre pour révision
  const submitForReview = async () => {
    if (!moduleRef.value?.code) return

    try {
      const classCode = selectedClassRef.value || 'ALL'
      const { error } = await supabase
        .from('planning_validations')
        .upsert({
          module_code: moduleRef.value.code,
          class_code: classCode,
          status: 'pending',
          updated_at: new Date().toISOString()
        }, { onConflict: 'module_code,class_code' })

      if (error) throw error

      await loadCurrentValidation()

      toast.add({ severity: 'info', summary: 'Soumis pour révision', detail: 'Le planning est en attente de validation', life: 3000 })
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  return {
    planningHistory,
    loadingHistory,
    currentValidation,
    hoursBudget,
    hoursDifference,
    validationStatus,
    loadPlanningHistory,
    loadCurrentValidation,
    loadHoursBudget,
    saveHoursBudget,
    validatePlanning,
    unvalidatePlanning,
    submitForReview,
  }
}

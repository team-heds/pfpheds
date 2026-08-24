import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import votationSessionService from '@/service/votationSessionService'

const getAcademicYearKeys = (year) => {
  const y = Number(year)
  if (!Number.isFinite(y)) return [String(year)]
  return [String(y), `${y - 1}-${y}`]
}

export function useVotationSession(toast, userStore) {
  const currentSession = ref(null)
  const showSessionDialog = ref(false)
  const sessionLoading = ref(false)
  const sessionHistory = ref([])
  const showHistoryPanel = ref(false)

  const sessionIsOpen = computed(() => {
    return currentSession.value?.status === 'open'
  })

  const loadCurrentSession = async (pfpType, year) => {
    if (!pfpType || !year) {
      currentSession.value = null
      return
    }
    try {
      currentSession.value = await votationSessionService.getActiveSession(pfpType, year)
    } catch (error) {
      console.error('❌ Erreur chargement session:', error)
      currentSession.value = null
    }
  }

  const openVotation = async (classe, pfpType, year) => {
    if (!classe || !pfpType || !year) {
      toast.add({ severity: 'warn', summary: 'Sélection incomplète', detail: 'Veuillez sélectionner une classe, un PFP et une année', life: 3000 })
      return
    }
    sessionLoading.value = true
    try {
      const userId = userStore.user?.id || null
      const session = await votationSessionService.openSession(pfpType, year, classe, userId)
      currentSession.value = session
      showSessionDialog.value = false
      if (showHistoryPanel.value) await loadSessionHistory()
      toast.add({
        severity: 'success',
        summary: 'Votation ouverte',
        detail: `La votation ${pfpType} ${year} est maintenant ouverte pour les étudiants ${classe}`,
        life: 5000
      })
    } catch (error) {
      console.error('❌ Erreur ouverture session:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'ouvrir la votation: ' + error.message, life: 5000 })
    } finally {
      sessionLoading.value = false
    }
  }

  const closeVotation = async (pfpType, year) => {
    if (!pfpType || !year) return
    sessionLoading.value = true
    try {
      await votationSessionService.closeSession(pfpType, year)
      currentSession.value = null
      if (showHistoryPanel.value) await loadSessionHistory()
      toast.add({
        severity: 'info',
        summary: 'Votation fermée',
        detail: `La votation ${pfpType} ${year} est maintenant fermée`,
        life: 5000
      })
    } catch (error) {
      console.error('❌ Erreur fermeture session:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de fermer la votation: ' + error.message, life: 5000 })
    } finally {
      sessionLoading.value = false
    }
  }

  const loadSessionHistory = async () => {
    try {
      const allSessions = await votationSessionService.fetchAll()
      const enriched = await Promise.all(allSessions.map(async (session) => {
        try {
          const yearKeys = getAcademicYearKeys(session.year)
          const { count } = await supabase
            .from('student_votes')
            .select('*', { count: 'exact', head: true })
            .eq('pfp_type', session.pfp_type)
            .in('year', yearKeys)
          return { ...session, voteCount: count || 0 }
        } catch {
          return { ...session, voteCount: '?' }
        }
      }))
      sessionHistory.value = enriched
    } catch (error) {
      console.error('❌ Erreur chargement historique sessions:', error)
      sessionHistory.value = []
    }
  }

  const formatDuration = (openedAt, closedAt) => {
    if (!openedAt) return '-'
    const start = new Date(openedAt)
    const end = closedAt ? new Date(closedAt) : new Date()
    const diffMs = end - start
    const hours = Math.floor(diffMs / 3600000)
    const minutes = Math.floor((diffMs % 3600000) / 60000)
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes}min`
  }

  return {
    currentSession,
    showSessionDialog,
    sessionLoading,
    sessionIsOpen,
    sessionHistory,
    showHistoryPanel,
    loadCurrentSession,
    openVotation,
    closeVotation,
    loadSessionHistory,
    formatDuration
  }
}

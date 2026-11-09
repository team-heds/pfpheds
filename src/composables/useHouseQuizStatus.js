import { onMounted, ref } from 'vue'
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'

/**
 * Indique si le compte connecté peut passer le quiz des maisons (décision du serveur :
 * joueur de la gamification sans maison). Fermé par défaut tant que la réponse n'est pas là,
 * pour ne jamais inviter un compte non concerné (ex. BA23, personnel).
 */
export function useHouseQuizStatus({ enabled = true } = {}) {
  const quizOpen = ref(false)

  const refresh = async () => {
    if (!enabled) return
    try {
      const status = await gamificationServiceSupabase.getMyHouseQuizStatus()
      quizOpen.value = Boolean(status?.quiz_open)
    } catch {
      quizOpen.value = false
    }
  }

  onMounted(refresh)
  return { quizOpen, refresh }
}

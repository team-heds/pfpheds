import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/supabase'

export function useGamificationAuth() {
  const user = ref(null)
  let subscription

  const loadUser = async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('[GamificationAuth] Erreur de session Supabase:', error)
      user.value = null
      return
    }
    user.value = data.user || null
  }

  const ready = loadUser()

  onMounted(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null
    })
    subscription = data.subscription
  })

  onUnmounted(() => subscription?.unsubscribe())

  return { user, ready }
}

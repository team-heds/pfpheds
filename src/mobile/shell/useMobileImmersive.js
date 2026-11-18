import { onBeforeUnmount, watch } from 'vue'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'

/**
 * Déclare une tâche plein écran (partie de quiz, duel, mot de la semaine en
 * cours) : la barre d'onglets de l'application mobile se cache tant que
 * `isImmersive()` est vrai. Sans effet sur ordinateur.
 */
export function useMobileImmersive(isImmersive) {
  let store = null
  try {
    store = useMobileShellStore()
  } catch {
    return
  }
  let counted = false
  const sync = (value) => {
    if (value && !counted) store.enterImmersive()
    if (!value && counted) store.leaveImmersive()
    counted = Boolean(value)
  }
  watch(isImmersive, sync, { immediate: true })
  onBeforeUnmount(() => sync(false))
}

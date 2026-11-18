import { computed } from 'vue'
import { currentScheme } from '@/theme/themeService'
import { useTheme } from '@/theme/useTheme'

/** Le thème clair est-il affiché ? (service unique du thème) */
export function isLightSchemeActive(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return false
  return currentScheme(doc) === 'light'
}

/** `dark` suit le thème de la plateforme, quel que soit le bouton qui l'a changé. */
export function useMapTheme() {
  const { isDark } = useTheme()
  return { dark: computed(() => isDark.value) }
}

import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLayout } from '@/layout/composables/layout'

/**
 * Thème réellement actif : la feuille claire est-elle en service ?
 * En production le thème sombre est intégré à la feuille principale ; seule la claire reste un <link>.
 */
export function isLightSchemeActive(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return false
  const light = doc.querySelector('link[data-theme-link="heds"][data-theme-scheme="light"]')
  return Boolean(light && !light.disabled && light.media !== 'not all')
}

/**
 * `dark` suit le thème de la plateforme : bouton de la barre d'ordinateur (layoutConfig)
 * et réglage de l'application mobile (événement heds:theme-change).
 */
export function useMapTheme() {
  const { layoutConfig } = useLayout()
  const dark = ref(!isLightSchemeActive())
  const refresh = () => { dark.value = !isLightSchemeActive() }

  watch(() => layoutConfig.colorScheme.value, refresh)
  onMounted(() => {
    refresh()
    window.addEventListener('heds:theme-change', refresh)
  })
  onBeforeUnmount(() => window.removeEventListener('heds:theme-change', refresh))

  return { dark }
}

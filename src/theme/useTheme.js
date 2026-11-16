import { computed, reactive } from 'vue'
import { useLayout } from '@/layout/composables/layout'
import {
  THEME_EVENT,
  currentScheme,
  readPreference,
  setPreference as savePreference,
  toggleScheme,
} from '@/theme/themeService'

// État partagé par tous les composants : mis à jour par l'événement du service,
// quel que soit le bouton qui a changé le thème.
const state = reactive({ scheme: 'dim', preference: 'dim' })
let bound = false

function bind() {
  if (bound || typeof window === 'undefined') return
  bound = true
  const { layoutConfig } = useLayout()
  const sync = (scheme, preference) => {
    state.scheme = scheme
    state.preference = preference
    // Anciennes pages qui lisent encore le réglage de mise en page.
    layoutConfig.colorScheme.value = scheme
  }
  sync(currentScheme(window.document), readPreference(window))
  window.addEventListener(THEME_EVENT, (event) => {
    sync(event.detail?.scheme === 'light' ? 'light' : 'dim', event.detail?.preference || readPreference(window))
  })
}

/** Thème courant et réglage, réactifs, pour tout composant. */
export function useTheme() {
  bind()
  return {
    /** « light » ou « dim » : ce qui est affiché. */
    scheme: computed(() => state.scheme),
    /** « dim », « light » ou « auto » : ce que la personne a choisi. */
    preference: computed(() => state.preference),
    isDark: computed(() => state.scheme !== 'light'),
    setPreference: (value) => savePreference(value),
    toggle: () => toggleScheme(),
  }
}

import { inject } from 'vue'

export const MOBILE_SHELL_KEY = Symbol('mobileShell')

const noop = () => {}

/**
 * Accès à la coque depuis un écran mobile : ouvrir un panneau ou un écran
 * empilé, fermer celui du dessus, revenir en arrière.
 */
export function useMobileShell() {
  return inject(MOBILE_SHELL_KEY, { open: noop, close: noop, goBack: noop })
}

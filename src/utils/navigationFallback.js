/**
 * Navigation d'une application monopage : le réseau d'abord, puis la version en
 * cache de cette page, puis la coque de l'application. Ainsi, une adresse jamais
 * visitée s'ouvre aussi hors ligne au lieu de l'erreur du navigateur.
 */
export function createNavigationHandler({ strategy, matchShell }) {
  return async (options) => {
    try {
      const response = await strategy.handle(options)
      if (response) return response
    } catch (error) {
      const shell = await matchShell()
      if (shell) return shell
      throw error
    }
    const shell = await matchShell()
    return shell || Response.error()
  }
}

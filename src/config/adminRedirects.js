/**
 * Détermine le chemin de redirection après connexion selon les permissions.
 * @param {string[]} permissions
 * @returns {string} Le path de redirection
 */
export function getPostLoginRedirect(permissions = []) {
  return permissions.includes('auth.redirect.dashboard_rm')
    ? '/admin/dashboard-rm'
    : '/feed'
}

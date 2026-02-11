/**
 * Liste des emails qui sont redirigés directement vers /admin/dashboard-rm après connexion.
 * Centralisée ici pour éviter la duplication entre LoginView et LoginHome.
 *
 * @type {string[]}
 */
export const ADMIN_DIRECT_EMAILS = [
  'lucienne.darbellay-fumeaux@hevs.ch',
  'filipa.pereira@hevs.ch',
  'aline.chappuis@hevs.ch',
  'maude.epiney-perruchoud@hevs.ch',
  'isabelle.salamin-plaschy@hevs.ch',
  'rafael.weissbrodt@hevs.ch',
  'valerie.caloz-albrecht@hevs.ch',
  'tiffany.rapillard@hevs.ch',
  'omar.porteladossantos@hevs.ch',
  'jesse.curchod@hevs.ch',
  'line.martin@hevs.ch',
  'isabelle.rey@hevs.ch',
  'carla.gomesdarocha@hevs.ch',
  'elodie.perruchoud@hevs.ch',
]

/**
 * Détermine le chemin de redirection après connexion selon l'email.
 * @param {string} email
 * @returns {string} Le path de redirection
 */
export function getPostLoginRedirect(email) {
  if (!email) return '/feed'
  return ADMIN_DIRECT_EMAILS.includes(email.toLowerCase())
    ? '/admin/dashboard-rm'
    : '/feed'
}

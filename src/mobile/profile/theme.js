// Thème de l'application mobile : relais vers le service unique de la plateforme
// (src/theme/themeService.js), partagé avec les boutons d'ordinateur, les
// graphiques et la carte.
import { currentScheme, setPreference } from '@/theme/themeService'

export { currentScheme }

/** Enregistre et applique un choix : « dim », « light » ou « auto ». Retourne le thème affiché. */
export function applyScheme(preference) {
  return setPreference(preference)
}

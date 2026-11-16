// Calculs et images des écrans Maisons de l'application mobile, sans accès aux données.
import BlasonDoloris from '@/assets/maisons/mobile/BlasonDoloris.png'
import BlasonElaris from '@/assets/maisons/mobile/BlasonElaris.png'
import BlasonHarmonis from '@/assets/maisons/mobile/BlasonHarmonis.png'
import BlasonSolencia from '@/assets/maisons/mobile/BlasonSolencia.png'
import FondDoloris from '@/assets/maisons/mobile/FondDoloris.jpg'
import FondElaris from '@/assets/maisons/mobile/FondElaris.jpg'
import FondHarmonis from '@/assets/maisons/mobile/FondHarmonis.jpg'
import FondSolencia from '@/assets/maisons/mobile/FondSolencia.jpg'

export const HOUSE_KEYS = ['harmonis', 'elaris', 'doloris', 'solencia']

const VISUALS = {
  harmonis: { crest: BlasonHarmonis, background: FondHarmonis },
  elaris: { crest: BlasonElaris, background: FondElaris },
  doloris: { crest: BlasonDoloris, background: FondDoloris },
  solencia: { crest: BlasonSolencia, background: FondSolencia },
}

/** Clé de maison (« solencia ») depuis un nom libre (« Solencia », « sol… »), ou null. */
export function houseKey(value) {
  const text = String(value || '').trim().toLowerCase()
  return HOUSE_KEYS.find((key) => text.startsWith(key.slice(0, 3))) || null
}

/** Maison de la personne connectée, d'après son compte. */
export function userHouseKey(user) {
  return houseKey(user?.user_metadata?.maison || user?.maison || user?.house)
}

/**
 * Maison de la personne connectée : d'abord son compte, sinon ses données de
 * progression (là où la maison est réellement enregistrée). Jamais d'erreur.
 */
export async function fetchUserHouseKey(service, user) {
  const fromAccount = userHouseKey(user)
  if (fromAccount || !user?.id || user.id === 'guest-user') return fromAccount
  try {
    const data = await service.getUserGamificationData(user.id)
    return houseKey(data?.house_name || data?.maison || data?.house)
  } catch {
    return null
  }
}

export const houseVisual = (key) => VISUALS[houseKey(key)] || null

/** Avancement vers le niveau suivant, en pour cent (100 au dernier niveau). */
export function houseProgress(house) {
  if (!house) return 0
  if (Number(house.xpToNext) <= 0) return 100
  return Math.round(Math.min(100, Math.max(0, Number(house.progressPercent) || 0)))
}

/** « 12 340 » : séparateur des milliers de Suisse romande. */
export const formatNumber = (value) => Number(value || 0).toLocaleString('fr-CH')

/** « à l’instant », « il y a 5 min », « il y a 2 h », « il y a 3 jours ». */
export function updatedLabel(value, now = new Date()) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  const minutes = Math.floor((now - date) / 60000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 1440) return `il y a ${Math.floor(minutes / 60)} h`
  const days = Math.floor(minutes / 1440)
  return `il y a ${days} ${days > 1 ? 'jours' : 'jour'}`
}

/** Écart d'XP avec la maison classée juste devant (null pour la première). */
export function gapToNext(ranking = [], key) {
  const index = ranking.findIndex((house) => house.name === key)
  if (index <= 0) return null
  return Math.max(0, Number(ranking[index - 1].totalXP || 0) - Number(ranking[index].totalXP || 0))
}

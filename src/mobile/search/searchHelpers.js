import { supabase } from '@/supabase.js'

// Tuiles d'accès rapide de l'onglet Recherche. `feature` : réglage de
// gamification qui doit être actif ; `action` : comportement particulier.
const QUICK_TILES = [
  { key: 'challenges', icon: 'target', label: 'Défis et quêtes', detail: 'Gagner des points pour ta maison', to: '/challenges', fallbackTo: '/quests', feature: ['userJourney', 'badgesChallenges'] },
  { key: 'word', icon: 'letters', label: 'Mot de la semaine', detail: 'Six essais pour le trouver', to: '/mot-de-la-semaine', feature: ['wordOfDay'] },
  { key: 'quiz', icon: 'quiz', label: 'Quiz', detail: 'Réviser et suivre ton classement', to: '/quiz', feature: ['quizzes'] },
  { key: 'mentoring', icon: 'users', label: 'Mentorat', detail: 'Proposer ou réserver un créneau', to: '/mentorat', feature: ['mentoring'] },
  { key: 'documents', icon: 'file', label: 'Documents PFP', detail: 'Guides et formulaires', action: 'documents' },
  { key: 'scan', icon: 'qr', label: 'Scanner', detail: 'Valider ta présence à un événement', to: '/scan', feature: ['eventCheckin'] },
]

// Accès déjà présents ailleurs dans l'application mobile (onglets ou tuiles).
const COVERED_DESTINATIONS = new Set(['institutions', 'documents', 'map', 'profile', 'mentoring', 'quizzes'])

/** Tuiles à afficher selon les réglages actifs et les pages existantes. */
export function buildQuickTiles({ features = {}, hasPath = () => true } = {}) {
  return QUICK_TILES.flatMap((tile) => {
    if (tile.action) return [tile]
    const enabled = (tile.feature || []).every((name) => features[name])
    const to = enabled ? tile.to : tile.fallbackTo
    return to && hasPath(to) ? [{ ...tile, to }] : []
  })
}

/** Autres accès de la personne (votation, événements, outils, administration…). */
export function otherDestinations(destinations = []) {
  return destinations.filter((item) => !COVERED_DESTINATIONS.has(item.key))
}

const normalize = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLocaleLowerCase('fr-CH')
  .trim()

/** Pages et tuiles dont le nom ou la description contient la recherche. */
export function matchEntries(entries = [], term = '') {
  const needle = normalize(term)
  if (!needle) return []
  return entries.filter((entry) => normalize(`${entry.label} ${entry.detail || entry.description || ''}`).includes(needle))
}

/** Institutions dont le nom ou le lieu contient la recherche. */
export function matchInstitutions(institutions = [], term = '', limit = 6) {
  const needle = normalize(term)
  if (needle.length < 2) return []
  return institutions
    .filter((item) => item?.is_hidden !== true && normalize(`${item.Name} ${item.Locality} ${item.Canton}`).includes(needle))
    .sort((a, b) => {
      const aStarts = normalize(a.Name).startsWith(needle) ? 0 : 1
      const bStarts = normalize(b.Name).startsWith(needle) ? 0 : 1
      return aStarts - bStarts || String(a.Name).localeCompare(String(b.Name), 'fr-CH')
    })
    .slice(0, limit)
}

const HOUSE_NAMES = { harmonis: 'Harmonis', elaris: 'Elaris', doloris: 'Doloris', solencia: 'Solencia' }
const HOUSE_COLORS = { harmonis: '#10b981', elaris: '#ef4444', doloris: '#f59e0b', solencia: '#3b82f6' }

/** Classement prêt à afficher : rang, points, part du premier (pour la barre). */
export function buildHouseRanking(rows = []) {
  const houses = rows
    .filter((row) => row?.name && String(row.name).toLowerCase() !== 'gamemaster')
    .map((row) => {
      const key = String(row.name).toLowerCase()
      return {
        key,
        name: HOUSE_NAMES[key] || row.name,
        color: row.color || HOUSE_COLORS[key] || '#f3c300',
        xp: Math.max(0, Number(row.total_xp) || 0),
      }
    })
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, 'fr-CH'))
  const top = houses[0]?.xp || 0
  return houses.map((house, index) => ({
    ...house,
    rank: index + 1,
    percent: top > 0 ? Math.max(4, Math.round((house.xp / top) * 100)) : 0,
  }))
}

/** Points des maisons (table `houses`, la même source que la page du classement). */
export async function fetchHouseRanking() {
  const { data, error } = await supabase.from('houses').select('name, color, total_xp')
  if (error) throw error
  return buildHouseRanking(data || [])
}

export const formatXp = (value) => `${new Intl.NumberFormat('fr-CH').format(Number(value) || 0)} XP`

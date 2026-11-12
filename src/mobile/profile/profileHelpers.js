import { getLevelInfo, getLevelProgress, getXPToNextLevel } from '@/config/levelsConfig'

const HOUSES = {
  harmonis: { name: 'Harmonis', color: '#2E8B57' },
  elaris: { name: 'Elaris', color: '#DC143C' },
  doloris: { name: 'Doloris', color: '#FFD700' },
  solencia: { name: 'Solencia', color: '#4169E1' },
  gamemaster: { name: 'Maître du jeu', color: '#9333ea' },
}

/** Maison d'une personne à partir du nom enregistré : { key, name, color } ou null. */
export function houseOf(value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return null
  const key = text.startsWith('harm') ? 'harmonis'
    : text.startsWith('ela') ? 'elaris'
      : text.startsWith('dol') ? 'doloris'
        : text.startsWith('sol') ? 'solencia'
          : text.startsWith('game') || text.startsWith('maitre') || text.startsWith('maître') ? 'gamemaster'
            : null
  return key ? { key, ...HOUSES[key] } : null
}

export function displayNameOf(profile, fallbackEmail = '') {
  const display = String(profile?.display_name || '').trim()
  if (display) return display
  const full = [profile?.forname, profile?.family_name].filter(Boolean).join(' ').trim()
  if (full) return full
  const email = profile?.email || fallbackEmail || ''
  return email.split('@')[0] || 'Mon profil'
}

/** Niveau, points et avancée vers le niveau suivant, prêts à afficher. */
export function levelSummary({ level, xp } = {}) {
  const current = Math.min(20, Math.max(1, Math.trunc(Number(level) || 1)))
  const total = Math.max(0, Number(xp) || 0)
  const isMax = current >= 20
  return {
    level: current,
    name: getLevelInfo(current)?.name || getLevelInfo(current)?.title || '',
    xp: total,
    isMax,
    percent: isMax ? 100 : Math.round(getLevelProgress(current, total)),
    toNext: isMax ? 0 : getXPToNextLevel(current, total),
  }
}

/** Avancée d'un défi : « 3/5 », pourcentage, terminé ou non. */
export function challengeProgress(challenge) {
  const target = Math.max(1, Number(challenge?.target) || 1)
  const done = Math.min(target, Math.max(0, Number(challenge?.progress) || 0))
  const completed = Boolean(challenge?.completed) || done >= target
  return { label: `${completed ? target : done}/${target}`, percent: completed ? 100 : Math.round((done / target) * 100), completed }
}

/** Défis à mettre en avant : ceux en cours d'abord (les plus avancés), puis les terminés. */
export function featuredChallenges(challenges = [], limit = 3) {
  return challenges
    .map((challenge) => ({ challenge, state: challengeProgress(challenge) }))
    .sort((a, b) => Number(a.state.completed) - Number(b.state.completed) || b.state.percent - a.state.percent)
    .slice(0, limit)
}

/** Pictogramme d'un badge : classe d'icône de la plateforme, ou caractère (émoji). */
export function badgeIcon(badge) {
  const icon = String(badge?.icon || '').trim()
  if (/^pi[\s-]/.test(icon)) return { className: icon.startsWith('pi ') ? icon : `pi ${icon}`, text: '' }
  return { className: '', text: icon || '★' }
}

export const formatNumber = (value) => new Intl.NumberFormat('fr-CH').format(Number(value) || 0)

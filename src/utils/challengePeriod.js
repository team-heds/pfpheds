// Période couverte par les défis en cours, calculée depuis leurs dates réelles
// (et non plus depuis la semaine civile, les défis pouvant durer plusieurs semaines).

const toDate = (value, endOfDay = false) => {
  if (!value) return null
  const text = String(value)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T${endOfDay ? '23:59:59.999' : '00:00:00'}`)
    : new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDay = (date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

/** Début le plus tôt et fin la plus tardive des défis actifs ; null si aucun n'est daté. */
export function challengePeriod(challenges = []) {
  const starts = challenges.map((c) => toDate(c?.startDate)).filter(Boolean)
  const ends = challenges.map((c) => toDate(c?.endDate, true)).filter(Boolean)
  if (!starts.length && !ends.length) return null
  const start = starts.length ? new Date(Math.min(...starts)) : null
  const end = ends.length ? new Date(Math.max(...ends)) : null
  return { start, end }
}

/** « 9 nov. – 6 déc. », ou un libellé neutre sans défi daté. */
export function formatChallengePeriod(period) {
  if (!period) return 'Aucune date limite'
  if (period.start && period.end) return `${formatDay(period.start)} – ${formatDay(period.end)}`
  if (period.end) return `Jusqu’au ${formatDay(period.end)}`
  return `Depuis le ${formatDay(period.start)}`
}

/** Temps restant jusqu'à la fin de la période : « 27j 14h », « 5h », « Terminé ». */
export function formatTimeLeft(period, now = new Date()) {
  if (!period?.end) return '—'
  const diff = period.end - now
  if (diff <= 0) return 'Terminé'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  return days > 0 ? `${days}j ${hours}h` : `${Math.max(hours, 1)}h`
}

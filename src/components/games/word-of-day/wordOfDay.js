// Mot de la semaine physio : aides d'affichage. Aucune règle de jeu ici : le mot, la
// validation des essais et les points sont décidés par le serveur (voir les migrations
// 20261111110000_gamification_word_of_day.sql et 20261112100000_gamification_word_of_week.sql).

// Disposition du clavier suisse romand (QWERTZ).
export const KEYBOARD_ROWS = Object.freeze(['QWERTZUIOP', 'ASDFGHJKL', 'YXCVBNM'])

// Indices renvoyés par le serveur pour chaque lettre d'un essai. Chaque indice a une
// couleur, une icône et un libellé : la couleur n'est jamais le seul repère.
export const MARKS = Object.freeze({
  C: Object.freeze({ key: 'correct', label: 'bien placée', icon: 'pi pi-check' }),
  P: Object.freeze({ key: 'present', label: 'mal placée', icon: 'pi pi-arrows-h' }),
  A: Object.freeze({ key: 'absent', label: 'absente', icon: 'pi pi-times' }),
})

const MARK_PRIORITY = { C: 3, P: 2, A: 1 }

export const normalizeLetter = (value) => {
  const text = String(value ?? '')
  if ([...text].length !== 1) return ''
  const letter = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : ''
}

// Meilleur indice connu pour chaque lettre déjà jouée (pour colorer le clavier).
export const letterStates = (attempts = []) => {
  const states = {}
  for (const attempt of attempts) {
    const guess = String(attempt?.guess || '')
    const feedback = String(attempt?.feedback || '')
    for (let index = 0; index < guess.length; index += 1) {
      const mark = feedback[index]
      if (!MARKS[mark]) continue
      const letter = guess[index]
      if (!states[letter] || MARK_PRIORITY[mark] > MARK_PRIORITY[states[letter]]) states[letter] = mark
    }
  }
  return states
}

// Phrase lue par les lecteurs d'écran pour un essai : « Essai 2 : F bien placée, … ».
export const describeAttempt = (attempt, index) => {
  const guess = String(attempt?.guess || '')
  const feedback = String(attempt?.feedback || '')
  const letters = [...guess].map((letter, position) => `${letter} ${MARKS[feedback[position]]?.label || 'non évaluée'}`)
  return `Essai ${index + 1} : ${letters.join(', ')}`
}

export const attemptsLabel = (count) => (count > 1 ? `${count} essais` : `${count} essai`)

export const weeksLabel = (count) => (count > 1 ? `${count} semaines` : `${count} semaine`)

// Dates du calendrier (AAAA-MM-JJ) fournies par le serveur : traitées en UTC pour que
// l'affichage ne dépende jamais du fuseau de l'appareil.
const parseDay = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''))
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return Number.isNaN(date.getTime()) ? null : date
}
const addDays = (date, days) => new Date(date.getTime() + days * 86400000)
const formatDay = (date, options) => new Intl.DateTimeFormat('fr-CH', { timeZone: 'UTC', ...options }).format(date)

// « du 9 au 15 novembre », ou « du 30 novembre au 6 décembre » à cheval sur deux mois.
export const weekRangeLabel = (weekStart) => {
  const start = parseDay(weekStart)
  if (!start) return ''
  const end = addDays(start, 6)
  const sameMonth = start.getUTCMonth() === end.getUTCMonth()
  const from = formatDay(start, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' })
  return `du ${from} au ${formatDay(end, { day: 'numeric', month: 'long' })}`
}

// Jour d'arrivée du mot suivant : « lundi 16 novembre ».
export const nextWordLabel = (weekStart) => {
  const start = parseDay(weekStart)
  return start ? formatDay(addDays(start, 7), { weekday: 'long', day: 'numeric', month: 'long' }) : ''
}

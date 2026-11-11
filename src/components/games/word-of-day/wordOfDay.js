// Mot du jour physio : aides d'affichage. Aucune règle de jeu ici : le mot, la validation
// des essais et les points sont décidés par le serveur (voir la migration
// 20261111110000_gamification_word_of_day.sql).

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

export const daysLabel = (count) => (count > 1 ? `${count} jours` : `${count} jour`)

// Devise et description de chaque maison : les textes de la table `houses`,
// affichés par le classement. Décision du 16.11.2026 : le quiz des maisons, le
// profil et les bandeaux reprennent ces textes (ils affichaient une autre devise).
export const HOUSE_TEXTS = Object.freeze({
  harmonis: Object.freeze({
    motto: "Harmonie et équilibre dans l'apprentissage",
    description: "La maison Harmonis valorise l'équilibre, la collaboration et l'harmonie dans les relations interpersonnelles.",
  }),
  elaris: Object.freeze({
    motto: "Excellence et innovation pédagogique",
    description: "La maison Elaris représente l'excellence académique et l'innovation. Ses membres sont reconnus pour leur rigueur intellectuelle.",
  }),
  doloris: Object.freeze({
    motto: "Compassion et empathie thérapeutique",
    description: "La maison Doloris incarne la compassion et l'empathie dans les soins. Ses membres se distinguent par leur bienveillance.",
  }),
  solencia: Object.freeze({
    motto: "Force et détermination professionnelle",
    description: "La maison Solencia symbolise la force, la détermination et le leadership. Ses membres font preuve de courage et de persévérance.",
  }),
  gamemaster: Object.freeze({
    motto: "Voir tout, gérer tout",
    description: "Maison spéciale réservée aux maîtres du jeu et administrateurs",
  }),
})

const keyOf = (house) => String(house || '').trim().toLowerCase()

export const houseMotto = (house) => HOUSE_TEXTS[keyOf(house)]?.motto || ''
export const houseDescription = (house) => HOUSE_TEXTS[keyOf(house)]?.description || ''

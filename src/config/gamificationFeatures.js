const isEnabled = (value) => String(value || '').toLowerCase() === 'true'

export const gamificationFeatures = Object.freeze({
  userJourney: isEnabled(import.meta.env.VITE_GAMIFICATION_USER_UI),
  houseQuiz: isEnabled(import.meta.env.VITE_GAMIFICATION_HOUSE_QUIZ),
  badgesChallenges: isEnabled(import.meta.env.VITE_GAMIFICATION_BADGES_CHALLENGES),
})

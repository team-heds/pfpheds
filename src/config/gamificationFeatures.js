const isEnabled = (value) => String(value || '').toLowerCase() === 'true'

export const gamificationFeatures = Object.freeze({
  userJourney: isEnabled(import.meta.env.VITE_GAMIFICATION_USER_UI),
  houseQuiz: isEnabled(import.meta.env.VITE_GAMIFICATION_HOUSE_QUIZ),
  badgesChallenges: isEnabled(import.meta.env.VITE_GAMIFICATION_BADGES_CHALLENGES),
  gamesHub: isEnabled(import.meta.env.VITE_GAMIFICATION_GAMES_HUB),
  dailyWheel: isEnabled(import.meta.env.VITE_GAMIFICATION_DAILY_WHEEL),
  romRunner: isEnabled(import.meta.env.VITE_GAMIFICATION_ROM_RUNNER),
  tournaments: isEnabled(import.meta.env.VITE_GAMIFICATION_TOURNAMENTS),
  ventriglisse: isEnabled(import.meta.env.VITE_GAMIFICATION_VENTRIGLISSE),
})

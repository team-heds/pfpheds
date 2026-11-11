const isEnabled = (value) => String(value || '').toLowerCase() === 'true'

export const gamificationFeatures = Object.freeze({
  userJourney: isEnabled(import.meta.env.VITE_GAMIFICATION_USER_UI),
  houseQuiz: isEnabled(import.meta.env.VITE_GAMIFICATION_HOUSE_QUIZ),
  badgesChallenges: isEnabled(import.meta.env.VITE_GAMIFICATION_BADGES_CHALLENGES),
  mentoring: isEnabled(import.meta.env.VITE_GAMIFICATION_MENTORING),
  gamesHub: isEnabled(import.meta.env.VITE_GAMIFICATION_GAMES_HUB),
  quizzes: isEnabled(import.meta.env.VITE_GAMIFICATION_QUIZZES),
  dailyWheel: isEnabled(import.meta.env.VITE_GAMIFICATION_DAILY_WHEEL),
  romRunner: isEnabled(import.meta.env.VITE_GAMIFICATION_ROM_RUNNER),
  tournaments: isEnabled(import.meta.env.VITE_GAMIFICATION_TOURNAMENTS),
  ventriglisse: isEnabled(import.meta.env.VITE_GAMIFICATION_VENTRIGLISSE),
  eventCheckin: isEnabled(import.meta.env.VITE_GAMIFICATION_EVENT_CHECKIN),
})

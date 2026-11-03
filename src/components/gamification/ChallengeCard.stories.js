import ChallengeCard from './ChallengeCard.vue'

const challenge = {
  id: 'challenge-learning-streak',
  name: 'Une semaine d’apprentissage',
  description: 'Consulte une ressource pédagogique chaque jour pendant sept jours.',
  difficulty: 'MEDIUM',
  icon: '📚',
  category: 'apprentissage',
  progress: 4,
  target: 7,
  completed: false,
  endDate: '2027-09-30T20:00:00+02:00',
  reward: {
    xp: 450,
    badge: true,
    badgeName: 'Régularité clinique',
    title: null,
  },
}

export default {
  title: 'Gamification/Défi',
  component: ChallengeCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 25rem)"><story /></div>' })],
  args: {
    challenge,
    houseColor: '#167d86',
  },
}

export const EnCours = {}

export const PresqueTermine = {
  args: {
    challenge: {
      ...challenge,
      id: 'challenge-near-completion',
      progress: 6,
    },
  },
}

export const Termine = {
  args: {
    challenge: {
      ...challenge,
      id: 'challenge-completed',
      progress: 7,
      completed: true,
      completedAt: '2026-09-22T09:00:00+02:00',
    },
  },
}

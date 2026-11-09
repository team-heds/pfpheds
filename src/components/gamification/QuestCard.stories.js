import QuestCard from './QuestCard.vue'

const availableQuest = {
  id: 'quest-clinical-reasoning',
  title: 'Affûter son raisonnement clinique',
  description: 'Compléter une série de situations cliniques et justifier chaque choix thérapeutique.',
  icon: '🧭',
  difficulty: 'MEDIUM',
  type: 'weekly',
  status: 'not_started',
  xp_reward: 320,
  duration: 180,
  start_date: '2026-09-21T08:00:00+02:00',
  end_date: '2027-09-28T18:00:00+02:00',
}

export default {
  title: 'Gamification/Quête',
  component: QuestCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 38rem)"><story /></div>' })],
  args: {
    quest: availableQuest,
    houseColor: '#167d86',
    showSteps: true,
  },
}

export const Disponible = {}

export const EnCours = {
  args: {
    quest: {
      ...availableQuest,
      id: 'quest-in-progress',
      title: 'Documenter cinq prises en charge',
      status: 'in_progress',
      progress: 60,
      xp_reward: 500,
    },
  },
}

export const Terminee = {
  args: {
    quest: {
      ...availableQuest,
      id: 'quest-completed',
      title: 'Explorer les institutions partenaires',
      status: 'completed',
      progress: 100,
      xp_reward: 200,
    },
  },
}

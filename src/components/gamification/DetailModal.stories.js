import DetailModal from './DetailModal.vue'

const badge = {
  name: 'Régularité clinique',
  description: 'Récompense une participation régulière aux activités pédagogiques.',
  icon: 'pi pi-shield',
  rarity: 'rare',
  points: 250,
  category: 'Progression',
  unlocked_at: '2026-09-21T10:00:00+02:00',
  requirements: { type: 'login_streak', value: 7 },
}

const challenge = {
  title: 'Une semaine d’apprentissage',
  description: 'Consultez une ressource pédagogique chaque jour.',
  icon: 'pi pi-book',
  difficulty: 'medium',
  progress: 72,
  points: 450,
  type: 'Apprentissage',
  end_date: '2027-09-30T20:00:00+02:00',
  completed: false,
}

const quest = {
  title: 'Du bilan au plan de traitement',
  description: 'Construisez une prise en charge complète à partir d’une situation clinique.',
  icon: 'pi pi-compass',
  difficulty: 'hard',
  story: 'Une patiente reprend progressivement ses activités après une blessure de l’épaule.',
  points: 700,
  steps_completed: 1,
  total_steps: 3,
  steps: [
    { title: 'Bilan', description: 'Recueillir les informations utiles.', xp: 150 },
    { title: 'Hypothèses', description: 'Hiérarchiser les hypothèses cliniques.', xp: 200 },
    { title: 'Plan', description: 'Proposer un plan de traitement.', xp: 350 },
  ],
}

export default {
  title: 'Gamification/Fenêtre de détail',
  component: DetailModal,
  tags: ['autodocs'],
  args: { modelValue: true, type: 'badge', item: badge },
}

export const Badge = {}
export const Defi = { args: { type: 'challenge', item: challenge } }
export const Quete = { args: { type: 'quest', item: quest } }

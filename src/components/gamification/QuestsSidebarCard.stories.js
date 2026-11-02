import QuestsSidebarCard from './QuestsSidebarCard.vue'

const quests = [
  { id: 'new-1', title: 'Explorer les institutions', difficulty: 'easy', progress: 0, xp_reward: 100, isNew: true },
  { id: 'new-2', title: 'Compléter son profil de stage', difficulty: 'medium', progress: 35, xp_reward: 160, isNew: true },
  { id: 'new-3', title: 'Participer à la communauté', difficulty: 'hard', progress: 10, xp_reward: 240, isNew: false },
  { id: 'new-4', title: 'Défi collectif de la cohorte', difficulty: 'expert', progress: 0, xp_reward: 360, isNew: true },
]

export default {
  title: 'Gamification/Quêtes/Carte latérale',
  component: QuestsSidebarCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 30rem)"><story /></div>' })],
  args: { previewQuests: quests.slice(0, 3), previewHouseColor: '#2E8B57', previewLoading: false },
}

export const NouvellesQuetes = {}
export const AvecVoirToutes = { args: { previewQuests: quests } }
export const Vide = { args: { previewQuests: [] } }
export const Chargement = { args: { previewQuests: [], previewLoading: true } }


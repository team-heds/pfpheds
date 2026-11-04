import QuestsProfileCard from './QuestsProfileCard.vue'

const quests = [
  { id: 'quest-1', title: 'Découvrir les terrains de stage', description: 'Consultez trois institutions et enregistrez vos préférences.', difficulty: 'easy', progress: 75, xp_reward: 120 },
  { id: 'quest-2', title: 'Préparer son entretien', description: 'Complétez la liste de préparation avant votre prochain entretien.', difficulty: 'medium', progress: 40, xp_reward: 180 },
  { id: 'quest-3', title: 'Partager une ressource', description: 'Publiez une ressource utile pour votre cohorte.', difficulty: 'hard', progress: 15, xp_reward: 260 },
  { id: 'quest-4', title: 'Semaine sans retard', description: 'Validez toutes vos échéances de la semaine.', difficulty: 'expert', progress: 5, xp_reward: 400 },
]

export default {
  title: 'Gamification/Quêtes/Carte de profil',
  component: QuestsProfileCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 58rem)"><story /></div>' })],
  args: { houseColor: '#2E8B57', previewQuests: quests.slice(0, 3), previewLoading: false },
}

export const Actives = {}
export const AvecVoirToutes = { args: { previewQuests: quests } }
export const Vide = { args: { previewQuests: [] } }
export const Chargement = { args: { previewQuests: [], previewLoading: true } }


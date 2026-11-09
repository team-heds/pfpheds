import CreationToolsCard from './CreationToolsCard.vue'

export default {
  title: 'Gamification/Outils de création',
  component: CreationToolsCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 54rem)"><story /></div>' })],
  args: {
    userCreationStats: { questsCreated: 4, challengesCreated: 2, totalEngagement: 138 },
  },
}

export const AvecActivite = {}
export const PremiereCreation = { args: { userCreationStats: { questsCreated: 0, challengesCreated: 0, totalEngagement: 0 } } }

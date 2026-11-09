import BandeauGameMaster from './BandeauGameMaster.vue'

export default {
  title: 'Gamification/Maisons/Bandeau maître du jeu',
  component: BandeauGameMaster,
  tags: ['autodocs'],
  args: { niveau: 20, loginStreak: 9 },
}

export const Standard = {}
export const SansSerie = { args: { niveau: 20, loginStreak: 0 } }
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }


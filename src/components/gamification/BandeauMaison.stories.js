import BandeauMaison from './BandeauMaison.vue'

export default {
  title: 'Gamification/Maisons/Bandeau de maison',
  component: BandeauMaison,
  tags: ['autodocs'],
  args: { maison: 'harmonis', niveau: 8, loginStreak: 4 },
  argTypes: { maison: { control: 'select', options: ['harmonis', 'elaris', 'doloris', 'solencia', 'gamemaster'] } },
}

export const Harmonis = {}
export const Elaris = { args: { maison: 'elaris', niveau: 6, loginStreak: 2 } }
export const Doloris = { args: { maison: 'doloris', niveau: 11, loginStreak: 12 } }
export const Solencia = { args: { maison: 'solencia', niveau: 4, loginStreak: 1 } }
export const SansSerie = { args: { maison: 'harmonis', niveau: 2, loginStreak: 0 } }
export const SerieLongue = { args: { maison: 'elaris', niveau: 14, loginStreak: 31 } }
export const Mobile = { args: { maison: 'solencia', niveau: 7, loginStreak: 6 }, parameters: { viewport: { defaultViewport: 'mobile1' } } }


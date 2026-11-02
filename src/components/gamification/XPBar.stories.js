import XPBar from './XPBar.vue'

export default {
  title: 'Gamification/Barre d’expérience',
  component: XPBar,
  tags: ['autodocs'],
  args: {
    xp: 360,
    xpToNext: 140,
    niveau: 7,
    maison: 'harmonis',
  },
  argTypes: {
    maison: { control: 'select', options: ['harmonis', 'elaris', 'doloris', 'solencia'] },
  },
}

export const Standard = {}

export const PresqueAuNiveauSuivant = {
  args: { xp: 490, xpToNext: 10 },
}

import GamificationToast from './GamificationToast.vue'

export default {
  title: 'Gamification/Notification toast',
  component: GamificationToast,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    modelValue: true,
    autoClose: false,
    type: 'success',
    title: 'Progression enregistrée',
    message: 'Votre activité clinique a été prise en compte.',
    xp: 80,
  },
}

export const Succes = {}
export const BadgeDebloque = { args: { type: 'badge', title: 'Nouveau badge', message: 'Vous avez débloqué « Régularité clinique ».', xp: 150 } }
export const NiveauSuperieur = { args: { type: 'levelup', title: 'Niveau 8 atteint', message: 'Physiothérapeute diplômé·e', xp: 500 } }
export const Erreur = { args: { type: 'error', title: 'Progression non enregistrée', message: 'Réessayez dans quelques instants.', xp: null } }

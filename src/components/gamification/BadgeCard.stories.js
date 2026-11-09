import BadgeCard from './BadgeCard.vue'

const badge = {
  name: 'Premier pas',
  description: 'Première activité terminée sur la plateforme.',
  icon: '🌟',
  color: '#7c3aed',
  rarity: 'rare',
  xpBonus: 150,
  unlockedAt: '2026-09-20T10:00:00.000Z',
}

export default {
  title: 'Gamification/Badge',
  component: BadgeCard,
  tags: ['autodocs'],
  args: {
    badge,
    isUnlocked: true,
    isNewlyUnlocked: false,
    progressHint: '',
    showProgress: false,
    progressValue: 0,
    progressMax: 10,
  },
  decorators: [() => ({ template: '<div style="max-width:22rem"><story /></div>' })],
}

export const Debloque = {}

export const Nouveau = {
  args: { isNewlyUnlocked: true },
}

export const Verrouille = {
  args: {
    isUnlocked: false,
    progressHint: 'Terminez encore 3 activités.',
    showProgress: true,
    progressValue: 7,
  },
}

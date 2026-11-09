import MiniChart from './MiniChart.vue'

export default {
  title: 'Composants/Visualisations/Mini-tendance',
  component: MiniChart,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="width:min(100%, 32rem)"><story /></div>' })],
  args: {
    data: [42, 47, 45, 53, 58, 61, 66, 72],
    color: '#F3C300',
    height: 72,
    accessibleLabel: 'Progression du nombre de places disponibles sur huit semaines',
  },
}

export const Progression = {}
export const Recul = { args: { data: [78, 74, 69, 71, 63, 59, 54], color: '#ef4444', accessibleLabel: 'Baisse du taux d’attribution' } }
export const SansDonnees = { args: { data: [], accessibleLabel: 'Aucune évolution disponible' } }


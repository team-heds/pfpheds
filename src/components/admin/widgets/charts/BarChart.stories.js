import BarChart from './BarChart.vue'

const cantonData = [
  { label: 'Valais', value: 86, color: '#F3C300' },
  { label: 'Vaud', value: 64, color: '#38bdf8' },
  { label: 'Genève', value: 48, color: '#a78bfa' },
  { label: 'Fribourg', value: 35, color: '#34d399' },
  { label: 'Berne', value: 22, color: '#fb923c' },
]

export default {
  title: 'Composants/Visualisations/Graphique en barres',
  component: BarChart,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="width:min(100%, 58rem)"><story /></div>' })],
  args: { data: cantonData, title: 'Places de stage par canton', height: 340, horizontal: false, accessibleLabel: 'Nombre de places de stage réparties par canton' },
}

export const Vertical = {}
export const Horizontal = { args: { horizontal: true, title: 'Répartition cantonale' } }
export const SansDonnees = { args: { data: [], title: 'Places de stage' } }


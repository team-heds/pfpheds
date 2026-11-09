import PieChart from './PieChart.vue'

const sectorData = [
  { label: 'Soins aigus', value: 94, color: '#F3C300' },
  { label: 'Réadaptation', value: 52, color: '#38bdf8' },
  { label: 'Santé communautaire', value: 38, color: '#34d399' },
  { label: 'Psychiatrie', value: 31, color: '#a78bfa' },
]

export default {
  title: 'Composants/Visualisations/Graphique en secteurs',
  component: PieChart,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="width:min(100%, 42rem)"><story /></div>' })],
  args: { data: sectorData, title: 'Places par domaine clinique', height: 360, showLegend: true, accessibleLabel: 'Répartition des places par domaine clinique' },
}

export const AvecLegende = {}
export const SansLegende = { args: { showLegend: false } }
export const SansDonnees = { args: { data: [], title: 'Domaines cliniques' } }


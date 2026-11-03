import DoughnutChart from './DoughnutChart.vue'

const assignmentData = [
  { label: 'Attribuées', value: 164, color: '#34d399' },
  { label: 'Disponibles', value: 42, color: '#F3C300' },
  { label: 'En attente', value: 18, color: '#94a3b8' },
]

export default {
  title: 'Composants/Visualisations/Graphique en anneau',
  component: DoughnutChart,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="width:min(100%, 42rem)"><story /></div>' })],
  args: { data: assignmentData, title: 'État des attributions', height: 360, showLegend: true, showCenterText: true, centerValue: '224', centerLabel: 'Places', cutout: '70%', accessibleLabel: 'Répartition des 224 places selon leur état d’attribution' },
}

export const AvecTotal = {}
export const AnneauCompact = { args: { height: 280, cutout: '62%', showCenterText: false } }
export const SansDonnees = { args: { data: [], title: 'État des attributions' } }


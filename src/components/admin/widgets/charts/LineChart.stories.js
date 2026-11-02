import LineChart from './LineChart.vue'

const monthlyData = [
  { x: 'Jan.', y: 118 }, { x: 'Fév.', y: 126 }, { x: 'Mars', y: 121 },
  { x: 'Avr.', y: 139 }, { x: 'Mai', y: 148 }, { x: 'Juin', y: 157 },
]

export default {
  title: 'Composants/Visualisations/Graphique en ligne',
  component: LineChart,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="width:min(100%, 58rem)"><story /></div>' })],
  args: { data: monthlyData, label: 'Places disponibles', color: '#F3C300', height: 340, fill: true, showPoints: true, smooth: true, accessibleLabel: 'Évolution mensuelle des places disponibles' },
}

export const Evolution = {}
export const LigneSimple = { args: { fill: false, showPoints: false, smooth: false, color: '#38bdf8' } }
export const SansDonnees = { args: { data: [], label: 'Places disponibles' } }


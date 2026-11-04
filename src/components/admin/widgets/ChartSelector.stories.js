import ChartSelector from './ChartSelector.vue'

const cohortData = [
  { label: 'BA22', value: 37 },
  { label: 'BA23', value: 54 },
  { label: 'BA24', value: 61 },
  { label: 'BA25', value: 48 },
]

const timelineData = [
  { x: 'S1', y: 22 }, { x: 'S2', y: 31 }, { x: 'S3', y: 29 },
  { x: 'S4', y: 43 }, { x: 'S5', y: 51 }, { x: 'S6', y: 58 },
]

export default {
  title: 'Composants/Visualisations/Sélecteur de graphique',
  component: ChartSelector,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 58rem)"><story /></div>' })],
  args: { data: cohortData, title: 'Étudiants par cohorte', defaultType: 'doughnut', height: 340, showRefresh: false, chartColor: '#F3C300' },
  argTypes: { defaultType: { control: 'select', options: ['auto', 'pie', 'doughnut', 'bar', 'horizontal-bar', 'line'] } },
}

export const Anneau = {}
export const Barres = { args: { defaultType: 'bar' } }
export const DetectionAutomatique = { args: { data: timelineData, title: 'Évolution hebdomadaire', defaultType: 'auto' } }
export const AvecActualisation = { args: { showRefresh: true, defaultType: 'pie' } }


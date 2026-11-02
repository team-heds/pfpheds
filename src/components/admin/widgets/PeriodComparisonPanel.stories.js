import PeriodComparisonPanel from './PeriodComparisonPanel.vue'

const kpis = [
  { id: 'places', label: 'Places disponibles', value: 186, status: 'ok', icon: 'pi pi-building', color: '#F3C300', comparisonData: { status: 'ok', value: 172, percentChange: 8.1 } },
  { id: 'students', label: 'Étudiants attribués', value: 164, status: 'ok', icon: 'pi pi-users', color: '#38bdf8', comparisonData: { status: 'ok', value: 158, percentChange: 3.8 } },
  { id: 'pending', label: 'Dossiers en attente', value: 12, status: 'ok', icon: 'pi pi-clock', color: '#fb923c', comparisonData: { status: 'ok', value: 18, percentChange: -33.3 } },
]

export default {
  title: 'Composants/Administration/Comparaison de périodes',
  component: PeriodComparisonPanel,
  tags: ['autodocs'],
  args: { kpis, period: 'month' },
  argTypes: { period: { control: 'select', options: ['day', 'week', 'month', 'quarter', 'year'] } },
}

export const Mensuelle = {}
export const Annuelle = { args: { period: 'year' } }
export const HistoriqueIndisponible = { args: { kpis: [], period: 'quarter' } }


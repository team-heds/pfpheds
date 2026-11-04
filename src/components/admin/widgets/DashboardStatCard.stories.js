import DashboardStatCard from './DashboardStatCard.vue'

export default {
  title: 'Composants/Administration/Indicateur',
  component: DashboardStatCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 22rem)"><story /></div>' })],
  args: {
    label: 'Étudiant·es actifs',
    value: 284,
    caption: 'Toutes filières confondues',
    icon: 'pi pi-users',
    color: '#F3C300',
    status: 'ok',
    loading: false,
  },
}

export const Disponible = {}
export const Chargement = { args: { loading: true } }
export const Indisponible = { args: { value: null, status: 'error' } }

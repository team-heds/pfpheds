import KpiCard from './KpiCard.vue'

export default {
  title: 'Composants/Tableau de bord/Indicateur KPI',
  component: KpiCard,
  tags: ['autodocs'],
  args: {
    label: 'Étudiants actifs',
    subtitle: 'Année académique 2026–2027',
    value: 284,
    icon: 'pi pi-users',
    color: '#F3C300',
    trend: 6.4,
    comparison: 'Par rapport à l’année précédente',
    animated: false,
    clickable: false,
  },
  decorators: [() => ({ template: '<div style="max-width:26rem"><story /></div>' })],
}

export const Standard = {}

export const AvecAction = {
  args: {
    label: 'Places à valider',
    subtitle: 'Formation pratique',
    value: 18,
    icon: 'pi pi-briefcase',
    color: '#F59E0B',
    trend: -12,
    comparison: 'Depuis la semaine dernière',
    clickable: true,
    actionLabel: 'Voir les places',
  },
}

export const Indisponible = {
  args: {
    label: 'Taux de couverture',
    subtitle: 'Synchronisation en attente',
    value: null,
    icon: 'pi pi-chart-line',
    color: '#64748B',
    trend: null,
    comparison: '',
    status: 'unavailable',
  },
}

export const Chargement = {
  args: { loading: true },
}

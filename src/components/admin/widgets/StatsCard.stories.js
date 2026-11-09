import StatsCard from './StatsCard.vue'

export default {
  title: 'Composants/Administration/Carte statistique',
  component: StatsCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 34rem)"><story /></div>' })],
  args: {
    title: 'Places de stage disponibles',
    subtitle: 'Semestre d’automne 2026',
    value: 186,
    icon: 'pi pi-building',
    color: '#F3C300',
    trend: 8.4,
    showChartToggle: false,
    additionalInfo: [
      { label: 'Institutions', value: '42' },
      { label: 'Cantons', value: '6' },
    ],
    footerText: 'Dernière synchronisation : aujourd’hui à 08:45',
  },
}

export const Hausse = {}
export const Baisse = { args: { value: 128, trend: -4.2, color: '#ef4444' } }
export const Stable = { args: { value: 164, trend: 0, color: '#38bdf8' } }

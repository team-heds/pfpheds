import PageList from './PageList.vue'

const pages = [
  { id: 'assessment', title: 'Bilan initial', updatedAt: '2026-09-21T13:30:00+02:00' },
  { id: 'hypotheses', title: 'Hypothèses cliniques', updatedAt: '2026-09-20T16:15:00+02:00' },
  { id: 'plan', title: 'Plan de traitement', createdAt: '2026-09-18T09:00:00+02:00' },
]

export default {
  title: 'Composants/Notes/Liste des feuilles',
  component: PageList,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 25rem);height:32rem"><story /></div>' })],
  args: { pages, selectedPageId: 'hypotheses' },
}

export const AvecRecherche = {}
export const SansSelection = { args: { selectedPageId: null } }
export const Vide = { args: { pages: [] } }

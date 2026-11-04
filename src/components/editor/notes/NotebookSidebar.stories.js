import NotebookSidebar from './NotebookSidebar.vue'

const notebooks = [
  { id: 'clinical', name: 'Raisonnement clinique' },
  { id: 'placements', name: 'Stages PFP' },
  { id: 'research', name: 'Travail de Bachelor' },
]

export default {
  title: 'Composants/Notes/Liste des classeurs',
  component: NotebookSidebar,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 24rem);height:28rem"><story /></div>' })],
  args: { notebooks, selectedNotebookId: 'clinical' },
}

export const AvecSelection = {}
export const SansSelection = { args: { selectedNotebookId: null } }
export const Vide = { args: { notebooks: [] } }

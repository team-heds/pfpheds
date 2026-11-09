import Button from 'primevue/button'
import BlockViewer from './BlockViewer.vue'

export default {
  title: 'Composants/Utilitaires/Bloc de démonstration',
  component: BlockViewer,
  tags: ['autodocs'],
  args: {
    header: 'Bouton principal',
    code: '<Button label="Enregistrer" icon="pi pi-check" />',
  },
  render: (args) => ({
    components: { BlockViewer, Button },
    setup: () => ({ args }),
    template: '<BlockViewer v-bind="args"><Button label="Enregistrer" icon="pi pi-check" /></BlockViewer>',
  }),
}

export const AvecCode = {}
export const ApercuSeul = { args: { header: 'Action secondaire', code: null } }

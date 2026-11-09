import { ref } from 'vue'
import TriStateCell from './TriStateCell.vue'

const renderControlled = (args) => ({
  components: { TriStateCell },
  setup() {
    const value = ref(args.value)
    const comment = ref(args.comment)
    return { value, comment }
  },
  template: '<TriStateCell v-model:value="value" v-model:comment="comment" />',
})

export default {
  title: 'Composants/Administration/Cellule de validation',
  component: TriStateCell,
  tags: ['autodocs'],
  render: renderControlled,
  args: { value: null, comment: '' },
  decorators: [() => ({ template: '<div style="width:12rem;padding:1.5rem;border-radius:1rem;background:var(--surface-card)"><story /></div>' })],
}

export const NonRenseignee = {}
export const NonConforme = { args: { value: false, comment: 'Le document doit être complété.' } }
export const Validee = { args: { value: true, comment: 'Contrôle effectué.' } }

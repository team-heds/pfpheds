import Button from 'primevue/button'
import FormActions from './FormActions.vue'

export default {
  title: 'Composants/Formulaires/Barre d’actions',
  component: FormActions,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="width:min(100%, 58rem)"><story /></div>' })],
  args: { sticky: false, busy: false, status: 'idle', statusMessage: '' },
  argTypes: { status: { control: 'select', options: ['idle', 'loading', 'success', 'error'] } },
  render: (args) => ({
    components: { FormActions, Button },
    setup: () => ({ args }),
    template: `
      <FormActions v-bind="args">
        <template #secondary><Button label="Annuler" text severity="secondary" /></template>
        <Button label="Enregistrer" icon="pi pi-check" :loading="args.busy" />
      </FormActions>
    `,
  }),
}

export const ParDefaut = {}
export const Enregistrement = { args: { busy: true, status: 'loading', statusMessage: 'Enregistrement des modifications…' } }
export const Succes = { args: { status: 'success', statusMessage: 'Modifications enregistrées.' } }
export const Erreur = { args: { status: 'error', statusMessage: 'Corrigez les champs signalés avant de continuer.' } }


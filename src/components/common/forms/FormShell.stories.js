import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FormField from './FormField.vue'
import FormSection from './FormSection.vue'
import FormShell from './FormShell.vue'

export default {
  title: 'Composants/Formulaires/Conteneur',
  component: FormShell,
  tags: ['autodocs'],
  args: {
    title: 'Modifier le profil',
    description: 'Mettez à jour les informations visibles par votre institution.',
    busy: false,
  },
  render: (args) => ({
    components: { Button, FormField, FormSection, FormShell, InputText },
    setup: () => ({ args }),
    template: `
      <FormShell v-bind="args">
        <FormSection title="Identité" icon="pi pi-id-card">
          <FormField for-id="shell-name" label="Nom complet" span="12" v-slot="field">
            <InputText v-bind="field.controlAttrs" model-value="Camille Dubuis" />
          </FormField>
        </FormSection>
        <template #actions>
          <Button label="Annuler" outlined severity="secondary" />
          <Button label="Enregistrer" icon="pi pi-check" :loading="args.busy" />
        </template>
      </FormShell>
    `,
  }),
}

export const Standard = {}
export const Enregistrement = { args: { busy: true, description: 'Enregistrement des informations en cours…' } }
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }


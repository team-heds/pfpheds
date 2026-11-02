import InputText from 'primevue/inputtext'
import FormField from './FormField.vue'
import FormSection from './FormSection.vue'

export default {
  title: 'Composants/Formulaires/Section',
  component: FormSection,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 58rem)"><story /></div>' })],
  args: {
    title: 'Informations personnelles',
    description: 'Ces informations permettent d’identifier la personne dans la plateforme.',
    icon: 'pi pi-user',
    disabled: false,
  },
  render: (args) => ({
    components: { FormField, FormSection, InputText },
    setup: () => ({ args }),
    template: `
      <FormSection v-bind="args">
        <FormField for-id="section-firstname" label="Prénom" required v-slot="field">
          <InputText v-bind="field.controlAttrs" model-value="Camille" />
        </FormField>
        <FormField for-id="section-lastname" label="Nom" required v-slot="field">
          <InputText v-bind="field.controlAttrs" model-value="Dubuis" />
        </FormField>
      </FormSection>
    `,
  }),
}

export const InformationsPersonnelles = {}
export const SansDescription = { args: { title: 'Coordonnées', description: '', icon: 'pi pi-address-book' } }
export const Desactivee = { args: { disabled: true, title: 'Informations verrouillées', description: 'Cette section ne peut plus être modifiée après validation.', icon: 'pi pi-lock' } }


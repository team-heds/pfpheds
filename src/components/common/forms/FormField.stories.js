import InputText from 'primevue/inputtext'
import FormField from './FormField.vue'

export default {
  title: 'Composants/Formulaires/Champ',
  component: FormField,
  tags: ['autodocs'],
  args: {
    forId: 'email',
    label: 'Adresse e-mail',
    hint: 'Utilisez votre adresse institutionnelle.',
    required: true,
    disabled: false,
    error: '',
    success: '',
    span: 6,
  },
  argTypes: {
    span: { control: 'select', options: [3, 4, 6, 8, 12] },
  },
  render: (args) => ({
    components: { FormField, InputText },
    setup: () => ({ args }),
    template: `
      <div style="display:grid;grid-template-columns:repeat(12,minmax(0,1fr));max-width:48rem">
        <FormField v-bind="args" v-slot="{ controlAttrs }">
          <InputText v-bind="controlAttrs" placeholder="prenom.nom@hevs.ch" />
        </FormField>
      </div>
    `,
  }),
}

export const Standard = {}

export const Erreur = {
  args: {
    hint: '',
    error: 'Cette adresse e-mail n’est pas valide.',
  },
}

export const Valide = {
  args: {
    hint: '',
    success: 'Adresse disponible.',
  },
}

export const Facultatif = {
  args: {
    required: false,
    optionalLabel: 'Facultatif',
  },
}

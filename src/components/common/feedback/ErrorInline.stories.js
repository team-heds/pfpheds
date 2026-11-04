import InputText from 'primevue/inputtext'
import ErrorInline from './ErrorInline.vue'

export default {
  title: 'Composants/Feedback/Erreur de champ',
  component: ErrorInline,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="width:min(100%, 32rem)"><story /></div>' })],
  args: { id: 'email-error', message: 'Saisissez une adresse e-mail valide.' },
}

export const Validation = {
  render: (args) => ({
    components: { ErrorInline, InputText },
    setup: () => ({ args }),
    template: `
      <div style="display:grid;gap:.5rem">
        <label for="story-email">Adresse e-mail</label>
        <InputText id="story-email" class="p-invalid" model-value="adresse-invalide" aria-invalid="true" :aria-describedby="args.id" />
        <ErrorInline v-bind="args" />
      </div>
    `,
  }),
}
export const ChampObligatoire = { args: { id: 'required-error', message: 'Ce champ est obligatoire.' } }
export const ErreurServeur = { args: { id: 'server-error', message: 'L’enregistrement a échoué. Vérifiez votre connexion puis réessayez.' } }


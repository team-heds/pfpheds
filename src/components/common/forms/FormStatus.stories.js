import Button from 'primevue/button'
import FormStatus from './FormStatus.vue'

export default {
  title: 'Composants/Formulaires/Statut',
  component: FormStatus,
  tags: ['autodocs'],
  args: {
    status: 'loading',
    title: 'Enregistrement en cours',
    message: 'Vos modifications sont envoyées de manière sécurisée.',
  },
  argTypes: {
    status: { control: 'select', options: ['idle', 'loading', 'success', 'error'] },
  },
}

export const Chargement = {}

export const Succes = {
  args: {
    status: 'success',
    title: 'Modifications enregistrées',
    message: 'Les nouvelles informations sont maintenant visibles.',
  },
}

export const Erreur = {
  args: {
    status: 'error',
    title: 'Enregistrement impossible',
    message: 'Vérifiez votre connexion puis réessayez.',
  },
  render: (args) => ({
    components: { FormStatus, Button },
    setup: () => ({ args }),
    template: `
      <FormStatus v-bind="args">
        <template #action><Button label="Réessayer" size="small" severity="danger" outlined /></template>
      </FormStatus>
    `,
  }),
}

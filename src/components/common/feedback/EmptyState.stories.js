import Button from 'primevue/button'
import EmptyState from './EmptyState.vue'

export default {
  title: 'Composants/Feedback/État vide enrichi',
  component: EmptyState,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="width:min(100%, 58rem)"><story /></div>' })],
  args: {
    title: 'Aucun résultat',
    description: 'Modifiez vos critères de recherche pour afficher davantage de résultats.',
    icon: 'pi-search',
    actionLabel: 'Réinitialiser les filtres',
  },
}

export const RechercheSansResultat = {}
export const AucunDocument = {
  args: {
    title: 'Aucun document partagé',
    description: 'Les documents ajoutés à ce dossier apparaîtront ici.',
    icon: 'pi-file',
    actionLabel: 'Ajouter un document',
  },
}
export const SansAction = {
  args: {
    title: 'Aucune notification',
    description: 'Vous êtes à jour. Les nouvelles notifications apparaîtront ici.',
    icon: 'pi-bell',
    actionLabel: '',
  },
}
export const ActionsPersonnalisees = {
  render: (args) => ({
    components: { EmptyState, Button },
    setup: () => ({ args }),
    template: `
      <EmptyState v-bind="args" action-label="">
        <template #actions>
          <Button label="Créer une communauté" icon="pi pi-plus" />
          <Button label="Découvrir les communautés" outlined severity="secondary" />
        </template>
      </EmptyState>
    `,
  }),
  args: {
    title: 'Aucune communauté suivie',
    description: 'Créez un nouvel espace ou rejoignez une communauté existante.',
    icon: 'pi-users',
  },
}


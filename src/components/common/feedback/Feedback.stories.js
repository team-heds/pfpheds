import AppSkeleton from './AppSkeleton.vue'
import AppSpinner from './AppSpinner.vue'
import EmptyState from './EmptyState.vue'
import ErrorInline from './ErrorInline.vue'

export default {
  title: 'Composants/Retours d’état',
  tags: ['autodocs'],
}

export const Chargement = {
  render: () => ({
    components: { AppSpinner, AppSkeleton },
    template: `
      <div style="display:grid;gap:2rem;max-width:52rem">
        <AppSpinner size="md" label="Chargement des données…" />
        <AppSkeleton :rows="5" :cols="4" />
      </div>
    `,
  }),
}

export const ListeVide = {
  render: () => ({
    components: { EmptyState },
    template: '<EmptyState title="Aucun résultat" description="Modifiez les filtres ou créez un premier élément." icon="pi-inbox" />',
  }),
}

export const Erreur = {
  render: () => ({
    components: { ErrorInline },
    template: '<ErrorInline message="Les données n’ont pas pu être chargées." />',
  }),
}

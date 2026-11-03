import EmptyState from './EmptyState.vue'
import ErrorState from './ErrorState.vue'
import LoadingState from './LoadingState.vue'

export default {
  title: 'Composants/États système',
  tags: ['autodocs'],
}

export const Vide = {
  render: () => ({
    components: { EmptyState },
    template: '<div class="storybook-surface"><EmptyState title="Aucune publication" description="Soyez la première personne à partager une information avec la communauté." action-label="Créer une publication" icon="pi pi-comments" /></div>',
  }),
}

export const Chargement = {
  render: () => ({
    components: { LoadingState },
    template: '<div class="storybook-surface"><LoadingState label="Chargement des institutions…" /></div>',
  }),
}

export const Erreur = {
  render: () => ({
    components: { ErrorState },
    template: '<ErrorState title="Impossible de charger les institutions" description="Vérifiez votre connexion puis réessayez." retry-label="Réessayer" />',
  }),
}

export const ParcoursComplet = {
  render: () => ({
    components: { EmptyState, ErrorState, LoadingState },
    template: `
      <div class="storybook-stack">
        <section class="storybook-section"><h2>Chargement</h2><div class="storybook-surface"><LoadingState /></div></section>
        <section class="storybook-section"><h2>Résultat vide</h2><div class="storybook-surface"><EmptyState title="Aucun résultat" description="Modifiez les filtres actifs pour élargir la recherche." action-label="Effacer les filtres" /></div></section>
        <section class="storybook-section"><h2>Erreur récupérable</h2><ErrorState /></section>
      </div>
    `,
  }),
}

import { defineAsyncComponent } from 'vue'

// Panneaux du bas et écrans empilés de l'application mobile. Le nom apparaît
// dans l'adresse (« /feed#/notifications ») : le retour du téléphone les ferme.
// `restorable` : peut se rouvrir seul après un rechargement (aucune donnée à fournir).
export const OVERLAYS = {
  notifications: {
    component: defineAsyncComponent(() => import('@/mobile/home/NotificationsScreen.vue')),
    restorable: true,
  },
  // Création en plein écran : publication ou story, au choix.
  publier: {
    component: defineAsyncComponent(() => import('@/mobile/home/CreateScreen.vue')),
    props: { mode: 'post' },
    restorable: true,
  },
  commentaires: {
    component: defineAsyncComponent(() => import('@/mobile/home/CommentsSheet.vue')),
  },
  aime: {
    component: defineAsyncComponent(() => import('@/mobile/home/LikersSheet.vue')),
  },
  'nouvelle-story': {
    component: defineAsyncComponent(() => import('@/mobile/home/CreateScreen.vue')),
    props: { mode: 'story' },
    restorable: true,
  },
  filtres: {
    component: defineAsyncComponent(() => import('@/mobile/institutions/InstitutionFiltersSheet.vue')),
    restorable: true,
  },
  story: {
    component: defineAsyncComponent(() => import('@/mobile/home/StoryViewerOverlay.vue')),
  },
}

export const canRestoreOverlay = (name) => Boolean(OVERLAYS[name]?.restorable)

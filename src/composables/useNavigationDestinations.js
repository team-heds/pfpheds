import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useRoleStore } from '@/stores/role'
import { evaluateRouteAccess } from '@/router/accessControl'
import { gamificationFeatures } from '@/config/gamificationFeatures'

export function getVotationDestination(profile) {
  return profile?.pfp_cohort === 'PFP1B' ? '/votation_pfp1b' : '/votation'
}

const studyDestinations = [
  { key: 'votation', label: 'Votation', description: 'Consulter la campagne et classer vos choix.', icon: 'pi pi-check-square' },
  { key: 'institutions', to: '/institution', label: 'Institutions', description: 'Découvrir les institutions et les places de stage.', icon: 'pi pi-building' },
  { key: 'documents', to: '/documents_pfp', label: 'Documents PFP', description: 'Retrouver les documents de formation pratique.', icon: 'pi pi-file' },
  { key: 'map', to: '/map', label: 'Carte des institutions', description: 'Situer les institutions et préparer vos recherches.', icon: 'pi pi-map-marker' },
  { key: 'events', to: '/events', label: 'Événements', description: 'Consulter les événements et vos participations.', icon: 'pi pi-calendar' },
  { key: 'profile', label: 'Mon profil', description: 'Consulter votre parcours et modifier vos informations.', icon: 'pi pi-user' },
]

const toolDestinations = [
  { key: 'notes', to: '/notes', label: 'Mes notes', description: 'Ouvrir vos carnets et vos pages.', icon: 'pi pi-book' },
  { key: 'tools', to: '/outils', label: 'Tous les outils', description: 'Retrouver les outils disponibles sur la plateforme.', icon: 'pi pi-th-large' },
  { key: 'games', to: '/game', label: 'Jeux', description: 'Accéder aux jeux et aux activités.', icon: 'pi pi-star', feature: 'gamesHub' },
]

const administrationDestinations = [
  { key: 'admin', to: '/admin', label: 'Administration', description: 'Ouvrir votre tableau de bord de gestion.', icon: 'pi pi-cog' },
  { key: 'rm', to: '/admin/dashboard-rm', label: 'Responsable de module', description: 'Consulter le tableau de bord RM soins infirmiers.', icon: 'pi pi-briefcase' },
  { key: 'teacher', to: '/admin/soins-infirmiers/dashboard-enseignant', label: 'Enseignant soins infirmiers', description: 'Retrouver vos cours et vos postulations.', icon: 'pi pi-users' },
  { key: 'secretariat', to: '/admin/soins-infirmiers/dashboard', label: 'Secrétariat soins infirmiers', description: 'Accéder au suivi et à la planification.', icon: 'pi pi-calendar-plus' },
]

/** Use the same route metadata and evaluator as the navigation guard. */
export function getNavigationDestinations({
  router,
  userId,
  profile,
  permissions = [],
  isAuthenticated = false,
  isSuper = false,
  can = () => false,
  features = {},
}) {
  const academicOnly = permissions.includes('academic.restricted')
  const items = [
    ...studyDestinations.map(item => ({ ...item, section: 'study' })),
    ...toolDestinations.map(item => ({ ...item, section: 'tools' })),
    ...administrationDestinations.map(item => ({ ...item, section: 'administration' })),
  ]

  return items.flatMap(item => {
    if (academicOnly && item.section !== 'administration' && item.key !== 'profile') return []
    if (item.feature && !features[item.feature]) return []
    const to = item.key === 'votation'
      ? getVotationDestination(profile)
      : item.key === 'profile'
        ? (userId ? `/profile/${encodeURIComponent(userId)}` : null)
        : item.to
    if (!to) return []

    const resolved = router.resolve(to)
    if (!resolved.matched?.length || resolved.name === 'Error404') return []
    const access = evaluateRouteAccess({
      ...resolved.meta,
      requiresAuth: resolved.matched.some(record => record.meta?.requiresAuth),
    }, { isAuthenticated, isSuper, can })

    return access.allowed ? [{ ...item, to }] : []
  })
}

export function useNavigationDestinations() {
  const router = useRouter()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const roleStore = useRoleStore()

  const destinations = computed(() => getNavigationDestinations({
    router,
    userId: authStore.user?.id || authStore.user?.uid,
    profile: userStore.profile,
    permissions: roleStore.perms,
    isAuthenticated: Boolean(authStore.user),
    isSuper: roleStore.isSuper,
    can: requirement => roleStore.can(requirement),
    features: gamificationFeatures,
  }))

  return { destinations }
}

const SEARCHABLE_ROUTES = [
  { name: 'FeedView', label: 'Accueil', icon: 'pi pi-home', category: 'Navigation', keywords: ['accueil', 'feed'] },
  { name: 'Profile', label: 'Mon profil', icon: 'pi pi-user', category: 'Profil', keywords: ['profil', 'compte'], ownProfile: true },
  { name: 'ModulesPage', label: 'Modules vidéo', icon: 'pi pi-video', category: 'Médias', keywords: ['module', 'vidéo', 'cours'] },
  { name: 'MediaHubPage', label: 'Hub multimédia', icon: 'pi pi-play-circle', category: 'Médias', keywords: ['média', 'multimédia'] },
  { name: 'NotesWorkspaceView', label: 'Notes', icon: 'pi pi-book', category: 'Outils', keywords: ['notes'] },
  { name: 'CalendarHome', label: 'Calendrier', icon: 'pi pi-calendar', category: 'Outils', keywords: ['calendrier', 'agenda'] },
  { name: 'Institution', label: 'Institutions', icon: 'pi pi-building', category: 'Formation pratique', keywords: ['institution', 'stage'] },
  { name: 'DashboardView', label: 'Administration', icon: 'pi pi-cog', category: 'Administration', keywords: ['admin', 'tableau de bord'] },
]

function matches(entry, query) {
  const haystack = [entry.label, entry.category, ...(entry.keywords || [])].join(' ').toLocaleLowerCase('fr-CH')
  return haystack.includes(query.toLocaleLowerCase('fr-CH'))
}

function buildRoute(entry, userId) {
  if (entry.ownProfile && !userId) return null
  return entry.ownProfile
    ? { name: entry.name, params: { id: userId } }
    : { name: entry.name }
}

function routeIsAllowed(router, roleStore, entry, userId) {
  if (!router.hasRoute(entry.name)) return false
  const route = buildRoute(entry, userId)
  if (!route) return false
  const resolved = router.resolve(route)
  const need = resolved.meta?.need
  if (!need || need === 'public' || need === 'authenticated') return true
  return roleStore.can(need)
}

export function searchAvailableRoutes({ router, roleStore, userId, query }) {
  const normalizedQuery = String(query || '').trim()
  if (normalizedQuery.length < 2) return []

  return SEARCHABLE_ROUTES
    .filter((entry) => routeIsAllowed(router, roleStore, entry, userId))
    .filter((entry) => matches(entry, normalizedQuery))
    .map((entry) => {
      const route = buildRoute(entry, userId)
      return {
        name: entry.label,
        category: entry.category,
        icon: entry.icon,
        route,
        path: router.resolve(route).href,
        type: 'page',
      }
    })
}

// Les cinq onglets de l'application mobile et la règle qui range chaque adresse
// dans un onglet. Mobile et ordinateur partagent les mêmes adresses : seule la
// présentation change.

export const MOBILE_BREAKPOINT_QUERY = '(max-width: 768px)'

export const TAB_KEYS = ['home', 'institutions', 'search', 'map', 'profile']

const TAB_DEFINITIONS = [
  {
    key: 'home',
    label: 'Accueil',
    icon: 'home',
    root: () => '/feed',
    prefixes: ['/feed', '/hashtag', '/mention', '/communities', '/create'],
  },
  {
    key: 'institutions',
    label: 'Institutions',
    icon: 'building',
    root: () => '/institution',
    prefixes: [
      '/institution', '/place', '/documents_pfp', '/document_pfp', '/documents',
      '/history', '/votation',
    ],
  },
  {
    key: 'search',
    label: 'Recherche',
    icon: 'search',
    root: () => '/mobile-search',
    prefixes: [
      '/mobile-search', '/mobile-outils', '/mobile-tools', '/outils', '/tools',
      '/quiz', '/mot-de-la-semaine', '/mentorat', '/challenges', '/quests',
      '/achievements', '/houses', '/scan', '/game', '/events',
    ],
  },
  {
    key: 'map',
    label: 'Carte',
    icon: 'map',
    root: () => '/map',
    prefixes: ['/map'],
  },
  {
    key: 'profile',
    label: 'Profil',
    icon: 'user',
    // Le profil des autres personnes s'ouvre dans l'onglet où l'on se trouve :
    // seul son propre profil appartient à l'onglet Profil.
    root: (userId) => (userId ? `/profile/${userId}` : '/settings'),
    prefixes: ['/settings', '/gamification-profile'],
  },
]

const matchesPrefix = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`)

/** Onglets prêts à afficher pour un utilisateur donné. */
export function buildTabs(userId = null) {
  return TAB_DEFINITIONS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    root: tab.root(userId),
  }))
}

export function tabRoot(tabKey, userId = null) {
  const tab = TAB_DEFINITIONS.find((item) => item.key === tabKey) || TAB_DEFINITIONS[0]
  return tab.root(userId)
}

/**
 * Onglet d'une adresse. Une adresse inconnue (page d'administration, profil
 * d'une autre personne…) reste dans l'onglet courant, comme un écran empilé.
 */
export function tabForPath(path, { currentTab = 'home', userId = null } = {}) {
  const cleanPath = String(path || '/').split(/[?#]/)[0]
  for (const tab of TAB_DEFINITIONS) {
    if (cleanPath === tab.root(userId)) return tab.key
    if (tab.prefixes.some((prefix) => matchesPrefix(cleanPath, prefix))) return tab.key
  }
  return TAB_KEYS.includes(currentTab) ? currentTab : 'home'
}

/** Adresse sans l'ancre : les panneaux et écrans empilés vivent dans l'ancre. */
export function pageKey(fullPath) {
  return String(fullPath || '/').split('#')[0] || '/'
}

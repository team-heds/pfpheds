const DEFAULT_PRESENTATION_BASE_URL = 'https://hedsvs.ch'
const developmentBaseUrl = typeof window === 'undefined' ? '' : window.location.origin

export const presentationBaseUrl =
  import.meta.env.VITE_PRESENTATION_BASE_URL ||
  (import.meta.env.DEV ? developmentBaseUrl : DEFAULT_PRESENTATION_BASE_URL)

function withBaseUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl

  const base = presentationBaseUrl.replace(/\/$/, '')
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${base}${path}`
}

export function getPresentationUrl(course, type = 'slides') {
  const source = type === 'pdf' ? course.pdfPath || course.pdfHref : course.path || course.href
  return withBaseUrl(source)
}

export const presentationCategories = [
  { label: 'Toutes les catégories', value: 'all' },
  { label: 'Technique', value: 'technique' },
  { label: 'Métier', value: 'metier' },
  { label: 'Reprise', value: 'reprise' },
  { label: 'Admin', value: 'admin' },
]

export const presentationStatuses = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Publié', value: 'published' },
  { label: 'Brouillon', value: 'draft' },
  { label: 'Archivé', value: 'archived' },
]

export const presentationCatalog = [
  {
    id: 'pfpheds-support-cours',
    slug: 'pfpheds-support-cours',
    order: 10,
    title: 'PFPHEdS · Support de cours',
    eyebrow: 'Cours technique',
    description:
      'Présentation Reveal.js pour comprendre la plateforme, les outils, la stack, le déploiement et la reprise externe.',
    path: '/presentation/',
    pdfPath: '/presentation/PFPHEdS-presentation.pdf',
    status: 'published',
    statusLabel: 'Publié',
    category: 'technique',
    categoryLabel: 'Technique',
    duration: '60–90 min',
    level: 'Technique',
    audience: ['Admins', 'Développeurs', 'Reprise externe'],
    tags: ['Vue 3', 'Supabase', 'Docker', 'Jira', 'GitHub'],
    accent: 'var(--primary-color)',
    icon: 'pi pi-desktop',
    updatedAt: '2026-08-03',
    official: true,
    objectives: [
      'Comprendre le périmètre métier de PFPHEdS.',
      'Identifier les outils et workflows utilisés par l’équipe.',
      'Expliquer la stack technique et les points d’attention de reprise.',
    ],
    prerequisites: ['Accès à la plateforme', 'Notions de base web', 'Contexte du projet HEdS'],
    resources: [
      { label: 'Présentation Reveal.js', type: 'slides' },
      { label: 'Export PDF', type: 'pdf' },
      { label: 'Documentation interne', href: 'https://hedsvs.ch/docs/' },
    ],
    qualityChecklist: [
      'Slides lisibles en 16:9.',
      'PDF exporté et vérifié.',
      'Liens externes fonctionnels.',
      'Aucun secret ou accès serveur dans le support.',
    ],
  },
  {
    id: 'agents-ia-developpement',
    slug: 'agents-ia-developpement',
    order: 20,
    title: 'Développer avec des agents IA',
    eyebrow: 'Cours technique',
    description:
      'Méthode pratique pour cadrer, déléguer et vérifier un changement logiciel réalisé avec un agent IA.',
    path: '/presentation/agents-ia-developpement/',
    pdfPath: '/presentation/agents-ia-developpement/agents-ia-developpement.pdf',
    status: 'published',
    statusLabel: 'Publié',
    category: 'technique',
    categoryLabel: 'Technique',
    duration: '45–60 min',
    level: 'Intermédiaire',
    audience: ['Développeurs', 'Tech leads', 'Équipes produit'],
    tags: ['Agents IA', 'Développement', 'Git', 'Tests', 'Revue de code'],
    accent: 'var(--primary-color)',
    icon: 'pi pi-code',
    updatedAt: '2026-08-05',
    official: true,
    objectives: [
      'Distinguer un agent IA d’un assistant conversationnel ou d’un copilote.',
      'Cadrer une tâche avec un objectif, un contexte, des limites et des preuves.',
      'Intégrer le diff, les tests, la sécurité et la revue humaine dans le workflow.',
    ],
    prerequisites: ['Notions de base en développement logiciel', 'Connaissance de Git'],
    resources: [
      { label: 'Présentation Reveal.js', type: 'slides' },
      { label: 'Export PDF', type: 'pdf' },
    ],
    qualityChecklist: [
      'Slides lisibles en 16:9.',
      'Exemples sans secret ni donnée sensible.',
      'Responsabilité humaine explicitement rappelée.',
      'Workflow applicable à différents agents et éditeurs.',
    ],
  },
]

export const sortedPresentationCatalog = [...presentationCatalog].sort(
  (a, b) => (a.order ?? 999) - (b.order ?? 999),
)

export const presentationCreationSteps = [
  {
    title: 'Créer le support Reveal',
    text: 'Génère un fichier de départ structuré avec titre, objectifs, plan et conclusion.',
    command: 'npm run presentation:new -- --slug mon-cours --title "Mon cours"',
  },
  {
    title: 'Rédiger les slides',
    text: 'Complète le fichier généré avec un contenu court, oral et contrôlable visuellement.',
    command: 'presentation/src/slides/custom/mon-cours.js',
  },
  {
    title: 'Déclarer dans le LMS',
    text: 'Ajoute une entrée au catalogue pour rendre la formation visible aux admins.',
    command: 'src/config/presentationCatalog.js',
  },
  {
    title: 'Tester et publier',
    text: 'Vérifie le deck, l’export PDF et le build complet avant déploiement.',
    command: 'npm run presentation:test && npm run build:all',
  },
]

export const presentationQualityChecklist = [
  'Titre, objectif et public cible clairs.',
  'Slides non coupées en 16:9.',
  'Textes courts et lisibles.',
  'Graphiques et SVG lisibles.',
  'Liens Reveal.js et PDF valides.',
  'Aucun secret, token, IP sensible ou mot de passe.',
]

export const presentationCatalogExample = `{
  id: 'mon-cours',
  slug: 'mon-cours',
  order: 20,
  title: 'Mon cours',
  eyebrow: 'Cours technique',
  description: 'Résumé court du support.',
  path: '/presentation/mon-cours/',
  pdfPath: '/presentation/mon-cours/mon-cours.pdf',
  status: 'draft',
  statusLabel: 'Brouillon',
  category: 'technique',
  categoryLabel: 'Technique',
  duration: '30–45 min',
  level: 'Intermédiaire',
  audience: ['Admins'],
  tags: ['Vue 3', 'Supabase'],
  icon: 'pi pi-desktop',
  updatedAt: '2026-08-03',
}`

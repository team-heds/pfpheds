import { chapter, diagramFlow, processDiagram, slide, stackCards } from './helpers.js'

export const frontendSlides = [
  chapter(
    'frontend',
    5,
    'La stack frontend',
    `<p>Le frontend PFPHEdS est un monolithe Vue 3 servi par Vite. L’interface repose sur PrimeVue, l’état sur Pinia, la navigation sur Vue Router et les styles sur SCSS.</p>
    ${stackCards([
      ['assets/tech/simpleicons/vue.svg', 'Vue 3', 'Composants réactifs et vues métier.', ['pages', 'formulaires', 'dashboards'], 'var(--tt-color-green-dec-1)', 'var(--tt-color-highlight-green)'],
      ['assets/tech/simpleicons/vite.svg', 'Vite', 'Serveur dev et build de production.', ['HMR rapide', 'bundle dist/'], 'var(--tt-color-text-purple)', 'var(--tt-color-highlight-purple)'],
      ['assets/tech/simpleicons/primevue.svg', 'PrimeVue', 'Composants UI de l’application.', ['DataTable', 'Dialog', 'Calendar'], 'var(--tt-color-text-blue)', 'var(--tt-color-highlight-blue)'],
    ])}`,
    [
      slide(
        'Vue.js 3',
        `${stackCards([
          ['assets/tech/simpleicons/vue.svg', 'Composants', 'Vue découpe les écrans en blocs réutilisables.', ['template', 'props / emits', 'composables'], 'var(--tt-color-green-dec-1)', 'var(--tt-color-highlight-green)'],
          ['↔', 'Réactivité', 'L’interface se met à jour quand les données changent.', ['ref / reactive', 'computed', 'watch'], 'var(--tt-brand-color-600)', 'var(--tt-brand-color-50)'],
          ['UI', 'Usage PFPHEdS', 'Vue porte les vues métier, formulaires et dashboards.', ['pages', 'tables', 'parcours métier'], 'var(--tt-color-text-blue)', 'var(--tt-color-highlight-blue)'],
        ])}
        <p class="callout">À retenir : la logique lourde doit rester dans les services, composables ou stores, pas uniquement dans le template.</p>`,
      ),
      slide(
        'Vite',
        `${stackCards([
          ['assets/tech/simpleicons/vite.svg', 'Développement', 'Serveur local avec rechargement rapide.', ['npm run dev', 'HMR'], 'var(--tt-color-text-purple)', 'var(--tt-color-highlight-purple)'],
          ['Build', 'Production', 'Compile et optimise l’application.', ['npm run build', 'dist/'], 'var(--tt-brand-color-600)', 'var(--tt-brand-color-50)'],
          ['Env', 'Configuration', 'Injecte les variables et chemins publics.', ['.env', 'base URL'], 'var(--tt-color-text-orange)', 'var(--tt-color-highlight-orange)'],
        ])}`,
      ),
      slide(
        'PrimeVue, PrimeFlex et PrimeIcons',
        `${stackCards([
          ['assets/tech/simpleicons/primevue.svg', 'PrimeVue', 'Composants prêts pour les interfaces métier.', ['tables', 'modales', 'menus'], 'var(--tt-color-text-blue)', 'var(--tt-color-highlight-blue)'],
          ['Flex', 'PrimeFlex', 'Utilitaires de grille et espacement.', ['layout', 'responsive'], 'var(--tt-color-text-green)', 'var(--tt-color-highlight-green)'],
          ['Icon', 'PrimeIcons', 'Iconographie cohérente dans l’UI.', ['actions', 'états', 'navigation'], 'var(--tt-color-text-pink)', 'var(--tt-color-highlight-pink)'],
        ])}
        <p class="warning">À surveiller : trop de surcharges CSS globales rendent la maintenance difficile.</p>`,
      ),
      slide(
        'Pinia',
        `${diagramFlow([
          ['View', 'Vue', 'La vue déclenche une action utilisateur.', 'var(--tt-brand-color-600)'],
          ['assets/tech/simpleicons/pinia.svg', 'Store Pinia', 'Le store centralise session, rôles, caches et préférences.', 'var(--tt-color-text-yellow)'],
          ['Svc', 'Service', 'Le service appelle Supabase ou une API métier.', 'var(--tt-color-text-blue)'],
          ['Data', 'Données', 'La réponse met à jour l’interface sans logique cachée.', 'var(--tt-color-green-dec-1)'],
        ])}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'Vue Router',
        `${processDiagram([
          ['Route', ['URL', 'Paramètres', 'Composant affiché'], 'var(--tt-brand-color-600)'],
          ['Garde frontend', ['Session présente', 'Rôle attendu', 'Navigation autorisée ou redirigée'], 'var(--tt-color-text-orange)'],
          ['Sécurité réelle', ['RLS Supabase', 'Validation API', 'Données protégées côté backend'], 'var(--tt-color-text-red)'],
        ])}`,
      ),
      slide(
        'Sass / SCSS',
        `${stackCards([
          ['assets/tech/simpleicons/sass.svg', 'Sass', 'Structure variables, thèmes et règles réutilisables.', ['tokens', 'mixins', 'partials'], 'var(--tt-color-text-pink)', 'var(--tt-color-highlight-pink)'],
          ['assets/images/element/coding.svg', 'Composants', 'Styles locaux et règles de présentation.', ['scoped', 'layout', 'responsive'], 'var(--tt-brand-color-600)', 'var(--tt-brand-color-50)'],
          ['assets/images/element/rocket.svg', 'Maintenance', 'Limiter les règles globales et les conflits historiques.', ['conflits', 'héritage', 'lisibilité'], 'var(--tt-color-text-orange)', 'var(--tt-color-highlight-orange)'],
        ])}`,
      ),
      slide(
        'Bibliothèques spécialisées',
        processDiagram([
          ['Visualisation', ['Chart.js', 'FullCalendar', 'Leaflet'], 'var(--tt-color-text-blue)'],
          ['Contenu et documents', ['TipTap', 'jsPDF', 'ExcelJS / xlsx'], 'var(--tt-brand-color-600)'],
          ['Modules spécialisés', ['Three.js', 'Expériences 3D', 'ECharts à confirmer'], 'var(--tt-color-text-orange)'],
        ]),
      ),
    ].join(''),
  ),
]

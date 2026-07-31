import { chapter, diagramFlow, processDiagram, slide, spotVisual, stackCards, svgFigure, timeline } from './helpers.js'

export const backendSupabaseSlides = [
  chapter(
    'backend-supabase',
    6,
    'Backend, PostgreSQL et Supabase',
    `<p>Le backend regroupe la base de données, l’authentification, les API serveur et les intégrations qui ne doivent pas vivre uniquement dans le navigateur.</p>
    ${stackCards([
      ['assets/tech/simpleicons/postgres.svg', 'PostgreSQL', 'Base relationnelle et source de vérité.', ['tables', 'relations', 'migrations'], 'var(--tt-color-text-blue)', 'var(--tt-color-highlight-blue)'],
      ['assets/tech/simpleicons/supabase.svg', 'Supabase', 'API, Auth, Storage, Realtime et Studio.', ['PostgREST', 'GoTrue', 'RLS'], 'var(--tt-color-green-dec-1)', 'var(--tt-color-highlight-green)'],
      ['assets/tech/simpleicons/node.svg', 'Node / Express', 'Routes métier et intégrations spécifiques.', ['imports', 'push', 'FTP/SFTP'], 'var(--tt-gray-light-800)', 'var(--tt-gray-light-a-100)'],
    ])}`,
    [
      slide(
        'Qu’est-ce qu’un backend ?',
        `${diagramFlow([
          ['User', 'Navigateur', 'L’utilisateur déclenche une action depuis l’interface.', 'var(--tt-brand-color-600)'],
          ['API', 'API serveur', 'Le backend reçoit, valide et trace la demande.', 'var(--tt-color-text-blue)'],
          ['Rules', 'Règles métier', 'Les droits, formats et contraintes sont appliqués.', 'var(--tt-color-text-purple)'],
          ['assets/tech/simpleicons/postgres.svg', 'Base', 'Les données sont lues ou modifiées dans PostgreSQL.', 'var(--tt-color-text-blue)'],
        ])}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'PostgreSQL',
        `${stackCards([
          ['assets/tech/simpleicons/postgres.svg', 'Tables', 'Stockage structuré des données métier.', ['colonnes', 'types', 'contraintes'], 'var(--tt-color-text-blue)', 'var(--tt-color-highlight-blue)'],
          ['Rel', 'Relations', 'Liens fiables entre entités.', ['foreign keys', 'jointures'], 'var(--tt-brand-color-600)', 'var(--tt-brand-color-50)'],
          ['Tx', 'Transactions', 'Cohérence lors des opérations critiques.', ['commit', 'rollback'], 'var(--tt-color-text-orange)', 'var(--tt-color-highlight-orange)'],
        ])}`,
      ),
      slide(
        'Supabase',
        `<p>Supabase regroupe l’authentification, l’API PostgREST, PostgreSQL, Storage, Realtime et les politiques de sécurité.</p>
        ${svgFigure('assets/svg/4-workflow-supabase.svg', 'Schéma du workflow Supabase', {
          variant: 'inline',
          caption: 'Supabase relie l’authentification, les règles RLS, l’API PostgREST, le stockage et PostgreSQL.',
        })}
        <p><a href="https://studio2.hedsvs.ch/">Ouvrir Supabase Studio</a></p>
        <p class="warning">Accès réservé aux personnes autorisées. Ne jamais partager de mot de passe ou de clé dans cette présentation.</p>`,
      ),
      slide(
        'RLS : Row Level Security',
        `<div class="spot-layout">
          <div>
            ${diagramFlow([
              ['UI', 'Frontend', 'L’utilisateur demande une donnée.', 'var(--tt-brand-color-600)'],
              ['JWT', 'Session JWT', 'Supabase transmet l’identité et les claims.', 'var(--tt-color-text-purple)'],
              ['RLS', 'Policy RLS', 'PostgreSQL décide quelles lignes sont autorisées.', 'var(--tt-color-text-red)'],
              ['Rows', 'Données', 'Seules les lignes permises sortent de la base.', 'var(--tt-color-green-dec-1)'],
            ])}
            <p>Une interface masquée côté frontend ne protège pas les données si la base autorise encore la lecture.</p>
          </div>
          ${spotVisual('assets/svg/spot-rls-policy.svg', 'Politique RLS et lignes autorisées')}
        </div>`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'Backend Node / Express',
        `${processDiagram([
          ['API custom', ['Node.js côté serveur', 'Express routes', 'Middlewares de validation'], 'var(--tt-gray-light-800)'],
          ['Flux métier', ['Institutions', 'Communautés', 'Fichiers physio', 'Feedback et chat'], 'var(--tt-brand-color-600)'],
          ['Sécurité', ['Secrets hors frontend', 'Validation serveur', 'Logs maîtrisés', 'Imports contrôlés'], 'var(--tt-color-text-red)'],
        ])}`,
      ),
      slide(
        'Firebase historique',
        `<p><span class="inline-tech"><img src="assets/tech/simpleicons/firebase.svg" alt="" /> Firebase</span> reste présent comme couche legacy pour certaines données ou fonctionnalités historiques.</p>
        ${timeline([
          ['Fonctionnalité', 'Identifier ce qui utilise encore Firebase.'],
          ['Source réelle', 'Confirmer la donnée maître.'],
          ['Migration', 'Déplacer sans perdre l’historique.'],
          ['Tests', 'Valider droits, écriture et lecture.'],
        ])}
        <p class="callout">Avant toute modification, identifier la vraie source de vérité : Firebase, Supabase ou API custom.</p>`,
      ),
    ].join(''),
  ),
]

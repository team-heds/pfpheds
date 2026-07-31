import { chapter, checklist, codeBlock, slide, timeline } from './helpers.js'

export const conclusionSlides = [
  chapter(
    'workflow-conclusion',
    11,
    'Workflow complet et conclusion',
    `<p>Une reprise saine relie métier, ticket, branche, code, tests, revue, documentation et déploiement contrôlé.</p>`,
    [
      slide(
        'Workflow complet',
        `${timeline([
          ['Besoin métier', 'Un problème réel est formulé.'],
          ['Ticket Jira', 'Le périmètre et les critères sont testables.'],
          ['Branche GitHub', 'Le changement est isolé et relié au ticket.'],
          ['Pull request', 'Le diff est relu et validé.'],
          ['Déploiement', 'La production est contrôlée et documentée.'],
        ])}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide('Commandes de vérification', `${codeBlock(`npm run build
npm run docs:build
npm run presentation:build
npm run presentation:test`)}`),
      slide(
        'Définition de terminé',
        `${checklist([
          'Présentation compilable.',
          'Chapitres présents et lisibles.',
          'Liens cliquables.',
          'Commandes copiables.',
          'Tests passants.',
          'Aucun secret exposé.',
          'Frontend principal et Docusaurus toujours buildables.',
        ])}`,
      ),
      slide(
        'Conclusion',
        `<p class="title-lead">PFPHEdS est à la fois un produit métier, une base technique historique et un chantier de pérennisation. La réussite dépend de la clarté des règles, de la traçabilité et d’une reprise disciplinée.</p>
        ${checklist([
          'Comprendre avant de modifier.',
          'Tracer les décisions.',
          'Tester les flux réels.',
          'Documenter ce qui doit être repris.',
        ])}
        <p><a href="#/sommaire">Revenir au sommaire</a></p>`,
        '',
        { className: 'title-slide compact-title' },
      ),
    ].join(''),
  ),
]

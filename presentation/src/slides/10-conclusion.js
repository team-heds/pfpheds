import { chapter, checklist, codeBlock, slide, techGrid, timeline } from './helpers.js'

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
npm run presentation:test
npm run presentation:pdf`)}`),
      slide(
        'Références utiles',
        `${techGrid([
          ['Projet', '<a href="https://github.com/team-heds/pfpheds">Repository GitHub PFPHEdS</a>'],
          ['Documentation', '<a href="https://hedsvs.ch/docs/">Documentation interne Docusaurus</a>'],
          ['Frontend', '<a href="https://vuejs.org/">Vue</a> · <a href="https://vite.dev/">Vite</a> · <a href="https://primevue.org/">PrimeVue</a>'],
          ['Backend', '<a href="https://supabase.com/docs">Supabase</a> · <a href="https://www.postgresql.org/docs/">PostgreSQL</a>'],
          ['Production', '<a href="https://docs.docker.com/">Docker</a> · <a href="https://caddyserver.com/docs/">Caddy</a>'],
          ['Méthode', '<a href="https://www.atlassian.com/software/jira/guides">Jira</a> · <a href="https://docs.github.com/">GitHub Docs</a>'],
        ])}
        <p class="callout">Ces liens servent de point de départ. La source de vérité pour PFPHEdS reste la documentation interne et le dépôt GitHub.</p>`,
      ),
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

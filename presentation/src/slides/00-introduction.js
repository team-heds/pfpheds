import { chapter, checklist, metricCards, slide, stackCards, svgFigure, techGrid } from './helpers.js'

export const introductionSlides = [
  `<section id="accueil" data-name="accueil" class="title-slide chapter-cover intro-cover">
    <p class="chapter-label">Support de cours</p>
    <h1>PFPHEdS</h1>
    <p class="title-lead">Comprendre la plateforme, ses métiers, sa stack technique et les conditions d’une reprise fiable.</p>
    <div class="stack-grid title-stack">
      <article class="stack-card" style="--stack-color: var(--tt-color-green-dec-1); --stack-soft: var(--tt-color-highlight-green)">
        <div class="stack-logo" aria-hidden="true"><img src="assets/tech/simpleicons/vue.svg" alt="" /></div>
        <strong>Frontend</strong>
        <span>Application Vue 3, Vite, PrimeVue, Pinia et Vue Router.</span>
      </article>
      <article class="stack-card" style="--stack-color: var(--tt-color-green-dec-1); --stack-soft: var(--tt-color-highlight-green)">
        <div class="stack-logo" aria-hidden="true"><img src="assets/tech/simpleicons/supabase.svg" alt="" /></div>
        <strong>Backend</strong>
        <span>Supabase, PostgreSQL, RLS, Storage et API Express.</span>
      </article>
      <article class="stack-card" style="--stack-color: var(--tt-brand-color-600); --stack-soft: var(--tt-brand-color-50)">
        <div class="stack-logo" aria-hidden="true">Ops</div>
        <strong>Déploiement</strong>
        <span>Docker, VPS Infomaniak, Caddy, documentation et reprise externe.</span>
      </article>
    </div>
    <div class="hero-actions">
      <a href="#/sommaire">Commencer</a>
      <a href="https://hedsvs.ch/docs/">Documentation</a>
    </div>
    <aside class="notes">Positionner la présentation comme un support pédagogique, pas comme une documentation exhaustive.</aside>
  </section>`,
  slide(
    'Comment lire ce support',
    `${checklist([
      'Flèche droite / gauche : avancer dans les chapitres.',
      'Flèche bas / haut : entrer dans le détail d’un chapitre.',
      'Touche f : passer en plein écran.',
      'Les liens externes ouvrent la documentation, Jira, GitHub ou Supabase.',
      'Les commandes peuvent être copiées avec le bouton Copier.',
    ])}`,
    '',
    { className: 'compact-title intro-instructions' },
  ),
  `<section id="sommaire" data-name="sommaire" class="compact-title intro-summary">
    <p class="chapter-label">Parcours du cours</p>
    <h2>Sommaire principal</h2>
    <p class="title-lead">Progression recommandée : métier, outils de travail, stack technique, production, puis reprise externe.</p>
    <div class="toc-sections">
      <article>
        <strong>01 · Produit</strong>
        <a href="#/comprendre-pfpheds">Plateforme PFPHEdS</a>
        <a href="#/projets-metier">Deux projets métier</a>
      </article>
      <article>
        <strong>02 · Travail</strong>
        <a href="#/jira">Jira et la gestion du travail</a>
        <a href="#/github">GitHub et collaboration code</a>
      </article>
      <article>
        <strong>03 · Stack</strong>
        <a href="#/frontend">Frontend Vue</a>
        <a href="#/backend-supabase">Backend, PostgreSQL, Supabase</a>
      </article>
      <article>
        <strong>04 · Production</strong>
        <a href="#/docker-vps">Docker, VPS et Caddy</a>
        <a href="#/deploiement-documentation">Déploiement et documentation</a>
      </article>
      <article>
        <strong>05 · Reprise</strong>
        <a href="#/outils-ia">Outils IA et vibe coding</a>
        <a href="#/reprise-externe">Reprise externe</a>
        <a href="#/workflow-conclusion">Conclusion</a>
      </article>
    </div>
  </section>`,
  chapter(
    'comprendre-pfpheds',
    1,
    'Comprendre la plateforme PFPHEdS',
    `<p>PFPHEdS est une application Vue 3 qui regroupe plusieurs outils internes HEdS autour de la formation pratique, du planning académique, de l'administration, du social, de la gamification et d'applications intégrées.</p>`,
    [
      slide(
        'À qui s’adresse la plateforme ?',
        `<p>Elle s’adresse aux équipes internes, aux responsables métier, aux enseignants, aux administrateurs, aux nouveaux développeurs et aux prestataires qui doivent comprendre les règles de gestion avant de modifier le code.</p>
        ${techGrid([
          ['Utilisateurs métier', 'Valident les flux, priorisent les besoins et testent les cas réels.'],
          ['Développeurs', 'Relient vues, services, stores et sources de données.'],
          ['Entreprise externe', 'Doit reconstruire ou pérenniser les blocs critiques avec une architecture maintenable.'],
        ])}`,
      ),
      slide(
        'Repères de taille du projet',
        `${metricCards([
          ['223', 'vues', 'interfaces routées ou écrans métier documentés'],
          ['280', 'composants', 'briques UI et métier réutilisées'],
          ['48', 'services', 'couche métier et accès aux données'],
          ['20', 'stores', 'État partagé avec Pinia'],
        ])}`,
      ),
      slide(
        'Origine et logique produit',
        `<p>Le projet est né comme une initiative interne proche d'une startup : un prototype a permis de démontrer rapidement la valeur métier. Cette vitesse a créé une base utile, mais aussi une dette structurelle à documenter et à reprendre prudemment.</p>
        <p class="callout">La reprise doit préserver ce qui fonctionne, clarifier les sources de vérité et réduire les zones fragiles progressivement.</p>`,
      ),
      slide(
        'Deux systèmes métier dans une même application',
        `<p>La plateforme partage les comptes, rôles, permissions et outils transversaux, mais elle porte deux systèmes métier différents : la Formation Pratique en Physiothérapie et le Projet Académique en Soins infirmiers.</p>
        ${svgFigure('assets/svg/5-architecture-globale.svg', 'Schéma de l’architecture globale PFPHEdS', {
          variant: 'inline',
          caption: 'Le même socle sert le parcours utilisateur et le parcours de développement jusqu’à la production.',
        })}`,
      ),
    ].join(''),
  ),
]


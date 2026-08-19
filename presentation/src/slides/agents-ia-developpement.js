import {
  chapter,
  checklist,
  codeBlock,
  diagramFlow,
  processDiagram,
  riskGrid,
  roleMatrix,
  slide,
  spotVisual,
  techGrid,
  timeline,
} from './helpers.js'

const asset = (path) => `/presentation/assets/${path}`

export const agentsIaDeveloppementSlides = [
  `<section id="accueil" data-name="accueil" class="title-slide chapter-cover intro-cover">
    <p class="chapter-label">Support de cours</p>
    <h1>Développer avec des agents IA</h1>
    <p class="title-lead">Accélérer l’exploration, l’implémentation et la vérification sans abandonner la maîtrise du code.</p>
    <div class="tech-grid">
      <article><strong>Comprendre</strong><span>Ce qu’un agent peut réellement faire dans un dépôt.</span></article>
      <article><strong>Collaborer</strong><span>Donner un objectif, du contexte et des limites utiles.</span></article>
      <article><strong>Contrôler</strong><span>Relire le diff, tester et assumer chaque changement.</span></article>
    </div>
    <div class="hero-actions">
      <a href="#/sommaire">Commencer</a>
      <a href="agents-ia-developpement.pdf">Télécharger le PDF</a>
    </div>
    <aside class="notes">Demander à l’audience où elle utilise déjà l’IA : recherche, complétion, génération ou agent autonome.</aside>
  </section>`,
  slide(
    'Comment utiliser ce support',
    checklist([
      'Droite / gauche : changer de chapitre.',
      'Bas / haut : approfondir le chapitre courant.',
      'Touche f : passer en plein écran.',
      'Touche s : ouvrir la vue présentateur et les notes.',
      'Chaque pratique proposée doit rester adaptée aux règles de votre organisation.',
    ]),
    'Présenter le parcours vertical avant de commencer.',
    { className: 'compact-title intro-instructions' },
  ),
  `<section id="sommaire" data-name="sommaire" class="compact-title intro-summary">
    <p class="chapter-label">Parcours</p>
    <h2>Une méthode de travail, pas un bouton magique</h2>
    <p class="title-lead">Le cours suit le cycle réel d’un changement logiciel : cadrer, déléguer, vérifier, collaborer et progresser.</p>
    <div class="toc-sections">
      <article><strong>01 · Comprendre</strong><a href="#/comprendre-agent">Ce que fait un agent</a></article>
      <article><strong>02 · Cadrer</strong><a href="#/cadrer-travail">Un objectif et des limites</a></article>
      <article><strong>03 · Vérifier</strong><a href="#/verifier-changement">Du diff à la preuve</a></article>
      <article><strong>04 · Collaborer</strong><a href="#/collaborer-equipe">Une responsabilité partagée</a></article>
      <article><strong>05 · Adopter</strong><a href="#/adopter-progressivement">Commencer sans brûler les étapes</a></article>
    </div>
  </section>`,

  chapter(
    'comprendre-agent',
    1,
    'Un agent agit dans une boucle de développement',
    techGrid([
      ['Observer', 'Lire les fichiers, rechercher les symboles et comprendre les contraintes.'],
      ['Agir', 'Modifier le code et lancer les outils explicitement autorisés.'],
      ['Évaluer', 'Interpréter les résultats, corriger ou signaler un blocage.'],
    ]),
    [
      slide(
        'Assistant, copilote ou agent ?',
        `<div class="spot-layout">
          <div>
            <p>Un assistant répond. Un copilote suggère dans l’éditeur. Un agent poursuit un objectif à travers plusieurs actions : exploration, modification, commande, test et synthèse.</p>
            <p class="callout">Plus l’outil peut agir, plus le cadre, les permissions et la vérification deviennent importants.</p>
          </div>
          ${spotVisual(asset('svg/spot-ai-agent.svg'), 'Boucle de travail d’un agent IA', 'Boucle agentique', 'Observer, agir, évaluer, recommencer.')}
        </div>`,
      ),
      slide(
        'L’autonomie se règle, elle ne se subit pas',
        timeline([
          ['Question', 'Expliquer une fonction ou une erreur.'],
          ['Proposition', 'Préparer un plan ou un patch à valider.'],
          ['Exécution', 'Modifier et tester dans un périmètre défini.'],
          ['Supervision', 'Poursuivre jusqu’à une condition d’arrêt claire.'],
        ]),
        'Insister sur le fait que le niveau dépend du risque et de la réversibilité.',
      ),
      slide(
        'Les meilleures tâches ont une sortie vérifiable',
        riskGrid([
          ['Bon candidat', 'Test ciblé, refactor local, documentation, diagnostic.', 'Le résultat peut être inspecté ou exécuté.'],
          ['À encadrer fortement', 'Migration, sécurité, dépendances, architecture.', 'La portée et le retour arrière doivent être explicites.'],
          ['Mauvais candidat', 'Décision métier implicite ou demande vague.', 'Clarifier avec un humain avant de coder.'],
        ]),
      ),
    ].join(''),
  ),

  chapter(
    'cadrer-travail',
    2,
    'La qualité de la délégation détermine la qualité du changement',
    techGrid([
      ['Objectif', 'Décrire le résultat observable, pas seulement une intention.'],
      ['Contexte', 'Pointer les fichiers, règles, exemples et conventions utiles.'],
      ['Limites', 'Nommer ce qui ne doit pas changer et comment vérifier.'],
    ]),
    [
      slide(
        'Un ticket clair devient un contrat de travail',
        diagramFlow([
          ['1', 'Besoin', 'Le problème utilisateur ou technique.'],
          ['2', 'Périmètre', 'Les zones autorisées et exclues.'],
          ['3', 'Critères', 'Les comportements attendus.'],
          ['4', 'Preuves', 'Les tests ou contrôles à fournir.'],
        ], { variant: 'compact' }),
      ),
      slide(
        'Le contexte utile tient dans un paquet ciblé',
        `<div class="spot-layout">
          ${checklist([
            'La commande qui reproduit le problème.',
            'Les fichiers ou symboles probablement concernés.',
            'Les conventions du dépôt et les contraintes d’architecture.',
            'Un exemple d’entrée, de sortie et de cas limite.',
            'La définition de terminé et les tests attendus.',
          ])}
          ${spotVisual(asset('svg/spot-docs-map.svg'), 'Carte documentaire du dépôt', 'Contexte ciblé', 'Assez pour décider, pas tout le dépôt.')}
        </div>`,
      ),
      slide(
        'Un bon prompt ressemble à une mini-spécification',
        codeBlock(`Objectif : empêcher l’envoi d’un formulaire invalide.

Contexte : src/components/RequestForm.vue
Contrainte : conserver l’API publique du composant.
Attendu : messages accessibles, focus sur la première erreur.
Vérification : ajouter les tests des cas vide et incomplet.
Avant de modifier : résume ton plan et les fichiers touchés.`, 'text'),
        'Faire lire le prompt à voix haute et identifier chaque garde-fou.',
      ),
      slide(
        'Planifier avant d’éditer réduit les surprises',
        techGrid([
          ['Explorer', 'Demander les faits observés dans le dépôt.'],
          ['Proposer', 'Faire expliciter le plan, les risques et les inconnues.'],
          ['Autoriser', 'Valider la portée et les commandes permises.'],
          ['Exécuter', 'Préférer un changement petit, cohérent et réversible.'],
        ]),
      ),
    ].join(''),
  ),

  chapter(
    'verifier-changement',
    3,
    'Le travail n’est terminé que lorsque les preuves sont lisibles',
    techGrid([
      ['Diff', 'Voir exactement ce qui a changé et pourquoi.'],
      ['Tests', 'Exécuter les contrôles proportionnés au risque.'],
      ['Revue', 'Vérifier le métier, la sécurité et la maintenabilité.'],
    ]),
    [
      slide(
        'Le diff est l’unité de confiance',
        `<div class="spot-layout">
          <div>
            <p>Une réponse convaincante ne suffit pas. Le développeur lit les fichiers modifiés, repère les changements hors périmètre et vérifie que chaque ligne sert l’objectif.</p>
            <p class="callout">Si le diff est trop grand pour être compris, le changement est trop grand pour être accepté.</p>
          </div>
          ${spotVisual(asset('svg/spot-github-pr.svg'), 'Revue d’une pull request', 'Lire le changement', 'Portée, intention, effets de bord.')}
        </div>`,
      ),
      slide(
        'Les tests transforment une affirmation en preuve',
        processDiagram([
          ['Rapide', ['Lint', 'Typecheck', 'Tests unitaires ciblés']],
          ['Fonctionnel', ['Tests d’intégration', 'Parcours principal', 'Cas limites']],
          ['Sensible', ['Sécurité', 'Migration', 'Performance', 'Retour arrière']],
        ]),
      ),
      slide(
        'La revue humaine reste irremplaçable',
        roleMatrix([
          ['Agent', 'Expose son plan, son diff, ses tests et ses incertitudes.', 'Traçabilité'],
          ['Auteur', 'Comprend le changement et vérifie le comportement attendu.', 'Responsabilité'],
          ['Relecteur', 'Challenge les hypothèses, les risques et la maintenabilité.', 'Décision'],
        ]),
      ),
      slide(
        'Sécurité : réduire ce que l’agent peut voir et faire',
        riskGrid([
          ['Secrets', 'Clés, tokens, données personnelles.', 'Ne jamais les placer dans le prompt ou le dépôt.'],
          ['Commandes', 'Suppression, publication, migration.', 'Limiter les permissions et demander confirmation.'],
          ['Dépendances', 'Paquet inutile, compromis ou incompatible.', 'Vérifier la source, la licence et l’impact.'],
          ['Données', 'Environnement réel ou contenu sensible.', 'Utiliser des jeux de test et des accès minimaux.'],
        ]),
      ),
    ].join(''),
  ),

  chapter(
    'collaborer-equipe',
    4,
    'L’agent rejoint le workflow de l’équipe, pas l’inverse',
    techGrid([
      ['Traçable', 'Ticket, branche, commits et pull request restent la colonne vertébrale.'],
      ['Partagé', 'Les instructions utiles vivent dans le dépôt, pas dans une conversation privée.'],
      ['Révisable', 'Les règles évoluent à partir des erreurs réellement observées.'],
    ]),
    [
      slide(
        'Un workflow agentique reste un workflow Git',
        diagramFlow([
          [asset('svg/spot-jira-ticket.svg'), 'Ticket', 'But et critères.'],
          [asset('svg/spot-ai-agent.svg'), 'Agent', 'Exploration et patch.'],
          [asset('svg/spot-ci-pipeline.svg'), 'CI', 'Contrôles automatiques.'],
          [asset('svg/spot-github-pr.svg'), 'Revue', 'Décision humaine.'],
        ], { variant: 'compact' }),
      ),
      slide(
        'Les échecs suivent des motifs reconnaissables',
        riskGrid([
          ['Demande vague', 'L’agent choisit lui-même le problème.', 'Revenir au résultat observable.'],
          ['Contexte excessif', 'Le signal se perd dans le bruit.', 'Pointer les sources de vérité.'],
          ['Patch géant', 'La revue devient superficielle.', 'Découper en étapes indépendantes.'],
          ['Confiance automatique', 'Une sortie plausible passe pour une preuve.', 'Exiger diff, tests et limites.'],
        ]),
      ),
      slide(
        'Les règles d’équipe doivent être exécutables',
        checklist([
          'Documenter les commandes de test et de build.',
          'Nommer les répertoires sensibles et les opérations interdites.',
          'Définir le format attendu des plans et comptes rendus.',
          'Fournir des exemples de code qui représentent la convention actuelle.',
          'Mettre à jour les instructions après chaque incident ou friction répétée.',
        ]),
      ),
      slide(
        'Atelier : confier une petite amélioration',
        processDiagram([
          ['10 min · Cadrer', ['Choisir un défaut réel', 'Écrire les critères', 'Définir les limites']],
          ['15 min · Déléguer', ['Faire explorer', 'Valider le plan', 'Autoriser le patch']],
          ['15 min · Vérifier', ['Lire le diff', 'Lancer les tests', 'Noter les incertitudes']],
        ]),
        'L’exercice peut se faire en binôme : une personne pilote, l’autre observe les décisions.',
      ),
    ].join(''),
  ),

  chapter(
    'adopter-progressivement',
    5,
    'Commencer par la confiance vérifiable',
    techGrid([
      ['Petit', 'Choisir des tâches réversibles et peu couplées.'],
      ['Mesurable', 'Observer le temps gagné et les défauts introduits.'],
      ['Collectif', 'Partager les pratiques qui fonctionnent réellement.'],
    ]),
    [
      slide(
        'L’adoption progresse par paliers',
        timeline([
          ['1 · Comprendre', 'Explications, recherche et documentation.'],
          ['2 · Assister', 'Tests, petits correctifs et refactors locaux.'],
          ['3 · Déléguer', 'Tickets complets dans un bac à sable.'],
          ['4 · Industrialiser', 'Règles, métriques, revues et gouvernance.'],
        ]),
      ),
      slide(
        'Définition de terminé pour un changement assisté par IA',
        checklist([
          'Le besoin et le périmètre sont explicites.',
          'Le développeur comprend chaque modification importante.',
          'Le diff ne contient aucun changement opportuniste.',
          'Les tests pertinents passent et les limites sont signalées.',
          'Les risques de sécurité, données et dépendances ont été vérifiés.',
          'La pull request explique le pourquoi, pas seulement le comment.',
        ]),
      ),
      `<section id="conclusion" data-id="conclusion" class="chapter-cover">
        <p class="chapter-label">Conclusion</p>
        <h2>L’agent accélère la boucle ; l’équipe garde le jugement</h2>
        <p class="title-lead">Un usage professionnel repose sur quatre réflexes : cadrer l’objectif, limiter l’action, exiger des preuves et relire humainement.</p>
        ${techGrid([
          ['Cadrer', 'Un résultat observable et des contraintes explicites.'],
          ['Contrôler', 'Un diff lisible et des tests proportionnés.'],
          ['Assumer', 'Aucun code fusionné sans compréhension humaine.'],
        ])}
        <p class="back-to-summary"><a href="#/sommaire">Revoir le parcours</a></p>
        <aside class="notes">Terminer en demandant quelle tâche faible risque l’équipe peut expérimenter cette semaine.</aside>
      </section>`,
    ].join(''),
  ),
]

import { chapter, codeBlock, processDiagram, roleMatrix, slide, spotVisual, svgFigure, techGrid } from './helpers.js'

export const jiraSlides = [
  chapter(
    'jira',
    3,
    'Jira et la gestion du travail',
    `<p>Jira structure le travail à faire, son état réel, ses priorités et les décisions prises pendant le projet.</p>`,
    [
      slide(
        'Qu’est-ce que Jira ?',
        `<div class="spot-layout">
          <div>
            <p>Jira est une plateforme de gestion de projet. Un projet Jira regroupe des tickets. Un ticket décrit une demande, un bug, une tâche technique ou une évolution, avec un responsable, une priorité et des critères d'acceptation.</p>
            <p><a href="https://hedsdev2025.atlassian.net/jira/software/projects/HEDS25/summary">Ouvrir le projet Jira HEDS25</a></p>
          </div>
          ${spotVisual('assets/svg/spot-jira-ticket.svg', 'Ticket Jira structuré')}
        </div>`,
      ),
      slide(
        'Vocabulaire essentiel',
        techGrid([
          ['Type', 'Nature du ticket : bug, tâche, story, epic.'],
          ['Statut', 'État réel : prêt, en cours, revue, terminé.'],
          ['Backlog', 'Réserve priorisée de travail non planifié.'],
          ['Sprint', 'Période courte de réalisation.'],
          ['Critères d’acceptation', 'Conditions vérifiables pour considérer le ticket terminé.'],
          ['Labels', 'Repères transversaux pour filtrer ou signaler un cas.'],
        ]),
      ),
      slide(
        'Workflow PFPHEdS',
        `<p>Le workflow doit montrer où se trouve réellement le travail, sans confondre type de ticket et avancement.</p>
        ${svgFigure('assets/svg/1-workflow-jira.svg', 'Schéma complet du workflow Jira', {
          variant: 'inline',
          caption: 'Un ticket part du besoin, passe par la qualification, la planification, l’attribution, puis le suivi réel.',
        })}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'Tickets non terminés en fin de sprint',
        `<p>Un ticket non terminé conserve son statut réel. Il retourne dans le backlog ou passe dans un sprint futur avec un commentaire expliquant la cause, le reste à faire, une repriorisation et éventuellement le label <code>reporté-sprint</code>.</p>`,
      ),
      slide(
        'Chaque rôle prend une part différente dans la réussite',
        roleMatrix([
          ['Métier / Product Owner', 'Exprime le besoin, priorise la valeur et clarifie les règles.', 'Backlog ordonné et critères testables.'],
          ['Équipe de réalisation', 'Développe, teste, documente, relit et déploie.', 'Changement vérifié et traçable.'],
          ['Sponsor', 'Donne la direction et arbitre les enjeux majeurs.', 'Décisions assumées.'],
          ['Référent métier', 'Vérifie que la solution répond au terrain.', 'Validation fonctionnelle.'],
          ['Reviewer', 'Contrôle la qualité, les risques et les tests.', 'PR approuvée ou corrigée.'],
          ['Facilitateur', 'Protège le cadre, les rituels et la visibilité.', 'Flux de travail lisible.'],
        ]),
      ),
      slide(
        'Les décisions doivent avoir un propriétaire clair',
        `<p>Le sponsor arbitre les enjeux majeurs, le Product Owner ordonne le backlog, le facilitateur protège le cadre de travail, le développeur réalise et documente, le reviewer contrôle la qualité, et le référent métier valide le résultat sur le terrain.</p>`,
      ),
      slide(
        'Type, statut, parent et enfant',
        processDiagram([
          ['Type', ['Epic', 'Évolution', 'Tâche technique', 'Bug', 'Documentation'], 'var(--tt-brand-color-600)'],
          ['Statut', ['Prêt à développer', 'En cours', 'Revue de code', 'Prêt à déployer', 'Terminé'], 'var(--tt-color-text-blue)'],
          ['Hiérarchie', ['Parent = vision large', 'Enfant = résultat concret', 'Critères vérifiables', 'Estimation possible'], 'var(--tt-color-text-green)'],
        ]),
      ),
      slide(
        'Un bon ticket permet de commencer sans deviner',
        `<div class="spot-layout">
          ${processDiagram([
            ['Contexte', ['Problème réel', 'Utilisateur concerné', 'Valeur attendue'], 'var(--tt-brand-color-600)'],
            ['Périmètre', ['Ce qui est inclus', 'Ce qui est exclu', 'Dépendances connues'], 'var(--tt-color-text-blue)'],
            ['Validation', ['Critères observables', 'Droits et erreurs', 'Tests ou preuves attendues'], 'var(--tt-color-green-dec-1)'],
          ])}
          ${spotVisual('assets/svg/spot-jira-ticket.svg', 'Ticket Jira exploitable')}
        </div>`,
      ),
      slide(
        'Exemple de ticket exploitable',
        `${codeBlock(`Titre: Corriger l'affichage des places PFP4
Contexte: les administrateurs voient des places sans institution.
Attendu: chaque place affiche son institution ou un message explicite.
Critères: test sur la cohorte active, aucun débordement tableau, PR liée au ticket HEDS25-XXX.`, 'text')}`,
      ),
      slide(
        'Exemple HEDS25 bien structuré',
        `${codeBlock(`HEDS25-428 — Corriger la validation d'une offre sur Safari

Contexte:
Le bouton confirme l'action mais aucune donnée n'est enregistrée.

Besoin:
Permettre à un responsable de valider l'offre depuis les navigateurs supportés.

Critères:
- Safari, Chrome et Firefox
- confirmation visible
- donnée persistée et journalisée
- test automatisé ajouté`, 'text')}`,
      ),
      slide(
        'Critères d’acceptation',
        `<div class="spot-layout">
          <p>Les critères rendent la validation objective. Ils décrivent un comportement observable, utilisent un vocabulaire compris par le métier, séparent les scénarios, incluent les erreurs ou droits importants et évitent les formulations vagues comme « fonctionne correctement ».</p>
          ${spotVisual('assets/svg/spot-jira-ticket.svg', 'Critères d’acceptation')}
        </div>`,
      ),
      slide(
        'Dépendances et blocages',
        processDiagram([
          ['Bloque', ['Le ticket livre un prérequis', 'Le lien est visible dans Jira'], 'var(--tt-color-text-orange)'],
          ['Est bloqué par', ['Le statut reste réel', 'La cause est documentée'], 'var(--tt-color-text-red)'],
          ['Décision', ['Daily si urgent', 'Commentaire Jira', 'Repriorisation si nécessaire'], 'var(--tt-brand-color-600)'],
        ]),
      ),
      slide(
        'Backlog et refinement',
        `<p>Le backlog n’est pas une liste oubliée : c’est la réserve ordonnée des besoins futurs. Pendant le refinement, l’équipe clarifie, découpe, estime et priorise. Seuls les tickets suffisamment prêts deviennent candidats au sprint suivant.</p>`,
      ),
      slide(
        'Sprint : transformer une priorité en résultat',
        `<p>Un sprint possède un objectif compréhensible. L’équipe sélectionne des tickets prêts selon sa capacité. Le périmètre est fixé au démarrage, le tableau reflète l’avancement quotidien, et seuls les tickets répondant à la Definition of Done sont terminés.</p>`,
      ),
      slide(
        'Une semaine ou deux semaines ?',
        `${techGrid([
          ['Sprint d’une semaine', 'Feedback rapide, petit périmètre, priorités changeantes, équipe disponible.'],
          ['Sprint de deux semaines', 'Coordination plus forte, validation externe, travail cohérent plus large, disponibilités réduites.'],
        ])}`,
      ),
      slide(
        'Cycle et rituels',
        `<p>Les rituels structurent le flux : préparer, planifier, synchroniser, démontrer, puis améliorer.</p>
        ${svgFigure('assets/svg/8-cycle-scrum.svg', 'Schéma du cycle Scrum', {
          variant: 'inline',
          caption: 'Le cycle rend visible la préparation, la réalisation, la revue et l’amélioration continue.',
        })}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'Ready autorise l’entrée ; Done autorise la clôture',
        processDiagram([
          ['Definition of Ready', ['Besoin compris', 'Critères testables', 'Ticket assez petit', 'Dépendances connues'], 'var(--tt-brand-color-600)'],
          ['Pendant le travail', ['Code', 'Tests', 'Revue', 'Documentation'], 'var(--tt-color-text-blue)'],
          ['Definition of Done', ['Critères respectés', 'Code relu', 'Production vérifiée', 'Trace Jira à jour'], 'var(--tt-color-green-dec-1)'],
        ]),
      ),
      slide(
        'Priorités',
        `<p>La priorité exprime l’impact, pas une promesse de sprint. Highest couvre la sécurité, la perte de données ou une production bloquée. High couvre une fonction essentielle. Medium indique un impact réel avec contournement. Low couvre confort, optimisation ou défaut visuel mineur.</p>`,
      ),
      slide(
        'Bug et hotfix',
        `<p>Un bug utilise le même workflow avec une urgence adaptée. Un hotfix reste rapide mais traçable : ticket Bug, branche <code>hotfix/HEDS25-XXX-description</code>, pull request relue, test ciblé, déploiement contrôlé, cause documentée et action préventive.</p>`,
      ),
    ].join(''),
  ),
]

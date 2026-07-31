import { chapter, codeBlock, processDiagram, roleMatrix, slide, spotVisual, svgFigure, techGrid, timeline } from './helpers.js'

export const githubSlides = [
  chapter(
    'github',
    4,
    'GitHub et la collaboration sur le code',
    `<p>Git conserve l’historique. GitHub organise la collaboration autour de cet historique.</p>`,
    [
      slide(
        'Git vs GitHub',
        `<div class="spot-layout">
          <div>
            <p>Git est l’outil de versionnement installé localement. GitHub héberge le dépôt, les branches, les pull requests, les revues, les contrôles automatiques et les liens avec Jira.</p>
            <p><a href="https://github.com/team-heds/pfpheds">Ouvrir le dépôt GitHub PFPHEdS</a></p>
          </div>
          ${spotVisual('assets/svg/spot-github-pr.svg', 'Branche Git et pull request')}
        </div>`,
      ),
      slide(
        'Vocabulaire',
        techGrid([
          ['Dépôt', 'Espace contenant le code et son historique.'],
          ['Commit', 'Point d’historique décrivant une modification cohérente.'],
          ['Branche', 'Ligne de travail isolée.'],
          ['Pull request', 'Demande de fusion relue et testée.'],
          ['Conflit', 'Désaccord entre deux modifications à résoudre.'],
          ['GitHub Actions', 'Automatisations et contrôles.'],
        ]),
      ),
      slide(
        'Récupérer le projet',
        `${codeBlock(`git clone https://github.com/team-heds/pfpheds.git
cd pfpheds
npm install
npm run dev`)}`,
      ),
      slide(
        'Nommage des branches',
        `${codeBlock(`feature/HEDS25-XXX-description
fix/HEDS25-XXX-description
hotfix/HEDS25-XXX-description
chore/HEDS25-XXX-description
docs/HEDS25-XXX-description`, 'text')}`,
      ),
      slide(
        'Bonnes pratiques',
        processDiagram([
          ['Avant de coder', ['Partir du ticket Jira', 'Créer une branche dédiée', 'Vérifier le périmètre'], 'var(--tt-brand-color-600)'],
          ['Pendant la PR', ['Diff court', 'Description claire', 'Tests indiqués'], 'var(--tt-color-text-blue)'],
          ['Avant fusion', ['Secrets absents', 'Contrôles verts', 'Reviewer d’accord'], 'var(--tt-color-green-dec-1)'],
        ]),
      ),
      slide(
        'Jira décrit le besoin ; GitHub montre le changement',
        `<p>La clé <code>HEDS25-XXX</code> relie le ticket au code. Elle doit apparaître dans le nom de branche, les commits utiles, la pull request et le commentaire Jira.</p>
        ${svgFigure('assets/svg/2-workflow-github.svg', 'Schéma du workflow GitHub', {
          variant: 'inline',
          caption: 'Le dépôt, la branche, la pull request, la revue et la fusion restent reliés au ticket Jira.',
        })}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'Branches et commits racontent le changement',
        `<p>Une branche suit la forme <code>type/HEDS25-XXX-description-courte</code>. Un commit représente une étape cohérente et compréhensible, par exemple <code>HEDS25-428 corrige la persistance de validation</code>. Les messages vagues comme “fix” ou “update” ne suffisent pas.</p>`,
      ),
      slide(
        'Niveaux de confiance des branches',
        `${techGrid([
          ['feature / fix / hotfix', 'Changement isolé lié à un ticket HEDS25.'],
          ['develop', 'Intégration et validation technique continue si cette branche est utilisée.'],
          ['prod', 'Branche principale actuelle du dépôt et version candidate ou productive selon le workflow en place.'],
          ['main', 'Mentionnée dans le support source comme branche protégée cible ; à confirmer si elle existe dans le workflow réel.'],
        ])}`,
      ),
      slide(
        'La pull request est le point de contrôle',
        `<div class="spot-layout">
          ${processDiagram([
            ['Comprendre', ['Résumé du problème', 'Lien Jira', 'Contexte métier'], 'var(--tt-brand-color-600)'],
            ['Vérifier', ['Diff relu', 'Tests exécutés', 'Risques connus'], 'var(--tt-color-text-blue)'],
            ['Décider', ['Commentaires résolus', 'Contrôles verts', 'Approbation explicite'], 'var(--tt-color-green-dec-1)'],
          ])}
          ${spotVisual('assets/svg/spot-github-pr.svg', 'Pull request contrôlée')}
        </div>`,
      ),
      slide(
        'Auteur et reviewer',
        roleMatrix([
          ['Auteur', 'Explique le changement, fournit les preuves et corrige avant fusion.', 'PR compréhensible.'],
          ['Reviewer', 'Vérifie le besoin, le code, les tests et les risques.', 'Approbation défendable.'],
          ['Jira', 'Garde la trace du pourquoi et de l’état réel.', 'Ticket à jour.'],
        ]),
      ),
      slide(
        'Intégration continue',
        `<p>GitHub Actions peut vérifier chaque changement : lint, types si disponibles, tests, build et règles de fusion. Une erreur doit bloquer la fusion jusqu’à correction.</p>
        ${svgFigure('assets/svg/6-pipeline-cicd.svg', 'Schéma du pipeline CI/CD cible', {
          variant: 'inline',
          caption: 'La cible : automatiser les contrôles avant livraison et garder un point de validation explicite.',
        })}`,
      ),
      slide(
        'Jira reflète les étapes GitHub',
        `${timeline([
          ['Développement', 'Le ticket passe en cours quand la branche démarre.'],
          ['Pull request', 'Le ticket reflète la revue de code.'],
          ['Fusion', 'Le ticket devient prêt à déployer.'],
          ['Production', 'Le ticket est terminé après vérification réelle.'],
        ])}`,
        '',
        { className: 'workflow-slide' },
      ),
    ].join(''),
  ),
]

import { chapter, checklist, riskGrid, slide, spotVisual, techGrid, timeline } from './helpers.js'

export const repriseExterneSlides = [
  chapter(
    'reprise-externe',
    10,
    'Reprise par l’entreprise externe',
    `<p>La reprise doit être présentée sans accusation : le prototype a démontré une valeur métier forte, et la phase suivante doit pérenniser les blocs critiques.</p>`,
    [
      slide(
        'Histoire à formuler prudemment',
        `<div class="spot-layout">
          <p>Le projet est né comme initiative interne. Le prototype a démontré la valeur métier. La direction a identifié son potentiel, un budget d’environ 350 000 CHF a été attribué, et le service informatique a choisi une entreprise externe pour pérenniser la plateforme.</p>
          ${spotVisual('assets/svg/spot-reprise-roadmap.svg', 'Passage du prototype à la reprise externe', 'Reprise', 'Passer de la valeur démontrée à la pérennisation.')}
        </div>`,
      ),
      slide(
        'Ordre recommandé des travaux',
        `${timeline([
          ['Audit', 'Comprendre les flux réels, les données et les droits.'],
          ['Cadrage', 'Décider ce qui est reconstruit, gardé ou migré.'],
          ['Migration', 'Sécuriser les sources de vérité et les dépendances.'],
          ['Stabilisation', 'Tester, documenter, monitorer, transférer.'],
        ])}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'Risques principaux',
        `<div class="spot-layout">
          ${riskGrid([
            ['Droits', 'Permissions multiples et règles difficiles à auditer.', 'Centraliser et tester les politiques.'],
            ['Données', 'Firebase + Supabase peuvent diverger.', 'Définir une source de vérité par flux.'],
            ['Déploiement', 'Procédures manuelles et dépendance aux personnes.', 'Automatiser build, test, release et rollback.'],
            ['Métier', 'Cas particuliers non documentés.', 'Faire valider par référents terrain.'],
          ])}
          ${spotVisual('assets/svg/spot-data-migration.svg', 'Migration et validation de données')}
        </div>`,
      ),
      slide(
        'Décisions à prendre',
        `<div class="spot-layout">
          ${checklist([
            'Quelles fonctionnalités restent dans le périmètre de reprise ?',
            'Quelle base devient source de vérité pour chaque flux ?',
            'Quels rôles et permissions sont nécessaires dès la première version ?',
            'Quel niveau de compatibilité avec l’existant est attendu ?',
            'Quels contrôles bloquent une mise en production ?',
          ])}
          ${spotVisual('assets/svg/spot-data-policy.svg', 'Décisions de données et droits', 'Décisions', 'Périmètre, données, droits et contrôles.')}
        </div>`,
      ),
      slide(
        'Rôle de l’équipe HEdS',
        `${techGrid([
          ['Transmettre', 'Expliquer les règles métier et les cas particuliers.'],
          ['Prioriser', 'Choisir ce qui compte vraiment pour la reprise.'],
          ['Valider', 'Tester les flux réels et accepter les livrables.'],
          ['Documenter', 'Transformer le savoir oral en décisions traçables.'],
        ])}`,
      ),
      slide(
        'Rôle de l’entreprise',
        `${techGrid([
          ['Concevoir', 'Poser une architecture maintenable.'],
          ['Sécuriser', 'Auditer droits, secrets, RLS et surfaces API.'],
          ['Automatiser', 'Rendre installation, tests et déploiement reproductibles.'],
          ['Livrer', 'Documenter les choix et transférer l’exploitation.'],
        ])}`,
      ),
      slide(
        'Erreurs à éviter',
        `<div class="spot-layout">
          ${checklist([
            'Reprendre le prototype sans clarifier les règles métier.',
            'Copier-coller la physiothérapie vers les soins sans adaptation.',
            'Masquer la sécurité uniquement dans le frontend.',
            'Migrer des données sans stratégie de vérification.',
            'Livrer sans documentation d’exploitation.',
          ])}
          ${spotVisual('assets/svg/spot-data-migration.svg', 'Migration contrôlée')}
        </div>`,
      ),
    ].join(''),
  ),
]

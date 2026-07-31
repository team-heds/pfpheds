import { chapter, codeBlock, slide, spotVisual, techGrid } from './helpers.js'

export const deploiementDocumentationSlides = [
  chapter(
    'deploiement-documentation',
    8,
    'Déploiement et documentation',
    `<p>Le déploiement actuel est manuel. La documentation Docusaurus est la source de reprise technique.</p>`,
    [
      slide('Déploiement actuel', `<div class="spot-layout">
        <p>Le script <code>deploy-hedsvs.ps1</code> compile le frontend, compile la documentation, transfère par SSH, synchronise le backend, reconstruit les images nécessaires, redémarre les conteneurs et prévoit des vérifications post-déploiement.</p>
        ${spotVisual('assets/svg/spot-ci-pipeline.svg', 'Chaîne de déploiement contrôlée', 'Déploiement', 'Build, transfert, redémarrage et contrôle.')}
      </div>`),
      slide('Contrôles post-déploiement', `${codeBlock(`curl -I https://hedsvs.ch/
curl -I https://hedsvs.ch/docs/
curl -H "Origin: https://hedsvs.ch" -I "https://api2.hedsvs.ch/rest/v1/institutions?select=InstitutionId&limit=1"`)}`),
      slide('Cible future', `<div class="spot-layout">
        <p>La cible recommandée est une CI/CD avec build automatisé, tests, artefacts, traçabilité, validation explicite, rollback et contrôle avant production. Elle ne doit pas être improvisée à partir des artefacts obsolètes du dépôt.</p>
        ${spotVisual('assets/svg/spot-security-review.svg', 'Contrôle avant production', 'Contrôle', 'Tests, validation et rollback prévu.')}
      </div>`),
      slide('Docusaurus', `<div class="spot-layout">
        <div>
          <p>Docusaurus transforme du Markdown versionné en site de documentation. Pour PFPHEdS, il documente l’architecture, les domaines métier, les données, le backend, l’exploitation, les tests et la contribution.</p>
          <p><a href="https://hedsvs.ch/docs/">Ouvrir la documentation PFPHEdS</a></p>
        </div>
        ${spotVisual('assets/svg/spot-docs-map.svg', 'Documentation structurée', 'Documentation', 'Markdown versionné et exploitable.')}
      </div>`),
      slide(
        'Catégories existantes',
        techGrid([
          ['Vision système', 'Architecture, vue système, structure du dépôt.'],
          ['Frontend', 'Bootstrap, routes, composants, état, PWA.'],
          ['Auth et sécurité', 'Rôles, permissions, guards, RLS.'],
          ['Données et backends', 'Firebase, Supabase, migrations, API.'],
          ['Domaines métier', 'Formation pratique, planning, gamification, médias.'],
          ['Exploitation', 'Développement, déploiement, VPS, runbook et tests.'],
        ]),
      ),
    ].join(''),
  ),
]

import { chapter, slide, spotVisual, techGrid } from './helpers.js'

export const outilsIaSlides = [
  chapter(
    'outils-ia',
    9,
    'Zed, Codex, Claude Code et le vibe coding',
    `<p>Les assistants de développement accélèrent le travail, mais ne remplacent pas la compréhension, les tests et la revue humaine.</p>`,
    [
      slide('Zed', `<div class="spot-layout">
        <p>Zed est un IDE : un environnement pour lire, chercher, modifier, lancer un terminal, utiliser Git et réduire les changements de contexte. Il peut être utilisé sur PFPHEdS sans être obligatoire pour tous les développeurs.</p>
        ${spotVisual('assets/svg/spot-docs-map.svg', 'IDE et navigation projet', 'IDE', 'Lire, chercher, modifier, lancer.')}
      </div>`),
      slide('Codex', `<div class="spot-layout">
        <p>Codex est un agent de développement de l’écosystème OpenAI. Il peut comprendre le dépôt, chercher, modifier des fichiers, exécuter des outils autorisés, lancer des tests, diagnostiquer et documenter.</p>
        ${spotVisual('assets/svg/spot-ai-agent.svg', 'Agent de développement assisté par IA', 'Agent IA', 'Contexte, édition, tests et diagnostic.')}
      </div>`),
      slide('Claude Code', `<div class="spot-layout">
        <p>Claude Code est un agent de développement de l’écosystème Anthropic. Il peut aider à explorer le dépôt, proposer des modifications multi-fichiers, documenter, tester et réfléchir à l’architecture.</p>
        ${spotVisual('assets/svg/spot-ai-agent.svg', 'Agent de développement assisté par IA', 'Agent IA', 'Exploration, refactor et documentation.')}
      </div>`),
      slide('Limites des agents', `<div class="spot-layout">
        <ul><li>Hallucinations possibles.</li><li>Modification trop large.</li><li>Mauvaise compréhension d’un flux métier.</li><li>Risque de sécurité ou de régression.</li><li>Coût et dépendance à la revue humaine.</li></ul>
        ${spotVisual('assets/svg/spot-security-review.svg', 'Revue humaine obligatoire', 'Garde-fou', 'Comprendre, tester et relire.')}
      </div>`),
      slide(
        'Vibe coding responsable',
        `<p>Le vibe coding consiste à développer avec une forte assistance IA. Il est utile pour prototyper, apprendre, générer une structure, documenter ou créer des tests, mais dangereux si l’équipe fusionne du code qu’elle ne comprend pas.</p>
        <div class="flow vertical"><span>Ticket Jira clair</span><span>Contexte donné à l’assistant</span><span>Petite modification</span><span>Lecture du diff</span><span>Tests</span><span>Revue humaine</span><span>Pull request</span><span>Validation</span><span>Déploiement</span></div>`,
      ),
      slide(
        'Responsabilité',
        `<div class="spot-layout">
          <div>
            <p class="callout">L’équipe reste responsable de tout code fusionné, même si le code a été généré par un assistant.</p>
            ${techGrid([
              ['Avantages', 'Prototypage, apprentissage, documentation, tests, tâches répétitives.'],
              ['Risques', 'Dette technique, failles, incohérences, dépendances inutiles, absence de tests.'],
            ])}
          </div>
          ${spotVisual('assets/svg/spot-security-review.svg', 'Responsabilité et contrôle humain', 'Responsabilité', 'La revue humaine reste obligatoire.')}
        </div>`,
      ),
    ].join(''),
  ),
]

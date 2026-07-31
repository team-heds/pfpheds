import { chapter, diagramFlow, processDiagram, slide, spotVisual, stackCards, svgFigure, techGrid } from './helpers.js'

export const dockerVpsSlides = [
  chapter(
    'docker-vps',
    7,
    'Docker, VPS et hébergement',
    `<p>La production vérifiée tourne sur un VPS Ubuntu Infomaniak avec Docker, Caddy, le frontend, la documentation, le backend Express et la stack Supabase self-hosted.</p>
    ${stackCards([
      ['assets/tech/simpleicons/docker.svg', 'Docker', 'Exécute les services dans des conteneurs.', ['images', 'volumes', 'réseaux'], 'var(--tt-color-text-blue)', 'var(--tt-color-highlight-blue)'],
      ['VPS', 'Infomaniak VPS', 'Machine Linux permanente de production.', ['SSH', 'Ubuntu', 'monitoring'], 'var(--tt-brand-color-600)', 'var(--tt-brand-color-50)'],
      ['assets/tech/simpleicons/caddy.svg', 'Caddy', 'Reverse proxy et HTTPS automatique.', ['TLS', 'domaines', 'routage'], 'var(--tt-gray-light-800)', 'var(--tt-gray-light-a-100)'],
    ])}`,
    [
      slide(
        'Docker',
        `<p>Docker rend les services reproductibles : une image décrit le service, un conteneur l’exécute, les volumes gardent les données.</p>
        ${svgFigure('assets/svg/3-workflow-docker.svg', 'Schéma du workflow Docker', {
          variant: 'inline',
          caption: 'Docker rend les services reproductibles : image, conteneur, réseau, volume et logs.',
        })}`,
      ),
      slide(
        'Conteneurs de production vérifiés',
        techGrid([
          ['supabase-caddy-1', 'Reverse proxy, TLS et fichiers statiques frontend.'],
          ['pfpheds-backend', 'API Express custom.'],
          ['supabase-db-1', 'PostgreSQL.'],
          ['supabase-rest-1', 'PostgREST.'],
          ['supabase-auth-1', 'GoTrue.'],
          ['supabase-storage-1', 'Storage.'],
          ['supabase-realtime-1', 'Websockets temps réel.'],
          ['supabase-meta-1 / studio', 'Métadonnées et interface Studio.'],
          ['push-worker', 'Queue de notifications.'],
        ]),
      ),
      slide(
        'VPS Infomaniak',
        `<p>Un VPS est une machine virtuelle Linux disponible en permanence. Dans PFPHEdS, il héberge l’ensemble de la production.</p>
        ${svgFigure('assets/svg/7-deploiement-vps.svg', 'Schéma du déploiement sur VPS', {
          variant: 'inline',
          caption: 'Le VPS concentre le reverse proxy, les conteneurs applicatifs, les données persistantes et les vérifications.',
        })}
        <p class="warning">Les accès SSH, IP et clés sont transmis séparément et ne doivent pas être publiés dans le support.</p>`,
      ),
      slide(
        'Différence entre les environnements',
        `${diagramFlow([
          ['PC', 'Ordinateur développeur', 'Code, tests locaux et branches Git.', 'var(--tt-brand-color-600)'],
          ['assets/tech/simpleicons/github.svg', 'Dépôt GitHub', 'Pull requests, revue et historique.', 'var(--tt-gray-light-800)'],
          ['VPS', 'VPS', 'Machine Linux qui héberge la production.', 'var(--tt-color-text-blue)'],
          ['assets/tech/simpleicons/docker.svg', 'Conteneurs', 'Services isolés et redémarrables.', 'var(--tt-color-green-dec-1)'],
        ])}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'Caddy et HTTPS',
        `<div class="spot-layout">
          ${processDiagram([
            ['TLS', ['Certificats automatiques', 'Let’s Encrypt', 'Renouvellement'], 'var(--tt-color-green-dec-1)'],
            ['Reverse proxy', ['hedsvs.ch → frontend', 'api2 → API/REST', 'studio2 → Studio'], 'var(--tt-brand-color-600)'],
            ['DNS', ['Domaines publics', 'Pointent vers le VPS', 'Routage centralisé'], 'var(--tt-color-text-orange)'],
          ])}
          ${spotVisual('assets/svg/spot-docker-caddy.svg', 'Caddy route les domaines vers les services')}
        </div>`,
      ),
      slide(
        'Routage de production',
        `${diagramFlow([
          ['Web', 'Internet', 'Un utilisateur arrive sur hedsvs.ch, api2 ou studio2.', 'var(--tt-brand-color-600)'],
          ['assets/tech/simpleicons/caddy.svg', 'Caddy', 'Le reverse proxy termine HTTPS et choisit le service cible.', 'var(--tt-gray-light-800)'],
          ['Svc', 'Services', 'Frontend, API Express ou Supabase répondent selon le domaine.', 'var(--tt-color-text-blue)'],
          ['Logs', 'Logs', 'Les erreurs restent traçables après chaque déploiement.', 'var(--tt-color-text-red)'],
        ])}`,
        '',
        { className: 'workflow-slide' },
      ),
    ].join(''),
  ),
]

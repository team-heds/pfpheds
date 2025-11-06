/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      link: { type: 'generated-index', slug: '/getting-started', description: 'Prise en main du projet, introduction et prérequis.' },
      items: [
        'intro',
        'getting-started',
        {
          type: 'category',
          label: 'Environment Setup',
          link: { type: 'generated-index', slug: '/getting-started/environment', description: "Configuration de l’environnement de dev." },
          items: []
        },
        {
          type: 'category',
          label: 'CLI & Extensions',
          link: { type: 'generated-index', slug: '/getting-started/cli-extensions', description: 'CLI, outils et extensions (ex: Vue DevTools).' },
          items: []
        }
      ],
    },
    {
      type: 'category',
      label: 'Developing',
      collapsed: false,
      link: { type: 'generated-index', slug: '/developing', description: 'Architecture, stack et modules de développement.' },
      items: [
        'architecture',
        'stack',
        {
          type: 'category',
          label: 'Frontend',
          collapsed: true,
          items: [
            'frontend/structure',
            'frontend/routing',
            'frontend/state',
            'frontend/pwa',
          ],
        },
        {
          type: 'category',
          label: 'Features',
          collapsed: true,
          items: [
            'features/overview',
            'features/navigation',
            'features/notifications',
          ],
        },
        {
          type: 'category',
          label: 'Applications',
          collapsed: true,
          items: [
            'apps/chat',
            'apps/mail',
            'apps/tasklist',
            'apps/calendar',
            'apps/files',
            'apps/notes',
            'apps/events',
            'apps/tools',
          ],
        },
        {
          type: 'category',
          label: 'Social',
          collapsed: true,
          items: [
            'social/overview',
            'social/communities',
            'social/messaging',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Layout & Design',
      collapsed: false,
      link: { type: 'generated-index', slug: '/layout', description: 'Design system, thèmes et typographie.' },
      items: [
        'frontend/ui',
      ],
    },
    {
      type: 'category',
      label: 'Backend',
      collapsed: false,
      link: { type: 'generated-index', slug: '/backend', description: 'Firebase, Supabase, DevOps et sécurité.' },
      items: [
        {
          type: 'category',
          label: 'Firebase',
          collapsed: true,
          items: [
            'backend/firebase/overview',
            'backend/firebase/database',
            'backend/firebase/storage',
            'backend/firebase/auth',
          ],
        },
        {
          type: 'category',
          label: 'Supabase',
          collapsed: true,
          items: [
            'backend/supabase/overview',
            'backend/supabase/services',
            'backend/supabase/rls',
            'backend/supabase/migrations',
          ],
        },
        {
          type: 'category',
          label: 'DevOps & Deployment',
          collapsed: true,
          items: [
            'devops/docker-dev',
            'devops/firebase-hosting',
            'devops/vps-caddy-nginx',
            'devops/ci-cd',
            'devops/large-files',
          ],
        },
        {
          type: 'category',
          label: 'Sécurité & Permissions',
          collapsed: true,
          items: [
            'security/roles',
            'security/route-guards',
            'security/supabase-rls',
          ],
        },
        {
          type: 'category',
          label: 'Données & Migrations',
          collapsed: true,
          items: [
            'data/migration-firebase-supabase',
            'data/schema-supabase',
            'data/multi-system-router',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Physiothérapie',
      collapsed: false,
      link: { type: 'generated-index', slug: '/physiotherapie', description: 'Formation pratique et gamification.' },
      items: [
        {
          type: 'category',
          label: 'Formation pratique',
          link: { type: 'generated-index', slug: '/physiotherapie/formation-pratique' },
          items: [
            'map/overview',
            'map/institutions',
            'map/places',
          ],
        },
        {
          type: 'category',
          label: 'Gamification',
          collapsed: true,
          items: [
            'gamification/profile',
            'gamification/quests',
            'gamification/challenges',
            'gamification/houses',
            'gamification/admin',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Soins-infirmiers',
      collapsed: false,
      link: { type: 'generated-index', slug: '/soins-infirmiers', description: 'Administration et processus SI.' },
      items: [
        {
          type: 'category',
          label: 'Administration',
          collapsed: true,
          items: [
            'admin/dashboard',
            'admin/users',
            'admin/institutions-places',
            'admin/votations',
            'admin/validation-reception',
            'admin/scroll-policy',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Médias & Vimeo',
      collapsed: true,
      items: [
        'media/modules',
        'media/vimeo-config',
        'media/media-service',
      ],
    },
    {
      type: 'category',
      label: 'Tests & Diagnostics',
      collapsed: true,
      items: [
        'testing/supabase-test',
        'testing/firebase-test',
        'testing/diagnostic-tools',
        'testing/scripts',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      collapsed: true,
      items: [
        'troubleshooting/firebase-env',
        'troubleshooting/firebase-auth',
        'troubleshooting/env-encoding',
        'troubleshooting/docusaurus-prism',
      ],
    },
    {
      type: 'category',
      label: 'Qualité & Contribution',
      collapsed: true,
      items: [
        'contrib/eslint-prettier',
        'contrib/conventions',
        'contrib/workflow',
      ],
    },
    {
      type: 'category',
      label: 'Gestion de projet',
      collapsed: true,
      items: [
        'project/overview',
        'project/roadmap',
        'project/sprints',
        'project/releases',
        'project/migrations',
        'project/template-gantt',
      ],
    },
    'roadmap',
    'changelog',
  ],
};

module.exports = sidebars;
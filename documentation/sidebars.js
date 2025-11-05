/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    'getting-started',
    'architecture',
    {
      type: 'category',
      label: 'Frontend (Vue 3)',
      collapsed: false,
      items: [
        'frontend/structure',
        'frontend/routing',
        'frontend/state',
        'frontend/ui',
        'frontend/pwa',
      ],
    },
    {
      type: 'category',
      label: 'Backends',
      collapsed: false,
      items: [
        'backend/firebase/overview',
        'backend/firebase/database',
        'backend/firebase/storage',
        'backend/firebase/auth',
        'backend/supabase/overview',
        'backend/supabase/services',
        'backend/supabase/rls',
        'backend/supabase/migrations',
      ],
    },
    {
      type: 'category',
      label: 'Données & Migrations',
      items: [
        'data/migration-firebase-supabase',
        'data/schema-supabase',
        'data/multi-system-router',
      ],
    },
    {
      type: 'category',
      label: 'Fonctionnalités',
      items: [
        'features/overview',
        'features/navigation',
        'features/notifications',
      ],
    },
    {
      type: 'category',
      label: 'Administration',
      items: [
        'admin/dashboard',
        'admin/users',
        'admin/institutions-places',
        'admin/votations',
        'admin/validation-reception',
        'admin/scroll-policy',
      ],
    },
    {
      type: 'category',
      label: 'Applications',
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
      label: 'Gamification',
      items: [
        'gamification/profile',
        'gamification/quests',
        'gamification/challenges',
        'gamification/houses',
        'gamification/admin',
      ],
    },
    {
      type: 'category',
      label: 'Social',
      items: [
        'social/overview',
        'social/communities',
        'social/messaging',
      ],
    },
    {
      type: 'category',
      label: 'Institutions & Carte',
      items: [
        'map/overview',
        'map/institutions',
        'map/places',
      ],
    },
    {
      type: 'category',
      label: 'Médias & Vimeo',
      items: [
        'media/modules',
        'media/vimeo-config',
        'media/media-service',
      ],
    },
    {
      type: 'category',
      label: 'Sécurité & Permissions',
      items: [
        'security/roles',
        'security/route-guards',
        'security/supabase-rls',
      ],
    },
    {
      type: 'category',
      label: 'Déploiement & DevOps',
      items: [
        'devops/firebase-hosting',
        'devops/vps-caddy-nginx',
        'devops/docker-dev',
        'devops/ci-cd',
        'devops/large-files',
      ],
    },
    {
      type: 'category',
      label: 'Tests & Diagnostics',
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
      items: [
        'contrib/eslint-prettier',
        'contrib/conventions',
        'contrib/workflow',
      ],
    },
    'roadmap',
    'changelog',
  ],
};

module.exports = sidebars;
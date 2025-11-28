import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/__docusaurus/debug',
    component: ComponentCreator('/docs/__docusaurus/debug', 'e58'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/config',
    component: ComponentCreator('/docs/__docusaurus/debug/config', '2ce'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/content',
    component: ComponentCreator('/docs/__docusaurus/debug/content', '11b'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/globalData',
    component: ComponentCreator('/docs/__docusaurus/debug/globalData', 'f13'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/metadata',
    component: ComponentCreator('/docs/__docusaurus/debug/metadata', 'bff'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/registry',
    component: ComponentCreator('/docs/__docusaurus/debug/registry', '830'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/routes',
    component: ComponentCreator('/docs/__docusaurus/debug/routes', '13e'),
    exact: true
  },
  {
    path: '/docs/landing',
    component: ComponentCreator('/docs/landing', '80b'),
    exact: true
  },
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', '36e'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', '97f'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', 'b50'),
            routes: [
              {
                path: '/docs/admin/dashboard',
                component: ComponentCreator('/docs/admin/dashboard', 'c23'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/admin/institutions-places',
                component: ComponentCreator('/docs/admin/institutions-places', '17b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/admin/scroll-policy',
                component: ComponentCreator('/docs/admin/scroll-policy', '587'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/admin/users',
                component: ComponentCreator('/docs/admin/users', 'f16'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/admin/validation-reception',
                component: ComponentCreator('/docs/admin/validation-reception', 'a23'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/admin/votations',
                component: ComponentCreator('/docs/admin/votations', '793'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/apps/calendar',
                component: ComponentCreator('/docs/apps/calendar', '8b1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/apps/chat',
                component: ComponentCreator('/docs/apps/chat', '996'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/apps/events',
                component: ComponentCreator('/docs/apps/events', '026'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/apps/files',
                component: ComponentCreator('/docs/apps/files', 'b1d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/apps/mail',
                component: ComponentCreator('/docs/apps/mail', '972'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/apps/notes',
                component: ComponentCreator('/docs/apps/notes', '149'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/apps/tasklist',
                component: ComponentCreator('/docs/apps/tasklist', '60d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/apps/tools',
                component: ComponentCreator('/docs/apps/tools', '146'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/architecture',
                component: ComponentCreator('/docs/architecture', '38d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/firebase/auth',
                component: ComponentCreator('/docs/backend/firebase/auth', '470'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/firebase/database',
                component: ComponentCreator('/docs/backend/firebase/database', '595'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/firebase/overview',
                component: ComponentCreator('/docs/backend/firebase/overview', 'bf7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/firebase/storage',
                component: ComponentCreator('/docs/backend/firebase/storage', '95d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/supabase/migrations',
                component: ComponentCreator('/docs/backend/supabase/migrations', 'abe'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/supabase/overview',
                component: ComponentCreator('/docs/backend/supabase/overview', '546'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/supabase/rls',
                component: ComponentCreator('/docs/backend/supabase/rls', '2e7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/supabase/services',
                component: ComponentCreator('/docs/backend/supabase/services', 'fef'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/changelog',
                component: ComponentCreator('/docs/changelog', 'c45'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/conventions',
                component: ComponentCreator('/docs/contrib/conventions', '5da'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/eslint-prettier',
                component: ComponentCreator('/docs/contrib/eslint-prettier', '5c1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/workflow',
                component: ComponentCreator('/docs/contrib/workflow', 'ca8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/migration-firebase-supabase',
                component: ComponentCreator('/docs/data/migration-firebase-supabase', 'dab'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/multi-system-router',
                component: ComponentCreator('/docs/data/multi-system-router', '2e6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/schema-supabase',
                component: ComponentCreator('/docs/data/schema-supabase', 'ba7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/devops/ci-cd',
                component: ComponentCreator('/docs/devops/ci-cd', '61a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/devops/docker-dev',
                component: ComponentCreator('/docs/devops/docker-dev', '3f5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/devops/firebase-hosting',
                component: ComponentCreator('/docs/devops/firebase-hosting', '79b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/devops/large-files',
                component: ComponentCreator('/docs/devops/large-files', 'bf3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/devops/vps-caddy-nginx',
                component: ComponentCreator('/docs/devops/vps-caddy-nginx', '02d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/navigation',
                component: ComponentCreator('/docs/features/navigation', 'afa'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/notifications',
                component: ComponentCreator('/docs/features/notifications', '810'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/overview',
                component: ComponentCreator('/docs/features/overview', '2f1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/pwa',
                component: ComponentCreator('/docs/frontend/pwa', 'b8d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/routing',
                component: ComponentCreator('/docs/frontend/routing', '30f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/state',
                component: ComponentCreator('/docs/frontend/state', '035'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/structure',
                component: ComponentCreator('/docs/frontend/structure', '58a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/ui',
                component: ComponentCreator('/docs/frontend/ui', '56b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/gamification/admin',
                component: ComponentCreator('/docs/gamification/admin', 'bae'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/gamification/challenges',
                component: ComponentCreator('/docs/gamification/challenges', '57e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/gamification/houses',
                component: ComponentCreator('/docs/gamification/houses', '0aa'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/gamification/profile',
                component: ComponentCreator('/docs/gamification/profile', '623'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/gamification/quests',
                component: ComponentCreator('/docs/gamification/quests', '2c5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started',
                component: ComponentCreator('/docs/getting-started', '565'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/map/institutions',
                component: ComponentCreator('/docs/map/institutions', '6ab'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/map/overview',
                component: ComponentCreator('/docs/map/overview', '529'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/map/places',
                component: ComponentCreator('/docs/map/places', 'fc6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/media/media-service',
                component: ComponentCreator('/docs/media/media-service', 'd8c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/media/modules',
                component: ComponentCreator('/docs/media/modules', '166'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/media/vimeo-config',
                component: ComponentCreator('/docs/media/vimeo-config', 'e88'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/project/migrations',
                component: ComponentCreator('/docs/project/migrations', 'b08'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/project/overview',
                component: ComponentCreator('/docs/project/overview', '1e1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/project/releases',
                component: ComponentCreator('/docs/project/releases', '3a0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/project/roadmap',
                component: ComponentCreator('/docs/project/roadmap', '1f2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/project/sprints',
                component: ComponentCreator('/docs/project/sprints', '28d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/project/template-gantt',
                component: ComponentCreator('/docs/project/template-gantt', '55d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/roadmap',
                component: ComponentCreator('/docs/roadmap', '8c5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/security/roles',
                component: ComponentCreator('/docs/security/roles', '7bc'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/security/route-guards',
                component: ComponentCreator('/docs/security/route-guards', '91c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/security/supabase-rls',
                component: ComponentCreator('/docs/security/supabase-rls', '6b0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/social/communities',
                component: ComponentCreator('/docs/social/communities', '96f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/social/messaging',
                component: ComponentCreator('/docs/social/messaging', 'a5f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/social/overview',
                component: ComponentCreator('/docs/social/overview', 'cbb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/stack',
                component: ComponentCreator('/docs/stack', '1fa'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/testing/diagnostic-tools',
                component: ComponentCreator('/docs/testing/diagnostic-tools', 'e4c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/testing/firebase-test',
                component: ComponentCreator('/docs/testing/firebase-test', 'f96'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/testing/scripts',
                component: ComponentCreator('/docs/testing/scripts', '63b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/testing/supabase-test',
                component: ComponentCreator('/docs/testing/supabase-test', '987'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/troubleshooting/docusaurus-prism',
                component: ComponentCreator('/docs/troubleshooting/docusaurus-prism', '918'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/troubleshooting/env-encoding',
                component: ComponentCreator('/docs/troubleshooting/env-encoding', '3b5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/troubleshooting/firebase-auth',
                component: ComponentCreator('/docs/troubleshooting/firebase-auth', '299'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/troubleshooting/firebase-env',
                component: ComponentCreator('/docs/troubleshooting/firebase-env', 'f0a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', 'be8'),
                exact: true,
                sidebar: "docs"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

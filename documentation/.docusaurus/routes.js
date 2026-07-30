import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/landing',
    component: ComponentCreator('/docs/landing', '80b'),
    exact: true
  },
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', 'bd4'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', '993'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', '434'),
            routes: [
              {
                path: '/docs/apps/overview',
                component: ComponentCreator('/docs/apps/overview', '781'),
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
                path: '/docs/auth/auth-routing-lifecycle',
                component: ComponentCreator('/docs/auth/auth-routing-lifecycle', '6f9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/auth/overview',
                component: ComponentCreator('/docs/auth/overview', 'd57'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/auth/permission-model',
                component: ComponentCreator('/docs/auth/permission-model', 'eeb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/auth/security-services-legacy',
                component: ComponentCreator('/docs/auth/security-services-legacy', '58a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/active-vs-legacy',
                component: ComponentCreator('/docs/backend/active-vs-legacy', '495'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/endpoints-catalog',
                component: ComponentCreator('/docs/backend/endpoints-catalog', '9c8'),
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
                path: '/docs/backend/frontend-backend-traceability',
                component: ComponentCreator('/docs/backend/frontend-backend-traceability', '34c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/overview',
                component: ComponentCreator('/docs/backend/overview', '94d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/routes-map',
                component: ComponentCreator('/docs/backend/routes-map', 'c91'),
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
                path: '/docs/contrib/docs-style-guide',
                component: ComponentCreator('/docs/contrib/docs-style-guide', '2cd'),
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
                path: '/docs/contrib/github',
                component: ComponentCreator('/docs/contrib/github', '0d4'),
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
                path: '/docs/data/critical-tables',
                component: ComponentCreator('/docs/data/critical-tables', '506'),
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
                path: '/docs/data/migrations-catalog',
                component: ComponentCreator('/docs/data/migrations-catalog', 'ecf'),
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
                path: '/docs/data/overview',
                component: ComponentCreator('/docs/data/overview', '7db'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/rpc-and-sql-surface',
                component: ComponentCreator('/docs/data/rpc-and-sql-surface', '6e1'),
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
                path: '/docs/domains/formation-pratique',
                component: ComponentCreator('/docs/domains/formation-pratique', 'c0c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/formation-pratique-flows',
                component: ComponentCreator('/docs/domains/formation-pratique-flows', '0c7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/formation-pratique-fonctionnel',
                component: ComponentCreator('/docs/domains/formation-pratique-fonctionnel', '157'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/formation-pratique-traceability',
                component: ComponentCreator('/docs/domains/formation-pratique-traceability', '1a0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/gamification-service-deep-dive',
                component: ComponentCreator('/docs/domains/gamification-service-deep-dive', '9ea'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/multi-filiere-si-phy',
                component: ComponentCreator('/docs/domains/multi-filiere-si-phy', '065'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/pfp-services-deep-dive',
                component: ComponentCreator('/docs/domains/pfp-services-deep-dive', '6d6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/planning-soins',
                component: ComponentCreator('/docs/domains/planning-soins', '2e9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/priorite-extension-soins-infirmiers-et-profil-etudiant',
                component: ComponentCreator('/docs/domains/priorite-extension-soins-infirmiers-et-profil-etudiant', '39f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/social-gamification',
                component: ComponentCreator('/docs/domains/social-gamification', 'd8e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/ui-ownership-map',
                component: ComponentCreator('/docs/domains/ui-ownership-map', '1a8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/votation-algorithm',
                component: ComponentCreator('/docs/domains/votation-algorithm', '393'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/votation-priority-score',
                component: ComponentCreator('/docs/domains/votation-priority-score', '23e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/votation-systeme-complet',
                component: ComponentCreator('/docs/domains/votation-systeme-complet', '34f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/bootstrap',
                component: ComponentCreator('/docs/frontend/bootstrap', 'e81'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-admin',
                component: ComponentCreator('/docs/frontend/component-library-admin', '2ff'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-common-ui',
                component: ComponentCreator('/docs/frontend/component-library-common-ui', '6b6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-critical-components',
                component: ComponentCreator('/docs/frontend/component-library-critical-components', '21c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-layout',
                component: ComponentCreator('/docs/frontend/component-library-layout', 'ef7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-overview',
                component: ComponentCreator('/docs/frontend/component-library-overview', '6f5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-social-media',
                component: ComponentCreator('/docs/frontend/component-library-social-media', '9c4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/critical-stores',
                component: ComponentCreator('/docs/frontend/critical-stores', 'ef8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/data-refresh-pattern',
                component: ComponentCreator('/docs/frontend/data-refresh-pattern', '714'),
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
                path: '/docs/frontend/route-catalog',
                component: ComponentCreator('/docs/frontend/route-catalog', '7b9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/route-to-data-matrix',
                component: ComponentCreator('/docs/frontend/route-to-data-matrix', 'cf7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/router-modules',
                component: ComponentCreator('/docs/frontend/router-modules', '17e'),
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
                path: '/docs/frontend/services-catalog',
                component: ComponentCreator('/docs/frontend/services-catalog', '5dd'),
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
                path: '/docs/frontend/stores-services-map',
                component: ComponentCreator('/docs/frontend/stores-services-map', '7b7'),
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
                path: '/docs/frontend/view-store-service-matrix',
                component: ComponentCreator('/docs/frontend/view-store-service-matrix', '9f7'),
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
                path: '/docs/getting-started/cli-extensions/overview',
                component: ComponentCreator('/docs/getting-started/cli-extensions/overview', '020'),
                exact: true
              },
              {
                path: '/docs/getting-started/environment/setup',
                component: ComponentCreator('/docs/getting-started/environment/setup', '75a'),
                exact: true
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
                path: '/docs/ops/deployment',
                component: ComponentCreator('/docs/ops/deployment', '007'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/development',
                component: ComponentCreator('/docs/ops/development', 'b23'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/runbook',
                component: ComponentCreator('/docs/ops/runbook', '7d7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/vps-operations',
                component: ComponentCreator('/docs/ops/vps-operations', 'aa4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/vps-topology',
                component: ComponentCreator('/docs/ops/vps-topology', 'c30'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/priorites-developpement',
                component: ComponentCreator('/docs/priorites-developpement', 'a29'),
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
                path: '/docs/system/overview',
                component: ComponentCreator('/docs/system/overview', '26e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/system/project-structure',
                component: ComponentCreator('/docs/system/project-structure', 'fc1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/system/recovery-checklist',
                component: ComponentCreator('/docs/system/recovery-checklist', '6aa'),
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
                component: ComponentCreator('/docs/testing/firebase-test', '4e8'),
                exact: true
              },
              {
                path: '/docs/testing/overview',
                component: ComponentCreator('/docs/testing/overview', '9d1'),
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
                component: ComponentCreator('/docs/testing/supabase-test', '661'),
                exact: true
              },
              {
                path: '/docs/testing/unit-tests',
                component: ComponentCreator('/docs/testing/unit-tests', '3ff'),
                exact: true
              },
              {
                path: '/docs/troubleshooting/env-encoding',
                component: ComponentCreator('/docs/troubleshooting/env-encoding', '81f'),
                exact: true
              },
              {
                path: '/docs/troubleshooting/firebase-auth',
                component: ComponentCreator('/docs/troubleshooting/firebase-auth', 'a47'),
                exact: true
              },
              {
                path: '/docs/troubleshooting/firebase-env',
                component: ComponentCreator('/docs/troubleshooting/firebase-env', '30f'),
                exact: true
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

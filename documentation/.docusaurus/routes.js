import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/landing/',
    component: ComponentCreator('/docs/landing/', '94c'),
    exact: true
  },
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', '182'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', '35f'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', '1fd'),
            routes: [
              {
                path: '/docs/apps/overview/',
                component: ComponentCreator('/docs/apps/overview/', 'f67'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/architecture/',
                component: ComponentCreator('/docs/architecture/', '7ac'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/auth/auth-routing-lifecycle/',
                component: ComponentCreator('/docs/auth/auth-routing-lifecycle/', '2ee'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/auth/overview/',
                component: ComponentCreator('/docs/auth/overview/', '5e5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/auth/permission-model/',
                component: ComponentCreator('/docs/auth/permission-model/', '685'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/auth/security-services-legacy/',
                component: ComponentCreator('/docs/auth/security-services-legacy/', '1df'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/active-vs-legacy/',
                component: ComponentCreator('/docs/backend/active-vs-legacy/', 'ad1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/endpoints-catalog/',
                component: ComponentCreator('/docs/backend/endpoints-catalog/', '08e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/firebase/auth/',
                component: ComponentCreator('/docs/backend/firebase/auth/', 'a11'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/firebase/database/',
                component: ComponentCreator('/docs/backend/firebase/database/', '0b2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/firebase/overview/',
                component: ComponentCreator('/docs/backend/firebase/overview/', 'eea'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/firebase/storage/',
                component: ComponentCreator('/docs/backend/firebase/storage/', 'b2c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/frontend-backend-traceability/',
                component: ComponentCreator('/docs/backend/frontend-backend-traceability/', '3cf'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/overview/',
                component: ComponentCreator('/docs/backend/overview/', '072'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/routes-map/',
                component: ComponentCreator('/docs/backend/routes-map/', '058'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/supabase/migrations/',
                component: ComponentCreator('/docs/backend/supabase/migrations/', 'b50'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/supabase/overview/',
                component: ComponentCreator('/docs/backend/supabase/overview/', '63c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/supabase/rls/',
                component: ComponentCreator('/docs/backend/supabase/rls/', '845'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/backend/supabase/services/',
                component: ComponentCreator('/docs/backend/supabase/services/', '93b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/changelog/',
                component: ComponentCreator('/docs/changelog/', '604'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/conventions/',
                component: ComponentCreator('/docs/contrib/conventions/', '063'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/docs-style-guide/',
                component: ComponentCreator('/docs/contrib/docs-style-guide/', '43e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/eslint-prettier/',
                component: ComponentCreator('/docs/contrib/eslint-prettier/', 'b45'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/github/',
                component: ComponentCreator('/docs/contrib/github/', '6ad'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/presentation-revealjs/',
                component: ComponentCreator('/docs/contrib/presentation-revealjs/', '836'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/contrib/workflow/',
                component: ComponentCreator('/docs/contrib/workflow/', '5f2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/critical-tables/',
                component: ComponentCreator('/docs/data/critical-tables/', 'a41'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/migration-firebase-supabase/',
                component: ComponentCreator('/docs/data/migration-firebase-supabase/', 'ef2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/migrations-catalog/',
                component: ComponentCreator('/docs/data/migrations-catalog/', 'd2b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/multi-system-router/',
                component: ComponentCreator('/docs/data/multi-system-router/', 'c08'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/overview/',
                component: ComponentCreator('/docs/data/overview/', '1cc'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/rpc-and-sql-surface/',
                component: ComponentCreator('/docs/data/rpc-and-sql-surface/', '0f4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data/schema-supabase/',
                component: ComponentCreator('/docs/data/schema-supabase/', 'dd9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/formation-pratique-flows/',
                component: ComponentCreator('/docs/domains/formation-pratique-flows/', 'b0e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/formation-pratique-fonctionnel/',
                component: ComponentCreator('/docs/domains/formation-pratique-fonctionnel/', 'bf9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/formation-pratique-traceability/',
                component: ComponentCreator('/docs/domains/formation-pratique-traceability/', '745'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/formation-pratique/',
                component: ComponentCreator('/docs/domains/formation-pratique/', '968'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/gamification-service-deep-dive/',
                component: ComponentCreator('/docs/domains/gamification-service-deep-dive/', '703'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/multi-filiere-si-phy/',
                component: ComponentCreator('/docs/domains/multi-filiere-si-phy/', 'd24'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/pfp-services-deep-dive/',
                component: ComponentCreator('/docs/domains/pfp-services-deep-dive/', '0c4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/planning-soins/',
                component: ComponentCreator('/docs/domains/planning-soins/', 'a70'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/priorite-extension-soins-infirmiers-et-profil-etudiant/',
                component: ComponentCreator('/docs/domains/priorite-extension-soins-infirmiers-et-profil-etudiant/', 'a41'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/social-gamification/',
                component: ComponentCreator('/docs/domains/social-gamification/', 'bb4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/ui-ownership-map/',
                component: ComponentCreator('/docs/domains/ui-ownership-map/', '6ba'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/votation-algorithm/',
                component: ComponentCreator('/docs/domains/votation-algorithm/', 'a40'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/votation-priority-score/',
                component: ComponentCreator('/docs/domains/votation-priority-score/', '4f2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/domains/votation-systeme-complet/',
                component: ComponentCreator('/docs/domains/votation-systeme-complet/', 'be6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/bootstrap/',
                component: ComponentCreator('/docs/frontend/bootstrap/', '873'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-admin/',
                component: ComponentCreator('/docs/frontend/component-library-admin/', '85a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-common-ui/',
                component: ComponentCreator('/docs/frontend/component-library-common-ui/', 'f59'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-critical-components/',
                component: ComponentCreator('/docs/frontend/component-library-critical-components/', '820'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-layout/',
                component: ComponentCreator('/docs/frontend/component-library-layout/', '2fd'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-overview/',
                component: ComponentCreator('/docs/frontend/component-library-overview/', '719'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/component-library-social-media/',
                component: ComponentCreator('/docs/frontend/component-library-social-media/', 'a9b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/critical-stores/',
                component: ComponentCreator('/docs/frontend/critical-stores/', '881'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/data-refresh-pattern/',
                component: ComponentCreator('/docs/frontend/data-refresh-pattern/', 'fbd'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/pwa/',
                component: ComponentCreator('/docs/frontend/pwa/', '576'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/route-catalog/',
                component: ComponentCreator('/docs/frontend/route-catalog/', '840'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/route-to-data-matrix/',
                component: ComponentCreator('/docs/frontend/route-to-data-matrix/', '0ea'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/router-modules/',
                component: ComponentCreator('/docs/frontend/router-modules/', '791'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/routing/',
                component: ComponentCreator('/docs/frontend/routing/', 'c43'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/services-catalog/',
                component: ComponentCreator('/docs/frontend/services-catalog/', '1c3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/state/',
                component: ComponentCreator('/docs/frontend/state/', '02f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/stores-services-map/',
                component: ComponentCreator('/docs/frontend/stores-services-map/', '4ef'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/ui/',
                component: ComponentCreator('/docs/frontend/ui/', '0f0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/frontend/view-store-service-matrix/',
                component: ComponentCreator('/docs/frontend/view-store-service-matrix/', '039'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/',
                component: ComponentCreator('/docs/getting-started/', '826'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/cli-extensions/overview/',
                component: ComponentCreator('/docs/getting-started/cli-extensions/overview/', 'da6'),
                exact: true
              },
              {
                path: '/docs/getting-started/environment/setup/',
                component: ComponentCreator('/docs/getting-started/environment/setup/', '954'),
                exact: true
              },
              {
                path: '/docs/media/media-service/',
                component: ComponentCreator('/docs/media/media-service/', '4cc'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/media/modules/',
                component: ComponentCreator('/docs/media/modules/', 'c75'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/media/vimeo-config/',
                component: ComponentCreator('/docs/media/vimeo-config/', 'dfb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/deployment/',
                component: ComponentCreator('/docs/ops/deployment/', 'fbb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/development/',
                component: ComponentCreator('/docs/ops/development/', '57d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/runbook/',
                component: ComponentCreator('/docs/ops/runbook/', '1c5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/vps-operations/',
                component: ComponentCreator('/docs/ops/vps-operations/', 'd63'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ops/vps-topology/',
                component: ComponentCreator('/docs/ops/vps-topology/', 'e83'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/priorites-developpement/',
                component: ComponentCreator('/docs/priorites-developpement/', '917'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/roadmap/',
                component: ComponentCreator('/docs/roadmap/', '1c4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/security/roles/',
                component: ComponentCreator('/docs/security/roles/', '486'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/security/route-guards/',
                component: ComponentCreator('/docs/security/route-guards/', '6b8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/security/supabase-rls/',
                component: ComponentCreator('/docs/security/supabase-rls/', 'a33'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/system/overview/',
                component: ComponentCreator('/docs/system/overview/', '4a7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/system/project-structure/',
                component: ComponentCreator('/docs/system/project-structure/', '4d5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/system/recovery-checklist/',
                component: ComponentCreator('/docs/system/recovery-checklist/', '807'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/testing/diagnostic-tools/',
                component: ComponentCreator('/docs/testing/diagnostic-tools/', '1ac'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/testing/firebase-test/',
                component: ComponentCreator('/docs/testing/firebase-test/', '6b2'),
                exact: true
              },
              {
                path: '/docs/testing/overview/',
                component: ComponentCreator('/docs/testing/overview/', '46f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/testing/scripts/',
                component: ComponentCreator('/docs/testing/scripts/', '07b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/testing/supabase-test/',
                component: ComponentCreator('/docs/testing/supabase-test/', '84c'),
                exact: true
              },
              {
                path: '/docs/testing/unit-tests/',
                component: ComponentCreator('/docs/testing/unit-tests/', 'dfe'),
                exact: true
              },
              {
                path: '/docs/troubleshooting/env-encoding/',
                component: ComponentCreator('/docs/troubleshooting/env-encoding/', '863'),
                exact: true
              },
              {
                path: '/docs/troubleshooting/firebase-auth/',
                component: ComponentCreator('/docs/troubleshooting/firebase-auth/', '0bc'),
                exact: true
              },
              {
                path: '/docs/troubleshooting/firebase-env/',
                component: ComponentCreator('/docs/troubleshooting/firebase-env/', 'e43'),
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

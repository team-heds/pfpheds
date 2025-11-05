import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true
  },
  {
    path: '/derived',
    component: ComponentCreator('/derived', 'b29'),
    routes: [
      {
        path: '/derived',
        component: ComponentCreator('/derived', '2c4'),
        routes: [
          {
            path: '/derived',
            component: ComponentCreator('/derived', '4d2'),
            routes: [
              {
                path: '/derived/routes',
                component: ComponentCreator('/derived/routes', 'bbf'),
                exact: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/extras',
    component: ComponentCreator('/extras', '7b5'),
    routes: [
      {
        path: '/extras',
        component: ComponentCreator('/extras', 'dde'),
        routes: [
          {
            path: '/extras',
            component: ComponentCreator('/extras', '6c1'),
            routes: [
              {
                path: '/extras/build/Project-Documentation',
                component: ComponentCreator('/extras/build/Project-Documentation', '8d2'),
                exact: true
              },
              {
                path: '/extras/derived/routes',
                component: ComponentCreator('/extras/derived/routes', '362'),
                exact: true
              },
              {
                path: '/extras/planning-enseignants-gantt',
                component: ComponentCreator('/extras/planning-enseignants-gantt', '981'),
                exact: true
              },
              {
                path: '/extras/planning-enseignants-gantt.generated',
                component: ComponentCreator('/extras/planning-enseignants-gantt.generated', '0ef'),
                exact: true
              },
              {
                path: '/extras/project-docs/',
                component: ComponentCreator('/extras/project-docs/', '8fb'),
                exact: true
              },
              {
                path: '/extras/project-docs/Architecture',
                component: ComponentCreator('/extras/project-docs/Architecture', '095'),
                exact: true
              },
              {
                path: '/extras/project-docs/Data_Model',
                component: ComponentCreator('/extras/project-docs/Data_Model', 'b15'),
                exact: true
              },
              {
                path: '/extras/project-docs/Deployment_Runbook',
                component: ComponentCreator('/extras/project-docs/Deployment_Runbook', '44a'),
                exact: true
              },
              {
                path: '/extras/project-docs/Executive_Summary',
                component: ComponentCreator('/extras/project-docs/Executive_Summary', '523'),
                exact: true
              },
              {
                path: '/extras/project-docs/Migrations_and_Environments',
                component: ComponentCreator('/extras/project-docs/Migrations_and_Environments', 'a7b'),
                exact: true
              },
              {
                path: '/extras/project-docs/Ops_Monitoring',
                component: ComponentCreator('/extras/project-docs/Ops_Monitoring', '2a1'),
                exact: true
              },
              {
                path: '/extras/project-docs/Project_Charter',
                component: ComponentCreator('/extras/project-docs/Project_Charter', '33a'),
                exact: true
              },
              {
                path: '/extras/project-docs/Roadmap',
                component: ComponentCreator('/extras/project-docs/Roadmap', 'a32'),
                exact: true
              },
              {
                path: '/extras/project-docs/Router_and_Navigation',
                component: ComponentCreator('/extras/project-docs/Router_and_Navigation', 'a15'),
                exact: true
              },
              {
                path: '/extras/project-docs/Security_Roles_Permissions',
                component: ComponentCreator('/extras/project-docs/Security_Roles_Permissions', '6a3'),
                exact: true
              },
              {
                path: '/extras/project-docs/Testing_and_Quality',
                component: ComponentCreator('/extras/project-docs/Testing_and_Quality', 'd27'),
                exact: true
              },
              {
                path: '/extras/project-docs/User_Guides',
                component: ComponentCreator('/extras/project-docs/User_Guides', 'd6a'),
                exact: true
              },
              {
                path: '/extras/roles-permissions-router',
                component: ComponentCreator('/extras/roles-permissions-router', '26f'),
                exact: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '070'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '5f5'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '623'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '270'),
            routes: [
              {
                path: '/Architecture',
                component: ComponentCreator('/Architecture', '33e'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Data_Model',
                component: ComponentCreator('/Data_Model', '35f'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Deployment_Runbook',
                component: ComponentCreator('/Deployment_Runbook', 'a61'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Executive_Summary',
                component: ComponentCreator('/Executive_Summary', '332'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Migrations_and_Environments',
                component: ComponentCreator('/Migrations_and_Environments', 'd05'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Ops_Monitoring',
                component: ComponentCreator('/Ops_Monitoring', '588'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Project_Charter',
                component: ComponentCreator('/Project_Charter', 'd1a'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Roadmap',
                component: ComponentCreator('/Roadmap', 'ec0'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Router_and_Navigation',
                component: ComponentCreator('/Router_and_Navigation', 'e62'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Security_Roles_Permissions',
                component: ComponentCreator('/Security_Roles_Permissions', '262'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/Testing_and_Quality',
                component: ComponentCreator('/Testing_and_Quality', '927'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/User_Guides',
                component: ComponentCreator('/User_Guides', '8d5'),
                exact: true,
                sidebar: "projectSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', '5dd'),
                exact: true
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

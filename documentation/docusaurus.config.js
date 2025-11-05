// @ts-check

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Plateforme HEdS - Documentation',
  tagline: 'Documentation complète et technique de la plateforme HEdS',
  url: 'https://localhost',
  baseUrl: '/docs/',
  favicon: 'img/favicon.ico',
  organizationName: 'pfpheds',
  projectName: 'docs',
  trailingSlash: false,
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr']
  },
  markdown: {
    mermaid: true
  },
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */ ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: undefined
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      })
    ]
  ],
  themeConfig: /** @type {import('@docusaurus/preset-classic').ThemeConfig} */ ({
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true
    },
    navbar: {
      title: 'HEdS Docs',
      logo: {
        alt: 'HEdS',
        src: 'img/logo.svg'
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation'
        },
        {
          href: 'https://github.com/antoinequarroz/pfpheds',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/'
            },
            {
              label: 'Prise en main',
              to: '/getting-started'
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} HEdS.`
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' }
    }
  })
};

module.exports = config;

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
      defaultMode: 'dark',
      respectPrefersColorScheme: true
    },
    navbar: {
      hideOnScroll: true,
      title: 'HEdS Docs',
      logo: {
        alt: 'HEdS',
        src: 'img/hespicto.png'
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Guide'
        },
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Components'
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
      links: [],
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

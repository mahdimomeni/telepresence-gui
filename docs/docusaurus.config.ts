import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Telepresence GUI',
  tagline: 'A modern, cross-platform graphical user interface for Telepresence and Kubernetes development.',
  favicon: 'img/logo.png',

  // Set the production url of your site here
  url: 'https://mahdimomeni.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/telepresence-gui/',

  // GitHub pages deployment config.
  organizationName: 'mahdimomeni',
  projectName: 'telepresence-gui',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl:
            'https://github.com/mahdimomeni/telepresence-gui/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    navbar: {
      title: 'Telepresence GUI',
      logo: {
        alt: 'Telepresence GUI Logo',
        src: 'img/logo.png',
        href: '/telepresence-gui/docs/intro',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/user-guide/cluster-connection',
          label: 'User Guide',
          position: 'left',
        },
        {
          to: '/docs/developer-guide/development-setup',
          label: 'Developer Guide',
          position: 'left',
        },
        {
          to: '/docs/reference/cli-mapping',
          label: 'Reference',
          position: 'left',
        },
        {
          href: 'pathname:///telepresence-gui/',
          label: 'Landing Page',
          position: 'right',
        },
        {
          href: 'pathname:///telepresence-gui/download.html',
          label: 'Downloads',
          position: 'right',
        },
        {
          href: 'https://github.com/mahdimomeni/telepresence-gui',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Quick Start',
              to: '/docs/getting-started/quick-start',
            },
            {
              label: 'Installation Matrix',
              to: '/docs/installation/overview',
            },
            {
              label: 'User Guide',
              to: '/docs/user-guide/cluster-connection',
            },
          ],
        },
        {
          title: 'Developers & Community',
          items: [
            {
              label: 'Architecture Overview',
              to: '/docs/getting-started/architecture',
            },
            {
              label: 'Developer Setup',
              to: '/docs/developer-guide/development-setup',
            },
            {
              label: 'Contributing Guide',
              to: '/docs/contributing/guidelines',
            },
            {
              label: 'GitHub Repository',
              href: 'https://github.com/mahdimomeni/telepresence-gui',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Telepresence Official Docs',
              href: 'https://www.telepresence.io/',
            },
            {
              label: 'Ambassador Labs',
              href: 'https://www.getambassador.io/',
            },
            {
              label: 'GitHub Releases',
              href: 'https://github.com/mahdimomeni/telepresence-gui/releases',
            },
            {
              label: 'Troubleshooting & FAQ',
              to: '/docs/troubleshooting/faq',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Mohammad Mahdi Momeni. Built with Docusaurus. Released under the MIT License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'go', 'typescript', 'powershell', 'docker'],
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

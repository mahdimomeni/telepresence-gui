import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: '📖 Introduction',
    },
    {
      type: 'category',
      label: '🌟 Getting Started',
      collapsed: false,
      items: [
        'getting-started/quick-start',
        'getting-started/architecture',
        'getting-started/prerequisites',
      ],
    },
    {
      type: 'category',
      label: '📥 Installation & Setup',
      collapsed: false,
      items: [
        'installation/overview',
        'installation/windows',
        'installation/macos',
        'installation/linux',
        'installation/auto-updates',
        'installation/verification',
      ],
    },
    {
      type: 'category',
      label: '🚀 User Guide',
      collapsed: false,
      items: [
        'user-guide/cluster-connection',
        'user-guide/network-routing',
        'user-guide/authentication-rbac',
        'user-guide/workload-management',
        'user-guide/intercepts',
        'user-guide/system-tray',
      ],
    },
    {
      type: 'category',
      label: '🛠️ Developer Guide',
      collapsed: false,
      items: [
        'developer-guide/development-setup',
        'developer-guide/project-structure',
        'developer-guide/frontend-architecture',
        'developer-guide/backend-architecture',
        'developer-guide/build-packaging',
        'developer-guide/ci-cd-workflow',
      ],
    },
    {
      type: 'category',
      label: '📚 Reference',
      collapsed: true,
      items: [
        'reference/cli-mapping',
        'reference/config-schema',
        'reference/api-bindings',
        'reference/keyboard-shortcuts',
      ],
    },
    {
      type: 'category',
      label: '🔧 Troubleshooting & FAQ',
      collapsed: true,
      items: [
        'troubleshooting/connection-issues',
        'troubleshooting/network-dns',
        'troubleshooting/intercept-issues',
        'troubleshooting/linux-webkit',
        'troubleshooting/faq',
      ],
    },
    {
      type: 'category',
      label: '🤝 Contributing',
      collapsed: true,
      items: [
        'contributing/guidelines',
        'contributing/code-of-conduct',
        'contributing/security',
      ],
    },
  ],
};

export default sidebars;

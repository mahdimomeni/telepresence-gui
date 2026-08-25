---
id: project-structure
title: Project Structure & Codebase Map
sidebar_position: 2
---

# Project Structure & Codebase Map

This document provides a detailed breakdown of the file and folder layout across the Telepresence GUI repository.

---

## 📂 Repository Layout

```
telepresence-gui/
├── .github/
│   ├── actions/build-wails/      # Custom reusable GitHub Action for cross-platform builds
│   └── workflows/
│       ├── release.yml           # CI/CD multi-platform build & release pipeline
│       └── deploy-docs.yml       # Docusaurus documentation build & GitHub Pages deploy
├── build/                        # Packaging assets, icons, and platform-specific manifests
│   ├── appIcon.png               # High-res base application icon (1024x1024)
│   ├── darwin/                   # macOS Info.plist, entitlements, and tray icon
│   ├── linux/                    # Linux .desktop launcher and tray icon
│   └── windows/                  # Windows .ico, app.manifest, and NSIS installer scripts
├── docs/                         # Docusaurus documentation portal & landing page
│   ├── docs/                     # Markdown / MDX documentation source files
│   ├── src/                      # Theme customizations & styling
│   ├── static/                   # Static assets, images, and logo
│   ├── index.html                # Standalone landing page for GitHub Pages
│   ├── docusaurus.config.ts      # Docusaurus site configuration
│   └── package.json              # Docusaurus scripts & dependencies
├── frontend/                     # React 19 Frontend application
│   ├── src/
│   │   ├── assets/               # SVG vector icons & static UI graphics
│   │   ├── components/           # UI components, forms, and dialogs
│   │   │   ├── connect-form/     # Multi-tab cluster connection configuration form
│   │   │   │   ├── index.tsx     # Form coordinator & submit handler
│   │   │   │   ├── types.ts      # Form schema definitions
│   │   │   │   └── tabs/         # Core, Network, ClusterAuth, and Advanced tab views
│   │   │   ├── ui/               # shadcn/ui primitives (Button, Card, Input, Dialog, etc.)
│   │   │   ├── browse-input.tsx  # File picker input with native dialog bridge
│   │   │   ├── intercept-dialog.tsx # Intercept modal (local port, Docker, headers, env)
│   │   │   ├── log-panel.tsx     # Live daemon streaming output drawer
│   │   │   ├── mode-toggle.tsx   # Dark/light theme switch
│   │   │   ├── text-context-menu.tsx # Native right-click menu (Copy, Paste, Select All)
│   │   │   ├── theme-provider.tsx # Dark/Light theme context provider
│   │   │   └── update-toast.tsx  # Auto-update notification banner & progress bar
│   │   ├── pages/
│   │   │   ├── connect-page.tsx  # Main cluster connection screen
│   │   │   └── list/             # Workload Browser (TanStack Table, columns, pagination)
│   │   ├── services/             # Frontend wrappers for Wails Go bindings
│   │   ├── stores/               # Zustand global state (connection status, loading states)
│   │   ├── App.tsx               # Main application shell, router, and event listeners
│   │   ├── main.tsx              # React DOM entrypoint
│   │   └── style.css             # Tailwind CSS v4 design tokens and custom utility classes
│   ├── package.json              # Frontend npm dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   └── vite.config.ts            # Vite configuration with Tailwind CSS & SVGR plugins
├── internal/                     # Go Backend Services & Architecture
│   ├── app/                      # Application presentation and lifecycle layer
│   │   ├── app.go                # Wails bound methods, notifications, and IPC
│   │   ├── watcher.go            # Background polling goroutine (status & workloads)
│   │   ├── tray_windows.go       # Windows system tray implementation
│   │   ├── tray_darwin.go        # macOS system tray implementation
│   │   └── tray_linux.go         # Linux Ayatana/AppIndicator tray implementation
│   ├── cli/                      # Command-line execution layer
│   │   └── runner.go             # Subprocess runner with timeout contexts & error handling
│   ├── models/                   # Data structures & JSON serializations
│   │   ├── config.go             # ConnectConfig, InterceptConfig, DetachConfig
│   │   ├── kube.go               # KubeInfo, Contexts, Namespaces
│   │   └── workload.go           # Workload, InterceptInfo, TelepresenceStatusOutput
│   └── services/                 # Core domain services
│       ├── config.go             # JSON connection profile save/load service
│       ├── kube.go               # Kubeconfig parser & kubectl runner
│       ├── telepresence.go       # Telepresence CLI command generator & JSON parser
│       ├── update.go             # Self-update engine (go-selfupdate + GitHub Releases)
│       ├── abi_webkit41.go       # Linux WebKit 4.1 build tag provider
│       ├── abi_webkit40.go       # Linux WebKit 4.0 build tag provider
│       └── abi_other.go          # Non-Linux ABI provider
├── CHANGELOG.md                  # Release version history
├── go.mod / go.sum               # Go module dependencies
├── main.go                       # Application entrypoint & Wails window options
├── nfpm.yaml                     # Linux NFPM package configuration (.deb, .rpm, .apk)
├── README.md                     # Project README
└── wails.json                    # Wails build configuration & metadata
```

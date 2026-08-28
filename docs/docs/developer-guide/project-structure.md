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
│       ├── ci.yml                # Continuous Integration (lint, unit tests, integration, e2e)
│       ├── release.yml           # CI/CD multi-platform build & release pipeline
│       └── deploy-docs.yml       # Docusaurus documentation build & GitHub Pages deploy
├── build/                        # Packaging assets, icons, and platform-specific manifests
│   ├── appIcon.png               # High-res base application icon (1024x1024)
│   ├── darwin/                   # macOS Info.plist, entitlements, and tray icon
│   ├── linux/                    # Linux .desktop launcher, icons, and package scripts
│   └── windows/                  # Windows .ico, app.manifest, and NSIS installer scripts
├── docs/                         # Docusaurus documentation portal & landing page
│   ├── docs/                     # Markdown / MDX documentation source files
│   ├── src/                      # Theme customizations & styling
│   ├── static/                   # Static assets, index.html, download.html, images
│   ├── docusaurus.config.ts      # Docusaurus site configuration
│   └── package.json              # Docusaurus scripts & dependencies
├── frontend/                     # React 19 Frontend application
│   ├── e2e/                      # Playwright End-to-End browser test suite
│   ├── src/
│   │   ├── assets/               # SVG vector icons & static UI graphics
│   │   ├── components/           # UI components, forms, and dialogs
│   │   │   ├── connect-form/     # Multi-tab cluster connection configuration form
│   │   │   ├── settings-dialog/  # Application Settings modal with 5 configuration tabs
│   │   │   ├── ui/               # shadcn/ui primitives (Button, Card, Input, Dialog, etc.)
│   │   │   ├── browse-input.tsx  # File picker input with native dialog bridge
│   │   │   ├── context-input.tsx # Context selection component
│   │   │   ├── custom-title-bar.tsx # Frameless window title bar with controls & status
│   │   │   ├── intercept-dialog.tsx # Intercept modal (local port, Docker, headers, env)
│   │   │   ├── log-panel.tsx     # Live daemon streaming output drawer
│   │   │   ├── missing-tools-view.tsx # Dependency checker screen for missing tools
│   │   │   ├── mode-toggle.tsx   # Dark/light theme switch
│   │   │   ├── replace-dialog.tsx # Workload replacement modal
│   │   │   ├── splash-screen.tsx # Animated startup brand splash screen
│   │   │   ├── text-context-menu.tsx # Native right-click menu (Copy, Paste, Select All)
│   │   │   ├── theme-provider.tsx # Dark/Light theme context provider
│   │   │   ├── title-bar.tsx     # Custom title bar component
│   │   │   ├── update-toast.tsx  # Auto-update notification banner & progress bar
│   │   │   └── workload-details-dialog.tsx # Deep inspection dialog for cluster workloads
│   │   ├── pages/
│   │   │   ├── connect-page.tsx  # Main cluster connection screen
│   │   │   └── list/             # Workload Browser (TanStack Table, columns, pagination)
│   │   ├── services/             # Frontend service layers and Wails RPC bindings
│   │   ├── stores/               # Zustand global state (connection, loading, settings, tools)
│   │   ├── test/                 # Test setups, integration tests, and Vitest fixtures
│   │   ├── App.tsx               # Main application shell, router, and event listeners
│   │   ├── main.tsx              # React DOM entrypoint
│   │   └── style.css             # Tailwind CSS v4 design tokens and utility classes
│   ├── package.json              # Frontend npm dependencies & test scripts
│   ├── tsconfig.json             # TypeScript configuration
│   └── vite.config.ts            # Vite configuration with Tailwind CSS & SVGR plugins
├── internal/                     # Go Backend Services & Architecture
│   ├── app/                      # Application presentation and lifecycle layer
│   │   ├── app.go                # Wails bound methods, notifications, and IPC
│   │   ├── app_integration_test.go # Integration test suite for App methods
│   │   ├── watcher.go            # Background polling goroutine & gRPC streamer
│   │   ├── tray_windows.go       # Windows system tray implementation
│   │   ├── tray_darwin.go        # macOS system tray implementation
│   │   └── tray_linux.go         # Linux Ayatana/AppIndicator tray implementation
│   ├── cli/                      # Command-line execution layer
│   │   ├── runner.go             # Subprocess runner with timeout contexts & error handling
│   │   ├── sys_proc_attr_windows.go # Process creation flags for Windows
│   │   └── sys_proc_attr_other.go   # Process creation flags for POSIX systems
│   ├── e2e/                      # Go Backend End-to-End Lifecycle & Resilience tests
│   │   ├── e2e_full_lifecycle_test.go # Full connect -> intercept -> replace -> detach test
│   │   └── e2e_resilience_test.go     # Error recovery, timeouts, and disconnect tests
│   ├── models/                   # Data structures & JSON serializations
│   │   ├── config.go             # ConnectConfig, InterceptConfig, AppSettings, ReplaceConfig
│   │   ├── kube.go               # KubeInfo, Contexts, Namespaces
│   │   ├── tools.go              # SystemToolsReport, ToolCheckResult
│   │   └── workload.go           # Workload, InterceptInfo, TelepresenceStatusOutput
│   └── services/                 # Core domain services
│       ├── config.go             # Thread-safe JSON config & settings persistence
│       ├── grpc_client.go        # Telepresence gRPC streaming client
│       ├── kube.go               # In-memory Kubeconfig parser & kubectl runner
│       ├── log_tailer.go         # Streaming daemon stdout/stderr log tailer
│       ├── telepresence.go       # Telepresence CLI command generator & JSON parser
│       ├── tools.go              # System tool dependency detection (telepresence & kubectl)
│       ├── update.go             # Self-update engine (go-selfupdate + GitHub Releases)
│       ├── abi_webkit41.go       # Linux WebKit 4.1 build tag provider
│       ├── abi_webkit40.go       # Linux WebKit 4.0 build tag provider
│       └── abi_other.go          # Non-Linux ABI provider
├── CHANGELOG.md                  # Release version history
├── CODE_OF_CONDUCT.md            # Contributor Covenant Code of Conduct
├── CONTRIBUTING.md               # Contribution guidelines and workflow
├── go.mod / go.sum               # Go module dependencies
├── main.go                       # Application entrypoint & Wails window options
├── nfpm.yaml                     # Linux NFPM package configuration (.deb, .rpm, .apk)
├── README.md                     # Project README
├── SECURITY.md                   # Security policy & vulnerability reporting
└── wails.json                    # Wails build configuration & metadata
```

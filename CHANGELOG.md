# Release History

## Release v1.2.0

### 🚀 Major Features & Highlights

- **Application Settings System**: Added a comprehensive application settings modal (`Ctrl+,` / Settings gear) featuring multi-tab configuration:
  - *General & Appearance*: Dark/Light/System theme selector, ambient aurora glow effects toggle, animated splash screen toggle, close-to-tray, start-minimized, and granular desktop notification preferences (`f1b50c7`).
  - *Telepresence Defaults*: Configurable default namespaces, custom Kubeconfig path, default context, manager namespace, request timeouts, and background poll interval (`f1b50c7`).
  - *Log Console Preferences*: Ring buffer size capping (`maxLogLines`), auto-scroll toggle, line wrapping, and default log level filtering (`f1b50c7`).
  - *System Tools Status*: Live inspection of required CLI tools (`telepresence` and `kubectl`) with installed paths, detected versions, and direct documentation links (`f1b50c7`).
  - *About & Updates*: In-app update checks, build version details, and quick documentation shortcuts (`f1b50c7`).
- **System Tool Dependency Check & Missing Tools View**: Automated pre-flight validation on startup for `telepresence` (v2.x) and `kubectl`. If any required tool is missing, a dedicated fallback screen displays platform-specific installation instructions (`8ba3649`).
- **Custom Frameless Title Bar**: Modern frameless window design with native window dragging regions, minimize/maximize/restore/close controls, live connection status pill, and quick access to settings (`28df54e`).
- **Animated Splash Screen**: Sleek startup splash screen with pulsating brand icon, version indicator, and smooth reveal animations (`2e45a60`).
- **Workload Replacement (`ReplaceWorkload`)**: Added support for replacing existing workloads with local processes or Docker containers alongside standard traffic intercepts (`265f43d`).
- **Docker Container Intercept Mode**: Added support for running intercepted workloads inside local Docker containers with custom Docker run arguments, mounts, and build options (`265f43d`, `0a7c05a`).
- **gRPC Streaming Client**: Integrated Telepresence gRPC client for real-time daemon state and workload synchronization (`25cdb18`).
- **Log Tailing Service**: Integrated streaming log tailer capturing stdout/stderr daemon output directly into the frontend log console with level filtering and search (`c31de30`).
- **Linux Multi-Distro Packaging**: Added automatic WebKit ABI detection (WebKit 4.1 vs. WebKit 4.0) with native packages (`.deb`, `.rpm`, `.apk`, `.tar.gz`), desktop launcher, and high-res application icons (`7cb42a5`, `74fd21a`, `080cebf`, `ec6cee0`).
- **Official Documentation Portal**: Launched full Docusaurus-powered documentation site and standalone GitHub Pages landing & downloads portals (`c7be42b`, `8ff214c`).

### ⚡ Architecture & Performance Improvements

- **Thread-Safe State Management**: Re-architected backend state management with `sync.RWMutex` read/write locking across configuration, update, and watcher services (`8daff0c`).
- **In-Memory Kubeconfig Parser**: Ultra-fast in-memory YAML parser for `~/.kube/config` with resilient `kubectl` CLI fallback for sub-millisecond context and namespace extraction (`1dcd0c7`).
- **Optimized Frontend Rendering**: Implemented `React.memo`, stabilized callbacks (`useCallback`, `useMemo`), and code-split Rollup chunking to maintain 60 FPS rendering under heavy cluster load (`1dcd0c7`, `9ade941`).

### 🐛 Bug Fixes

- **Windows Tray Menu**: Resolved runtime interruption when opening context menu from Windows system tray (`951ba80`).
- **Intercept Configuration**: Fixed field binding synchronization and removed redundant dialog triggers in the intercept dialog component (`0a7c05a`).
- **Linux WebKit Auto-Updater**: Fixed auto-update asset selection matching different Linux WebKit runtime libraries (`ec6cee0`).
- **TypeScript & Linting**: Resolved all static analysis warnings, any-types, and linting errors across frontend and backend (`f92bf37`, `068d582`).

### 🧪 Testing Suite & Quality Assurance

- **Frontend Unit & Integration Tests**: Added comprehensive Vitest + Testing Library test suites covering stores, services, and dialog components (95 passing tests) (`75a61e5`).
- **Frontend E2E Tests**: Added Playwright end-to-end browser test automation (`e0afc3e`).
- **Backend Unit & Integration Tests**: Added Go unit and integration tests across services, models, and CLI runners (`75a61e5`, `41802bb`).
- **Backend E2E Lifecycle & Resilience Tests**: Added full lifecycle connect/disconnect and error resilience test suites (`e0afc3e`).
- **Static Analysis & Linting Pipeline**: Added `knip` (dead code detection), `typescript` strict checks, `eslint`, `prettier`, and `golangci-lint` to CI validation (`e3a83fb`, `7204a92`, `1bb95c6`).

---

# Release v1.1.0

## What's New

### 🚀 Features

* **Auto Update:** Added built-in auto-update functionality (`0f2a0b6`).
* **GUI Improvements:** Enhanced scrollbar aesthetics across the interface (`eae4bfd`).

### 🐛 Bug Fixes

* **Workload Lists:** Added scrolling and pagination for large workload lists to prevent off-screen rendering (#3, fixes #1) (`779ea9f`).
* **Theme Switching:** Automatically sync dark/light mode with OS-level theme changes (`939bc1c`).
* **Theme Selection:** Disabled the active/selected theme mode toggle (`cbadbaace`).
* **Intercept Dialog:** Prevented dialog re-renders during background watch operations (`447f8ac`).
* **UI Cleanups:**
* Updated email action button title (`cd11b08`).
* Removed obsolete `App.css` import (`738ce4f`).

### ⚙️ CI / Build Improvements

* Added release artifact compression (`08b50a8`).
* Added zip archive support for Windows build pipelines (`2dd2164`, `77a1056`).
* Cleaned up redundant installer configs (`a8515fa`).
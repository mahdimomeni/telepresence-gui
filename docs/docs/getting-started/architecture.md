---
id: architecture
title: Architecture & Core Concepts
sidebar_position: 2
---

# Architecture & Core Concepts

Telepresence GUI is engineered using **Wails v2**, combining a high-performance **Go** backend with a responsive **React 19** frontend. It acts as an orchestration layer on top of the native **Telepresence CLI** and **Kubectl** binaries, providing desktop integration, process lifecycle management, and real-time state synchronization.

---

## 🏗️ High-Level System Architecture

```mermaid
graph TD
    subgraph HostFrontend ["Frontend Layer (React 19 + TypeScript + Vite)"]
        UI["UI Layer (shadcn/ui + Tailwind CSS v4)"]
        Store["State Management (Zustand)"]
        TableEngine["Data Table (TanStack Table v9)"]
        WailsBindings["Wails JavaScript Runtime Bindings"]
    end

    subgraph HostBackend ["Backend Layer (Go 1.25 + Wails v2)"]
        App["App Controller & Lifecycle Manager"]
        Tray["System Tray Manager (systray)"]
        Watcher["Background Watcher & Poller Goroutine"]
        TeleSvc["TelepresenceService"]
        KubeSvc["KubeService"]
        ConfigSvc["ConfigService (JSON Profiles)"]
        UpdateSvc["UpdateService (go-selfupdate + ABI)"]
        Runner["Subprocess Command Runner"]
    end

    subgraph SystemTools ["Local System & Environment"]
        TeleCLI["Telepresence CLI (v2.x)"]
        KubeCLI["Kubectl CLI"]
        UserKubeconfig["~/.kube/config"]
    end

    subgraph Cluster ["Remote Kubernetes Cluster"]
        TM["Telepresence Traffic Manager"]
        WorkloadAgent["Traffic Agent (Sidecar / Injected)"]
        ClusterPods["Kubernetes Workloads & Services"]
    end

    UI --> Store
    Store --> TableEngine
    UI --> WailsBindings
    WailsBindings <==> App
    App --> TeleSvc
    App --> KubeSvc
    App --> ConfigSvc
    App --> UpdateSvc
    App --> Tray
    App --> Watcher
    TeleSvc --> Runner
    KubeSvc --> Runner
    Runner --> TeleCLI
    Runner --> KubeCLI
    KubeCLI --> UserKubeconfig
    TeleCLI <==> TM
    TM <==> WorkloadAgent
    WorkloadAgent <==> ClusterPods
```

---

## 🧩 Architectural Components

### 1. Presentation Layer (Frontend)
- **React 19 & TypeScript**: High-performance UI rendering with modern hooks and strict typing.
- **Tailwind CSS v4 & shadcn/ui**: Modern design system supporting dark/light modes, accessible modal dialogs, context menus, and custom scrollbars.
- **TanStack Table v9**: Virtualized, column-sortable, searchable, and paginated table engine capable of rendering hundreds of workloads smoothly.
- **Zustand State Stores**: Lightweight state container managing global connection states, notification queues, and active intercept metadata.
- **Wails JS Bindings**: Automatically generated TypeScript declarations bridging Go struct definitions and methods directly to browser JavaScript.

### 2. Application Layer (Go Backend)
- **App Controller (`internal/app/app.go`)**: Manages the application lifecycle, centralized connection state transitions (`updateConnectionStatus`), IPC communication with the frontend, desktop notifications, file dialogs, and single-instance locks.
- **Background Watcher (`internal/app/watcher.go`)**: A dedicated background goroutine that polls `telepresence status` and `telepresence list` every 3 seconds, detecting daemon crashes or out-of-band CLI changes and emitting event updates (`telepresence-status-changed`, `workloads-changed`, `connection-changed`) to the frontend.
- **System Tray (`internal/app/tray_*.go`)**: OS-native system tray integration (Windows, macOS, Linux) enabling dynamic status labels (`Connect`/`Disconnect`), quick status checks, and 1-click connect/disconnect actions when the main window is minimized or closed.
- **Subprocess Runner (`internal/cli/runner.go`)**: Cross-platform execution engine with timeout contexts, JSON output parsing, and error sanitization.

### 3. Core Services (`internal/services/`)
- **`TelepresenceService`**: Manages daemon lifecycle (`telepresence connect`, `quit -s`), workload queries (`telepresence list --format json`), intercept creation (`telepresence intercept`), and detach commands (`telepresence detach`). Supports raw JSON caching for efficient delta detection.
- **`KubeService`**: Features a high-speed in-memory YAML parser (`gopkg.in/yaml.v3`) to parse `~/.kube/config` and custom kubeconfig files in sub-millisecond time, with fallback to `kubectl config get-contexts` / `kubectl get namespaces`.
- **`ConfigService`**: Thread-safe configuration persistence (`sync.RWMutex`) storing user profiles in the OS config directory (`%APPDATA%/telepresence-gui/config.json` on Windows, `~/.config/telepresence-gui/config.json` on Linux/macOS).
- **`UpdateService`**: Thread-safe self-update engine (`sync.Mutex` with atomic state guard) checking GitHub Releases, matching Linux WebKit ABI tags (`webkit41` vs `webkit40`), downloading assets, applying in-place patches, and restarting the process.

---

## 🔄 Data & Communication Flow

### 1. Connection Initialization Flow
```mermaid
sequenceDiagram
    participant User as User / UI
    participant App as App (Go)
    participant Config as ConfigService
    participant TeleSvc as TelepresenceService
    participant CLI as Telepresence CLI

    User->>App: StartTelepresence(ConnectConfig)
    App->>Config: SaveConnectConfig(config)
    App->>TeleSvc: Start(ctx, config)
    TeleSvc->>CLI: telepresence connect [flags...] --format json
    CLI-->>TeleSvc: JSON status response
    TeleSvc-->>App: Success / Error
    App->>User: Emit "connection-changed" (connected: true)
```

### 2. Workload Polling & Intercept Flow
```mermaid
sequenceDiagram
    participant Watcher as Background Watcher
    participant TeleSvc as TelepresenceService
    participant CLI as Telepresence CLI
    participant UI as Frontend State Store

    loop Every 3 Seconds
        Watcher->>TeleSvc: StatusNoLock(ctx)
        TeleSvc->>CLI: telepresence status --format json
        CLI-->>TeleSvc: Status JSON
        Watcher->>TeleSvc: ListWorkloadsRawNoLock(ctx)
        TeleSvc->>CLI: telepresence list --format json
        CLI-->>TeleSvc: Workloads JSON
        Watcher->>UI: Emit "telepresence-status-changed" & "workloads-changed"
    end
```

---

## 🔒 Security & Single Instance Architecture

- **Single Instance Lock**: Telepresence GUI registers a unique system GUID (`ca6a3d2a-9307-43ee-9fc3-dff845cb175a`). Attempting to launch a second instance automatically focuses the existing window and passes CLI arguments without spawning duplicate daemons.
- **Subprocess Isolation**: Telepresence CLI commands are executed via dedicated `os/exec` contexts with timeouts (60 seconds default) preventing zombie processes and deadlocks.
- **Privilege Separation**: Elevated network operations (DNS modification, TUN/TAP driver routing) are handled by the Telepresence root daemon, while GUI operations run completely in user space without requiring root privileges for the application itself.

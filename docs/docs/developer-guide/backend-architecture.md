---
id: backend-architecture
title: Backend Architecture & Services
sidebar_position: 4
---

# Backend Architecture & Services

The backend layer of Telepresence GUI is written in **Go 1.25** and structured around clean architecture principles with decoupled services, thread-safe synchronization, and cross-platform OS integrations.

---

## 🏛️ Service Layer Overview

```
internal/
├── app/                  # Application Controller, Lifecycle & System Tray
│   ├── app.go            # Central coordinator & Wails-exposed RPC methods
│   ├── watcher.go        # Background polling goroutine (status & list)
│   ├── tray_windows.go   # Windows Systray integration
│   ├── tray_darwin.go    # macOS Systray integration
│   └── tray_linux.go     # Linux Systray integration
├── cli/
│   └── runner.go         # Subprocess execution engine with context timeouts
├── models/               # Strongly-typed Go structs & JSON definitions
└── services/             # Domain business logic
    ├── telepresence.go   # Telepresence CLI command generator & JSON decoder
    ├── kube.go           # Kubectl & Kubeconfig parser
    ├── config.go         # Local user profile persistence
    └── update.go         # Self-update engine with ABI detection
```

---

## ⚙️ Core Services Breakdown

### 1. `TelepresenceService` (`internal/services/telepresence.go`)
- **Mutex Synchronization**: Protects CLI subprocesses using `sync.Mutex` and `TryLock()`, preventing simultaneous execution collisions between user actions and background polling.
- **Command Generation**: Translates `models.ConnectConfig` and `models.InterceptConfig` into strict CLI flag arguments (`--namespace`, `--also-proxy`, `--as`, `--vnat`, etc.).
- **JSON Serialization**: Enforces `--format json` on all commands and deserializes stdout into typed Go structures (`models.Workload`, `models.TelepresenceStatusOutput`).

### 2. `KubeService` (`internal/services/kube.go`)
- Discovers available contexts from `~/.kube/config` or user-selected kubeconfig paths.
- Queries namespaces using `kubectl get namespaces --output=jsonpath={.items[*].metadata.name}`.

### 3. `ConfigService` (`internal/services/config.go`)
- Saves connection profiles to the standard OS configuration directory using `os.UserConfigDir()`:
  - Windows: `%APPDATA%\telepresence-gui\config.json`
  - macOS / Linux: `~/.config/telepresence-gui/config.json`
- Restores connection fields automatically on application startup.

### 4. `UpdateService` (`internal/services/update.go`)
- Powered by `github.com/creativeprojects/go-selfupdate`.
- Queries GitHub Releases for the `mahdimomeni/telepresence-gui` repository.
- Uses ABI detection (`getAbiTag()`) to match WebKit 4.1 (`webkit41`) vs WebKit 4.0 (`webkit40`) binaries on Linux.
- Downloads assets, validates checksums, replaces the binary on disk, and spawns the new executable upon restart.

---

## 🔄 Background Watcher (`internal/app/watcher.go`)

```go
func (a *App) startBackgroundWatcher() {
    ticker := time.NewTicker(3 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-a.ctx.Done():
            return
        case <-ticker.C:
            a.pollStatusAndWorkloads()
        }
    }
}
```

- **Non-Blocking Execution**: Calls `teleService.TryLock()` so user interactions take priority.
- **Delta Detection**: Compares raw JSON output with previous cached strings (`lastStatusRaw`, `lastListRaw`) and only triggers frontend events (`status:update`, `workloads:update`) when actual state changes occur.

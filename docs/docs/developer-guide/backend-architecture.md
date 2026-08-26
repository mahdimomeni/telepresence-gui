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
- **JSON Serialization & Raw Caching**: Enforces `--format json` on all commands and deserializes stdout into typed Go structures (`models.Workload`, `models.TelepresenceStatusOutput`). `ListWorkloadsRawNoLock()` returns both raw JSON strings and decoded models for high-efficiency delta comparison.

### 2. `KubeService` (`internal/services/kube.go`)
- **In-Memory YAML Parsing**: Parses `~/.kube/config` and user-selected kubeconfig paths directly in memory using `gopkg.in/yaml.v3`. This extracts `current-context`, configured contexts, and associated namespaces in sub-millisecond time without spawning external processes.
- **Resilient CLI Fallback**: If file reading or YAML unmarshaling fails (e.g., due to custom auth plugins or dynamic configs), it gracefully falls back to executing standard `kubectl config get-contexts`, `kubectl config current-context`, and `kubectl config view --minify` commands with context timeout protection.

### 3. `ConfigService` (`internal/services/config.go`)
- **Thread-Safe Concurrency**: Employs `sync.RWMutex` to guarantee safe concurrent reads (`LoadConnectConfig`) and exclusive writes (`SaveConnectConfig`) across multiple frontend requests and background routines.
- **Cross-Platform Storage**: Saves connection profiles to the standard OS configuration directory using `os.UserConfigDir()`:
  - Windows: `%APPDATA%\telepresence-gui\config.json`
  - macOS / Linux: `~/.config/telepresence-gui/config.json`
- Restores connection fields automatically on application startup.

### 4. `UpdateService` (`internal/services/update.go`)
- Powered by `github.com/creativeprojects/go-selfupdate`.
- **Atomic Update Guard**: Guarded by `sync.Mutex` and an `isUpdating` state flag, preventing concurrent update checks or duplicate download attempts. Mutex locks are released prior to long network operations (`DetectLatest`, `UpdateTo`) to ensure non-blocking responsiveness.
- **ABI & Architecture Matching**: Uses ABI detection (`getAbiTag()`) to match WebKit 4.1 (`webkit41`) vs WebKit 4.0 (`webkit40`) binaries on Linux.
- Downloads assets, validates checksums, replaces the binary on disk, and spawns the new executable upon restart.

---

## 🚦 Centralized Connection Status Management (`internal/app/app.go`)

Application connection lifecycle transitions are centralized in `App.updateConnectionStatus(connected bool)`:
- **Thread-Safe State**: Protects `isConnected` and resets the workload cache `lastListRaw` when disconnecting under `statusMu.Lock()`.
- **System Tray Coordination**: Calls `updateTrayMenu(connected)` to toggle the tray action item between `Connect` and `Disconnect`.
- **OS Notifications**: Dispatches system notifications upon connection and disconnection.
- **Wails Event Dispatching**: Emits `connection-changed` with a boolean payload to synchronize the frontend UI state.

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
            a.checkTelepresenceChanges()
        }
    }
}
```

- **Non-Blocking Execution**: Calls `teleService.TryLock()` so user interactions take priority over polling queries.
- **Delta Detection**: Compares raw JSON output with previous cached strings (`lastStatusRaw`, `lastListRaw`) and only triggers frontend events (`telepresence-status-changed`, `workloads-changed`) when actual state changes occur.
- **Centralized Status Updates**: When the daemon connection state changes out-of-band, the watcher automatically delegates to `a.updateConnectionStatus(connected)`.

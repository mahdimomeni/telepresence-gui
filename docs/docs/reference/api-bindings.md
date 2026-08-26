---
id: api-bindings
title: Go & Wails API Bindings Reference
sidebar_position: 3
---

# Go & Wails API Bindings Reference

Telepresence GUI exposes strongly-typed Go service methods to the React frontend through Wails v2 RPC bindings.

---

## 📡 Exposed Go Application Methods

All methods are defined on `*app.App` and available in `frontend/src/wailsjs/go/app/App.d.ts`.

### 1. `StartTelepresence(config: models.ConnectConfig): Promise<void>`
Initializes the Telepresence daemon with the given connection configuration.
- **Parameters**: `config` object matching `ConnectConfig`.
- **Emits**: `connection-changed` (boolean: `true`), `daemon-log` (on errors).

### 2. `StopTelepresence(): Promise<void>`
Stops active intercepts, terminates root/user daemons cleanly via `telepresence quit -s`, and restores system DNS.
- **Emits**: `connection-changed` (boolean: `false`), `daemon-log`.

### 3. `ListWorkloads(): Promise<models.Workload[]>`
Queries the active Kubernetes namespace and returns all discoverable workloads (Deployments, StatefulSets, Rollouts).

### 4. `InterceptWorkload(config: models.InterceptConfig): Promise<void>`
Creates a traffic intercept targeting a specific workload with local port, header routing, or Docker container arguments.

### 5. `DetachWorkload(config: models.DetachConfig): Promise<void>`
Releases an active traffic intercept on the specified workload and namespace.

### 6. `GetKubeInfo(kubeConfigPath: string): Promise<models.KubeInfo>`
Parses the specified or default kubeconfig file (using in-memory YAML parsing with CLI fallback) and returns all available contexts and namespaces.

### 7. `SaveConnectConfig(config: models.ConnectConfig): Promise<void>`
Persists connection parameters to `config.json` on disk with thread-safe `sync.RWMutex` write locking.

### 8. `LoadConnectConfig(): Promise<models.ConnectConfig>`
Reads and returns the saved configuration profile from disk with thread-safe read locking.

### 9. `CheckForUpdates(): Promise<services.UpdateInfo>`
Queries GitHub Releases for new updates matching the OS, architecture, and WebKit ABI.

### 10. `DownloadAndInstallUpdate(): Promise<void>`
Downloads the matching release binary and applies in-place binary patching.
- **Emits**: `update:progress` (`{ percentage: number, status: string, error?: string }`).

### 11. `RestartApp(): Promise<void>`
Spawns the updated binary and exits the current process.

### 12. `SelectFile(title: string): Promise<string>`
Opens a native OS file picker dialog and returns the selected absolute file path.

### 13. `Notify(title: string, body: string): Promise<void>`
Sends an OS-native desktop notification through the platform notification center.

---

## 🔔 Wails Runtime Event Emitters

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| `connection-changed` | `boolean` | Emitted when connection status transitions between Connected (`true`) and Disconnected (`false`). |
| `connection-pending` | `boolean` | Emitted when an asynchronous connect/disconnect operation starts (`true`) or completes (`false`). |
| `telepresence-status-changed` | `TelepresenceStatusOutput` | Emitted by the background watcher when daemon status or cluster connection metadata changes. |
| `workloads-changed` | `Workload[]` | Emitted by the background watcher when cluster workloads or intercept statuses change. |
| `daemon-log` | `string` | Emitted when stdout/stderr log output is captured from CLI daemons. |
| `update:available` | `UpdateInfo` | Emitted on startup when a newer release is detected on GitHub. |
| `update:progress` | `UpdateProgress` | Emitted during background update download and installation. |
| `launchArgs` | `string[]` | Emitted when a secondary application instance is launched with command-line arguments. |

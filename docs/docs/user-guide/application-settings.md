---
id: application-settings
title: Application Settings & Preferences
sidebar_position: 6
---

# Application Settings & Preferences

Telepresence GUI provides a centralized **Application Settings** dialog to customize appearance, background behaviors, connectivity defaults, logging policies, and CLI dependencies.

---

## ⚙️ Opening Application Settings

You can access the Application Settings dialog at any time via:
- **Shortcut**: Press <kbd>Ctrl</kbd> + <kbd>,</kbd> (or <kbd>Cmd</kbd> + <kbd>,</kbd> on macOS).
- **Custom Title Bar**: Click the **Settings Gear Icon (⚙️)** located in the top-right header area.

```
+------------------------------------------------------------------------------------+
|  ⚙️ Application Settings                                                        [X] |
+------------------------------------------------------------------------------------+
| [🎨 General]  [🌐 Connectivity]  [📋 Logs]  [🛠️ System Tools]  [ℹ️ About]          |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  Appearance & Themes                                                               |
|  Theme Mode:          (•) Dark        ( ) Light       ( ) System                   |
|  [X] Enable Ambient Aurora Glow Effects                                            |
|  [X] Show Animated Splash Screen on Startup                                        |
|                                                                                    |
|  Window & System Tray                                                              |
|  [X] Close Window to System Tray (Keep Running in Background)                      |
|  [ ] Start Minimized to System Tray                                                |
|                                                                                    |
|  Desktop Notifications                                                             |
|  [X] Enable Desktop Notifications                                                  |
|  [X] Notify on Cluster Connect & Disconnect                                        |
|  [X] Notify on Workload Intercept & Detach                                         |
|                                                                                    |
+------------------------------------------------------------------------------------+
| [🔄 Reset to Factory Defaults]                                [ Save Changes ]     |
+------------------------------------------------------------------------------------+
```

---

## 🎨 1. General & Appearance Tab

The **General Tab** controls UI aesthetics, window lifecycle, and operating system notification integration.

### Appearance Options
- **Theme Selection**: Choose between **Dark Mode**, **Light Mode**, or **System** (which tracks your operating system dark/light theme dynamically).
- **Ambient Aurora Glows**: Toggles subtle animated background radial gradient halos that give the application its signature look.
- **Show Splash Screen**: When enabled, displays a sleek branded loading animation with smooth reveal effects when the app launches.

### Window & Tray Behaviors
- **Close to System Tray**: When checked, clicking the window close button (`✕`) hides the window to the system tray rather than terminating active cluster daemons.
- **Start Minimized**: Launches the application directly to the system tray on startup (useful for auto-start setups).

### Desktop Notifications
- **Master Notification Switch**: Toggles OS desktop notifications on or off.
- **Notify on Connect / Disconnect**: Dispatches notification popups when cluster connectivity changes.
- **Notify on Intercept / Detach**: Dispatches alerts when an intercept or replacement is established or detached.

---

## 🌐 2. Telepresence & Connectivity Tab

The **Connectivity Tab** sets default values for the cluster connection form to speed up day-to-day reconnections.

| Setting | Default Value | Description |
| :--- | :--- | :--- |
| **Default Namespace** | `default` | Pre-populates the target namespace in the connection form. |
| **Default Kubeconfig** | *Empty (Auto)* | Specifies a custom kubeconfig file path instead of `~/.kube/config`. |
| **Default Context** | *Empty (Current)* | Overrides the active context selected on application startup. |
| **Traffic Manager Namespace** | *Empty (`ambassador`)* | Specifies the namespace where Telepresence Traffic Manager is deployed. |
| **Request Timeout** | `60s` | Network timeout for CLI operations before failing. |
| **Watcher Poll Interval** | `4s` | Background polling cadence for checking cluster workload updates. |
| **Docker Daemon Mode** | `false` | Instructs Telepresence to run daemons inside a Docker container. |
| **Disable Compression** | `false` | Disables stream compression for debugging raw HTTP streams. |
| **Insecure Skip TLS** | `false` | Bypasses TLS certificate verification for self-signed development clusters. |

---

## 📋 3. Logs Console Tab

The **Logs Tab** configures buffer limits and behavior for the built-in streaming daemon log viewer drawer (`log-panel.tsx`).

- **Max Buffer Lines (`maxLogLines`)**: Sets the maximum number of log lines kept in memory (default: `2000`). When exceeded, older entries are evicted in FIFO order to prevent browser memory leaks.
- **Auto-Scroll Logs (`autoScrollLogs`)**: Automatically scrolls the log viewer to the newest line upon receiving new stdout/stderr stream messages.
- **Wrap Log Lines (`wrapLogLines`)**: Toggles word-wrapping for long log lines and stack traces.
- **Default Log Level (`defaultLogLevel`)**: Pre-selects the active log filter level (`all`, `error`, `warn`, `info`, `commands`, `daemon`).

---

## 🛠️ 4. System Tools Dependency Tab

The **System Tools Tab** provides real-time verification of required command-line dependencies:

```
+------------------------------------------------------------------------------------+
|  Required Dependencies Status:                                                     |
|                                                                                    |
|  [✓] Telepresence CLI (v2.x)                                     Status: INSTALLED |
|      Detected Version: v2.19.0                                                     |
|      Binary Path: /usr/local/bin/telepresence                                      |
|                                                                                    |
|  [✓] Kubectl CLI                                                 Status: INSTALLED |
|      Detected Version: v1.31.0                                                     |
|      Binary Path: /usr/local/bin/kubectl                                           |
+------------------------------------------------------------------------------------+
```

- **Health Checks**: Checks whether `telepresence` and `kubectl` are executable and discoverable in `PATH`.
- **Direct Guidance**: If a tool is missing, shows clickable installation commands and official documentation links.

---

## ℹ️ 5. About & Updates Tab

The **About Tab** displays runtime build metadata, system architecture, and update controls:

- **Version & Build Info**: Current Telepresence GUI version, Go compiler version, React version, and Wails runtime version.
- **Manual Update Check**: Triggers an immediate query against GitHub Releases to check if a newer version is available.
- **Links**: Fast shortcuts to the official documentation, GitHub repository, and issue tracker.

---

## 💾 Storage & Reset

- **File Location**: All preferences are persisted to `settings.json` in the user application data directory:
  - Windows: `%APPDATA%\telepresence-gui\settings.json`
  - macOS: `~/Library/Application Support/telepresence-gui/settings.json`
  - Linux: `~/.config/telepresence-gui/settings.json`
- **Reset to Defaults**: Clicking **Reset to Factory Defaults** restores all preferences to their original factory values.

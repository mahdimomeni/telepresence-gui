---
id: system-tray
title: System Tray & Background Operations
sidebar_position: 6
---

# System Tray & Background Operations

Telepresence GUI is engineered to run quietly in the background without cluttering your desktop or taskbar. It integrates natively with the operating system tray across **Windows**, **macOS**, and **Linux**.

---

## 🖥️ System Tray Menu & Actions

```
+------------------------------------+
|  Telepresence GUI (Connected)      |
|------------------------------------|
|  [✓] Connected to: staging-cluster |
|  Namespace: dev                    |
|------------------------------------|
|  ⚡ Disconnect                      |
|  🗔 Show Dashboard                 |
|  🔄 Check for Updates              |
|------------------------------------|
|  ❌ Quit Telepresence GUI          |
+------------------------------------+
```

### 1. Minimizing to Tray
- Closing the window (clicking the `X` button) or minimizing it keeps the Telepresence daemon running seamlessly in the background.
- Active intercepts remain intact and traffic continues to route to your local debugger.

### 2. Restoring the Window
- Left-click or double-click the tray icon to instantly bring the Telepresence GUI window back into focus.

### 3. 1-Click Disconnect
- Select **Disconnect** from the tray menu to immediately stop all intercepts and terminate the daemon without opening the full UI.

---

## 🔄 Background Watcher & Polling Engine

The Go backend maintains an active watcher goroutine:

- **State Polling**: Every 3 seconds, the watcher calls `telepresence status` and `telepresence list` asynchronously.
- **Conflict Prevention**: Uses thread-safe mutex locking (`TryLock()`) to prevent polling queries from colliding with active user actions.
- **Automatic Event Dispatching**: When network status changes or an intercept is created out-of-band via terminal CLI, events (`status:update`, `workloads:update`) are pushed to the frontend store via Wails IPC.

---

## 🔔 Native Desktop Notifications

Telepresence GUI uses the OS notification center to keep you informed of critical events:
- **Connection Established**: Alerts you when the cluster proxy and DNS resolvers are active.
- **Connection Lost**: Notifies you immediately if the VPN tunnel drops or the cluster becomes unreachable.
- **Update Available**: Informs you when a new release is available on GitHub.

---

## 🔒 Single Instance Lock Architecture

If you attempt to launch a second instance of `telepresence-gui` (e.g. clicking the desktop icon while the app is minimized to the system tray):
1. The unique instance mutex (`ca6a3d2a-9307-43ee-9fc3-dff845cb175a`) prevents a second process from starting.
2. The running background instance intercepts the launch arguments.
3. The existing window unminimizes, comes to the foreground, and focuses automatically.

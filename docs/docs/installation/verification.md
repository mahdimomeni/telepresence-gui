---
id: verification
title: Post-Installation Verification
sidebar_position: 6
---

# Post-Installation Verification

After installing **Telepresence GUI**, run through this checklist to ensure all CLI binaries, network permissions, and Kubernetes cluster configurations are working correctly.

---

## 📋 Verification Checklist

### 1. Verify Telepresence CLI Discovery

Open your terminal or PowerShell and run:

```bash
telepresence version
```

**Expected Output:**
```
Client: v2.19.0 (api: v3)
Root Daemon: not running (or running)
User Daemon: not running (or running)
```

> [!TIP]
> If you see `command not found` or `'telepresence' is not recognized`:
> - Ensure the directory containing `telepresence` (or `telepresence.exe`) is added to your system `PATH`.
> - Completely restart Telepresence GUI and your terminal.

---

### 2. Verify Kubectl Context & Cluster Access

Ensure your active `kubeconfig` can reach your target Kubernetes cluster:

```bash
# Check current active context
kubectl config current-context

# Verify cluster connectivity
kubectl cluster-info

# Check node status
kubectl get nodes
```

---

### 3. Test Telepresence GUI Launch

1. Launch `Telepresence GUI`.
2. Inspect the **Connect Screen**:
   - The **Kubeconfig Context** dropdown should automatically be populated with the contexts defined in your `~/.kube/config`.
   - The active context and default namespace should be pre-selected.
3. Click **Connect**:
   - You should see the status indicator turn **Connected (Green)**.
   - The application should transition smoothly to the **Workload Browser**.

---

### 4. Verify System Tray Integration

- On **Windows**: Look for the orange Telepresence icon in the Windows Taskbar Notification Area (bottom right).
- On **macOS**: Check the Menu Bar (top right).
- On **Linux**: Look for the tray indicator in your desktop panel (e.g., GNOME Top Bar with AppIndicator extension, or KDE Plasma System Tray).

Right-click the tray icon to verify that the menu displays:
- Status (Connected / Disconnected)
- Toggle Connect / Disconnect
- Show Main Window
- Quit Application

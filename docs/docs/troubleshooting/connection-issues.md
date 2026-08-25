---
id: connection-issues
title: Connection & Daemon Troubleshooting
sidebar_position: 1
---

# Connection & Daemon Troubleshooting

This guide provides troubleshooting steps for issues encountered while establishing a connection or running the background Telepresence daemon.

---

## 🛑 Problem: "telepresence: command not found" or "executable file not found in $PATH"

### Cause:
The Telepresence CLI v2 binary is either not installed or located in a directory not included in your operating system's `PATH` environment variable.

### Solution:
1. Verify terminal access by running `telepresence version`.
2. If installed to `/usr/local/bin` (macOS/Linux) or `C:\Program Files\telepresence` (Windows), ensure that path is in your system `PATH`.
3. Fully restart Telepresence GUI after updating environment variables.

---

## 🛑 Problem: Root Daemon Permission Denied (macOS / Linux)

### Cause:
Telepresence requires root/administrator privileges to configure TUN/TAP network adapters and modify DNS routing tables.

### Solution:
- On **Linux**: Run `sudo telepresence connect` once in your terminal to initialize the root daemon credentials, or ensure your user has passwordless sudo for the `telepresence` binary.
- On **macOS**: Ensure you enter your system password when the OS authorization dialog appears.

---

## 🛑 Problem: "Traffic Manager is not installed in the cluster"

### Cause:
The cluster does not have the Telepresence Traffic Manager server-side components installed.

### Solution:
If you have cluster-admin privileges, install the traffic manager via CLI:
```bash
telepresence helm install
```
Or if installed in a custom namespace (such as `ambassador`), enter that namespace in the **Manager Namespace** field on the **Core** tab.

---

## 🛑 Problem: "Context or Namespace not found in dropdown"

### Cause:
`~/.kube/config` is missing, misconfigured, or contains invalid credentials.

### Solution:
1. Test your kubeconfig in terminal: `kubectl config get-contexts`.
2. In Telepresence GUI, click **Browse** in the **Cluster & Auth** tab to explicitly select your kubeconfig file.

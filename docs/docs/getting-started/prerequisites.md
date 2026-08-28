---
id: prerequisites
title: System Requirements & Prerequisites
sidebar_position: 3
---

# System Requirements & Prerequisites

Before installing and launching **Telepresence GUI**, ensure your workstation meets the following minimum requirements and has the required command-line dependencies installed.

---

## 💻 Operating System Requirements

| Operating System | Supported Architectures | Minimum Version | Notes |
| :--- | :--- | :--- | :--- |
| **Windows** | `x64 (amd64)`, `arm64` | Windows 10 / 11 / Server 2019+ | WebView2 runtime (preinstalled on Win 10/11) |
| **macOS** | `Apple Silicon (arm64)`, `Intel (x64)` | macOS 12 Monterey or later | Universal and architecture-specific binaries available |
| **Linux** | `x64 (amd64)`, `arm64` | Ubuntu 20.04+, Debian 11+, Fedora 38+, Arch | Requires GTK3 & WebKit2GTK runtime libraries |

---

## 🛠️ Automated System Dependency Verification

Telepresence GUI includes an automated **System Tool Dependency Checker**. Upon launching, the application automatically verifies whether required CLI binaries are installed, executable, and in your system `PATH`:

```
+--------------------------------------------------------------------+
| ⚠️ Required CLI Tools Missing                                       |
+--------------------------------------------------------------------+
| Telepresence GUI requires the Telepresence CLI and Kubectl to       |
| manage cluster connections and traffic routing.                    |
|                                                                    |
| [X] Telepresence CLI: NOT FOUND in PATH                             |
|     Run: scoop install telepresence                                |
|                                                                    |
| [✓] Kubectl CLI: INSTALLED (/usr/local/bin/kubectl v1.31.0)        |
+--------------------------------------------------------------------+
|                                                [ Check Again ]     |
+--------------------------------------------------------------------+
```

If any tool is missing, the application provides direct copy-to-clipboard commands for your operating system and automatically refreshes when installed.

---

## 📦 Required Dependencies

### 1. Telepresence CLI (v2.x)

Telepresence GUI orchestrates the official Telepresence CLI tool. You must have Telepresence CLI version `2.14.0` or higher installed and discoverable in your system `PATH`.

#### Installation Instructions:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="windows" label="Windows (PowerShell / Scoop)" default>

```powershell
# Using Scoop
scoop install telepresence

# Or download binary directly (PowerShell as Admin):
Invoke-WebRequest -Uri "https://app.getambassador.io/download/tel2/windows/amd64/latest/telepresence.exe" -OutFile "$env:SystemRoot\system32\telepresence.exe"
```

</TabItem>
<TabItem value="macos" label="macOS (Homebrew / Direct)">

```bash
# Using Homebrew
brew install datawire/blackbird/telepresence

# Verify installation
telepresence version
```

</TabItem>
<TabItem value="linux" label="Linux (Direct Download)">

```bash
# AMD64 (x86_64)
sudo curl -fL https://app.getambassador.io/download/tel2/linux/amd64/latest/telepresence -o /usr/local/bin/telepresence
sudo chmod a+x /usr/local/bin/telepresence

# ARM64 (aarch64)
sudo curl -fL https://app.getambassador.io/download/tel2/linux/arm64/latest/telepresence -o /usr/local/bin/telepresence
sudo chmod a+x /usr/local/bin/telepresence
```

</TabItem>
</Tabs>

#### Verification:
```bash
telepresence version
```

---

### 2. Kubectl & Kubeconfig

You must have `kubectl` installed and configured with a valid `~/.kube/config` file pointing to your target Kubernetes cluster.

#### Verification:
```bash
kubectl get nodes
kubectl config current-context
```

---

### 3. Docker *(Optional)*

Docker is **only required** if you intend to:
- Run the Telepresence user/root daemon inside a local container (`--docker` flag).
- Intercept or replace workloads directly into a local Docker container (`--docker-run` flag).

For standard local process intercepts (e.g., debugging a service on `localhost:8080`), Docker is **not required**.

---

### 4. Linux Runtime Dependencies

On Linux distributions, Wails applications rely on GTK3 and WebKit2GTK for rendering:

<Tabs>
<TabItem value="ubuntu-debian" label="Debian / Ubuntu / Pop!_OS" default>

```bash
# For WebKit 4.1 builds (Ubuntu 24.04+, Debian 12+):
sudo apt-get update && sudo apt-get install -y libgtk-3-0 libwebkit2gtk-4.1-0 libayatana-appindicator3-1

# For WebKit 4.0 builds (Ubuntu 20.04/22.04, Debian 11):
sudo apt-get update && sudo apt-get install -y libgtk-3-0 libwebkit2gtk-4.0-37 libappindicator3-1
```

</TabItem>
<TabItem value="fedora-rhel" label="Fedora / RHEL / CentOS">

```bash
# Fedora (WebKit 4.1):
sudo dnf install -y gtk3 webkit2gtk4.1 libappindicator-gtk3

# RHEL 9 (WebKit 4.0):
sudo dnf install -y gtk3 webkit2gtk3 libappindicator-gtk3
```

</TabItem>
<TabItem value="arch" label="Arch Linux / Manjaro">

```bash
sudo pacman -S --needed gtk3 webkit2gtk-4.1 libayatana-appindicator
```

</TabItem>
</Tabs>

---

## 🎯 Next Steps

Once your prerequisites are verified:
- Proceed to the **[Installation Overview](../installation/overview.md)** to download and install Telepresence GUI.
- Or check out the **[5-Minute Quickstart](./quick-start.md)**.

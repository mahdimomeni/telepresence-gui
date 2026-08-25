---
id: development-setup
title: Development Environment Setup
sidebar_position: 1
---

# Development Environment Setup

This guide provides everything you need to set up your local development workstation, compile Telepresence GUI from source, and run live development servers with hot module replacement (HMR).

---

## 🛠️ Required Toolchain

| Dependency | Minimum Version | Installation Link |
| :--- | :--- | :--- |
| **Go** | `1.25+` | [golang.org/dl](https://golang.org/dl/) |
| **Node.js & npm** | `Node 20.x+`, `npm 10.x+` | [nodejs.org](https://nodejs.org/) |
| **Wails CLI v2** | `v2.8.0+` | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| **Telepresence CLI** | `v2.14+` | [telepresence.io](https://www.telepresence.io/docs/latest/install/) |
| **Kubectl** | Latest | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |

---

## ⚙️ Platform-Specific Cgo Compilers

Wails requires Cgo to bridge Go with native windowing and webview libraries:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="windows" label="Windows" default>

- Install **MinGW-w64** or **MSYS2** to provide `gcc`:
  ```powershell
  # Using Scoop
  scoop install mingw

  # Or using Chocolatey
  choco install mingw
  ```
- Ensure `gcc --version` returns a valid GCC compiler in your PATH.

</TabItem>
<TabItem value="macos" label="macOS">

- Install Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```

</TabItem>
<TabItem value="linux" label="Linux (Debian / Ubuntu / Fedora)">

```bash
# Ubuntu / Debian:
sudo apt-get install -y build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev

# Fedora:
sudo dnf install -y gcc-c++ pkgconf-pkg-config gtk3-devel webkit2gtk4.1-devel libappindicator-gtk3-devel
```

</TabItem>
</Tabs>

---

## 🚀 Cloning & Initializing the Project

```bash
# 1. Clone the repository
git clone https://github.com/mahdimomeni/telepresence-gui.git
cd telepresence-gui

# 2. Install frontend dependencies
cd frontend
npm install
cd ..

# 3. Verify toolchain health
wails doctor
```

---

## ⚡ Running in Live Development Mode

Start the full application with live hot reloading:

```bash
wails dev
```

### What happens when you run `wails dev`?
1. Vite starts the React dev server with Hot Module Replacement (HMR).
2. Wails compiles the Go backend and generates TypeScript bindings in `frontend/src/wailsjs/`.
3. The desktop window opens automatically.
4. **Browser Preview**: You can also open `http://localhost:34115` in Chrome, Firefox, or Safari to inspect elements, debug console logs, or use React DevTools directly.

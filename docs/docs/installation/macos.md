---
id: macos
title: macOS Installation
sidebar_position: 3
---

# macOS Installation Guide

Telepresence GUI supports macOS 12 (Monterey), macOS 13 (Ventura), macOS 14 (Sonoma), and macOS 15 (Sequoia). Native builds are available for both **Apple Silicon** (M1/M2/M3/M4) and **Intel x86_64** architectures.

---

## 📥 Downloading the macOS App Bundle

1. Navigate to the [Releases Page](https://github.com/mahdimomeni/telepresence-gui/releases/latest).
2. Choose the download matching your Mac architecture:
   - **Apple Silicon (M1/M2/M3/M4)**: `telepresence-gui_Darwin_arm64.tar.gz`
   - **Intel x64**: `telepresence-gui_Darwin_x86_64.tar.gz`
   - **Universal (All Macs)**: `telepresence-gui_Darwin_all.tar.gz`

---

## 📦 Installation Steps

1. Extract the downloaded `.tar.gz` archive:
   ```bash
   tar -xzf telepresence-gui_Darwin_arm64.tar.gz
   ```
2. Move `Telepresence GUI.app` to your `/Applications` directory:
   ```bash
   mv "Telepresence GUI.app" /Applications/
   ```
3. Open `Telepresence GUI` from **Launchpad**, **Spotlight**, or `/Applications`.

---

## 🛡️ macOS Gatekeeper & Security Permissions

If macOS displays a warning that the app *"cannot be opened because the developer cannot be verified"*:

### Option 1: Right-Click Open
1. Open **Finder** and navigate to `/Applications`.
2. Right-click (or Control-click) `Telepresence GUI.app` and select **Open**.
3. In the security popup, click **Open**.

### Option 2: Remove Quarantine Attribute via Terminal
```bash
xattr -d com.apple.quarantine "/Applications/Telepresence GUI.app"
```

---

## 🔑 Administrative Privileges

Telepresence uses a root daemon (`tel2 daemon`) to configure `/etc/resolver/` and network routes on macOS. When initiating a cluster connection for the first time, macOS will prompt you to enter your system administrator password.

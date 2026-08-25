---
id: windows
title: Windows Installation
sidebar_position: 2
---

# Windows Installation Guide

Telepresence GUI supports Windows 10, Windows 11, and Windows Server 2019+ (64-bit x64 and ARM64).

---

## 📥 Installation Options

### Option 1: Setup Installer (`.exe`) *(Recommended)*

The official Windows setup installer guides you through installation, creates desktop shortcuts, adds start menu entries, and registers the app with Windows Settings.

1. Download the latest installer `telepresence-gui_Windows_amd64_installer.exe` from the [GitHub Releases](https://github.com/mahdimomeni/telepresence-gui/releases/latest).
2. Double-click the downloaded `.exe` file.
3. Follow the setup wizard prompts to select the destination directory (defaults to `C:\Program Files\Telepresence GUI`).
4. Once completed, check **Launch Telepresence GUI** and click **Finish**.

---

### Option 2: Portable ZIP Archive

If you do not have administrator permissions to run setup installers, or prefer a self-contained portable installation:

1. Download `telepresence-gui_Windows_x86_64.zip` (or `telepresence-gui_Windows_arm64.zip`).
2. Extract the ZIP archive to a folder of your choice (e.g., `C:\Tools\telepresence-gui`).
3. Run `telepresence-gui.exe`.

---

## 🛡️ Windows Defender & SmartScreen

Because Telepresence GUI is an open-source binary, Windows SmartScreen may present a blue warning screen on the first launch:

1. Click **More info**.
2. Click **Run anyway**.

---

## ⚙️ Elevated Privileges & Firewall

Telepresence CLI creates virtual network adapters and updates system routing tables to route cluster CIDRs.
When you click **Connect** for the first time:
- Windows User Account Control (UAC) may request permission for `telepresence.exe` or `wintun.sys`. Click **Yes** to grant permissions.
- Windows Defender Firewall may prompt to allow network access. Ensure both **Private** and **Public** networks are checked.

---

## 🔄 Updating on Windows

Telepresence GUI includes built-in auto-updates. When a new release is published, a toast notification will appear in the top-right corner. Click **Update & Restart** to automatically download and apply the patch.

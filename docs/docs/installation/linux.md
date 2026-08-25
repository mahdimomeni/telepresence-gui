---
id: linux
title: Linux Installation
sidebar_position: 4
---

# Linux Installation Guide

Telepresence GUI provides native packages for Debian, Ubuntu, Linux Mint, Pop!_OS, Fedora, Red Hat Enterprise Linux (RHEL), Rocky Linux, AlmaLinux, Arch Linux, Manjaro, and Alpine Linux.

---

## 🧩 WebKit2GTK ABI Variants Explained

Wails Linux applications require the GTK3 webview engine (`WebKit2GTK`). Because different Linux distributions ship different ABI versions of WebKit2GTK, Telepresence GUI publishes two tailored build variants:

| ABI Variant | Package Suffix | WebKit Library | Target Linux Distributions |
| :--- | :--- | :--- | :--- |
| **WebKit 4.1** *(Default / Modern)* | No suffix or `webkit41` | `libwebkit2gtk-4.1.so.0` | Ubuntu 24.04+, Debian 12 (Bookworm)+, Fedora 40+, Arch Linux, openSUSE Tumbleweed |
| **WebKit 4.0** *(Legacy / LTS)* | `webkit40` | `libwebkit2gtk-4.0.so.37` | Ubuntu 20.04 / 22.04 LTS, Debian 11 (Bullseye), RHEL 8 / 9, Rocky Linux 9 |

---

## 📥 Installation by Distribution

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="deb" label="Ubuntu / Debian / Pop!_OS (.deb)" default>

### 1. Modern Distributions (Ubuntu 24.04+, Debian 12+)
```bash
# Install WebKit 4.1 & Ayatana AppIndicator
sudo apt-get update
sudo apt-get install -y libgtk-3-0 libwebkit2gtk-4.1-0 libayatana-appindicator3-1

# Download and install DEB package
wget https://github.com/mahdimomeni/telepresence-gui/releases/latest/download/telepresence-gui_linux_amd64.deb
sudo dpkg -i telepresence-gui_linux_amd64.deb
sudo apt-get install -f
```

### 2. LTS Distributions (Ubuntu 20.04 / 22.04, Debian 11)
```bash
# Install WebKit 4.0 & AppIndicator
sudo apt-get update
sudo apt-get install -y libgtk-3-0 libwebkit2gtk-4.0-37 libappindicator3-1

# Download and install WebKit 4.0 DEB package
wget https://github.com/mahdimomeni/telepresence-gui/releases/latest/download/telepresence-gui_linux_amd64_webkit40.deb
sudo dpkg -i telepresence-gui_linux_amd64_webkit40.deb
sudo apt-get install -f
```

</TabItem>
<TabItem value="rpm" label="Fedora / RHEL / Rocky Linux (.rpm)">

### 1. Fedora 40+ (WebKit 4.1)
```bash
sudo dnf install -y gtk3 webkit2gtk4.1 libappindicator-gtk3
sudo dnf install -y https://github.com/mahdimomeni/telepresence-gui/releases/latest/download/telepresence-gui_linux_amd64.rpm
```

### 2. RHEL 8/9 / Rocky Linux 9 (WebKit 4.0)
```bash
sudo dnf install -y gtk3 webkit2gtk3 libappindicator-gtk3
sudo dnf install -y https://github.com/mahdimomeni/telepresence-gui/releases/latest/download/telepresence-gui_linux_amd64_webkit40.rpm
```

</TabItem>
<TabItem value="arch" label="Arch Linux / Manjaro">

```bash
sudo pacman -S --needed gtk3 webkit2gtk-4.1 libayatana-appindicator

# Download Tarball and extract
wget https://github.com/mahdimomeni/telepresence-gui/releases/latest/download/telepresence-gui_Linux_x86_64.tar.gz
tar -xzf telepresence-gui_Linux_x86_64.tar.gz
sudo mv telepresence-gui /usr/local/bin/
```

</TabItem>
<TabItem value="alpine" label="Alpine Linux (.apk)">

```bash
# Install dependencies
sudo apk add gtk+3.0 webkit2gtk-4.1 libayatana-appindicator

# Install APK
sudo apk add --allow-untrusted telepresence-gui_linux_amd64.apk
```

</TabItem>
</Tabs>

---

## 🖥️ System Tray Support on GNOME

If you are using GNOME Shell (Ubuntu default desktop), system tray icons require the **AppIndicator and KStatusNotifierItem Support** GNOME extension:

```bash
sudo apt-get install gnome-shell-extension-appindicator
```
Then log out and log back in, or enable it via the **Extensions** application.

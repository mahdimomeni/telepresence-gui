---
id: linux-webkit
title: Linux WebKit2GTK ABI Troubleshooting
sidebar_position: 4
---

# Linux WebKit2GTK ABI Troubleshooting

When running Wails-based desktop applications on Linux, you may encounter dynamic library loader errors related to `libwebkit2gtk`. This guide provides exact commands to resolve these issues across all major Linux distributions.

---

## 🛑 Error: `libwebkit2gtk-4.1.so.0: cannot open shared object file`

### Cause:
You downloaded the default **WebKit 4.1** binary, but your Linux distribution only provides **WebKit 4.0** (common on Ubuntu 20.04/22.04 LTS, Debian 11, RHEL 8/9).

### Solution:

#### Option A: Install the WebKit 4.0 Release Package *(Recommended)*
Download the `_webkit40` variant from the [GitHub Releases](https://github.com/mahdimomeni/telepresence-gui/releases/latest):
```bash
wget https://github.com/mahdimomeni/telepresence-gui/releases/latest/download/telepresence-gui_linux_amd64_webkit40.deb
sudo dpkg -i telepresence-gui_linux_amd64_webkit40.deb
```

#### Option B: Install Missing Libraries
```bash
# Ubuntu / Debian:
sudo apt-get install -y libwebkit2gtk-4.1-0

# Fedora:
sudo dnf install -y webkit2gtk4.1

# Arch Linux:
sudo pacman -S webkit2gtk-4.1
```

---

## 🛑 Error: `libwebkit2gtk-4.0.so.37: cannot open shared object file`

### Cause:
You downloaded the `_webkit40` binary on a modern Linux distribution (Ubuntu 24.04+, Debian 12+, Fedora 40+) where WebKit 4.0 has been deprecated in favor of WebKit 4.1.

### Solution:
Download the standard (WebKit 4.1) package instead:
```bash
# Ubuntu / Debian:
wget https://github.com/mahdimomeni/telepresence-gui/releases/latest/download/telepresence-gui_linux_amd64.deb
sudo dpkg -i telepresence-gui_linux_amd64.deb
```

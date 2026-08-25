---
id: build-packaging
title: Compiling & Distribution Packaging
sidebar_position: 5
---

# Compiling & Distribution Packaging

Telepresence GUI can be compiled into standalone executables or packaged into native operating system installers (`.exe`, `.tar.gz`, `.deb`, `.rpm`, `.apk`).

---

## 🔨 Compiling Standalone Binaries

Compile a production-ready binary for your current operating system:

```bash
wails build -clean
```

The compiled executable will be placed in `build/bin/`.

---

## 🪟 Windows Packaging

### 1. Standalone Executable / ZIP
```bash
wails build -platform windows/amd64
```

### 2. NSIS Setup Installer (`.exe`)
To generate a guided setup installer (`telepresence-gui_Windows_amd64_installer.exe`):

```bash
# Requires NSIS installed on your system (e.g. via 'scoop install nsis' or 'choco install nsis')
wails build -platform windows/amd64 -nsis
```

---

## 🍏 macOS Packaging

### 1. Architecture-Specific App Bundle
```bash
# Apple Silicon (M1/M2/M3/M4)
wails build -platform darwin/arm64

# Intel x86_64
wails build -platform darwin/amd64
```

### 2. Universal macOS Binary (All Macs)
```bash
wails build -platform darwin/universal
```

---

## 🐧 Linux Packaging & NFPM

Linux binaries are packaged into `.deb`, `.rpm`, and `.apk` formats using **NFPM** (`nfpm.yaml`).

### 1. Build Linux Binaries
```bash
# Standard WebKit 4.1 Build:
wails build -platform linux/amd64 -tags webkit41

# Legacy WebKit 4.0 Build (Ubuntu 20.04/22.04, Debian 11, RHEL):
wails build -platform linux/amd64 -tags webkit40
```

### 2. Package with NFPM
```bash
# Generate Debian package (.deb)
nfpm package --config nfpm.yaml --packager deb --target build/bin/

# Generate Red Hat package (.rpm)
nfpm package --config nfpm.yaml --packager rpm --target build/bin/

# Generate Alpine package (.apk)
nfpm package --config nfpm.yaml --packager apk --target build/bin/
```

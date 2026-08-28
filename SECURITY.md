# Security Policy

The Telepresence GUI team takes the security of developer workstations, local networking environments, and Kubernetes cluster proxies seriously.

---

## 🛡️ Supported Versions

We actively provide security updates and patches for the following versions:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| `v1.2.x` (Latest Release) | ✅ Yes | Actively maintained with security and compatibility patches. |
| `v1.1.x` | ✅ Yes | Maintained for critical vulnerability patches. |
| `v1.0.x` | ⚠️ Security Only | Critical security fixes only; upgrade to latest recommended. |
| `< v1.0` | ❌ No | Pre-release versions are deprecated. Please upgrade to latest. |

---

## 🔒 Reporting a Vulnerability

If you discover a security vulnerability or privilege escalation issue in Telepresence GUI, please **DO NOT open a public GitHub issue**.

Instead, report it responsibly through one of the following private channels:

1. **Email**: Send detailed vulnerability information to [mahdimomeni012@gmail.com](mailto:mahdimomeni012@gmail.com) with the subject line `[SECURITY] Telepresence GUI Vulnerability Report`.
2. **GitHub Security Advisory**: Open a confidential advisory report via the [GitHub Security Advisories](https://github.com/mahdimomeni/telepresence-gui/security/advisories/new) page.

---

## 📋 What to Include in Your Report

To help us investigate and triage the issue quickly, please include:

- A detailed description of the vulnerability and its potential impact.
- Step-by-step instructions to reproduce the issue (or a proof-of-concept script).
- Information about your environment:
  - Operating System and architecture (e.g. Ubuntu 24.04 x64, macOS Sonoma arm64, Windows 11).
  - Telepresence GUI version.
  - Telepresence CLI version (`telepresence version`).
  - Kubernetes cluster version (`kubectl version`).
- Any suggested fixes or remediations (if known).

---

## ⏳ Response & Disclosure Timeline

- **Initial Response**: Within **48 hours** of receiving the report.
- **Triage & Assessment**: Within **5 business days**, confirming severity and scope.
- **Remediation & Patch**: A fix will be developed, tested, and prepared for release.
- **Public Disclosure**: Coordinated public disclosure and release notes will follow the release of the patched version.

---

## 🔐 Security Architecture Overview

- **Privilege Separation**: Elevated network operations (DNS redirection, TUN/TAP virtual network devices) are executed exclusively by the Telepresence root daemon. The Telepresence GUI desktop application runs entirely in unprivileged user space.
- **Local IPC Isolation**: Wails v2 bindings communicate over an internal webview IPC bridge restricted to localhost.
- **Credential Storage**: Kubeconfig credentials and TLS certificates are never sent to external servers or logged in plain text.

---
id: faq
title: Frequently Asked Questions (FAQ)
sidebar_position: 5
---

# Frequently Asked Questions (FAQ)

Find quick answers to common questions about Telepresence GUI.

---

### Q: Is Telepresence GUI completely free and open-source?
**A:** Yes! Telepresence GUI is 100% open-source software licensed under the permissive **MIT License**. You can use it freely for personal and commercial development.

---

### Q: Does Telepresence GUI replace the official Telepresence CLI?
**A:** Telepresence GUI is an orchestration interface and visual control plane built *on top* of the official Telepresence CLI. It requires the CLI binary to be installed on your system.

---

### Q: Can multiple developers intercept the same service in the same cluster?
**A:** Yes! By using **Personal (Header-Based) Intercepts**, each developer configures a unique HTTP header (e.g. `x-dev-user: alice` vs `x-dev-user: bob`). Envoy routes matching requests to the respective developer's machine while all other traffic is untouched.

---

### Q: Does Telepresence GUI run inside Docker or WSL2?
**A:**
- On **Windows**: You can run Telepresence GUI natively on Windows or configure the **Docker Daemon** toggle to run daemons inside local containers.
- If using **WSL2**: Ensure your `kubeconfig` is shared with the Windows host or run the Linux binary inside your WSL2 X11/Wayland desktop environment.

---

### Q: Where are my connection profiles stored?
**A:**
- **Windows**: `%APPDATA%\telepresence-gui\config.json`
- **macOS**: `~/Library/Application Support/telepresence-gui/config.json` or `~/.config/telepresence-gui/config.json`
- **Linux**: `~/.config/telepresence-gui/config.json`

---

### Q: How do I report bugs or request new features?
**A:** Please open an issue on our [GitHub Issues Page](https://github.com/mahdimomeni/telepresence-gui/issues).

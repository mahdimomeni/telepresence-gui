# Contribution Guidelines

Thank you for your interest in contributing to **Telepresence GUI**! 🎉

Whether you are fixing a bug, adding new features, improving documentation, or testing edge-case Kubernetes configurations, your help is warmly welcomed.

---

## 🧭 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Contribution Workflow](#-contribution-workflow)
- [Commit Conventions](#-commit-conventions)
- [Code Style Guidelines](#-code-style-guidelines)
- [Pull Request Process](#-pull-request-process)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [mahdimomeni012@gmail.com](mailto:mahdimomeni012@gmail.com).

---

## 💡 How Can I Contribute?

### 1. Reporting Bugs
- Search existing [GitHub Issues](https://github.com/mahdimomeni/telepresence-gui/issues) before opening a new issue to avoid duplicates.
- Include a clear title and description, OS version, Telepresence CLI version, and steps to reproduce.
- Provide daemon log output or screenshots if applicable.

### 2. Suggesting Enhancements
- Open a feature request issue describing the problem you want solved and proposed solutions.
- Detail why this enhancement would be useful to other developers.

### 3. Submitting Pull Requests
- Keep PRs focused on a single change or feature.
- Follow the project's coding and commit standards.

---

## 💻 Development Setup

### Prerequisites
- [Go 1.25+](https://golang.org/dl/)
- [Node.js 20+](https://nodejs.org/) & `npm`
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- [Telepresence CLI](https://www.telepresence.io/docs/latest/install/) (v2.x) & [Kubectl](https://kubernetes.io/docs/tasks/tools/)

### Setup Steps
```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/telepresence-gui.git
cd telepresence-gui

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Start Wails live development mode (with hot reloading)
wails dev
```

---

## 🔄 Contribution Workflow

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. **Make Your Changes**:
   Ensure all changes are well-structured, performant, and commented where necessary.
3. **Validate Your Changes**:
   ```bash
   # Validate Go codebase
   go vet ./...
   go fmt ./...

   # Validate frontend build
   cd frontend && npm run build && cd ..
   ```
4. **Commit Your Changes**:
   Use [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(connect): add support for custom CA bundle"
   ```
5. **Push to Your Fork**:
   ```bash
   git push origin feat/my-new-feature
   ```
6. **Open a Pull Request**:
   Navigate to the [Telepresence GUI repository](https://github.com/mahdimomeni/telepresence-gui) and click **Compare & pull request**.

---

## 📝 Commit Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | Description | Example |
| :--- | :--- | :--- |
| `feat:` | A new feature or user-facing capability | `feat(tray): add shortcut toggle` |
| `fix:` | A bug fix | `fix(kube): handle missing current-context` |
| `refactor:` | Code restructuring without changing behavior | `refactor: centralize connection state` |
| `perf:` | Performance improvements | `perf: add in-memory YAML parser` |
| `docs:` | Documentation additions or updates | `docs: update API bindings reference` |
| `style:` | Code styling, formatting, or white-space | `style: fix indentation in main.go` |
| `test:` | Adding or updating tests | `test: add unit tests for config parser` |
| `chore:` | Build scripts, dependencies, CI/CD | `chore: bump wails version` |

---

## 🎨 Code Style Guidelines

- **Go Backend**:
  - Run `go fmt ./...` before committing.
  - Follow idiomatic Go guidelines and clean architecture.
  - Maintain thread safety with appropriate mutex locking when modifying shared state.
- **React Frontend**:
  - Use TypeScript with strict typing.
  - Structure components cleanly with memoization (`React.memo`, `useCallback`, `useMemo`) where appropriate to prevent unnecessary re-renders.
  - Use Tailwind CSS v4 and shadcn/ui design primitives for visual consistency.

---

## 🚀 Pull Request Process

1. Provide a concise summary of the changes in the PR description.
2. Link any related issues (e.g., `Fixes #42` or `Closes #15`).
3. Include screenshots or terminal logs for UI or CLI changes.
4. Ensure all CI workflows and automated checks pass.
5. Maintainers will review your PR and provide constructive feedback.

---

## 📖 Additional Resources

- **[Official Documentation](https://mahdimomeni.github.io/telepresence-gui/)**
- **[Developer Guide](https://mahdimomeni.github.io/telepresence-gui/docs/developer-guide/development-setup)**
- **[Architecture & Concepts](https://mahdimomeni.github.io/telepresence-gui/docs/getting-started/architecture)**

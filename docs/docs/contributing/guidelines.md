---
id: guidelines
title: Contribution Guidelines
sidebar_position: 1
---

# Contribution Guidelines

We welcome all contributions to **Telepresence GUI**! Whether you are fixing a bug, adding new features, improving documentation, or testing edge-case Kubernetes configurations, your help is appreciated.

---

## 🤝 Contribution Workflow

1. **Fork the Repository**: Click the **Fork** button on [GitHub](https://github.com/mahdimomeni/telepresence-gui).
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```
3. **Set Up Local Development**:
   Follow the [Development Setup Guide](../developer-guide/development-setup.md).
4. **Make Your Changes**:
   Ensure your code adheres to project formatting and conventions.
5. **Commit with Conventional Commits**:
   ```bash
   git commit -m "feat(connect): add support for custom CA bundle"
   ```
6. **Push to Your Fork**:
   ```bash
   git push origin feat/my-new-feature
   ```
7. **Open a Pull Request**: Submit your PR with a clear summary of changes and testing instructions.

---

## 📝 Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature or capability.
- `fix:` A bug fix.
- `docs:` Documentation additions or updates.
- `style:` Formatting, missing semi-colons, no code changes.
- `refactor:` Code restructuring without changing behavior.
- `perf:` Performance improvements.
- `test:` Adding or updating tests.
- `chore:` Build scripts, dependency updates, CI workflows.

---

## 🎨 Code Style Guidelines

- **Go**: Format all Go files with `go fmt ./...` and ensure `golangci-lint` passes without warnings.
- **Frontend / React**: Write functional components with TypeScript types. Use Tailwind CSS utility classes and shadcn/ui design primitives for UI consistency.

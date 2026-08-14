# Telepresence GUI

A modern, cross-platform graphical user interface for [Telepresence](https://www.telepresence.io/), built with [Wails](https://wails.io). It simplifies connecting to Kubernetes clusters, viewing workloads, and managing traffic intercepts without needing to memorize complex CLI commands.

## Features

- **Cluster Connection Management**: Connect to your Kubernetes clusters with a rich UI for configuring core settings, network routing, cluster authentication, and advanced daemon settings.
- **Workload Management**: View available workloads in your current namespace using a clean, filterable data table.
- **Visual Intercepts**: Quickly intercept workloads to route traffic to your local environment (Local Process or Docker Container) with advanced routing configurations.
- **System Tray Integration**: Runs quietly in the background with a system tray icon for quick connect/disconnect access without opening the full application window.
- **Dark/Light Mode**: Full support for system themes using a beautiful UI powered by Tailwind CSS and shadcn/ui.
- **Cross-Platform**: Built and packaged for Windows, macOS, and Linux.

## Tech Stack

- **Backend**: Go 1.25, Wails v2 Framework c
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui
- **State Management**: Zustand
- **Data Tables**: TanStack React Table

## Prerequisites

To build and run this project locally, you will need:

1. [Go](https://golang.org/dl/) 1.25 or later.
2. [Node.js](https://nodejs.org/en/) 20 or later.
3. [Wails CLI](https://wails.io/docs/gettingstarted/installation) (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`).
4. [Telepresence CLI](https://www.telepresence.io/docs/latest/install/) installed and available in your system's PATH.
5. `kubectl` installed with a valid `kubeconfig`.

## Getting Started

### Live Development

To run the application in live development mode with hot-reloading:

```bash
wails dev
```
This will run a Vite development server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser and have access to your Go methods, there is also a dev server that runs on `http://localhost:34115`.

### Building for Production

To build a standalone, production-ready executable:

```bash
wails build
```
This will generate the compiled binary for your operating system in the `build/bin/` directory.

## Project Structure

- `frontend/` - Contains the React/TypeScript frontend application.
  - `src/components/` - Reusable UI components (shadcn/ui), forms, and dialogs.
  - `src/pages/` - Main application views (Connect, List).
  - `src/services/` - Wrapper services to interact with Wails backend functions.
  - `src/stores/` - Global state management using Zustand.
- `internal/` - Contains the Go backend logic.
  - `app/` - Core application lifecycle, systray management, and background watchers.
  - `cli/` - Command-line execution wrappers for interacting with the Telepresence binary.
  - `models/` - Go data structures corresponding to Telepresence outputs and configs.
  - `services/` - Go services for handling Telepresence commands, Kubeconfig parsing, and app configuration.

## CI/CD

This project uses GitHub Actions to automate multi-platform builds. On every version tag (`v*`), it builds and packages releases for:
- **Windows** (amd64, arm64) - generating `.exe` binaries and NSIS installers.
- **macOS** (amd64, arm64, universal) - generating signed `.app` and `.pkg` installers.
- **Linux** (amd64, arm64).

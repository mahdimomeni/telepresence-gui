import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  takeRecords = vi.fn().mockReturnValue([]);
}
globalThis.IntersectionObserver =
  IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock Element.prototype.getAnimations for Base UI / JSDOM
if (typeof Element !== "undefined" && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = vi.fn().mockReturnValue([]);
}

const runtimeMock = {
  EventsOn: vi.fn((_event: string, _callback: (...args: unknown[]) => void) => () => {}),
  EventsOff: vi.fn(),
  EventsEmit: vi.fn(),
  EventsOnce: vi.fn(),
  WindowHide: vi.fn(),
  WindowShow: vi.fn(),
  WindowMinimise: vi.fn(),
  WindowToggleMaximise: vi.fn(),
  WindowIsMaximised: vi.fn().mockResolvedValue(false),
  WindowUnminimise: vi.fn(),
  Show: vi.fn(),
  Hide: vi.fn(),
  Quit: vi.fn(),
  BrowserOpenURL: vi.fn(),
};

// Mock Wails runtime module
vi.mock("@/../wailsjs/runtime/runtime", () => runtimeMock);
vi.mock("../../wailsjs/runtime/runtime", () => runtimeMock);

const appMock = {
  GetAppSettings: vi.fn().mockResolvedValue({
    theme: "dark",
    enableGlowEffects: true,
    showSplashScreen: true,
    closeToTray: true,
    startMinimized: false,
    enableNotifications: true,
    notifyOnConnect: true,
    notifyOnIntercept: true,
    autoCheckUpdates: true,
    defaultNamespace: "default",
    defaultKubeconfig: "",
    defaultContext: "",
    managerNamespace: "",
    requestTimeoutSeconds: 60,
    pollIntervalSeconds: 4,
    dockerDaemonMode: false,
    disableCompression: false,
    insecureSkipTLS: false,
    maxLogLines: 2000,
    autoScrollLogs: true,
    wrapLogLines: true,
    defaultLogLevel: "all",
  }),
  SaveAppSettings: vi.fn().mockResolvedValue(undefined),
  ResetAppSettings: vi.fn().mockResolvedValue({
    theme: "dark",
    enableGlowEffects: true,
    showSplashScreen: true,
    closeToTray: true,
    startMinimized: false,
    enableNotifications: true,
    notifyOnConnect: true,
    notifyOnIntercept: true,
    autoCheckUpdates: true,
    defaultNamespace: "default",
    defaultKubeconfig: "",
    defaultContext: "",
    managerNamespace: "",
    requestTimeoutSeconds: 60,
    pollIntervalSeconds: 4,
    dockerDaemonMode: false,
    disableCompression: false,
    insecureSkipTLS: false,
    maxLogLines: 2000,
    autoScrollLogs: true,
    wrapLogLines: true,
    defaultLogLevel: "all",
  }),
  GetKubeInfo: vi.fn().mockResolvedValue({
    currentContext: "dev-cluster",
    contexts: ["dev-cluster", "prod-cluster"],
    namespace: "dev",
    kubeconfigPath: "/mock/.kube/config",
  }),
  SaveConnectConfig: vi.fn().mockResolvedValue(undefined),
  LoadConnectConfig: vi.fn().mockResolvedValue(null),
  StartTelepresence: vi.fn().mockResolvedValue(undefined),
  StopTelepresence: vi.fn().mockResolvedValue(undefined),
  ListWorkloads: vi.fn().mockResolvedValue([]),
  InterceptWorkload: vi.fn().mockResolvedValue(undefined),
  ReplaceWorkload: vi.fn().mockResolvedValue(undefined),
  DetachWorkload: vi.fn().mockResolvedValue(undefined),
  CheckSystemTools: vi.fn().mockResolvedValue({
    allInstalled: true,
    missingCount: 0,
    tools: [
      {
        name: "telepresence",
        displayName: "Telepresence CLI",
        required: true,
        installed: true,
        version: "v2.21.3",
        docsUrl: "https://www.telepresence.io/docs/quick-start",
      },
      {
        name: "kubectl",
        displayName: "Kubernetes CLI",
        required: true,
        installed: true,
        version: "v1.31.0",
        docsUrl: "https://kubernetes.io/docs/tasks/tools/",
      },
    ],
  }),
  CheckForUpdates: vi.fn().mockResolvedValue({
    available: false,
    currentVersion: "0.0.0",
    latestVersion: "0.0.0",
  }),
  DownloadAndInstallUpdate: vi.fn().mockResolvedValue(undefined),
  RestartApp: vi.fn().mockResolvedValue(undefined),
  Notify: vi.fn().mockResolvedValue(undefined),
  SelectFile: vi.fn().mockResolvedValue("/selected/path"),
};

// Mock Wails Go App bindings
vi.mock("@/../wailsjs/go/app/App", () => appMock);
vi.mock("../../wailsjs/go/app/App", () => appMock);

// Define window.go for runtime checks
Object.defineProperty(window, "go", {
  writable: true,
  value: {
    app: {
      App: appMock,
    },
  },
});

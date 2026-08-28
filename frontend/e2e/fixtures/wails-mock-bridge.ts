import { test as base, Page } from "@playwright/test";

export interface MockState {
  toolsReport?: {
    allInstalled: boolean;
    missingCount: number;
    tools: Array<{
      name: string;
      displayName: string;
      description?: string;
      required: boolean;
      installed: boolean;
      version?: string;
      docsUrl?: string;
    }>;
  };
  kubeInfo?: {
    currentContext: string;
    contexts: string[];
    namespace: string;
    kubeconfigPath: string;
    savedConfig?: unknown;
  };
  workloads?: Array<{
    name: string;
    namespace: string;
    workload_resource_type: string;
    desired_replicas?: number;
    ready_replicas?: number;
    intercept_info?: Array<{
      id: string;
      spec: {
        name: string;
        client?: string;
        target_host?: string;
        target_port?: number;
        mechanism?: string;
      };
    }>;
  }>;
  settings?: {
    theme: string;
    enableGlowEffects: boolean;
    showSplashScreen: boolean;
    closeToTray: boolean;
    startMinimized: boolean;
    enableNotifications: boolean;
    notifyOnConnect: boolean;
    notifyOnIntercept: boolean;
    autoCheckUpdates: boolean;
    defaultNamespace: string;
    defaultKubeconfig: string;
    defaultContext: string;
    managerNamespace: string;
    requestTimeoutSeconds: number;
    pollIntervalSeconds: number;
    dockerDaemonMode: boolean;
    disableCompression: boolean;
    insecureSkipTLS: boolean;
    maxLogLines: number;
    autoScrollLogs: boolean;
    wrapLogLines: boolean;
    defaultLogLevel: string;
  };
  updateInfo?: {
    available: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseNotes?: string;
  };
  savedConnectConfig?: unknown;
  shouldFailConnect?: boolean;
  shouldFailIntercept?: boolean;
  shouldFailReplace?: boolean;
  shouldFailDetach?: boolean;
}

const defaultMockState: MockState = {
  toolsReport: {
    allInstalled: true,
    missingCount: 0,
    tools: [
      {
        name: "telepresence",
        displayName: "Telepresence CLI",
        description: "Connects local workstation to cluster",
        required: true,
        installed: true,
        version: "v2.21.3",
        docsUrl: "https://www.telepresence.io/docs/quick-start",
      },
      {
        name: "kubectl",
        displayName: "Kubernetes CLI",
        description: "Kubernetes control CLI",
        required: true,
        installed: true,
        version: "v1.31.0",
        docsUrl: "https://kubernetes.io/docs/tasks/tools/",
      },
    ],
  },
  kubeInfo: {
    currentContext: "prod-cluster",
    contexts: ["prod-cluster", "stage-cluster", "dev-cluster"],
    namespace: "ecommerce",
    kubeconfigPath: "C:\\Users\\Mock\\.kube\\config",
  },
  workloads: [
    {
      name: "orders-service",
      namespace: "ecommerce",
      workload_resource_type: "Deployment",
      desired_replicas: 3,
      ready_replicas: 3,
      intercept_info: [],
    },
    {
      name: "payment-gateway",
      namespace: "ecommerce",
      workload_resource_type: "Deployment",
      desired_replicas: 2,
      ready_replicas: 2,
      intercept_info: [
        {
          id: "int-payment-001",
          spec: {
            name: "payment-gateway",
            client: "dev-laptop",
            target_host: "127.0.0.1",
            target_port: 8080,
            mechanism: "http",
          },
        },
      ],
    },
    {
      name: "inventory-cache",
      namespace: "ecommerce",
      workload_resource_type: "StatefulSet",
      desired_replicas: 1,
      ready_replicas: 1,
      intercept_info: [],
    },
  ],
  settings: {
    theme: "dark",
    enableGlowEffects: true,
    showSplashScreen: false,
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
  },
  updateInfo: {
    available: false,
    currentVersion: "1.0.0",
    latestVersion: "1.0.0",
  },
};

export async function setupWailsMock(page: Page, customState: Partial<MockState> = {}) {
  page.on("console", msg => console.log("BROWSER LOG:", msg.type(), msg.text()));
  page.on("pageerror", err => console.error("BROWSER PAGEERROR:", err));

  const mergedState: MockState = {
    ...defaultMockState,
    ...customState,
  };

  await page.addInitScript((state: MockState) => {
    // Event listeners map
    const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

    const runtimeMock = {
      EventsOnMultiple: (
        eventName: string,
        callback: (...args: unknown[]) => void,
        maxCallbacks = -1
      ) => {
        if (!listeners[eventName]) {
          listeners[eventName] = [];
        }
        let count = 0;
        const wrappedCallback = (...args: unknown[]) => {
          count++;
          callback(...args);
          if (maxCallbacks > 0 && count >= maxCallbacks) {
            runtimeMock.EventsOff(eventName, wrappedCallback);
          }
        };
        listeners[eventName].push(wrappedCallback);
        return () => {
          runtimeMock.EventsOff(eventName, wrappedCallback);
        };
      },
      EventsOn: (eventName: string, callback: (...args: unknown[]) => void) => {
        return runtimeMock.EventsOnMultiple(eventName, callback, -1);
      },
      EventsOff: (eventName: string, ...additional: unknown[]) => {
        if (additional.length > 0 && typeof additional[0] === "function") {
          const fn = additional[0] as (...args: unknown[]) => void;
          listeners[eventName] = (listeners[eventName] || []).filter(cb => cb !== fn);
        } else {
          delete listeners[eventName];
          additional.forEach(n => {
            if (typeof n === "string") delete listeners[n];
          });
        }
      },
      EventsOffAll: () => {
        Object.keys(listeners).forEach(k => delete listeners[k]);
      },
      EventsOnce: (eventName: string, callback: (...args: unknown[]) => void) => {
        return runtimeMock.EventsOnMultiple(eventName, callback, 1);
      },
      EventsEmit: (eventName: string, ...args: unknown[]) => {
        if (listeners[eventName]) {
          const callbacks = [...listeners[eventName]];
          callbacks.forEach(cb => {
            try {
              cb(...args);
            } catch (err) {
              console.error("[WailsMock Error]", err);
            }
          });
        }
      },
      LogPrint: (msg: string) => console.log("[Runtime Log]", msg),
      LogTrace: (msg: string) => console.trace("[Runtime Trace]", msg),
      LogDebug: (msg: string) => console.debug("[Runtime Debug]", msg),
      LogInfo: (msg: string) => console.info("[Runtime Info]", msg),
      LogWarning: (msg: string) => console.warn("[Runtime Warn]", msg),
      LogError: (msg: string) => console.error("[Runtime Error]", msg),
      LogFatal: (msg: string) => console.error("[Runtime Fatal]", msg),
      WindowHide: () => {},
      WindowShow: () => {},
      WindowMinimise: () => {},
      WindowToggleMaximise: () => {},
      WindowIsMaximised: () => Promise.resolve(false),
      WindowUnminimise: () => {},
      WindowReload: () => {},
      WindowReloadApp: () => {},
      WindowSetAlwaysOnTop: () => {},
      WindowSetSystemDefaultTheme: () => {},
      WindowSetLightTheme: () => {},
      WindowSetDarkTheme: () => {},
      WindowCenter: () => {},
      WindowSetTitle: () => {},
      WindowFullscreen: () => {},
      WindowUnfullscreen: () => {},
      WindowIsFullscreen: () => Promise.resolve(false),
      WindowGetSize: () => Promise.resolve({ w: 1200, h: 800 }),
      WindowSetSize: () => {},
      WindowSetMaxSize: () => {},
      WindowSetMinSize: () => {},
      WindowSetPosition: () => {},
      WindowGetPosition: () => Promise.resolve({ x: 0, y: 0 }),
      WindowMaximise: () => {},
      WindowSetBackgroundColour: () => {},
      ScreenGetAll: () => Promise.resolve([]),
      WindowIsMinimised: () => Promise.resolve(false),
      WindowIsNormal: () => Promise.resolve(true),
      Show: () => {},
      Hide: () => {},
      Quit: () => {},
      BrowserOpenURL: () => {},
      ClipboardGetText: () => Promise.resolve(""),
      ClipboardSetText: () => Promise.resolve(),
      OpenFileDialog: () => Promise.resolve("C:\\Selected\\Mock\\kubeconfig"),
    };

    // Keep internal mutable state in window.__mockState
    const mockState = { ...state };
    (window as unknown as { __mockState: MockState }).__mockState = mockState;

    if (state.settings) {
      try {
        localStorage.setItem("telepresence-gui-app-settings", JSON.stringify(state.settings));
      } catch (e) {
        console.error("Failed to set mock settings in localStorage", e);
      }
    }

    const appMock = {
      GetAppSettings: () => Promise.resolve(mockState.settings),
      SaveAppSettings: (newSettings: MockState["settings"]) => {
        mockState.settings = { ...mockState.settings, ...newSettings };
        runtimeMock.EventsEmit("app-settings:changed", mockState.settings);
        return Promise.resolve();
      },
      ResetAppSettings: () => {
        mockState.settings = {
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
        };
        runtimeMock.EventsEmit("app-settings:changed", mockState.settings);
        return Promise.resolve(mockState.settings);
      },
      GetKubeInfo: () => Promise.resolve(mockState.kubeInfo),
      SaveConnectConfig: (config: unknown) => {
        mockState.savedConnectConfig = config;
        return Promise.resolve();
      },
      LoadConnectConfig: () => Promise.resolve(mockState.savedConnectConfig || null),
      StartTelepresence: () => {
        if (mockState.shouldFailConnect) {
          return Promise.reject(new Error("Daemon failed to establish tunnel connection"));
        }
        runtimeMock.EventsEmit("connection-changed", true);
        return Promise.resolve();
      },
      StopTelepresence: () => {
        runtimeMock.EventsEmit("connection-changed", false);
        return Promise.resolve();
      },
      ListWorkloads: () => Promise.resolve(mockState.workloads || []),
      InterceptWorkload: (config: { workload: string; port: string }) => {
        if (mockState.shouldFailIntercept) {
          return Promise.reject(new Error("Port collision on 8080"));
        }
        if (mockState.workloads) {
          mockState.workloads = mockState.workloads.map(w => {
            if (w.name === config.workload) {
              return {
                ...w,
                intercept_info: [
                  {
                    id: `int-${config.workload}-01`,
                    spec: {
                      name: config.workload,
                      target_port: parseInt(config.port, 10) || 8080,
                      mechanism: "http",
                    },
                  },
                ],
              };
            }
            return w;
          });
        }
        return Promise.resolve();
      },
      ReplaceWorkload: () => {
        if (mockState.shouldFailReplace) {
          return Promise.reject(new Error("Container not found in pod spec"));
        }
        return Promise.resolve();
      },
      DetachWorkload: (config: { attachment_name: string }) => {
        if (mockState.shouldFailDetach) {
          return Promise.reject(new Error("No active intercept found"));
        }
        if (mockState.workloads) {
          mockState.workloads = mockState.workloads.map(w => {
            if (w.name === config.attachment_name) {
              return { ...w, intercept_info: [] };
            }
            return w;
          });
        }
        return Promise.resolve();
      },
      CheckSystemTools: () => Promise.resolve(mockState.toolsReport),
      CheckForUpdates: () => Promise.resolve(mockState.updateInfo),
      DownloadAndInstallUpdate: () => {
        // Emit progress
        setTimeout(() => {
          runtimeMock.EventsEmit("update:progress", { percentage: 50, status: "downloading" });
        }, 100);
        setTimeout(() => {
          runtimeMock.EventsEmit("update:progress", { percentage: 100, status: "installed" });
        }, 300);
        return Promise.resolve();
      },
      RestartApp: () => Promise.resolve(),
      Notify: () => Promise.resolve(),
      SelectFile: () => Promise.resolve("C:\\Selected\\Mock\\kubeconfig"),
      OnSecondInstanceLaunch: () => {},
      SetEventEmitter: () => {},
      SetNotifier: () => {},
    };

    // Attach to window
    (window as unknown as { runtime: typeof runtimeMock }).runtime = runtimeMock;
    (window as unknown as { go: { app: { App: typeof appMock } } }).go = {
      app: {
        App: appMock,
      },
    };
  }, mergedState);
}

export const test = base.extend<{
  mockState: Partial<MockState>;
}>({
  // eslint-disable-next-line no-empty-pattern
  mockState: async ({}, use) => {
    await use({});
  },
});

export { expect } from "@playwright/test";

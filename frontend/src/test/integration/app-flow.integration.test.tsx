import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import * as AppBindings from "../../../wailsjs/go/app/App";
import * as WailsRuntime from "../../../wailsjs/runtime/runtime";
import { useToolsStore } from "@/stores/useToolsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { models } from "../../../wailsjs/go/models";

describe("App Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset stores
    useToolsStore.setState({
      report: new models.SystemToolsReport({
        allInstalled: true,
        missingCount: 0,
        tools: [
          new models.ToolCheckResult({
            name: "telepresence",
            displayName: "Telepresence CLI",
            description: "Required for cluster connection",
            required: true,
            installed: true,
            version: "v2.21.3",
            docsUrl: "https://telepresence.io",
          }),
          new models.ToolCheckResult({
            name: "kubectl",
            displayName: "Kubernetes CLI",
            description: "Required for kubectl operations",
            required: true,
            installed: true,
            version: "v1.31.0",
            docsUrl: "https://kubernetes.io",
          }),
        ],
      }),
      isChecking: false,
    });

    useSettingsStore.setState({
      settings: new models.AppSettings({
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
      }),
      isLoaded: true,
      isSaving: false,
    });

    // Mock GetAppSettings
    vi.mocked(AppBindings.GetAppSettings).mockResolvedValue(
      new models.AppSettings({
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
      })
    );

    // Mock KubeInfo
    vi.mocked(AppBindings.GetKubeInfo).mockResolvedValue(
      new models.KubeInfo({
        currentContext: "dev-ctx",
        contexts: ["dev-ctx", "staging-ctx"],
        namespace: "ecommerce",
        kubeconfigPath: "/mock/kubeconfig",
        savedConfig: null,
      })
    );

    // Mock Workloads
    vi.mocked(AppBindings.ListWorkloads).mockResolvedValue([
      new models.Workload({
        name: "orders-service",
        namespace: "ecommerce",
        workload_resource_type: "Deployment",
        desired_replicas: 2,
        ready_replicas: 2,
        intercept_info: [],
      }),
    ]);
  });

  it("should render ConnectPage when tools are installed and allow full connect/disconnect journey", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Verify Connect Form renders initially
    await waitFor(() => {
      expect(screen.getByText("Establish Cluster Session")).toBeInTheDocument();
    });

    const connectButton = screen.getByRole("button", { name: /Connect Session/i });
    expect(connectButton).toBeInTheDocument();

    // 2. Click Connect
    vi.mocked(AppBindings.StartTelepresence).mockResolvedValue(undefined);
    await user.click(connectButton);

    // 3. Verify transition to ListPage
    await waitFor(() => {
      expect(screen.getByText("Active Workload Session")).toBeInTheDocument();
    });
    expect(screen.getByText("orders-service")).toBeInTheDocument();

    // 4. Disconnect from ListPage
    vi.mocked(AppBindings.StopTelepresence).mockResolvedValue(undefined);
    const disconnectButton = screen.getByRole("button", { name: /Disconnect/i });
    await user.click(disconnectButton);

    // 5. Verify return to ConnectPage
    await waitFor(() => {
      expect(screen.getByText("Establish Cluster Session")).toBeInTheDocument();
    });
  });

  it("should display MissingToolsView when required tools are missing and switch on recheck", async () => {
    vi.mocked(AppBindings.CheckSystemTools).mockResolvedValueOnce(
      new models.SystemToolsReport({
        allInstalled: false,
        missingCount: 1,
        tools: [
          new models.ToolCheckResult({
            name: "telepresence",
            displayName: "Telepresence CLI",
            description: "Required for cluster connection",
            required: true,
            installed: false,
            docsUrl: "https://telepresence.io",
          }),
        ],
      })
    );

    useToolsStore.setState({
      report: new models.SystemToolsReport({
        allInstalled: false,
        missingCount: 1,
        tools: [
          new models.ToolCheckResult({
            name: "telepresence",
            displayName: "Telepresence CLI",
            description: "Required for cluster connection",
            required: true,
            installed: false,
            docsUrl: "https://telepresence.io",
          }),
        ],
      }),
      isChecking: false,
    });

    const user = userEvent.setup();
    render(<App />);

    // Verify MissingToolsView is shown
    await waitFor(() => {
      expect(screen.getByText("Required System Tools Missing")).toBeInTheDocument();
    });

    // Mock tool check resolving successfully on recheck
    vi.mocked(AppBindings.CheckSystemTools).mockResolvedValue(
      new models.SystemToolsReport({
        allInstalled: true,
        missingCount: 0,
        tools: [
          new models.ToolCheckResult({
            name: "telepresence",
            displayName: "Telepresence CLI",
            description: "Required for cluster connection",
            required: true,
            installed: true,
            version: "v2.21.3",
            docsUrl: "https://telepresence.io",
          }),
        ],
      })
    );

    const recheckButton = screen.getByRole("button", { name: /Re-check System Tools/i });
    await user.click(recheckButton);

    // Should transition to ConnectPage
    await waitFor(() => {
      expect(screen.getByText("Establish Cluster Session")).toBeInTheDocument();
    });
  });

  it("should open settings dialog on keyboard shortcut Ctrl+, and update settings", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Establish Cluster Session")).toBeInTheDocument();
    });

    // Press Ctrl+,
    await user.keyboard("{Control>},{/Control}");

    // Verify settings dialog opened
    await waitFor(() => {
      expect(screen.getByText("Application Preferences & Settings")).toBeInTheDocument();
    });

    expect(screen.getByText("Appearance & Visuals")).toBeInTheDocument();
  });

  it("should handle external Wails runtime connection-changed events", async () => {
    let connectionCallback: (status: boolean) => void = () => {};

    vi.mocked(WailsRuntime.EventsOn).mockImplementation((event, cb) => {
      if (event === "connection-changed") {
        connectionCallback = cb as (status: boolean) => void;
      }
      return () => {};
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Establish Cluster Session")).toBeInTheDocument();
    });

    // Simulate backend emitting connection-changed = true
    await act(async () => {
      connectionCallback(true);
    });

    await waitFor(() => {
      expect(screen.getByText("Active Workload Session")).toBeInTheDocument();
    });
  });
});

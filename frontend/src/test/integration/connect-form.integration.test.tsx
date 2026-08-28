import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectForm } from "@/components/connect-form";
import * as AppBindings from "../../../wailsjs/go/app/App";
import { models } from "../../../wailsjs/go/models";
import { useSettingsStore } from "@/stores/useSettingsStore";

describe("ConnectForm Integration", () => {
  const mockConnectSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

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
        defaultNamespace: "",
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
    });

    vi.mocked(AppBindings.GetKubeInfo).mockResolvedValue(
      new models.KubeInfo({
        currentContext: "k8s-dev-cluster",
        contexts: ["k8s-dev-cluster", "k8s-prod-cluster"],
        namespace: "frontend-app",
        kubeconfigPath: "/home/user/.kube/config",
        savedConfig: null,
      })
    );
  });

  it("should load kubeconfig information and populate form inputs across tabs", async () => {
    render(<ConnectForm onConnectSuccess={mockConnectSuccess} />);

    // Wait for kube info to load and populate namespace
    await waitFor(() => {
      const namespaceInput = screen.getByPlaceholderText("default");
      expect(namespaceInput).toHaveValue("frontend-app");
    });
  });

  it("should allow navigating across all configuration tabs and editing fields", async () => {
    const user = userEvent.setup();
    render(<ConnectForm onConnectSuccess={mockConnectSuccess} />);

    await waitFor(() => {
      expect(screen.getByText("Core")).toBeInTheDocument();
    });

    // Switch to Network tab
    const networkTab = screen.getByRole("tab", { name: /Network/i });
    await user.click(networkTab);

    // Verify Network tab content
    expect(screen.getByText("Network Routing")).toBeInTheDocument();
    const alsoProxyInput = screen.getByLabelText("Also Proxy");
    await user.type(alsoProxyInput, "10.244.0.0/16");
    expect(alsoProxyInput).toHaveValue("10.244.0.0/16");

    // Switch to Cluster & Auth tab
    const authTab = screen.getByRole("tab", { name: /Cluster & Auth/i });
    await user.click(authTab);

    expect(screen.getByText("Cluster & Authentication")).toBeInTheDocument();
    const serverInput = screen.getByLabelText("API Server");
    await user.type(serverInput, "https://api.mycluster.io");
    expect(serverInput).toHaveValue("https://api.mycluster.io");

    // Switch to Advanced tab
    const advancedTab = screen.getByRole("tab", { name: /Advanced/i });
    await user.click(advancedTab);

    expect(screen.getByText("Advanced Settings")).toBeInTheDocument();
    const timeoutInput = screen.getByLabelText("Request Timeout");
    await user.clear(timeoutInput);
    await user.type(timeoutInput, "120s");
    expect(timeoutInput).toHaveValue("120s");
  });

  it("should successfully submit connection and trigger onConnectSuccess", async () => {
    const user = userEvent.setup();
    vi.mocked(AppBindings.StartTelepresence).mockResolvedValue(undefined);

    render(<ConnectForm onConnectSuccess={mockConnectSuccess} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Connect Session/i })).toBeInTheDocument();
    });

    const connectButton = screen.getByRole("button", { name: /Connect Session/i });
    await user.click(connectButton);

    await waitFor(() => {
      expect(AppBindings.StartTelepresence).toHaveBeenCalled();
      expect(mockConnectSuccess).toHaveBeenCalled();
    });
  });

  it("should display error banner with copy functionality when connection fails", async () => {
    const user = userEvent.setup();
    vi.mocked(AppBindings.StartTelepresence).mockRejectedValue(
      new Error("Failed to authenticate to cluster API server: token expired")
    );

    render(<ConnectForm onConnectSuccess={mockConnectSuccess} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Connect Session/i })).toBeInTheDocument();
    });

    const connectButton = screen.getByRole("button", { name: /Connect Session/i });
    await user.click(connectButton);

    // Verify error banner is displayed
    await waitFor(() => {
      expect(screen.getByText(/Connection Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to authenticate to cluster API server: token expired/i)
      ).toBeInTheDocument();
    });

    // Test copy error button
    const copyButton = screen.getByRole("button", { name: /Copy Error/i });
    expect(copyButton).toBeInTheDocument();
    await user.click(copyButton);

    // Verify button shows Copied feedback
    await waitFor(() => {
      expect(screen.getByText(/Copied/i)).toBeInTheDocument();
    });
  });

  it("should reset form values when Reset to Defaults is clicked", async () => {
    const user = userEvent.setup();
    render(<ConnectForm onConnectSuccess={mockConnectSuccess} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("default")).toHaveValue("frontend-app");
    });

    // Type a custom namespace
    const namespaceInput = screen.getByPlaceholderText("default");
    await user.clear(namespaceInput);
    await user.type(namespaceInput, "custom-ns");
    expect(namespaceInput).toHaveValue("custom-ns");

    // Click Reset
    const resetButton = screen.getByRole("button", { name: /Reset to Defaults/i });
    await user.click(resetButton);

    // Should reset back to cluster default namespace ("frontend-app")
    await waitFor(() => {
      expect(namespaceInput).toHaveValue("frontend-app");
    });
  });
});

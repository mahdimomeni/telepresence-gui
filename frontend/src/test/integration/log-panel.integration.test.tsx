import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogPanel } from "@/components/log-panel";
import * as WailsRuntime from "../../../wailsjs/runtime/runtime";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { models } from "../../../wailsjs/go/models";

describe("LogPanel Integration", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useSettingsStore.setState({
      settings: new models.AppSettings({
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
      isLoaded: true,
    });
  });

  it("should receive streaming daemon-log events and display them in the terminal", async () => {
    let logCallback: (msg: string) => void = () => {};

    vi.mocked(WailsRuntime.EventsOn).mockImplementation((event, cb) => {
      if (event === "daemon-log") {
        logCallback = cb as (msg: string) => void;
      }
      return () => {};
    });

    render(<LogPanel isOpen={true} onOpenChange={mockOnOpenChange} />);

    // Emit various log messages
    await act(async () => {
      logCallback("[Tools] All required tools detected.");
      logCallback("[Connect] Connected to cluster successfully.");
      logCallback("[Error] Connection timeout while contacting traffic manager.");
    });

    await waitFor(() => {
      expect(screen.getByText(/All required tools detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Connected to cluster successfully/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Connection timeout while contacting traffic manager/i)
      ).toBeInTheDocument();
    });
  });

  it("should filter displayed logs when search query is entered", async () => {
    let logCallback: (msg: string) => void = () => {};

    vi.mocked(WailsRuntime.EventsOn).mockImplementation((event, cb) => {
      if (event === "daemon-log") {
        logCallback = cb as (msg: string) => void;
      }
      return () => {};
    });

    const user = userEvent.setup();
    render(<LogPanel isOpen={true} onOpenChange={mockOnOpenChange} />);

    await act(async () => {
      logCallback("[Info] Synchronized workloads from cluster.");
      logCallback("[Intercept] Intercepted payment-service.");
      logCallback("[Kube] Loaded config.");
    });

    await waitFor(() => {
      expect(screen.getByText(/Synchronized workloads/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Filter logs/i);
    await user.type(searchInput, "payment");

    expect(screen.getByText("payment", { selector: "mark" })).toBeInTheDocument();
    expect(screen.queryByText(/Synchronized workloads/i)).not.toBeInTheDocument();
  });

  it("should clear log messages when Clear button is clicked", async () => {
    let logCallback: (msg: string) => void = () => {};

    vi.mocked(WailsRuntime.EventsOn).mockImplementation((event, cb) => {
      if (event === "daemon-log") {
        logCallback = cb as (msg: string) => void;
      }
      return () => {};
    });

    const user = userEvent.setup();
    render(<LogPanel isOpen={true} onOpenChange={mockOnOpenChange} />);

    await act(async () => {
      logCallback("[Test] Some temporary log line.");
    });

    await waitFor(() => {
      expect(screen.getByText(/Some temporary log line/i)).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", { name: /Clear/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText(/Some temporary log line/i)).not.toBeInTheDocument();
    });
  });
});

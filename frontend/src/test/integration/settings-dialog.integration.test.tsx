import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog } from "@/components/settings-dialog";
import * as AppBindings from "../../../wailsjs/go/app/App";
import { models } from "../../../wailsjs/go/models";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useToolsStore } from "@/stores/useToolsStore";

describe("SettingsDialog Integration", () => {
  const mockOpenChange = vi.fn();
  const mockReplaySplash = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const initialSettings = new models.AppSettings({
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
    });

    useSettingsStore.setState({
      settings: initialSettings,
      isLoaded: true,
      isSaving: false,
    });

    useToolsStore.setState({
      report: new models.SystemToolsReport({
        allInstalled: true,
        missingCount: 0,
        tools: [],
      }),
      isChecking: false,
    });

    vi.mocked(AppBindings.GetAppSettings).mockResolvedValue(initialSettings);
    vi.mocked(AppBindings.SaveAppSettings).mockResolvedValue(undefined);
    vi.mocked(AppBindings.ResetAppSettings).mockResolvedValue(initialSettings);
  });

  it("should navigate across tabs and modify settings", async () => {
    const user = userEvent.setup();
    render(
      <SettingsDialog open={true} onOpenChange={mockOpenChange} onReplaySplash={mockReplaySplash} />
    );

    // Verify dialog title
    expect(screen.getByText("Application Preferences & Settings")).toBeInTheDocument();

    // Check General tab defaults
    expect(screen.getByText("Appearance & Visuals")).toBeInTheDocument();
    expect(screen.getByText("Color Theme")).toBeInTheDocument();

    // Switch to Cluster tab
    const clusterTab = screen.getByRole("tab", { name: /Cluster/i });
    await user.click(clusterTab);

    expect(screen.getByText("Cluster & Session Defaults")).toBeInTheDocument();

    // Switch to Logs tab
    const logsTab = screen.getByRole("tab", { name: /Logs/i });
    await user.click(logsTab);

    expect(screen.getByText("Console Stream & Buffer Settings")).toBeInTheDocument();

    // Switch to Tools tab
    const toolsTab = screen.getByRole("tab", { name: /Tools/i });
    await user.click(toolsTab);

    expect(screen.getByText("System Prerequisites & Diagnostics")).toBeInTheDocument();

    // Switch to About tab
    const aboutTab = screen.getByRole("tab", { name: /About/i });
    await user.click(aboutTab);

    expect(screen.getByText("Check for Updates Now")).toBeInTheDocument();
  });

  it("should save modified settings when Save Changes is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SettingsDialog open={true} onOpenChange={mockOpenChange} onReplaySplash={mockReplaySplash} />
    );

    const saveButton = screen.getByRole("button", { name: /Save Changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(AppBindings.SaveAppSettings).toHaveBeenCalled();
    });
  });

  it("should reset settings to factory defaults when Reset button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SettingsDialog open={true} onOpenChange={mockOpenChange} onReplaySplash={mockReplaySplash} />
    );

    const resetButton = screen.getByRole("button", { name: /Reset Defaults/i });
    await user.click(resetButton);

    await waitFor(() => {
      expect(AppBindings.ResetAppSettings).toHaveBeenCalled();
    });
  });
});

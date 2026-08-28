import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "./useSettingsStore";
import { SettingsService } from "@/services/settings";
import { models } from "@/../wailsjs/go/models";

vi.mock("@/services/settings", () => ({
  SettingsService: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    resetSettings: vi.fn(),
  },
}));

describe("useSettingsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default settings and flags", () => {
    const state = useSettingsStore.getState();
    expect(state.settings).toBeDefined();
    expect(state.settings.theme).toBe("dark");
    expect(state.settings.maxLogLines).toBe(2000);
  });

  it("should update individual fields with updateField", () => {
    useSettingsStore.getState().updateField("theme", "light");
    expect(useSettingsStore.getState().settings.theme).toBe("light");

    useSettingsStore.getState().updateField("maxLogLines", 5000);
    expect(useSettingsStore.getState().settings.maxLogLines).toBe(5000);
  });

  it("should load settings from SettingsService", async () => {
    const mockSettings = new models.AppSettings({
      theme: "light",
      enableGlowEffects: false,
      showSplashScreen: true,
      closeToTray: true,
      startMinimized: false,
      enableNotifications: true,
      notifyOnConnect: true,
      notifyOnIntercept: true,
      autoCheckUpdates: true,
      defaultNamespace: "custom",
      defaultKubeconfig: "",
      defaultContext: "",
      managerNamespace: "",
      requestTimeoutSeconds: 90,
      pollIntervalSeconds: 5,
      dockerDaemonMode: false,
      disableCompression: false,
      insecureSkipTLS: false,
      maxLogLines: 3000,
      autoScrollLogs: true,
      wrapLogLines: true,
      defaultLogLevel: "info",
    });

    vi.mocked(SettingsService.getSettings).mockResolvedValue(mockSettings);

    const loaded = await useSettingsStore.getState().loadSettings();
    expect(loaded.theme).toBe("light");
    expect(loaded.defaultNamespace).toBe("custom");
    expect(useSettingsStore.getState().isLoaded).toBe(true);
  });

  it("should save settings via saveSettings", async () => {
    vi.mocked(SettingsService.saveSettings).mockResolvedValue(undefined);

    const success = await useSettingsStore.getState().saveSettings({ defaultNamespace: "prod" });
    expect(success).toBe(true);
    expect(SettingsService.saveSettings).toHaveBeenCalled();
  });

  it("should reset settings via resetSettings", async () => {
    const defaults = new models.AppSettings();
    vi.mocked(SettingsService.resetSettings).mockResolvedValue(defaults);

    const result = await useSettingsStore.getState().resetSettings();
    expect(result).toBeDefined();
    expect(SettingsService.resetSettings).toHaveBeenCalled();
  });
});

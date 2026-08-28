import { describe, it, expect, beforeEach, vi } from "vitest";
import { SettingsService } from "./settings";
import { models } from "@/../wailsjs/go/models";
import * as appBindings from "@/../wailsjs/go/app/App";

describe("SettingsService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should get settings from backend if window.go is present", async () => {
    const mockSettings = new models.AppSettings({
      theme: "light",
      enableGlowEffects: false,
      defaultNamespace: "custom",
    });

    vi.mocked(appBindings.GetAppSettings).mockResolvedValue(mockSettings);

    window.go = {
      app: {
        App: {
          GetAppSettings: appBindings.GetAppSettings,
        },
      },
    } as unknown as typeof window.go;

    const res = await SettingsService.getSettings();
    expect(res.theme).toBe("light");
    expect(res.defaultNamespace).toBe("custom");
    expect(appBindings.GetAppSettings).toHaveBeenCalled();
  });

  it("should fallback to localStorage when backend is unavailable", async () => {
    window.go = undefined as unknown as typeof window.go;
    localStorage.setItem(
      "telepresence-gui-app-settings",
      JSON.stringify({
        theme: "light",
        defaultNamespace: "from-local-storage",
      })
    );

    const res = await SettingsService.getSettings();
    expect(res.theme).toBe("light");
    expect(res.defaultNamespace).toBe("from-local-storage");
  });

  it("should return default settings when neither backend nor localStorage has settings", async () => {
    window.go = undefined as unknown as typeof window.go;
    const res = await SettingsService.getSettings();
    expect(res.theme).toBe("dark");
    expect(res.enableGlowEffects).toBe(true);
    expect(res.defaultNamespace).toBe("default");
  });

  it("should save settings to localStorage and backend", async () => {
    window.go = {
      app: {
        App: {
          SaveAppSettings: appBindings.SaveAppSettings,
        },
      },
    } as unknown as typeof window.go;

    const newSettings = new models.AppSettings({ theme: "light" });
    await SettingsService.saveSettings(newSettings);

    expect(localStorage.getItem("telepresence-gui-app-settings")).toContain('"theme":"light"');
    expect(appBindings.SaveAppSettings).toHaveBeenCalledWith(newSettings);
  });

  it("should reset settings to defaults", async () => {
    const mockDefaults = new models.AppSettings({
      theme: "dark",
      defaultNamespace: "default",
    });

    vi.mocked(appBindings.ResetAppSettings).mockResolvedValue(mockDefaults);

    window.go = {
      app: {
        App: {
          ResetAppSettings: appBindings.ResetAppSettings,
        },
      },
    } as unknown as typeof window.go;

    const res = await SettingsService.resetSettings();
    expect(res.theme).toBe("dark");
    expect(localStorage.getItem("telepresence-gui-app-settings")).toContain('"theme":"dark"');
    expect(appBindings.ResetAppSettings).toHaveBeenCalled();
  });
});

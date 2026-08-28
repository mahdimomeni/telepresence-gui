import { describe, it, expect, beforeEach, vi } from "vitest";
import { UpdateService, type UpdateInfo, type UpdateProgress } from "./update";
import { EventsOn } from "../../wailsjs/runtime/runtime";

describe("UpdateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check for updates if window.go is present", async () => {
    const mockInfo: UpdateInfo = {
      available: true,
      currentVersion: "1.0.0",
      latestVersion: "1.1.0",
    };

    window.go = {
      app: {
        App: {
          CheckForUpdates: vi.fn().mockResolvedValue(mockInfo),
        },
      },
    } as unknown as typeof window.go;

    const info = await UpdateService.checkForUpdates();
    expect(info?.available).toBe(true);
    expect(info?.latestVersion).toBe("1.1.0");
  });

  it("should return null if check for updates fails or window.go is missing", async () => {
    window.go = undefined as unknown as typeof window.go;
    const info = await UpdateService.checkForUpdates();
    expect(info).toBeNull();
  });

  it("should call download and install update", async () => {
    const mockDownload = vi.fn().mockResolvedValue(undefined);
    window.go = {
      app: {
        App: {
          DownloadAndInstallUpdate: mockDownload,
        },
      },
    } as unknown as typeof window.go;

    await UpdateService.downloadAndInstall();
    expect(mockDownload).toHaveBeenCalled();
  });

  it("should call restartApp", async () => {
    const mockRestart = vi.fn().mockResolvedValue(undefined);
    window.go = {
      app: {
        App: {
          RestartApp: mockRestart,
        },
      },
    } as unknown as typeof window.go;

    await UpdateService.restartApp();
    expect(mockRestart).toHaveBeenCalled();
  });

  it("should subscribe to update available events", () => {
    const callback = vi.fn();
    const unsubscribe = UpdateService.onUpdateAvailable(callback);
    expect(EventsOn).toHaveBeenCalledWith("update:available", callback);
    expect(typeof unsubscribe).toBe("function");
  });

  it("should subscribe to update progress events", () => {
    const callback = vi.fn((_p: UpdateProgress) => {});
    const unsubscribe = UpdateService.onProgress(callback);
    expect(EventsOn).toHaveBeenCalledWith("update:progress", callback);
    expect(typeof unsubscribe).toBe("function");
  });
});

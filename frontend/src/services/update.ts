import { EventsOff, EventsOn } from "../../wailsjs/runtime/runtime";

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  publishedAt?: string;
  url?: string;
}

export interface UpdateProgress {
  percentage: number;
  status: "checking" | "downloading" | "installing" | "done" | "error";
  error?: string;
}

declare global {
  interface Window {
    go?: {
      app?: {
        App?: {
          CheckForUpdates?: () => Promise<UpdateInfo>;
          DownloadAndInstallUpdate?: () => Promise<void>;
          RestartApp?: () => Promise<void>;
        };
      };
    };
  }
}

export const UpdateService = {
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      if (window.go?.app?.App?.CheckForUpdates) {
        return await window.go.app.App.CheckForUpdates();
      }
    } catch (err) {
      console.error("[UpdateService] Check failed:", err);
    }
    return null;
  },

  async downloadAndInstall(): Promise<void> {
    const app = window.go?.app?.App;
    if (app && typeof app.DownloadAndInstallUpdate === "function") {
      await app.DownloadAndInstallUpdate();
    } else {
      console.error("[UpdateService] DownloadAndInstallUpdate is not available on window.go.app.App");
      throw new Error("Backend update method not found. Please restart Wails dev server.");
    }
  },

  async restartApp(): Promise<void> {
    if (window.go?.app?.App?.RestartApp) {
      await window.go.app.App.RestartApp();
    }
  },

  onUpdateAvailable(callback: (info: UpdateInfo) => void) {
    EventsOn("update:available", callback);
    return () => EventsOff("update:available");
  },

  onProgress(callback: (progress: UpdateProgress) => void) {
    EventsOn("update:progress", callback);
    return () => EventsOff("update:progress");
  },
};
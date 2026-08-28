import { create } from "zustand";
import { models } from "@/../wailsjs/go/models";
import { SettingsService } from "@/services/settings";
import { EventsOn } from "@/../wailsjs/runtime/runtime";

interface SettingsState {
  settings: models.AppSettings;
  isLoaded: boolean;
  isSaving: boolean;
  error: string | null;
  loadSettings: () => Promise<models.AppSettings>;
  updateField: <K extends keyof models.AppSettings>(key: K, value: models.AppSettings[K]) => void;
  saveSettings: (override?: Partial<models.AppSettings>) => Promise<boolean>;
  resetSettings: () => Promise<models.AppSettings>;
  setSettings: (settings: models.AppSettings) => void;
}

const DEFAULT_SETTINGS = new models.AppSettings({
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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  isSaving: false,
  error: null,

  setSettings: (settings: models.AppSettings) => {
    set({ settings, isLoaded: true });
  },

  loadSettings: async () => {
    try {
      const data = await SettingsService.getSettings();
      set({ settings: data, isLoaded: true, error: null });
      return data;
    } catch (err) {
      console.error("[useSettingsStore] Failed to load settings:", err);
      set({ isLoaded: true, error: String(err) });
      return get().settings;
    }
  },

  updateField: <K extends keyof models.AppSettings>(key: K, value: models.AppSettings[K]) => {
    set(state => {
      const updated = new models.AppSettings({
        ...state.settings,
        [key]: value,
      });
      return { settings: updated };
    });
  },

  saveSettings: async (override?: Partial<models.AppSettings>) => {
    set({ isSaving: true, error: null });
    try {
      const current = get().settings;
      const payload = override ? new models.AppSettings({ ...current, ...override }) : current;
      await SettingsService.saveSettings(payload);
      set({ settings: payload, isSaving: false });
      return true;
    } catch (err) {
      console.error("[useSettingsStore] Failed to save settings:", err);
      set({ isSaving: false, error: String(err) });
      return false;
    }
  },

  resetSettings: async () => {
    set({ isSaving: true, error: null });
    try {
      const defaults = await SettingsService.resetSettings();
      set({ settings: defaults, isSaving: false });
      return defaults;
    } catch (err) {
      console.error("[useSettingsStore] Failed to reset settings:", err);
      set({ isSaving: false, error: String(err) });
      return get().settings;
    }
  },
}));

// Auto-listen to backend settings changes
if (typeof window !== "undefined") {
  try {
    EventsOn("app-settings:changed", (newSettings: models.AppSettings) => {
      if (newSettings) {
        useSettingsStore.getState().setSettings(new models.AppSettings(newSettings));
      }
    });
  } catch {
    // Dev server fallback
  }
}

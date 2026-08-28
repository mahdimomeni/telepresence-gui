import { GetAppSettings, SaveAppSettings, ResetAppSettings } from "@/../wailsjs/go/app/App"
import { models } from "@/../wailsjs/go/models"

const LOCAL_STORAGE_KEY = "telepresence-gui-app-settings"

const DEFAULT_SETTINGS: models.AppSettings = new models.AppSettings({
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
})

export const SettingsService = {
    async getSettings(): Promise<models.AppSettings> {
        try {
            if (typeof window !== "undefined" && (window as any)?.go?.app?.App?.GetAppSettings) {
                const settings = await GetAppSettings()
                return new models.AppSettings(settings)
            }
        } catch (err) {
            console.warn("[SettingsService] Failed to load backend settings, falling back to storage/defaults:", err)
        }

        // Fallback to localStorage (browser/preview mode)
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (raw) {
                return new models.AppSettings(JSON.parse(raw))
            }
        } catch (e) {
            console.warn("[SettingsService] localStorage read error:", e)
        }

        return DEFAULT_SETTINGS
    },

    async saveSettings(settings: models.AppSettings): Promise<void> {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings))
        } catch (e) {
            console.warn("[SettingsService] localStorage write error:", e)
        }

        try {
            if (typeof window !== "undefined" && (window as any)?.go?.app?.App?.SaveAppSettings) {
                await SaveAppSettings(settings)
            }
        } catch (err) {
            console.error("[SettingsService] Failed to persist settings to backend:", err)
            throw err
        }
    },

    async resetSettings(): Promise<models.AppSettings> {
        try {
            if (typeof window !== "undefined" && (window as any)?.go?.app?.App?.ResetAppSettings) {
                const res = await ResetAppSettings()
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res))
                return new models.AppSettings(res)
            }
        } catch (err) {
            console.warn("[SettingsService] Failed to reset backend settings:", err)
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
        return DEFAULT_SETTINGS
    }
}

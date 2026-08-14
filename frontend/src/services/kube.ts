import { Notify, GetKubeInfo } from "@/../wailsjs/go/app/App"
import { models } from "@/../wailsjs/go/models"

/**
 * Standardized error handling for Wails backend calls.
 * This prevents raw Go panics or generic string errors from leaking into the UI.
 */
const handleBackendError = (error: unknown, context: string): never => {
    console.error(`[KubeService] ${context}:`, error)
    throw new Error(`Failed to ${context}. Please check your connection and try again.`)
}

export const KubeService = {
    async getInfo(path: string): Promise<models.KubeInfo> {
        try {
            return await GetKubeInfo(path)
        } catch (error) {
            return handleBackendError(error, "notify")
        }
    }
}
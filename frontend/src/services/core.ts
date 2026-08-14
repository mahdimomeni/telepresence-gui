import { Notify, SelectFile } from "@/../wailsjs/go/app/App"
import { models } from "@/../wailsjs/go/models"

/**
 * Standardized error handling for Wails backend calls.
 * This prevents raw Go panics or generic string errors from leaking into the UI.
 */
const handleBackendError = (error: unknown, context: string): never => {
    console.error(`[CoreService] ${context}:`, error)
    throw new Error(`Failed to ${context}. Please check your connection and try again.`)
}

export const CoreService = {
    async notify(title: string, message: string): Promise<void> {
        try {
            await Notify(title, message)
        } catch (error) {
            return handleBackendError(error, "notify")
        }
    },

    async browseFile(message: string): Promise<string> {
        try {
           return await SelectFile(message)
        } catch (error) {
            return handleBackendError(error, "notify")
        }
    }
}
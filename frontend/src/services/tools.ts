import { CheckSystemTools } from "@/../wailsjs/go/app/App"
import { models } from "@/../wailsjs/go/models"

export const ToolsService = {
    async checkSystemTools(): Promise<models.SystemToolsReport> {
        try {
            return await CheckSystemTools()
        } catch (error) {
            console.error("[ToolsService] checkSystemTools error:", error)
            throw error
        }
    }
}

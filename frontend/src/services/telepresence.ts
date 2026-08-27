import {
  ListWorkloads,
  StopTelepresence,
  StartTelepresence,
  GetKubeInfo,
  SaveConnectConfig,
  InterceptWorkload,
  ReplaceWorkload,
  DetachWorkload,
} from "@/../wailsjs/go/app/App"
import { models } from "@/../wailsjs/go/models"

const handleBackendError = (error: unknown, context: string): never => {
  const errorMsg = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error)
  console.error(`[TelepresenceService] ${context}:`, error)
  throw new Error(errorMsg || `Failed to ${context}. Please check your connection and try again.`)
}

export const TelepresenceService = {
  async getKubeInfo(kubeconfigPath: string): Promise<models.KubeInfo> {
    try {
      return await GetKubeInfo(kubeconfigPath)
    } catch (error) {
      return handleBackendError(error, "fetch Kubernetes config")
    }
  },

  async connect(config: models.ConnectConfig): Promise<void> {
    try {
      await SaveConnectConfig(config)
      await StartTelepresence(config)
    } catch (error) {
      return handleBackendError(error, "start Telepresence connection")
    }
  },

  async disconnect(): Promise<void> {
    try {
      await StopTelepresence()
    } catch (error) {
      return handleBackendError(error, "stop Telepresence")
    }
  },

  async listWorkloads(): Promise<models.Workload[]> {
    try {
      return await ListWorkloads()
    } catch (error) {
      return handleBackendError(error, "list workloads")
    }
  },

  async interceptWorkload(config: models.InterceptConfig): Promise<void> {
    try {
      return await InterceptWorkload(config)
    } catch (error) {
      return handleBackendError(error, "intercept workload")
    }
  },

  async replaceWorkload(config: models.ReplaceConfig): Promise<void> {
    try {
      return await ReplaceWorkload(config)
    } catch (error) {
      return handleBackendError(error, "replace workload")
    }
  },

  async detachWorkload(config: models.DetachConfig): Promise<void> {
    try {
      await DetachWorkload(config)
    } catch (error) {
      return handleBackendError(error, "detach workload")
    }
  }
}
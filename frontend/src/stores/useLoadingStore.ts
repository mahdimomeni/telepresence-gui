import { create } from 'zustand'

export type LoadingKey =
  | 'connection'        // For connect, disconnect, and tray pending
  | 'kube-info'         // For fetching kubeconfig/contexts
  | 'workloads'         // For scanning and fetching workloads
  | 'intercept'         // For workload intercepting dialog
  | (string & {})       // Scoped keys like workload detachment: `detach-${workloadName}`

interface LoadingState {
  activeLoaders: Record<string, boolean>
  isLoading: (key?: LoadingKey) => boolean
  startLoading: (key?: LoadingKey) => void
  stopLoading: (key?: LoadingKey) => void
  setLoading: (key: LoadingKey, status: boolean) => void
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  activeLoaders: {},

  isLoading: (key = 'connection') => Boolean(get().activeLoaders[key]),

  startLoading: (key = 'connection') =>
    set((state) => ({
      activeLoaders: { ...state.activeLoaders, [key]: true },
    })),

  stopLoading: (key = 'connection') =>
    set((state) => {
      const next = { ...state.activeLoaders }
      delete next[key]
      return { activeLoaders: next }
    }),

  setLoading: (key, status) =>
    set((state) => {
      if (status) {
        return { activeLoaders: { ...state.activeLoaders, [key]: true } }
      }
      const next = { ...state.activeLoaders }
      delete next[key]
      return { activeLoaders: next }
    }),
}))
import { describe, it, expect, beforeEach } from "vitest";
import { useLoadingStore } from "./useLoadingStore";

describe("useLoadingStore", () => {
  beforeEach(() => {
    // Reset store state
    useLoadingStore.setState({ activeLoaders: {} });
  });

  it("should have initial state with no active loaders", () => {
    const store = useLoadingStore.getState();
    expect(store.isLoading()).toBe(false);
    expect(store.isLoading("workloads")).toBe(false);
  });

  it("should start and stop loading for default key", () => {
    useLoadingStore.getState().startLoading();
    expect(useLoadingStore.getState().isLoading()).toBe(true);

    useLoadingStore.getState().stopLoading();
    expect(useLoadingStore.getState().isLoading()).toBe(false);
  });

  it("should handle scoped loading keys", () => {
    useLoadingStore.getState().startLoading("intercept");
    expect(useLoadingStore.getState().isLoading("intercept")).toBe(true);
    expect(useLoadingStore.getState().isLoading("connection")).toBe(false);

    useLoadingStore.getState().stopLoading("intercept");
    expect(useLoadingStore.getState().isLoading("intercept")).toBe(false);
  });

  it("should set loading status directly with setLoading", () => {
    useLoadingStore.getState().setLoading("kube-info", true);
    expect(useLoadingStore.getState().isLoading("kube-info")).toBe(true);

    useLoadingStore.getState().setLoading("kube-info", false);
    expect(useLoadingStore.getState().isLoading("kube-info")).toBe(false);
  });
});

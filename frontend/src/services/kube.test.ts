import { describe, it, expect, beforeEach, vi } from "vitest";
import { KubeService } from "./kube";
import { models } from "@/../wailsjs/go/models";
import * as appBindings from "@/../wailsjs/go/app/App";

describe("KubeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get kube info successfully", async () => {
    const mockInfo = new models.KubeInfo({
      currentContext: "k8s-cluster",
      contexts: ["k8s-cluster", "minikube"],
      namespace: "production",
      kubeconfigPath: "/root/.kube/config",
    });

    vi.mocked(appBindings.GetKubeInfo).mockResolvedValue(mockInfo);

    const res = await KubeService.getInfo("/root/.kube/config");
    expect(res.currentContext).toBe("k8s-cluster");
    expect(res.namespace).toBe("production");
    expect(appBindings.GetKubeInfo).toHaveBeenCalledWith("/root/.kube/config");
  });

  it("should handle error when GetKubeInfo fails", async () => {
    vi.mocked(appBindings.GetKubeInfo).mockRejectedValue(new Error("Unable to read config"));

    await expect(KubeService.getInfo("/invalid/path")).rejects.toThrow("Failed to notify");
  });
});

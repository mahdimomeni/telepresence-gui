import { describe, it, expect, beforeEach, vi } from "vitest";
import { TelepresenceService } from "./telepresence";
import { models } from "@/../wailsjs/go/models";
import * as appBindings from "@/../wailsjs/go/app/App";

describe("TelepresenceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get kube info successfully", async () => {
    const mockInfo = new models.KubeInfo({
      currentContext: "dev-cluster",
      contexts: ["dev-cluster"],
      namespace: "default",
      kubeconfigPath: "/kube/config",
    });

    vi.mocked(appBindings.GetKubeInfo).mockResolvedValue(mockInfo);

    const info = await TelepresenceService.getKubeInfo("/kube/config");
    expect(info.currentContext).toBe("dev-cluster");
    expect(appBindings.GetKubeInfo).toHaveBeenCalledWith("/kube/config");
  });

  it("should throw error if getKubeInfo fails", async () => {
    vi.mocked(appBindings.GetKubeInfo).mockRejectedValue(new Error("File not found"));

    await expect(TelepresenceService.getKubeInfo("/invalid")).rejects.toThrow("File not found");
  });

  it("should connect and save connect config", async () => {
    const config = new models.ConnectConfig({
      namespace: "staging",
      context: "staging-cluster",
    });

    await TelepresenceService.connect(config);
    expect(appBindings.SaveConnectConfig).toHaveBeenCalledWith(config);
    expect(appBindings.StartTelepresence).toHaveBeenCalledWith(config);
  });

  it("should stop telepresence on disconnect", async () => {
    await TelepresenceService.disconnect();
    expect(appBindings.StopTelepresence).toHaveBeenCalled();
  });

  it("should list workloads", async () => {
    const mockWorkloads = [
      new models.Workload({ name: "order-service", namespace: "staging" }),
      new models.Workload({ name: "user-service", namespace: "staging" }),
    ];

    vi.mocked(appBindings.ListWorkloads).mockResolvedValue(mockWorkloads);

    const workloads = await TelepresenceService.listWorkloads();
    expect(workloads).toHaveLength(2);
    expect(workloads[0].name).toBe("order-service");
  });

  it("should intercept workload", async () => {
    const config = new models.InterceptConfig({
      workload: "order-service",
      port: "8080",
    });

    await TelepresenceService.interceptWorkload(config);
    expect(appBindings.InterceptWorkload).toHaveBeenCalledWith(config);
  });

  it("should replace workload", async () => {
    const config = new models.ReplaceConfig({
      workload: "order-service",
      port: "8080",
    });

    await TelepresenceService.replaceWorkload(config);
    expect(appBindings.ReplaceWorkload).toHaveBeenCalledWith(config);
  });

  it("should detach workload", async () => {
    const config = new models.DetachConfig({
      attachmentName: "order-service",
      namespace: "staging",
    });

    await TelepresenceService.detachWorkload(config);
    expect(appBindings.DetachWorkload).toHaveBeenCalledWith(config);
  });
});

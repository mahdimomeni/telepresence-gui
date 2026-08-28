import { describe, it, expect, beforeEach, vi } from "vitest";
import { CoreService } from "./core";
import * as appBindings from "@/../wailsjs/go/app/App";

describe("CoreService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send notification via App.Notify", async () => {
    await CoreService.notify("Title", "Message");
    expect(appBindings.Notify).toHaveBeenCalledWith("Title", "Message");
  });

  it("should open file dialog via App.SelectFile", async () => {
    vi.mocked(appBindings.SelectFile).mockResolvedValue("/chosen/file.yaml");
    const path = await CoreService.browseFile("Select Kubeconfig");
    expect(path).toBe("/chosen/file.yaml");
    expect(appBindings.SelectFile).toHaveBeenCalledWith("Select Kubeconfig");
  });

  it("should handle notify error", async () => {
    vi.mocked(appBindings.Notify).mockRejectedValue(new Error("Notification failed"));
    await expect(CoreService.notify("Error Title", "Message")).rejects.toThrow("Failed to notify");
  });
});

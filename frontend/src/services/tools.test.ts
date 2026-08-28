import { describe, it, expect, beforeEach, vi } from "vitest";
import { ToolsService } from "./tools";
import { models } from "@/../wailsjs/go/models";
import * as appBindings from "@/../wailsjs/go/app/App";

describe("ToolsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check system tools successfully", async () => {
    const mockReport = new models.SystemToolsReport({
      allInstalled: true,
      missingCount: 0,
      tools: [],
    });

    vi.mocked(appBindings.CheckSystemTools).mockResolvedValue(mockReport);

    const res = await ToolsService.checkSystemTools();
    expect(res.allInstalled).toBe(true);
    expect(appBindings.CheckSystemTools).toHaveBeenCalled();
  });

  it("should throw when CheckSystemTools fails", async () => {
    vi.mocked(appBindings.CheckSystemTools).mockRejectedValue(new Error("system check failed"));

    await expect(ToolsService.checkSystemTools()).rejects.toThrow("system check failed");
  });
});

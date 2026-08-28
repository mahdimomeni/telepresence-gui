import { describe, it, expect, beforeEach, vi } from "vitest";
import { useToolsStore } from "./useToolsStore";
import { ToolsService } from "@/services/tools";
import { models } from "@/../wailsjs/go/models";

vi.mock("@/services/tools", () => ({
  ToolsService: {
    checkSystemTools: vi.fn(),
  },
}));

describe("useToolsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToolsStore.setState({
      report: null,
      isChecking: false,
      hasChecked: false,
    });
  });

  it("should have initial un-checked state", () => {
    const state = useToolsStore.getState();
    expect(state.report).toBeNull();
    expect(state.isChecking).toBe(false);
    expect(state.hasChecked).toBe(false);
  });

  it("should set report directly with setReport", () => {
    const report = new models.SystemToolsReport({
      allInstalled: true,
      missingCount: 0,
      tools: [],
    });

    useToolsStore.getState().setReport(report);
    expect(useToolsStore.getState().report).toEqual(report);
    expect(useToolsStore.getState().hasChecked).toBe(true);
  });

  it("should call checkTools and populate report", async () => {
    const mockReport = new models.SystemToolsReport({
      allInstalled: false,
      missingCount: 1,
      tools: [
        new models.ToolCheckResult({
          name: "telepresence",
          displayName: "Telepresence",
          required: true,
          installed: true,
        }),
        new models.ToolCheckResult({
          name: "kubectl",
          displayName: "Kubectl",
          required: true,
          installed: false,
        }),
      ],
    });

    vi.mocked(ToolsService.checkSystemTools).mockResolvedValue(mockReport);

    const report = await useToolsStore.getState().checkTools();
    expect(report).toEqual(mockReport);
    expect(useToolsStore.getState().hasChecked).toBe(true);
    expect(useToolsStore.getState().isChecking).toBe(false);
  });

  it("should handle checkTools failure gracefully", async () => {
    vi.mocked(ToolsService.checkSystemTools).mockRejectedValue(new Error("check failed"));

    const result = await useToolsStore.getState().checkTools();
    expect(result).toBeNull();
    expect(useToolsStore.getState().isChecking).toBe(false);
  });
});

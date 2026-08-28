import { create } from "zustand";
import { models } from "@/../wailsjs/go/models";
import { ToolsService } from "@/services/tools";

interface ToolsState {
  report: models.SystemToolsReport | null;
  isChecking: boolean;
  hasChecked: boolean;
  checkTools: () => Promise<models.SystemToolsReport | null>;
  setReport: (report: models.SystemToolsReport) => void;
}

export const useToolsStore = create<ToolsState>(set => ({
  report: null,
  isChecking: false,
  hasChecked: false,

  setReport: (report: models.SystemToolsReport) => {
    set({ report, hasChecked: true });
  },

  checkTools: async () => {
    set({ isChecking: true });
    try {
      const report = await ToolsService.checkSystemTools();
      set({ report, hasChecked: true, isChecking: false });
      return report;
    } catch (error) {
      console.error("[useToolsStore] Failed to check tools:", error);
      set({ isChecking: false });
      return null;
    }
  },
}));

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Settings,
  Sparkles,
  Network,
  Terminal,
  Wrench,
  Info,
  RotateCcw,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { GeneralTab } from "./tabs/general-tab";
import { TelepresenceTab } from "./tabs/telepresence-tab";
import { LogsTab } from "./tabs/logs-tab";
import { ToolsTab } from "./tabs/tools-tab";
import { AboutTab } from "./tabs/about-tab";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplaySplash?: () => void;
}

export function SettingsDialog({ open, onOpenChange, onReplaySplash }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("general");

  const settings = useSettingsStore(state => state.settings);
  const isSaving = useSettingsStore(state => state.isSaving);
  const updateField = useSettingsStore(state => state.updateField);
  const saveSettings = useSettingsStore(state => state.saveSettings);
  const resetSettings = useSettingsStore(state => state.resetSettings);

  const [_hasChanges, setHasChanges] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFieldChange = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    updateField(key, value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await saveSettings();
    if (success) {
      setHasChanges(false);
      setStatusMessage("Settings saved successfully!");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleReset = async () => {
    await resetSettings();
    setHasChanges(false);
    setStatusMessage("Restored factory defaults.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/80 shadow-2xl flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Settings className="size-4.5 animate-spin-slow" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
                Application Preferences & Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Customize appearance, cluster connection defaults, logs, and system tray behavior.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation & Body */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-border/40 bg-muted/20 shrink-0">
            <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-muted/50 gap-1">
              <TabsTrigger
                value="general"
                className="gap-1.5 text-xs py-1.5 data-[state=active]:shadow-xs transition-all cursor-pointer"
                title="General & Appearance"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>

              <TabsTrigger
                value="telepresence"
                className="gap-1.5 text-xs py-1.5 data-[state=active]:shadow-xs transition-all cursor-pointer"
                title="Telepresence Defaults"
              >
                <Network className="size-3.5 text-sky-400" />
                <span className="hidden sm:inline">Cluster</span>
              </TabsTrigger>

              <TabsTrigger
                value="logs"
                className="gap-1.5 text-xs py-1.5 data-[state=active]:shadow-xs transition-all cursor-pointer"
                title="Log Console"
              >
                <Terminal className="size-3.5 text-purple-400" />
                <span className="hidden sm:inline">Logs</span>
              </TabsTrigger>

              <TabsTrigger
                value="tools"
                className="gap-1.5 text-xs py-1.5 data-[state=active]:shadow-xs transition-all cursor-pointer"
                title="Prerequisites & Tools"
              >
                <Wrench className="size-3.5 text-amber-400" />
                <span className="hidden sm:inline">Tools</span>
              </TabsTrigger>

              <TabsTrigger
                value="about"
                className="gap-1.5 text-xs py-1.5 data-[state=active]:shadow-xs transition-all cursor-pointer"
                title="About & Updates"
              >
                <Info className="size-3.5 text-emerald-400" />
                <span className="hidden sm:inline">About</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <TabsContent value="general" className="mt-0">
              <GeneralTab
                settings={settings}
                onChange={handleFieldChange}
                onReplaySplash={() => {
                  onOpenChange(false);
                  onReplaySplash?.();
                }}
              />
            </TabsContent>

            <TabsContent value="telepresence" className="mt-0">
              <TelepresenceTab settings={settings} onChange={handleFieldChange} />
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <LogsTab settings={settings} onChange={handleFieldChange} />
            </TabsContent>

            <TabsContent value="tools" className="mt-0">
              <ToolsTab />
            </TabsContent>

            <TabsContent value="about" className="mt-0">
              <AboutTab settings={settings} onChange={handleFieldChange} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="p-3 sm:px-5 border-t border-border/40 bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-rose-400 gap-1.5 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Reset Defaults</span>
            </Button>

            {statusMessage && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 animate-page-enter">
                <CheckCircle2 className="size-3.5" />
                <span>{statusMessage}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Close
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-3.5 text-xs gap-1.5 shadow-sm font-semibold active:scale-95 transition-transform cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Spinner className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

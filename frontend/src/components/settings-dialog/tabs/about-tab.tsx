import { useState } from "react";
import { models } from "@/../wailsjs/go/models";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Mail,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import Github from "@/assets/images/github.svg?react";
import Logo from "@/assets/images/logo.svg?react";
import { BrowserOpenURL } from "@/../wailsjs/runtime/runtime";
import { UpdateService, type UpdateInfo } from "@/services/update";

interface AboutTabProps {
  settings: models.AppSettings;
  onChange: <K extends keyof models.AppSettings>(key: K, value: models.AppSettings[K]) => void;
}

export function AboutTab({ settings, onChange }: AboutTabProps) {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const info = await UpdateService.checkForUpdates();
      setUpdateInfo(info);
      if (!info?.available) {
        setUpdateStatus("You are running the latest version!");
      }
    } catch {
      setUpdateStatus("Failed to check for updates. Please verify your internet connection.");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await UpdateService.downloadAndInstall();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. App Branding & Hero Card */}
      <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute -top-12 -right-12 size-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 size-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-card border-2 border-primary/40 shadow-[0_0_20px_var(--primary)] mb-3">
          <Logo className="size-8 text-primary" />
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Telepresence GUI</h2>
          <Badge
            variant="outline"
            className="font-mono text-xs text-primary border-primary/40 bg-primary/10"
          >
            v{__APP_VERSION__}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Modern, high-performance desktop controller for Kubernetes local traffic interception and
          workload replacing.
        </p>

        <div className="flex items-center gap-3 mt-4 text-xs font-mono text-muted-foreground/70">
          <span>Engine: Wails v2</span>
          <span>•</span>
          <span>Go 1.23+</span>
          <span>•</span>
          <span>React 19</span>
        </div>
      </div>

      {/* 2. Software Updates Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Software Updates</h3>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="space-y-0.5">
              <Label
                htmlFor="auto-update-toggle"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                Check for Updates on Startup
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Silently check GitHub releases upon app launch and notify when a newer release is
                published.
              </p>
            </div>
            <Switch
              id="auto-update-toggle"
              checked={settings.autoCheckUpdates}
              onCheckedChange={checked => onChange("autoCheckUpdates", checked)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-xs font-medium text-foreground">Current Installed Version</p>
              <p className="text-[11px] text-muted-foreground font-mono">v{__APP_VERSION__}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="h-8 px-3 text-xs gap-1.5 active:scale-95 transition-transform"
            >
              <RefreshCw
                className={`size-3.5 ${isCheckingUpdate ? "animate-spin text-primary" : ""}`}
              />
              <span>{isCheckingUpdate ? "Checking Releases..." : "Check for Updates Now"}</span>
            </Button>
          </div>

          {/* Update Status Result */}
          {updateStatus && !updateInfo?.available && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-page-enter">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              <span>{updateStatus}</span>
            </div>
          )}

          {updateInfo?.available && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-foreground space-y-2 animate-page-enter">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">
                  New Version Available: v{updateInfo.latestVersion}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleInstallUpdate}
                  className="h-7 px-2.5 text-xs gap-1 shadow-xs"
                >
                  <Download className="size-3" />
                  <span>Update & Restart</span>
                </Button>
              </div>
              {updateInfo.releaseNotes && (
                <p className="text-[11px] text-muted-foreground whitespace-pre-wrap max-h-24 overflow-y-auto font-mono bg-background/50 p-2 rounded border border-border/40">
                  {updateInfo.releaseNotes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Community & Project Links */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Project & Community Links
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => BrowserOpenURL("https://github.com/mahdimomeni/telepresence-gui")}
            className="h-9 justify-between text-xs px-3 bg-card/40 hover-card-glow cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Github className="size-3.5" />
              <span>GitHub Repository</span>
            </div>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => BrowserOpenURL("https://github.com/mahdimomeni/telepresence-gui/issues")}
            className="h-9 justify-between text-xs px-3 bg-card/40 hover-card-glow cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-3.5 text-amber-500" />
              <span>Report an Issue</span>
            </div>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              BrowserOpenURL("https://github.com/mahdimomeni/telepresence-gui/releases")
            }
            className="h-9 justify-between text-xs px-3 bg-card/40 hover-card-glow cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              <span>Changelog & Releases</span>
            </div>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => BrowserOpenURL("mailto:mahdimomeni012@gmail.com")}
            className="h-9 justify-between text-xs px-3 bg-card/40 hover-card-glow cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 text-sky-400" />
              <span>Developer Feedback</span>
            </div>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}

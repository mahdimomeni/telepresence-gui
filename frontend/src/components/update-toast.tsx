import { useEffect, useState } from "react";
import { UpdateInfo, UpdateProgress, UpdateService } from "@/services/update";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DownloadCloud, RotateCcw, X, CheckCircle2, AlertTriangle } from "lucide-react";

export function UpdateToast() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState<UpdateProgress>({
    percentage: 0,
    status: "checking",
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Listen for backend startup check
    const unsubAvailable = UpdateService.onUpdateAvailable(info => {
      if (info && info.available) {
        setUpdateInfo(info);
        setDismissed(false);
      }
    });

    // Listen for live progress
    const unsubProgress = UpdateService.onProgress(p => {
      setProgress(p);
      if (p.status === "error") {
        setIsUpdating(false);
      }
    });

    return () => {
      unsubAvailable();
      unsubProgress();
    };
  }, []);

  if (!updateInfo || dismissed) return null;

  const handleStartUpdate = async () => {
    setIsUpdating(true);
    setProgress({ percentage: 0, status: "downloading" });
    try {
      await UpdateService.downloadAndInstall();
    } catch (err) {
      setProgress({
        percentage: 0,
        status: "error",
        error: String(err),
      });
      setIsUpdating(false);
    }
  };

  const handleRestart = async () => {
    await UpdateService.restartApp();
  };

  return (
    <div className="fixed bottom-14 right-4 z-50 w-96 animate-in slide-in-from-bottom-5 fade-in-0 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold leading-tight">Update Available</h4>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{updateInfo.currentVersion}</span>
                <span>→</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold">
                  {updateInfo.latestVersion}
                </Badge>
              </div>
            </div>
          </div>

          {!isUpdating && progress.status !== "done" && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Dynamic State Content */}
        <div className="mt-3">
          {!isUpdating && progress.status !== "done" && progress.status !== "error" && (
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
                Later
              </Button>
              <Button variant="default" size="sm" onClick={handleStartUpdate} className="gap-1.5">
                <DownloadCloud className="size-3.5" />
                Download & Install
              </Button>
            </div>
          )}

          {isUpdating && progress.status !== "done" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {progress.status === "downloading"
                    ? "Downloading binary..."
                    : "Installing update..."}
                </span>
                <span className="font-medium">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} />
            </div>
          )}

          {progress.status === "done" && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Ready to apply! Restart app to finish.</span>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleRestart}
                className="w-full gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Restart & Apply Now
              </Button>
            </div>
          )}

          {progress.status === "error" && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span className="truncate">{progress.error || "Update failed"}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="xs" onClick={() => setDismissed(true)}>
                  Close
                </Button>
                <Button variant="default" size="xs" onClick={handleStartUpdate}>
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

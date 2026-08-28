import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { useToolsStore } from "@/stores/useToolsStore";
import { BrowserOpenURL } from "@/../wailsjs/runtime/runtime";

export function ToolsTab() {
  const report = useToolsStore(state => state.report);
  const isChecking = useToolsStore(state => state.isChecking);
  const checkTools = useToolsStore(state => state.checkTools);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header with Live Status and Re-check Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            System Prerequisites & Diagnostics
          </h3>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={checkTools}
          disabled={isChecking}
          className="h-7 px-2.5 text-xs gap-1.5 active:scale-95 transition-transform"
        >
          <RefreshCw className={`size-3.5 ${isChecking ? "animate-spin text-primary" : ""}`} />
          <span>{isChecking ? "Checking..." : "Re-check Tools"}</span>
        </Button>
      </div>

      {/* Overview Card */}
      {report && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border ${
            report.allInstalled
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {report.allInstalled ? (
              <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="size-5 text-amber-500 shrink-0 animate-pulse" />
            )}
            <div>
              <p className="text-xs font-semibold text-foreground">
                {report.allInstalled
                  ? "All Required CLI Prerequisites Detected"
                  : `${report.missingCount} Required CLI Tool(s) Missing`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {report.allInstalled
                  ? "Your environment is ready to establish cluster intercepts and routing."
                  : "Please install the missing command-line binaries listed below to enable full functionality."}
              </p>
            </div>
          </div>
          <Badge
            variant={report.allInstalled ? "secondary" : "destructive"}
            className="font-mono text-xs"
          >
            {report.allInstalled ? "Ready" : "Action Required"}
          </Badge>
        </div>
      )}

      {/* Individual Tools List */}
      <div className="space-y-3">
        {report?.tools.map(tool => (
          <div
            key={tool.name}
            className="p-4 rounded-xl border border-border/60 bg-card/40 hover-card-glow space-y-2.5 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex size-6 items-center justify-center rounded-md ${
                    tool.installed
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-rose-500/15 text-rose-500"
                  }`}
                >
                  {tool.installed ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <AlertTriangle className="size-3.5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {tool.displayName}
                    </span>
                    <Badge
                      variant={tool.installed ? "secondary" : "destructive"}
                      className="text-[9px] h-4 font-mono px-1 py-0"
                    >
                      {tool.installed ? "Installed" : "Not Found"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
              </div>

              {tool.docsUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => BrowserOpenURL(tool.docsUrl)}
                  className="size-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  title="Open installation documentation"
                >
                  <ExternalLink className="size-3.5" />
                </Button>
              )}
            </div>

            {/* Binary Details */}
            {tool.installed ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                {tool.version && (
                  <div className="p-2 rounded bg-background/60 border border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Version</span>
                    <span className="font-semibold text-foreground truncate max-w-45">
                      {tool.version}
                    </span>
                  </div>
                )}
                {tool.path && (
                  <div className="p-2 rounded bg-background/60 border border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Path</span>
                    <span className="text-foreground truncate max-w-45" title={tool.path}>
                      {tool.path}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
                <span>{tool.error || "Executable not found in system PATH."}</span>
                {tool.docsUrl && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => BrowserOpenURL(tool.docsUrl)}
                    className="h-auto p-0 text-xs text-rose-400 font-semibold underline underline-offset-2"
                  >
                    Install Guide
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

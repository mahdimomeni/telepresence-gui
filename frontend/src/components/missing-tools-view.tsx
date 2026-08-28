import { models } from "@/../wailsjs/go/models";
import { BrowserOpenURL } from "@/../wailsjs/runtime/runtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Terminal,
  Sparkles,
} from "lucide-react";

interface MissingToolsViewProps {
  report: models.SystemToolsReport;
  isChecking: boolean;
  onRecheck: () => void;
}

export function MissingToolsView({ report, isChecking, onRecheck }: MissingToolsViewProps) {
  const handleOpenDocs = (url: string) => {
    if (url) {
      BrowserOpenURL(url);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-page-enter">
      <Card className="border-destructive/40 bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden relative border">
        {/* Top Subtle Amber Warning Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-amber-500 via-rose-500 to-amber-500 animate-aurora-1" />

        <CardHeader className="pb-4 pt-6 border-b border-border/40">
          <div className="flex items-start gap-4">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/30 shadow-md">
              <ShieldAlert className="size-6 text-amber-500 dark:text-amber-400 animate-pulse" />
              <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping opacity-25 pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  Required System Tools Missing
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs px-2 py-0.5"
                >
                  {report.missingCount} Missing
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Telepresence GUI requires native CLI binaries to establish secure daemon sessions
                and manage Kubernetes workloads. Please install the missing tools below to unlock
                the application.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 pb-3 space-y-3.5">
          {report.tools.map(tool => {
            const isInstalled = tool.installed;

            return (
              <div
                key={tool.name}
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  isInstalled
                    ? "border-emerald-500/30 bg-emerald-500/4"
                    : "border-destructive/30 bg-destructive/4 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5">
                      {isInstalled ? (
                        <div className="size-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 className="size-4" />
                        </div>
                      ) : (
                        <div className="size-7 rounded-lg bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
                          <XCircle className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm tracking-tight text-foreground">
                          {tool.displayName}
                        </h3>
                        {isInstalled ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] h-4.5 font-mono"
                          >
                            Installed
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] h-4.5 font-mono"
                          >
                            Not Found in PATH
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>

                      {isInstalled && tool.version && (
                        <p className="text-[11px] font-mono text-muted-foreground/80 mt-1.5 truncate">
                          Detected:{" "}
                          <span className="text-foreground font-medium">{tool.version}</span>
                        </p>
                      )}

                      {!isInstalled && tool.error && (
                        <p className="text-[11px] font-mono text-destructive/90 mt-1.5">
                          {tool.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isInstalled && tool.docsUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDocs(tool.docsUrl)}
                      className="shrink-0 h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-transform active:scale-95 cursor-pointer shadow-xs"
                      title={`Open official ${tool.displayName} install guide`}
                    >
                      <span>Install Docs</span>
                      <ExternalLink className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Helpful instructions note */}
          <div className="rounded-lg bg-muted/40 border border-border/50 p-3 text-xs text-muted-foreground flex items-center gap-2.5">
            <Terminal className="size-4 text-primary shrink-0" />
            <span>
              After installing, ensure the tool directory is added to your system{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground font-semibold">
                PATH
              </code>{" "}
              and click below to re-check.
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-5 border-t border-border/40 bg-muted/20">
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-500 animate-pulse" />
            <span>App interaction locked until tools are ready</span>
          </div>

          <Button
            onClick={onRecheck}
            disabled={isChecking}
            className="w-full sm:w-auto min-w-36 h-9 font-semibold text-xs gap-2 shadow-md hover:shadow-primary/20 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            {isChecking ? (
              <>
                <Spinner className="size-3.5 animate-spin" />
                <span>Checking System...</span>
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                <span>Re-check System Tools</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

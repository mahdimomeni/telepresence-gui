import { useEffect, useState, useCallback } from "react";
import { models } from "@/../wailsjs/go/models";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Network, FolderOpen, Sliders, Clock } from "lucide-react";
import { CoreService } from "@/services/core";
import { KubeService } from "@/services/kube";

interface TelepresenceTabProps {
  settings: models.AppSettings;
  onChange: <K extends keyof models.AppSettings>(key: K, value: models.AppSettings[K]) => void;
}

export function TelepresenceTab({ settings, onChange }: TelepresenceTabProps) {
  const [contexts, setContexts] = useState<string[]>([]);
  const [isLoadingKube, setIsLoadingKube] = useState(false);

  const loadKubeContexts = useCallback(
    async (path: string) => {
      setIsLoadingKube(true);
      try {
        const info = await KubeService.getInfo(path);
        if (info && info.contexts && info.contexts.length > 0) {
          setContexts(info.contexts);
          if (!settings.defaultContext && info.currentContext) {
            onChange("defaultContext", info.currentContext);
          }
        }
      } catch (err) {
        console.warn("Failed to load contexts from kubeconfig path:", err);
      } finally {
        setIsLoadingKube(false);
      }
    },
    [settings.defaultContext, onChange]
  );

  useEffect(() => {
    let ignore = false;
    KubeService.getInfo(settings.defaultKubeconfig)
      .then(info => {
        if (!ignore && info?.contexts && info.contexts.length > 0) {
          setContexts(info.contexts);
          if (!settings.defaultContext && info.currentContext) {
            onChange("defaultContext", info.currentContext);
          }
        }
      })
      .catch(err => {
        console.warn("Failed to load contexts from kubeconfig path:", err);
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingKube(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [settings.defaultKubeconfig, settings.defaultContext, onChange]);

  const handleBrowseKubeconfig = async () => {
    const filePath = await CoreService.browseFile("Select Kubernetes Kubeconfig File");
    if (filePath) {
      onChange("defaultKubeconfig", filePath);
      loadKubeContexts(filePath);
    }
  };

  const handleKubeconfigBlur = () => {
    loadKubeContexts(settings.defaultKubeconfig);
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. Cluster & Session Defaults */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Network className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Cluster & Session Defaults
          </h3>
        </div>

        <div className="grid gap-4 rounded-xl border border-border/60 bg-card/40 p-4">
          {/* Default Namespace */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="default-namespace" className="text-xs font-semibold text-foreground">
                Default Namespace
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">--namespace</span>
            </div>
            <Input
              id="default-namespace"
              placeholder="default"
              value={settings.defaultNamespace}
              onChange={e => onChange("defaultNamespace", e.target.value.trim())}
              className="h-8 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Pre-filled target namespace when opening the cluster connection screen.
            </p>
          </div>

          {/* Default Kubeconfig Path */}
          <div className="grid gap-1.5 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label htmlFor="default-kubeconfig" className="text-xs font-semibold text-foreground">
                Default Kubeconfig Path
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">--kubeconfig</span>
            </div>
            <div className="flex gap-2">
              <Input
                id="default-kubeconfig"
                placeholder="Leave blank to use default (~/.kube/config or $KUBECONFIG)"
                value={settings.defaultKubeconfig}
                onChange={e => onChange("defaultKubeconfig", e.target.value)}
                onBlur={handleKubeconfigBlur}
                className="h-8 text-xs font-mono flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBrowseKubeconfig}
                className="h-8 px-2.5 text-xs gap-1.5 shrink-0 active:scale-95"
              >
                <FolderOpen className="size-3.5 text-primary" />
                <span>Browse</span>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Optional custom kubeconfig path. If blank, standard system kubeconfig location is
              used.
            </p>
          </div>

          {/* Default Context */}
          <div className="grid gap-1.5 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="default-context" className="text-xs font-semibold text-foreground">
                  Default Context
                </Label>
                {isLoadingKube && <Spinner className="size-3 text-primary animate-spin" />}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">--context</span>
            </div>

            {contexts.length > 0 ? (
              <Select
                value={settings.defaultContext}
                onValueChange={val => onChange("defaultContext", val || "")}
              >
                <SelectTrigger id="default-context" className="w-full h-8 text-xs font-mono">
                  <SelectValue
                    placeholder={settings.defaultContext || "Select target cluster context"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {contexts.map(ctx => (
                    <SelectItem key={ctx} value={ctx} className="text-xs font-mono">
                      {ctx}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="default-context"
                placeholder="e.g. minikube, gke_project_region_cluster"
                value={settings.defaultContext}
                onChange={e => onChange("defaultContext", e.target.value.trim())}
                className="h-8 text-xs font-mono"
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              Initial Kubernetes context selected by default upon connection.
            </p>
          </div>

          {/* Traffic Manager Namespace */}
          <div className="grid gap-1.5 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label htmlFor="default-manager-ns" className="text-xs font-semibold text-foreground">
                Traffic Manager Namespace
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                --manager-namespace
              </span>
            </div>
            <Input
              id="default-manager-ns"
              placeholder="e.g. ambassador (optional)"
              value={settings.managerNamespace}
              onChange={e => onChange("managerNamespace", e.target.value.trim())}
              className="h-8 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Namespace where the Telepresence Traffic Manager pod is deployed in the cluster.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Engine Timers & Polling */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Execution Timers & Health Monitoring
          </h3>
        </div>

        <div className="grid gap-4 rounded-xl border border-border/60 bg-card/40 p-4">
          {/* CLI Request Timeout */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="request-timeout" className="text-xs font-semibold text-foreground">
                CLI Command Timeout (Seconds)
              </Label>
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {settings.requestTimeoutSeconds}s
              </Badge>
            </div>
            <Input
              id="request-timeout"
              type="number"
              min={10}
              max={600}
              step={5}
              value={settings.requestTimeoutSeconds}
              onChange={e => onChange("requestTimeoutSeconds", Number(e.target.value) || 60)}
              className="h-8 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Maximum seconds to wait for Telepresence CLI operations (connect, intercept, list)
              before aborting.
            </p>
          </div>

          {/* Background Status Poll Interval */}
          <div className="grid gap-1.5 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label htmlFor="poll-interval" className="text-xs font-semibold text-foreground">
                Background Status Heartbeat Interval
              </Label>
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {settings.pollIntervalSeconds}s
              </Badge>
            </div>
            <Select
              value={String(settings.pollIntervalSeconds)}
              onValueChange={val => onChange("pollIntervalSeconds", Number(val) || 4)}
            >
              <SelectTrigger id="poll-interval" className="w-full h-8 text-xs font-mono">
                <SelectValue placeholder="Select heartbeat interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2" className="text-xs">
                  2 Seconds (High frequency - fast updates)
                </SelectItem>
                <SelectItem value="4" className="text-xs">
                  4 Seconds (Recommended - balanced)
                </SelectItem>
                <SelectItem value="8" className="text-xs">
                  8 Seconds (Low resource consumption)
                </SelectItem>
                <SelectItem value="15" className="text-xs">
                  15 Seconds (Minimal background load)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Rate at which the background watcher syncs cluster status and intercepts.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Advanced Daemon Flags */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Daemon & Networking Flags
          </h3>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
          {/* Docker Daemon Mode */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="docker-mode-toggle"
                  className="text-xs font-semibold text-foreground cursor-pointer"
                >
                  Default Docker Daemon Mode
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">--docker</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Run the Telepresence User Daemon inside a local Docker container rather than
                natively on host.
              </p>
            </div>
            <Switch
              id="docker-mode-toggle"
              checked={settings.dockerDaemonMode}
              onCheckedChange={checked => onChange("dockerDaemonMode", checked)}
            />
          </div>

          {/* Insecure Skip TLS */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="insecure-tls-toggle"
                  className="text-xs font-semibold text-foreground cursor-pointer"
                >
                  Insecure Skip TLS Verify
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  --insecure-skip-tls-verify
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Skip cluster server TLS certificate verification. Useful for development or
                self-signed clusters.
              </p>
            </div>
            <Switch
              id="insecure-tls-toggle"
              checked={settings.insecureSkipTLS}
              onCheckedChange={checked => onChange("insecureSkipTLS", checked)}
            />
          </div>

          {/* Disable Compression */}
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="compression-toggle"
                  className="text-xs font-semibold text-foreground cursor-pointer"
                >
                  Disable Response Compression
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  --disable-compression
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Prevent gRPC / HTTP response compression between user daemon and cluster traffic
                manager.
              </p>
            </div>
            <Switch
              id="compression-toggle"
              checked={settings.disableCompression}
              onCheckedChange={checked => onChange("disableCompression", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

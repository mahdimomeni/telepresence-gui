import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContextInput } from "@/components/context-input";
import { Spinner } from "@/components/ui/spinner";
import { models } from "../../wailsjs/go/models";
import { TelepresenceService } from "@/services/telepresence";
import { CoreService } from "@/services/core";
import { useLoadingStore } from "@/stores/useLoadingStore";
import {
  Check,
  Copy,
  Folder,
  Globe,
  HardDrive,
  Info,
  Layers,
  Radio,
  Server,
  Terminal,
  Trash2,
  ExternalLink,
  FileCode,
} from "lucide-react";

interface WorkloadDetailsDialogProps {
  workload: models.Workload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function CopyButton({
  text,
  label = "Copy",
  size = "sm",
  variant = "ghost",
  className = "",
}: {
  text: string;
  label?: string;
  size?: "sm" | "icon-sm" | "icon";
  variant?: "ghost" | "outline" | "secondary" | "default";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      title={label}
      className={className}
      type="button"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" />
      )}
      {size === "sm" && <span className="ml-1 text-xs">{copied ? "Copied" : label}</span>}
    </Button>
  );
}

export function WorkloadDetailsDialog({
  workload,
  open,
  onOpenChange,
  onSuccess,
}: WorkloadDetailsDialogProps) {
  const [envSearch, setEnvSearch] = useState("");

  const isDetaching = useLoadingStore(state =>
    workload ? state.isLoading(`detach-${workload.name}`) : false
  );
  const startLoading = useLoadingStore(state => state.startLoading);
  const stopLoading = useLoadingStore(state => state.stopLoading);
  const interceptInfo = workload?.intercept_info?.[0];
  const spec = interceptInfo?.spec;
  const isReplaced = Boolean(spec?.replace);
  const isAttached = Boolean(interceptInfo);

  const envEntries = useMemo(() => {
    if (!interceptInfo?.environment) return [];
    return Object.entries(interceptInfo.environment);
  }, [interceptInfo]);

  const filteredEnv = useMemo(() => {
    if (!envSearch.trim()) return envEntries;
    const q = envSearch.toLowerCase();
    return envEntries.filter(
      ([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
    );
  }, [envEntries, envSearch]);

  const headerEntries = useMemo(() => {
    if (!spec?.header_filters) return [];
    return Object.entries(spec.header_filters);
  }, [spec]);

  const mountEntries = useMemo(() => {
    if (!interceptInfo?.mounts) return [];
    return Object.entries(interceptInfo.mounts);
  }, [interceptInfo]);

  const handleCopyAllEnv = (format: "env" | "json") => {
    if (!interceptInfo?.environment) return;
    if (format === "json") {
      navigator.clipboard.writeText(JSON.stringify(interceptInfo.environment, null, 2));
    } else {
      const text = Object.entries(interceptInfo.environment)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
      navigator.clipboard.writeText(text);
    }
  };

  const handleDetach = async () => {
    if (!workload) return;
    startLoading(`detach-${workload.name}`);
    try {
      await TelepresenceService.detachWorkload({
        attachment_name: workload.name,
        namespace: workload.namespace,
      });
      CoreService.notify(
        isReplaced ? "Telepresence Replace Detached" : "Telepresence Detach Active",
        `Successfully detached ${workload.name}`
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      CoreService.notify("Telepresence Detach Error", `Detach failed: ${String(error)}`);
    } finally {
      stopLoading(`detach-${workload.name}`);
    }
  };

  const targetHost = spec?.target_host || "127.0.0.1";
  const targetPort = spec?.target_port || 0;
  const targetEndpoint = targetPort ? `${targetHost}:${targetPort}` : targetHost;

  const formattedDate = interceptInfo?.modified_at?.seconds
    ? new Date(interceptInfo.modified_at.seconds * 1000).toLocaleString()
    : "N/A";

  if (!workload) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="gap-1 border-b pb-4 shrink-0">
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  isReplaced
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}
              >
                {isReplaced ? <Layers className="size-5" /> : <Radio className="size-5" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  {workload.name}
                  {isReplaced ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-xs font-semibold"
                    >
                      Replaced
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-semibold"
                    >
                      Intercepted
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {workload.workload_resource_type || "Workload"} &bull; Namespace:{" "}
                  <span className="font-medium text-foreground">{workload.namespace}</span>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 my-1">
          <div className="p-2.5 rounded-lg border bg-card/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="flex items-center gap-1 font-medium">
                <ExternalLink className="size-3" /> Target Port
              </span>
              {targetPort > 0 && <CopyButton text={targetEndpoint} size="icon-sm" />}
            </div>
            <div className="text-sm font-mono font-semibold truncate" title={targetEndpoint}>
              {targetEndpoint}
            </div>
          </div>

          <div className="p-2.5 rounded-lg border bg-card/60 flex flex-col gap-1">
            <div className="flex items-center text-muted-foreground text-xs font-medium gap-1">
              <Server className="size-3" /> Container
            </div>
            <div
              className="text-sm font-mono font-semibold truncate"
              title={spec?.container_name || "default"}
            >
              {spec?.container_name || "default"}
              {spec?.container_port ? `:${spec.container_port}` : ""}
            </div>
          </div>

          <div className="p-2.5 rounded-lg border bg-card/60 flex flex-col gap-1">
            <div className="flex items-center text-muted-foreground text-xs font-medium gap-1">
              <Globe className="size-3" /> Mechanism
            </div>
            <div className="text-sm font-semibold truncate">
              {spec?.mechanism?.toUpperCase() || "TCP"}
              {spec?.plaintext && (
                <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                  (Plaintext)
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-lg border bg-card/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="flex items-center gap-1 font-medium">
                <Folder className="size-3" /> Mount Point
              </span>
              {interceptInfo?.mount_point && (
                <CopyButton text={interceptInfo.mount_point} size="icon-sm" />
              )}
            </div>
            <div
              className="text-sm font-mono font-semibold truncate"
              title={interceptInfo?.mount_point || "None"}
            >
              {interceptInfo?.mount_point ? (
                <span className="text-emerald-600 dark:text-emerald-400">Mounted</span>
              ) : (
                <span className="text-muted-foreground font-normal">Disabled</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 shrink-0 mb-3">
              <TabsTrigger value="overview" className="gap-1 text-xs">
                <Info className="size-3.5" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="routing" className="gap-1 text-xs">
                <Globe className="size-3.5" />
                <span>Routing</span>
                {headerEntries.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-[10px] h-4 font-mono">
                    {headerEntries.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mounts" className="gap-1 text-xs">
                <HardDrive className="size-3.5" />
                <span>Mounts</span>
                {interceptInfo?.mount_point && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-[10px] h-4 font-mono">
                    1
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="environment" className="gap-1 text-xs">
                <Terminal className="size-3.5" />
                <span>Env</span>
                {envEntries.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-[10px] h-4 font-mono">
                    {envEntries.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent
              value="overview"
              className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm m-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              <div className="rounded-lg border divide-y bg-card/40">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Workload Kind & Name</span>
                  <span className="font-mono text-xs font-medium">
                    {workload.workload_resource_type}/{workload.name}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Target Host & Port</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold">{targetEndpoint}</span>
                    <CopyButton text={targetEndpoint} size="icon-sm" />
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Service & Port</span>
                  <span className="font-mono text-xs">
                    {spec?.service_port_name || "Port"} : {spec?.service_port || "N/A"}
                    {spec?.service_uid ? ` (${spec.service_uid.slice(0, 8)}...)` : ""}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Target Container</span>
                  <span className="font-mono text-xs">
                    {spec?.container_name || "default"}
                    {spec?.container_port ? ` (Port: ${spec.container_port})` : ""}
                  </span>
                </div>
                {interceptInfo?.pod_name && (
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Remote Pod Name</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs truncate max-w-70">
                        {interceptInfo.pod_name}
                      </span>
                      <CopyButton text={interceptInfo.pod_name} size="icon-sm" />
                    </div>
                  </div>
                )}
                {interceptInfo?.pod_ip && (
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Remote Pod IP</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs">{interceptInfo.pod_ip}</span>
                      <CopyButton text={interceptInfo.pod_ip} size="icon-sm" />
                    </div>
                  </div>
                )}
                {spec?.agent && (
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Agent Version</span>
                    <span className="font-mono text-xs">{spec.agent}</span>
                  </div>
                )}
                {spec?.client && (
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Client User / Host</span>
                    <span className="font-mono text-xs">{spec.client}</span>
                  </div>
                )}
                {interceptInfo?.id && (
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Intercept ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-muted-foreground truncate max-w-65">
                        {interceptInfo.id}
                      </span>
                      <CopyButton text={interceptInfo.id} size="icon-sm" />
                    </div>
                  </div>
                )}
                <div className="p-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Modified At</span>
                  <span className="text-xs text-muted-foreground">{formattedDate}</span>
                </div>
              </div>
            </TabsContent>

            {/* Routing & Headers Tab */}
            <TabsContent
              value="routing"
              className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm m-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              {headerEntries.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    This intercept is filtered. Traffic matching the following HTTP headers is
                    forwarded to your local target:
                  </div>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                        <tr>
                          <th className="p-2.5">Header Name</th>
                          <th className="p-2.5">Value Match</th>
                          <th className="p-2.5 w-10 text-right">Copy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono">
                        {headerEntries.map(([k, v]) => (
                          <tr key={k} className="hover:bg-muted/30">
                            <td className="p-2.5 font-semibold text-foreground">{k}</td>
                            <td className="p-2.5 text-muted-foreground">{String(v)}</td>
                            <td className="p-2.5 text-right">
                              <CopyButton text={`${k}: ${v}`} size="icon-sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground space-y-2">
                  <Globe className="size-8 mx-auto opacity-40 text-primary" />
                  <div className="font-semibold text-foreground text-sm">
                    Global Intercept (All Traffic)
                  </div>
                  <p className="text-xs max-w-md mx-auto">
                    No HTTP header filters were specified. All inbound traffic to this workload is
                    currently intercepted and forwarded to your local instance.
                  </p>
                </div>
              )}

              {spec?.mechanism && (
                <div className="rounded-lg border p-3 bg-card/40 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mechanism</span>
                  <span className="font-mono font-medium">{spec.mechanism}</span>
                </div>
              )}
            </TabsContent>

            {/* Mounts Tab */}
            <TabsContent
              value="mounts"
              className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm m-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              {interceptInfo?.mount_point ? (
                <div className="space-y-3">
                  <div className="rounded-lg border p-3.5 bg-card/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <HardDrive className="size-3.5 text-emerald-500" /> Local Mount Directory
                      </span>
                      <CopyButton text={interceptInfo.mount_point} label="Copy Path" size="sm" />
                    </div>
                    <div className="p-2 rounded bg-muted/70 font-mono text-xs break-all select-all border">
                      {interceptInfo.mount_point}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Remote pod filesystem volumes are mounted locally at this directory.
                    </p>
                  </div>

                  <div className="rounded-lg border divide-y bg-card/40 text-xs">
                    {interceptInfo.sftp_port > 0 && (
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-muted-foreground">SFTP Port</span>
                        <span className="font-mono">{interceptInfo.sftp_port}</span>
                      </div>
                    )}
                    {interceptInfo.ftp_port > 0 && (
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-muted-foreground">FTP Port</span>
                        <span className="font-mono">{interceptInfo.ftp_port}</span>
                      </div>
                    )}
                  </div>

                  {mountEntries.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground">
                        Remote Mount Mappings
                      </div>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                            <tr>
                              <th className="p-2">Remote Path</th>
                              <th className="p-2">Port</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y font-mono">
                            {mountEntries.map(([path, port]) => (
                              <tr key={path} className="hover:bg-muted/30">
                                <td className="p-2">{path}</td>
                                <td className="p-2 text-muted-foreground">{port}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground space-y-2">
                  <Folder className="size-8 mx-auto opacity-40 text-primary" />
                  <div className="font-semibold text-foreground text-sm">
                    Volume Mounts Disabled
                  </div>
                  <p className="text-xs max-w-md mx-auto">
                    Remote filesystem mounting was not enabled for this interception/replacement.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Environment Variables Tab */}
            <TabsContent
              value="environment"
              className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm m-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              {envEntries.length > 0 ? (
                <div className="space-y-2.5 flex flex-col h-full">
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <ContextInput
                      placeholder="Filter environment variables..."
                      value={envSearch}
                      onChange={e => setEnvSearch(e.target.value)}
                      className="h-8 text-xs max-w-xs"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleCopyAllEnv("env")}
                        title="Copy all variables as KEY=VALUE"
                      >
                        <FileCode className="size-3 mr-1" />
                        .env
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleCopyAllEnv("json")}
                        title="Copy all variables as JSON"
                      >
                        JSON
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-hidden flex-1 min-h-0">
                    <div className="max-h-75 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b font-medium text-muted-foreground sticky top-0">
                          <tr>
                            <th className="p-2.5">Key</th>
                            <th className="p-2.5">Value</th>
                            <th className="p-2.5 w-10 text-right">Copy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono">
                          {filteredEnv.length > 0 ? (
                            filteredEnv.map(([key, val]) => (
                              <tr key={key} className="hover:bg-muted/30 group">
                                <td className="p-2.5 font-semibold text-foreground select-all align-top">
                                  {key}
                                </td>
                                <td className="p-2.5 text-muted-foreground break-all select-all align-top max-w-70">
                                  {String(val)}
                                </td>
                                <td className="p-2.5 text-right align-top">
                                  <CopyButton text={`${key}=${val}`} size="icon-sm" />
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                No environment variables matching &quot;{envSearch}&quot;
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground space-y-2">
                  <Terminal className="size-8 mx-auto opacity-40 text-primary" />
                  <div className="font-semibold text-foreground text-sm">
                    No Environment Captured
                  </div>
                  <p className="text-xs max-w-md mx-auto">
                    No remote container environment variables were received in the intercept
                    metadata.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t flex justify-between sm:justify-between items-center shrink-0">
          <div>
            {isAttached && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDetach}
                disabled={isDetaching}
                className="gap-1.5"
              >
                {isDetaching ? <Spinner className="size-3.5" /> : <Trash2 className="size-3.5" />}
                Detach {isReplaced ? "Replace" : "Intercept"}
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

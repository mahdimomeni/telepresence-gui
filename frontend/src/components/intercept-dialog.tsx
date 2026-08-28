import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronUpIcon, Laptop, Container, Hammer, Radio } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { models } from "../../wailsjs/go/models";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { TelepresenceService } from "@/services/telepresence";
import { CoreService } from "@/services/core";
import { ContextInput } from "@/components/context-input";

interface InterceptDialogProps {
  workloadName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ExecutionMode = "local" | "docker-run" | "docker-build";

export function InterceptDialog({
  workloadName,
  open,
  onOpenChange,
  onSuccess,
}: InterceptDialogProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const loading = useLoadingStore(state => state.isLoading(`intercept-${workloadName}`));
  const startLoading = useLoadingStore(state => state.startLoading);
  const stopLoading = useLoadingStore(state => state.stopLoading);

  const [mode, setMode] = useState<ExecutionMode>("local");
  const [toPodInput, setToPodInput] = useState("");
  const [dockerBuildOptInput, setDockerBuildOptInput] = useState("");
  const [envFormat, setEnvFormat] = useState("docker");
  const [envFile, setEnvFile] = useState("");

  const [interceptConfig, setInterceptConfig] = useState<models.InterceptConfig>(
    new models.InterceptConfig({
      workload: workloadName,
      port: "8080",
      address: "127.0.0.1",
      container: "",
      service: "",
      namespace: "",
      http_header: "",
      http_path_prefix: "",
      mount: "",
      local_mount_port: 0,
      to_pod: [],
      env_file: "",
      env_json: "",
      env_syntax: "",
      docker_run: false,
      docker_args: "",
      docker_build: "",
      docker_build_opt: [],
      docker_debug: "",
      docker_mount: "",
    })
  );

  const handleModeChange = (newMode: string) => {
    const m = newMode as ExecutionMode;
    setMode(m);
    setInterceptConfig(prev => ({
      ...prev,
      docker_run: m === "docker-run",
      docker_build: m === "docker-build" ? prev.docker_build || "./" : "",
    }));
  };

  const handleFieldChange = (
    key: keyof models.InterceptConfig,
    value: models.InterceptConfig[keyof models.InterceptConfig]
  ) => {
    setInterceptConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleIntercept = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    startLoading(`intercept-${workloadName}`);

    try {
      const toPodList = toPodInput
        .split(",")
        .map(p => p.trim())
        .filter(Boolean);

      const buildOptsList = dockerBuildOptInput
        .split(",")
        .map(o => o.trim())
        .filter(Boolean);

      const isJson = envFormat === "json";
      const finalEnvFile = !isJson ? envFile : "";
      const finalEnvJson = isJson ? envFile : "";
      const finalSyntax = !isJson && envFormat !== "docker" ? envFormat : "";

      const configToSubmit: models.InterceptConfig = {
        ...interceptConfig,
        workload: workloadName,
        env_file: finalEnvFile,
        env_json: finalEnvJson,
        env_syntax: finalSyntax,
        docker_run: mode === "docker-run",
        docker_build: mode === "docker-build" ? interceptConfig.docker_build : "",
        to_pod: toPodList,
        docker_build_opt: buildOptsList,
      };

      await TelepresenceService.interceptWorkload(configToSubmit);
      CoreService.notify(
        "Telepresence Intercept Active",
        `Successfully intercepted ${workloadName}`
      );
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      CoreService.notify("Telepresence Intercept Error", `Intercept failed: ${String(error)}`);
    } finally {
      stopLoading(`intercept-${workloadName}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal={loading}>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleIntercept}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                <Radio className="size-4" />
              </div>
              <DialogTitle>Intercept Workload</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Route inbound cluster traffic from{" "}
              <strong className="text-foreground">{workloadName}</strong> to your local development
              environment.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={mode} onValueChange={handleModeChange} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="local" className="gap-1.5 text-xs">
                <Laptop className="size-3.5" />
                <span>Local Process</span>
              </TabsTrigger>
              <TabsTrigger value="docker-run" className="gap-1.5 text-xs">
                <Container className="size-3.5" />
                <span>Docker Run</span>
              </TabsTrigger>
              <TabsTrigger value="docker-build" className="gap-1.5 text-xs">
                <Hammer className="size-3.5" />
                <span>Docker Build</span>
              </TabsTrigger>
            </TabsList>

            <div className="grid gap-3 py-4">
              {/* Port */}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="intercept-port" className="text-right text-xs font-semibold">
                  Port <span className="text-destructive">*</span>
                </Label>
                <ContextInput
                  id="intercept-port"
                  value={interceptConfig.port}
                  onChange={e => handleFieldChange("port", e.target.value)}
                  className="col-span-3 h-8 text-sm"
                  placeholder="8080 or 8080:80"
                  required
                  disabled={loading}
                />
              </div>

              {/* HTTP Header Filter */}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="intercept-httpHeader" className="text-right text-xs">
                  HTTP Header
                </Label>
                <ContextInput
                  id="intercept-httpHeader"
                  value={interceptConfig.http_header}
                  onChange={e => handleFieldChange("http_header", e.target.value)}
                  className="col-span-3 h-8 text-sm"
                  placeholder="x-dev-user=mohammad"
                  disabled={loading}
                />
              </div>

              {/* HTTP Path Prefix Filter */}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="intercept-httpPath" className="text-right text-xs">
                  Path Prefix
                </Label>
                <ContextInput
                  id="intercept-httpPath"
                  value={interceptConfig.http_path_prefix}
                  onChange={e => handleFieldChange("http_path_prefix", e.target.value)}
                  className="col-span-3 h-8 text-sm"
                  placeholder="/api/v1"
                  disabled={loading}
                />
              </div>

              {/* Local Address */}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="intercept-address" className="text-right text-xs">
                  Local Address
                </Label>
                <ContextInput
                  id="intercept-address"
                  value={interceptConfig.address}
                  onChange={e => handleFieldChange("address", e.target.value)}
                  className="col-span-3 h-8 text-sm"
                  placeholder="127.0.0.1"
                  disabled={loading}
                />
              </div>

              {/* Container */}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="intercept-container" className="text-right text-xs">
                  Container
                </Label>
                <ContextInput
                  id="intercept-container"
                  value={interceptConfig.container}
                  onChange={e => handleFieldChange("container", e.target.value)}
                  className="col-span-3 h-8 text-sm"
                  placeholder="Leave empty if single container"
                  disabled={loading}
                />
              </div>

              {/* LOCAL MODE */}
              <TabsContent value="local" className="space-y-3 m-0">
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="intercept-envFile" className="text-right text-xs">
                    Env Output
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <ContextInput
                      id="intercept-envFile"
                      value={envFile}
                      onChange={e => setEnvFile(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      placeholder="/path/to/output.env"
                      disabled={loading}
                    />
                    <Select
                      value={envFormat}
                      onValueChange={val => val && setEnvFormat(val)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="docker">.env (Docker)</SelectItem>
                        <SelectItem value="sh">Shell (sh)</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csh">C-Shell (csh)</SelectItem>
                        <SelectItem value="cmd">Windows (cmd)</SelectItem>
                        <SelectItem value="ps">PowerShell (ps)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* DOCKER RUN MODE */}
              <TabsContent value="docker-run" className="space-y-3 m-0">
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label
                    htmlFor="intercept-dockerArgs"
                    className="text-right text-xs font-semibold"
                  >
                    Docker Args <span className="text-destructive">*</span>
                  </Label>
                  <ContextInput
                    id="intercept-dockerArgs"
                    value={interceptConfig.docker_args}
                    onChange={e => handleFieldChange("docker_args", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="-it --rm ubuntu:20.04 /bin/bash"
                    required={mode === "docker-run"}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="intercept-dockerMount" className="text-right text-xs">
                    Docker Mount
                  </Label>
                  <ContextInput
                    id="intercept-dockerMount"
                    value={interceptConfig.docker_mount}
                    onChange={e => handleFieldChange("docker_mount", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="Defaults to mount point"
                    disabled={loading}
                  />
                </div>
              </TabsContent>

              {/* DOCKER BUILD MODE */}
              <TabsContent value="docker-build" className="space-y-3 m-0">
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label
                    htmlFor="intercept-dockerBuild"
                    className="text-right text-xs font-semibold"
                  >
                    Context Path <span className="text-destructive">*</span>
                  </Label>
                  <ContextInput
                    id="intercept-dockerBuild"
                    value={interceptConfig.docker_build}
                    onChange={e => handleFieldChange("docker_build", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="./ or /path/to/docker/context"
                    required={mode === "docker-build"}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="intercept-dockerBuildOpt" className="text-right text-xs">
                    Build Options
                  </Label>
                  <ContextInput
                    id="intercept-dockerBuildOpt"
                    value={dockerBuildOptInput}
                    onChange={e => setDockerBuildOptInput(e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="tag=mytag, target=dev"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="intercept-dockerDebug" className="text-right text-xs">
                    Docker Debug
                  </Label>
                  <ContextInput
                    id="intercept-dockerDebug"
                    value={interceptConfig.docker_debug}
                    onChange={e => handleFieldChange("docker_debug", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="Optional debug context"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="intercept-dockerArgs-build" className="text-right text-xs">
                    Run Flags
                  </Label>
                  <ContextInput
                    id="intercept-dockerArgs-build"
                    value={interceptConfig.docker_args}
                    onChange={e => handleFieldChange("docker_args", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="-it IMAGE /bin/bash"
                    disabled={loading}
                  />
                </div>
              </TabsContent>

              {/* ADVANCED SECTION */}
              <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="w-full mt-2"
              >
                <CollapsibleTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full flex justify-between text-muted-foreground"
                    />
                  }
                >
                  <span>Advanced Routing</span>
                  {isAdvancedOpen ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3 border-t mt-2">
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="intercept-mount" className="text-right text-xs">
                      Mount Point
                    </Label>
                    <ContextInput
                      id="intercept-mount"
                      value={interceptConfig.mount}
                      onChange={e => handleFieldChange("mount", e.target.value)}
                      className="col-span-3 h-8 text-xs"
                      placeholder="true (default), false, or /path"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="intercept-service" className="text-right text-xs">
                      Service
                    </Label>
                    <ContextInput
                      id="intercept-service"
                      value={interceptConfig.service}
                      onChange={e => handleFieldChange("service", e.target.value)}
                      className="col-span-3 h-8 text-xs"
                      placeholder="Optional service name"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="intercept-toPod" className="text-right text-xs">
                      To-Pod Ports
                    </Label>
                    <ContextInput
                      id="intercept-toPod"
                      value={toPodInput}
                      onChange={e => setToPodInput(e.target.value)}
                      className="col-span-3 h-8 text-xs"
                      placeholder="e.g. 9090, 53/UDP"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="intercept-localMountPort" className="text-right text-xs">
                      Mount Port
                    </Label>
                    <ContextInput
                      id="intercept-localMountPort"
                      type="number"
                      value={
                        interceptConfig.local_mount_port
                          ? String(interceptConfig.local_mount_port)
                          : ""
                      }
                      onChange={e =>
                        handleFieldChange("local_mount_port", parseInt(e.target.value, 10) || 0)
                      }
                      className="col-span-3 h-8 text-xs"
                      placeholder="Expose local port for external mounter"
                      disabled={loading}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2" />}
              Start Intercept
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

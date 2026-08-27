import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { models } from "../../wailsjs/go/models"
import { useLoadingStore } from "@/stores/useLoadingStore"
import { TelepresenceService } from "@/services/telepresence"
import { CoreService } from "@/services/core"
import { ContextInput } from "@/components/context-input"

interface ReplaceDialogProps {
  workloadName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type ExecutionMode = "local" | "docker-run" | "docker-build"

export function ReplaceDialog({ workloadName, open, onOpenChange, onSuccess }: ReplaceDialogProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const loading = useLoadingStore((state) => state.isLoading(`replace-${workloadName}`))
  const startLoading = useLoadingStore((state) => state.startLoading)
  const stopLoading = useLoadingStore((state) => state.stopLoading)

  const [mode, setMode] = useState<ExecutionMode>("local")
  const [toPodInput, setToPodInput] = useState("")
  const [dockerBuildOptInput, setDockerBuildOptInput] = useState("")

  const [replaceConfig, setReplaceConfig] = useState<models.ReplaceConfig>(
    new models.ReplaceConfig({
      workload: workloadName,
      port: "all",
      container: "",
      address: "127.0.0.1",
      mount: "true",
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
      namespace: "",
    })
  )

  useEffect(() => {
    setReplaceConfig((prev) => ({ ...prev, workload: workloadName }))
  }, [workloadName])

  const [envFormat, setEnvFormat] = useState("docker")
  const [envFile, setEnvFile] = useState("")

  useEffect(() => {
    const isJson = envFormat === "json"
    const finalEnvFile = !isJson ? envFile : ""
    const finalEnvJson = isJson ? envFile : ""
    const finalSyntax = (!isJson && envFormat !== "docker") ? envFormat : ""

    setReplaceConfig((prev) => ({
      ...prev,
      env_file: finalEnvFile,
      env_json: finalEnvJson,
      env_syntax: finalSyntax,
    }))
  }, [envFormat, envFile])

  const handleModeChange = (newMode: string) => {
    const m = newMode as ExecutionMode
    setMode(m)
    setReplaceConfig((prev) => ({
      ...prev,
      docker_run: m === "docker-run",
      docker_build: m === "docker-build" ? (prev.docker_build || "./") : "",
    }))
  }

  const handleFieldChange = (key: keyof models.ReplaceConfig, value: any) => {
    setReplaceConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleReplace = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    startLoading(`replace-${workloadName}`)

    try {
      const toPodList = toPodInput
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)

      const buildOptsList = dockerBuildOptInput
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)

      const configToSubmit: models.ReplaceConfig = {
        ...replaceConfig,
        docker_run: mode === "docker-run",
        docker_build: mode === "docker-build" ? replaceConfig.docker_build : "",
        to_pod: toPodList,
        docker_build_opt: buildOptsList,
      }

      await TelepresenceService.replaceWorkload(configToSubmit)
      CoreService.notify("Telepresence Replace Active", `Successfully replaced ${workloadName}`)
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      CoreService.notify("Telepresence Replace Error", `Replace failed: ${String(error)}`)
    } finally {
      stopLoading(`replace-${workloadName}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal={loading}>
      <DialogContent className="sm:max-w-120 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleReplace}>
          <DialogHeader>
            <DialogTitle>Replace Workload</DialogTitle>
            <DialogDescription>
              Removes remote container from <strong>{workloadName}</strong> and reroutes all traffic, environment, and volumes to your workstation.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={mode}
            onValueChange={handleModeChange}
            className="w-full mt-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="local">Local Process</TabsTrigger>
              <TabsTrigger value="docker-run">Docker Run</TabsTrigger>
              <TabsTrigger value="docker-build">Docker Build</TabsTrigger>
            </TabsList>

            <div className="grid gap-3 py-4">
              {/* Port */}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="replace-port" className="text-right text-xs font-semibold">
                  Ports
                </Label>
                <div className="col-span-3">
                  <ContextInput
                    id="replace-port"
                    value={replaceConfig.port}
                    onChange={(e) => handleFieldChange("port", e.target.value)}
                    placeholder="all, or 8080, or 8080:80"
                    disabled={loading}
                    className="h-8 text-sm"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Use &quot;all&quot; (default) or &lt;local-port&gt;:&lt;container-port&gt;
                  </span>
                </div>
              </div>

              {/* Container */}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="replace-container" className="text-right text-xs">
                  Container
                </Label>
                <ContextInput
                  id="replace-container"
                  value={replaceConfig.container}
                  onChange={(e) => handleFieldChange("container", e.target.value)}
                  className="col-span-3 h-8 text-sm"
                  placeholder="Leave empty if single container"
                  disabled={loading}
                />
              </div>

              {/* Address */}
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="replace-address" className="text-right text-xs">
                  Local Address
                </Label>
                <ContextInput
                  id="replace-address"
                  value={replaceConfig.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  className="col-span-3 h-8 text-sm"
                  placeholder="127.0.0.1"
                  disabled={loading}
                />
              </div>

              {/* LOCAL MODE: Env file */}
              <TabsContent value="local" className="space-y-3 m-0">
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="replace-envFile" className="text-right text-xs">
                    Env Output
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <ContextInput
                      id="replace-envFile"
                      value={envFile}
                      onChange={(e) => setEnvFile(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      placeholder="/path/to/output.env"
                      disabled={loading}
                    />
                    <Select value={envFormat} onValueChange={(val) => val && setEnvFormat(val)} disabled={loading}>
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
                  <Label htmlFor="replace-dockerArgs" className="text-right text-xs font-semibold">
                    Docker Args <span className="text-destructive">*</span>
                  </Label>
                  <ContextInput
                    id="replace-dockerArgs"
                    value={replaceConfig.docker_args}
                    onChange={(e) => handleFieldChange("docker_args", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="-it --rm ubuntu:20.04 /bin/bash"
                    required={mode === "docker-run"}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="replace-dockerMount" className="text-right text-xs">
                    Docker Mount
                  </Label>
                  <ContextInput
                    id="replace-dockerMount"
                    value={replaceConfig.docker_mount}
                    onChange={(e) => handleFieldChange("docker_mount", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="Defaults to mount point"
                    disabled={loading}
                  />
                </div>
              </TabsContent>

              {/* DOCKER BUILD MODE */}
              <TabsContent value="docker-build" className="space-y-3 m-0">
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="replace-dockerBuild" className="text-right text-xs font-semibold">
                    Context Path <span className="text-destructive">*</span>
                  </Label>
                  <ContextInput
                    id="replace-dockerBuild"
                    value={replaceConfig.docker_build}
                    onChange={(e) => handleFieldChange("docker_build", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="./ or /path/to/docker/context"
                    required={mode === "docker-build"}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="replace-dockerBuildOpt" className="text-right text-xs">
                    Build Options
                  </Label>
                  <ContextInput
                    id="replace-dockerBuildOpt"
                    value={dockerBuildOptInput}
                    onChange={(e) => setDockerBuildOptInput(e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="tag=mytag, target=dev"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="replace-dockerDebug" className="text-right text-xs">
                    Docker Debug
                  </Label>
                  <ContextInput
                    id="replace-dockerDebug"
                    value={replaceConfig.docker_debug}
                    onChange={(e) => handleFieldChange("docker_debug", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="Optional debug context"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="replace-dockerArgs-build" className="text-right text-xs">
                    Run Flags
                  </Label>
                  <ContextInput
                    id="replace-dockerArgs-build"
                    value={replaceConfig.docker_args}
                    onChange={(e) => handleFieldChange("docker_args", e.target.value)}
                    className="col-span-3 h-8 text-sm"
                    placeholder="-it IMAGE /bin/bash"
                    disabled={loading}
                  />
                </div>
              </TabsContent>

              {/* ADVANCED SECTION */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="w-full mt-2">
                <CollapsibleTrigger
                  render={
                    <Button variant="ghost" size="sm" className="w-full flex justify-between text-muted-foreground" />
                  }
                >
                  <span>Advanced Settings</span>
                  {isAdvancedOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3 border-t mt-2">
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="replace-mount" className="text-right text-xs">
                      Mount
                    </Label>
                    <ContextInput
                      id="replace-mount"
                      value={replaceConfig.mount}
                      onChange={(e) => handleFieldChange("mount", e.target.value)}
                      className="col-span-3 h-8 text-xs"
                      placeholder="true (default), false, /path, /path:ro"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="replace-toPod" className="text-right text-xs">
                      To-Pod Ports
                    </Label>
                    <ContextInput
                      id="replace-toPod"
                      value={toPodInput}
                      onChange={(e) => setToPodInput(e.target.value)}
                      className="col-span-3 h-8 text-xs"
                      placeholder="e.g. 9090, 53/UDP"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="replace-localMountPort" className="text-right text-xs">
                      Mount Port
                    </Label>
                    <ContextInput
                      id="replace-localMountPort"
                      type="number"
                      value={replaceConfig.local_mount_port ? String(replaceConfig.local_mount_port) : ""}
                      onChange={(e) => handleFieldChange("local_mount_port", parseInt(e.target.value, 10) || 0)}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2" />}
              Start Replace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

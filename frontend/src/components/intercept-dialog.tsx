import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { models } from "../../wailsjs/go/models"
import { useLoadingStore } from "@/stores/useLoadingStore"
import { TelepresenceService } from "@/services/telepresence"
import { CoreService } from "@/services/core"

interface InterceptDialogProps {
  workloadName: string
  onSuccess?: () => void
}

export function InterceptDialog({ workloadName, onSuccess }: InterceptDialogProps) {
  const [open, setOpen] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const loading = useLoadingStore((state) => state.isLoading(`intercept-${workloadName}`))
  const startLoading = useLoadingStore((state) => state.startLoading)
  const stopLoading = useLoadingStore((state) => state.stopLoading)

  const [interceptConfig, setInterceptConfig] = useState(new models.InterceptConfig({
    workload: workloadName,
    port: "8080",
    env_file: "",
    env_json: "",
    env_syntax: "",
    http_header: "",
    mount: "",
    container: "",
    service: "",
    docker_run: false,
    docker_args: "",
  }))
  const [envFormat, setEnvFormat] = useState("docker")
  const [envFile, setEnvFile] = useState("")

  useEffect(() => {
    const isJson = envFormat === "json"
    const finalEnvFile = !isJson ? envFile : ""
    const finalEnvJson = isJson ? envFile : ""
    const finalSyntax = (!isJson && envFormat !== "docker") ? envFormat : ""

    setInterceptConfig((prev) => ({ 
      ...prev,
      env_file: finalEnvFile,
      env_json: finalEnvJson,
      env_syntax: finalSyntax 
    }))
  }, [envFormat, envFile])

  const handleIntercept = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    startLoading(`intercept-${workloadName}`)

    try {
      await TelepresenceService.interceptWorkload(interceptConfig)

      CoreService.notify("Telepresence Intercept Active", `Successfully intercepted ${workloadName}`)
      setOpen(false)
      if (onSuccess) onSuccess()

      setOpen(false)
      if (onSuccess) onSuccess()

    } catch (error) {
      CoreService.notify("Telepresence Intercept Error", `Intercept failed: ${String(error)}`)
    } finally {
      stopLoading(`intercept-${workloadName}`)
    }
  }

  const handleFieldChange = (key: keyof models.InterceptConfig, value: any) => {
    setInterceptConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal={loading}>
      <DialogTrigger>
        <Button variant="default" size="sm">
          Intercept
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleIntercept}>
          <DialogHeader>
            <DialogTitle>Intercept Workload</DialogTitle>
            <DialogDescription>
              Route traffic from <strong>{workloadName}</strong> to your local machine.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={interceptConfig.docker_run ? "docker" : "local"}
            onValueChange={(val) => handleFieldChange("docker_run", val === "docker")}
            className="w-full mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">Local Process</TabsTrigger>
              <TabsTrigger value="docker">Docker Container</TabsTrigger>
            </TabsList>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="port" className="text-right font-semibold">Port <span className="text-destructive">*</span></Label>
                <Input
                  id="port"
                  value={interceptConfig.port}
                  onChange={(e) => handleFieldChange("port", e.target.value)}
                  className="col-span-3" 
                  required 
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="httpHeader" className="text-right text-xs">HTTP Header</Label>
                <Input 
                id="httpHeader" 
                value={interceptConfig.http_header}
                onChange={(e) => handleFieldChange("http_header", e.target.value)}
                className="col-span-3 h-8 text-sm" 
                placeholder="x-dev-user=mohammad"
                disabled={loading}
                />
              </div>

              {/* LOCAL MODE */}
              <TabsContent value="local" className="space-y-4 m-0">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="envFile" className="text-right text-xs">Env Output</Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                    id="envFile" 
                    value={envFile} 
                    onChange={(e) => setEnvFile(e.target.value)} 
                    className="flex-1 h-8 text-sm" 
                    placeholder="/path/to/output.env" 
                    disabled={loading} 
                    />
                    <Select value={envFormat} onValueChange={(val) => val && setEnvFormat(val)} disabled={loading}>
                      <SelectTrigger className="w-27.5 h-8 text-xs">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="docker">.env (Docker)</SelectItem>
                        <SelectItem value="sh">Shell (sh)</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docker" className="space-y-4 m-0">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dockerArgs" className="text-right text-xs font-semibold">Docker Args <span className="text-destructive">*</span></Label>
                  <Input id="dockerArgs" value="" className="col-span-3 h-8 text-sm" placeholder="-it --rm ubuntu:20.04 /bin/bash" required={interceptConfig.docker_run} disabled={loading} />
                </div>
              </TabsContent>

              {/* ADVANCED SECTION */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="w-full mt-2">
                <CollapsibleTrigger>
                  <Button variant="ghost" size="sm" className="w-full flex justify-between text-muted-foreground">
                    <span>Advanced Routing</span>
                    {isAdvancedOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4 border-t mt-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mount" className="text-right text-xs">Mount Point</Label>
                    <Input id="mount" value="" className="col-span-3 h-8 text-xs" placeholder="true, false, or /absolute/path" disabled={loading} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="container" className="text-right text-xs">Container</Label>
                    <Input id="container" value="" className="col-span-3 h-8 text-xs" placeholder="Overrides auto-detection" disabled={loading} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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
  )
}
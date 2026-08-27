import { useState } from "react"
import { models } from "../../../wailsjs/go/models"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ExternalLink,
  Info,
  Server,
  Folder,
  Globe,
  HardDrive,
  Copy,
  Check,
  Radio,
  Layers,
  Terminal,
} from "lucide-react"
import { DetachButton } from "./detach-button"

interface InterceptRowDetailsProps {
  workload: models.Workload
  onFetchWorkloads: () => void
  onOpenDetails: (workload: models.Workload) => void
}

export function InterceptRowDetails({
  workload,
  onFetchWorkloads,
  onOpenDetails,
}: InterceptRowDetailsProps) {
  const [copied, setCopied] = useState(false)
  const interceptInfo = workload.intercept_info?.[0]
  const spec = interceptInfo?.spec
  const isReplaced = Boolean(spec?.replace)

  if (!interceptInfo) return null

  const targetHost = spec?.target_host || "127.0.0.1"
  const targetPort = spec?.target_port || 0
  const targetEndpoint = targetPort ? `${targetHost}:${targetPort}` : targetHost

  const handleCopyEndpoint = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(targetEndpoint)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy endpoint", err)
    }
  }

  const envCount = interceptInfo.environment ? Object.keys(interceptInfo.environment).length : 0
  const headerCount = spec?.header_filters ? Object.keys(spec.header_filters).length : 0

  return (
    <div className="p-3.5 bg-muted/40 rounded-lg border border-border/80 my-1 space-y-3 animate-in fade-in-50 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          {isReplaced ? (
            <Layers className="size-4 text-amber-500" />
          ) : (
            <Radio className="size-4 text-emerald-500" />
          )}
          <span className="text-xs font-semibold text-foreground">
            {isReplaced ? "Active Replacement" : "Active Interception"}
          </span>
          <span className="text-xs text-muted-foreground font-mono">({spec?.name || workload.name})</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => onOpenDetails(workload)}
          >
            <Info className="size-3.5 text-primary" />
            View Full Details
          </Button>
          <DetachButton workload={workload} onFetchWorkloads={onFetchWorkloads} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Forwarding Endpoint */}
        <div className="bg-background/80 p-2 rounded border flex flex-col justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ExternalLink className="size-3" /> Target Address
          </span>
          <div className="flex items-center justify-between mt-1 gap-1">
            <span className="font-mono font-semibold truncate" title={targetEndpoint}>
              {targetEndpoint}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 shrink-0"
              onClick={handleCopyEndpoint}
              title="Copy endpoint"
            >
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Container */}
        <div className="bg-background/80 p-2 rounded border flex flex-col justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Server className="size-3" /> Container & Port
          </span>
          <span className="font-mono font-medium truncate mt-1" title={spec?.container_name || "default"}>
            {spec?.container_name || "default"}
            {spec?.container_port ? ` : ${spec.container_port}` : ""}
          </span>
        </div>

        {/* Mechanism & Routing */}
        <div className="bg-background/80 p-2 rounded border flex flex-col justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Globe className="size-3" /> Mechanism & Filters
          </span>
          <div className="flex items-center gap-1.5 mt-1 truncate">
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 uppercase">
              {spec?.mechanism || "TCP"}
            </Badge>
            {headerCount > 0 ? (
              <span className="text-muted-foreground font-mono text-[11px]">
                {headerCount} header{headerCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-muted-foreground text-[11px]">All traffic</span>
            )}
          </div>
        </div>

        {/* Mounts & Env */}
        <div className="bg-background/80 p-2 rounded border flex flex-col justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <HardDrive className="size-3" /> Mount & Environment
          </span>
          <div className="flex items-center gap-1.5 mt-1 truncate text-[11px]">
            {interceptInfo.mount_point ? (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
                Mounted
              </Badge>
            ) : (
              <span className="text-muted-foreground">No Mount</span>
            )}
            {envCount > 0 && (
              <span className="text-muted-foreground font-mono">
                {envCount} env var{envCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

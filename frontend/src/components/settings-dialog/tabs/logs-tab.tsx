import React from "react"
import { models } from "@/../wailsjs/go/models"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Terminal,
  FileText,
  Download,
  WrapText,
  ArrowDownToLine,
  Layers,
  CheckCircle2,
} from "lucide-react"

interface LogsTabProps {
  settings: models.AppSettings
  onChange: <K extends keyof models.AppSettings>(key: K, value: models.AppSettings[K]) => void
}

export function LogsTab({ settings, onChange }: LogsTabProps) {
  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. Log Console Behavior */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Console Stream & Buffer Settings
          </h3>
        </div>

        <div className="grid gap-4 rounded-xl border border-border/60 bg-card/40 p-4">
          {/* Max Log Buffer Lines */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-log-lines" className="text-xs font-semibold text-foreground">
                Maximum In-Memory Log Lines Buffer
              </Label>
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {settings.maxLogLines} lines
              </Badge>
            </div>
            <Select
              value={String(settings.maxLogLines)}
              onValueChange={(val) => onChange("maxLogLines", Number(val) || 2000)}
            >
              <SelectTrigger className="w-full h-8 text-xs font-mono">
                <SelectValue placeholder="Select log buffer limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="500" className="text-xs">500 Lines (Low memory footprint)</SelectItem>
                <SelectItem value="1000" className="text-xs">1,000 Lines (Standard)</SelectItem>
                <SelectItem value="2000" className="text-xs">2,000 Lines (Recommended)</SelectItem>
                <SelectItem value="5000" className="text-xs">5,000 Lines (Extended debugging)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Number of log entries kept in memory before older entries are FIFO purged.
            </p>
          </div>

          {/* Default Filter Level */}
          <div className="grid gap-1.5 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label htmlFor="default-log-level" className="text-xs font-semibold text-foreground">
                Default Log Filter Category
              </Label>
            </div>
            <Select
              value={settings.defaultLogLevel}
              onValueChange={(val) => onChange("defaultLogLevel", val || "all")}
            >
              <SelectTrigger className="w-full h-8 text-xs font-mono">
                <SelectValue placeholder="Select default category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Logs (Default)</SelectItem>
                <SelectItem value="error" className="text-xs">Errors Only</SelectItem>
                <SelectItem value="warn" className="text-xs">Warnings & Errors</SelectItem>
                <SelectItem value="commands" className="text-xs">Command Executions (CLI)</SelectItem>
                <SelectItem value="daemon" className="text-xs">Daemon System Streams</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Initial category filter selected when the daemon log console opens.
            </p>
          </div>

          {/* Auto Scroll Default */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="size-3.5 text-primary" />
                <Label htmlFor="auto-scroll-toggle" className="text-xs font-semibold text-foreground cursor-pointer">
                  Auto-Scroll to Bottom
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Automatically jump to the latest incoming daemon log line when streaming.
              </p>
            </div>
            <Switch
              id="auto-scroll-toggle"
              checked={settings.autoScrollLogs}
              onCheckedChange={(checked) => onChange("autoScrollLogs", checked)}
            />
          </div>

          {/* Word Wrap Default */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <WrapText className="size-3.5 text-primary" />
                <Label htmlFor="wrap-lines-toggle" className="text-xs font-semibold text-foreground cursor-pointer">
                  Word Wrap Long Lines
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Wrap long command outputs and gRPC payloads to prevent horizontal scrolling.
              </p>
            </div>
            <Switch
              id="wrap-lines-toggle"
              checked={settings.wrapLogLines}
              onCheckedChange={(checked) => onChange("wrapLogLines", checked)}
            />
          </div>
        </div>
      </div>

      {/* 2. Telepresence Log Files Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Telepresence Log Files Tailer
          </h3>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The application continuously monitors and tails official Telepresence diagnostic files generated by the background daemon:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span>connector.log</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-sans">
                Tracks user session and cluster connectivity.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span>daemon.log</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-sans">
                Root network routing and DNS intercept logs.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span>cli.log</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-sans">
                Direct command executions and intercept statuses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

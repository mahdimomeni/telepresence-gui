import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  Search,
  X,
  ArrowDownToLine,
  Download,
  WrapText,
  Maximize2,
  Minimize2,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react"
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const MAX_LOG_LINES = 2000
const MAX_LINE_LENGTH = 4000

export type LogLevel = "error" | "warn" | "info" | "success" | "debug" | "system"
export type LogCategory = "all" | "error" | "warn" | "info" | "commands" | "daemon"

export interface ParsedLog {
  id: string
  raw: string
  timestamp: string
  level: LogLevel
  source: string
  message: string
}

function getFormattedTime(): string {
  const d = new Date()
  return (
    d.toTimeString().split(" ")[0] +
    "." +
    String(d.getMilliseconds()).padStart(3, "0")
  )
}

function parseLogLine(raw: string, index: number): ParsedLog {
  let text = raw.trim()
  if (text.length > MAX_LINE_LENGTH) {
    text = text.slice(0, MAX_LINE_LENGTH) + "... [line truncated]"
  }
  let timestamp = getFormattedTime()
  let source = "app"
  let level: LogLevel = "info"

  // 1. Check for leading bracket tag: [connector], [daemon], [cli], [Connect], [Intercept Error], etc.
  const bracketMatch = text.match(/^\[([A-Za-z0-9\s_-]+)\]\s*(.*)$/)
  if (bracketMatch) {
    const rawTag = bracketMatch[1].trim()
    text = bracketMatch[2]

    const lowerTag = rawTag.toLowerCase()
    if (lowerTag.includes("error") || lowerTag.includes("fail")) {
      level = "error"
      source = rawTag.replace(/error/i, "").trim().toLowerCase() || "error"
    } else if (lowerTag.includes("warn")) {
      level = "warn"
      source = rawTag.replace(/warn/i, "").trim().toLowerCase() || "warn"
    } else {
      source = lowerTag
    }
  }

  // 2. Check for Telepresence timestamp pattern e.g. "2026-08-28 02:58:56.0194 INFO ..."
  const tpTimeMatch = text.match(/^(\d{4}-\d{2}-\d{2}[ T])?(\d{2}:\d{2}:\d{2}(\.\d+)?)\s+([A-Z]+)?\s*(.*)$/)
  if (tpTimeMatch) {
    if (tpTimeMatch[2]) {
      timestamp = tpTimeMatch[2]
    }
    const tpLevel = (tpTimeMatch[4] || "").toUpperCase()
    if (tpLevel === "ERROR" || tpLevel === "FATAL") {
      level = "error"
    } else if (tpLevel === "WARN" || tpLevel === "WARNING") {
      level = "warn"
    } else if (tpLevel === "INFO") {
      if (level !== "error" && level !== "warn") level = "info"
    } else if (tpLevel === "DEBUG" || tpLevel === "TRACE") {
      level = "debug"
    }
    if (tpTimeMatch[5]) {
      text = tpTimeMatch[5]
    }
  }

  // 3. Substring content inspections for level inference if not already identified
  const lowerMsg = text.toLowerCase()
  if (level === "info") {
    if (
      lowerMsg.includes("error") ||
      lowerMsg.includes("failed") ||
      lowerMsg.includes("fatal") ||
      lowerMsg.includes("panic:") ||
      lowerMsg.includes("is not allowed") ||
      lowerMsg.includes("not found in %path%")
    ) {
      level = "error"
    } else if (lowerMsg.includes("warn") || lowerMsg.includes("warning")) {
      level = "warn"
    } else if (
      lowerMsg.includes("success") ||
      lowerMsg.includes("connected") ||
      lowerMsg.includes("ready") ||
      lowerMsg.includes("applied successfully")
    ) {
      level = "success"
    }
  }

  return {
    id: `log-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    raw,
    timestamp,
    level,
    source: source || "system",
    message: text || raw,
  }
}

interface LogPanelProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function LogPanel({ isOpen: controlledOpen, onOpenChange: setControlledOpen }: LogPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen

  const [logs, setLogs] = useState<ParsedLog[]>([])
  const [filterCategory, setFilterCategory] = useState<LogCategory>("all")
  const [filterQuery, setFilterQuery] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const [wrapLines, setWrapLines] = useState(true)
  const [isExpandedHeight, setIsExpandedHeight] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    EventsOn("daemon-log", (newLine: string) => {
      if (!newLine || typeof newLine !== "string") return
      setLogs((prevLogs) => {
        const parsed = parseLogLine(newLine, prevLogs.length)
        const updated = [...prevLogs, parsed]
        return updated.length > MAX_LOG_LINES ? updated.slice(-MAX_LOG_LINES) : updated
      })
    })

    return () => {
      EventsOff("daemon-log")
    }
  }, [])

  useEffect(() => {
    if (isOpen && autoScroll && scrollRef.current) {
      requestAnimationFrame(() => {
        const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]")
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight
        }
      })
    }
  }, [logs, isOpen, autoScroll, filterCategory, filterQuery])

  // Counts by category
  const counts = useMemo(() => {
    let error = 0
    let warn = 0
    let info = 0
    let commands = 0
    let daemon = 0

    for (const item of logs) {
      if (item.level === "error") error++
      if (item.level === "warn") warn++
      if (item.level === "info" || item.level === "success") info++

      const src = item.source.toLowerCase()
      if (
        src.includes("connect") ||
        src.includes("intercept") ||
        src.includes("replace") ||
        src.includes("detach") ||
        src.includes("cli")
      ) {
        commands++
      }
      if (
        src.includes("connector") ||
        src.includes("daemon") ||
        src.includes("userd") ||
        src.includes("rootd")
      ) {
        daemon++
      }
    }

    return { total: logs.length, error, warn, info, commands, daemon }
  }, [logs])

  // Filter logs based on category and search text
  const filteredLogs = useMemo(() => {
    let result = logs

    if (filterCategory === "error") {
      result = result.filter((l) => l.level === "error")
    } else if (filterCategory === "warn") {
      result = result.filter((l) => l.level === "warn")
    } else if (filterCategory === "info") {
      result = result.filter((l) => l.level === "info" || l.level === "success")
    } else if (filterCategory === "commands") {
      result = result.filter((l) => {
        const src = l.source.toLowerCase()
        return (
          src.includes("connect") ||
          src.includes("intercept") ||
          src.includes("replace") ||
          src.includes("detach") ||
          src.includes("cli")
        )
      })
    } else if (filterCategory === "daemon") {
      result = result.filter((l) => {
        const src = l.source.toLowerCase()
        return (
          src.includes("connector") ||
          src.includes("daemon") ||
          src.includes("userd") ||
          src.includes("rootd")
        )
      })
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.raw.toLowerCase().includes(q) ||
          l.source.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q)
      )
    }

    return result
  }, [logs, filterCategory, filterQuery])

  const handleCopyLogs = useCallback(async () => {
    if (filteredLogs.length === 0) return
    try {
      const text = filteredLogs
        .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`)
        .join("\n")
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy logs", err)
    }
  }, [filteredLogs])

  const handleExportLogs = useCallback(() => {
    if (logs.length === 0) return
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`)
      .join("\n")
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-")
    link.href = url
    link.download = `telepresence-logs-${dateStr}.log`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [logs])

  const highlightMatch = useCallback(
    (text: string) => {
      if (!filterQuery.trim()) return text
      const regex = new RegExp(`(${filterQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      const parts = text.split(regex)
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-400/30 text-amber-200 rounded-xs px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )
    },
    [filterQuery]
  )

  const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
      case "error":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40"
      case "warn":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40"
      case "success":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      case "debug":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40"
      default:
        return "bg-sky-500/15 text-sky-300 border-sky-500/30"
    }
  }

  const getLogTextClass = (level: LogLevel) => {
    switch (level) {
      case "error":
        return "text-rose-400 font-medium"
      case "warn":
        return "text-amber-300"
      case "success":
        return "text-emerald-300"
      case "debug":
        return "text-purple-300"
      default:
        return "text-zinc-300"
    }
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t border-border/80 bg-card/95 backdrop-blur-md shadow-[0_-5px_25px_-5px_rgba(0,0,0,0.35)] transition-all"
    >
      {/* Trigger Bar */}
      <CollapsibleTrigger>
        <div className="flex h-9.5 cursor-pointer select-none items-center justify-between px-4 text-xs font-medium hover:bg-muted/60 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-5.5 rounded bg-primary/15 text-primary border border-primary/20">
              <Terminal className="size-3.5" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">Telepresence Console & Daemon Logs</span>
            {logs.length > 0 && (
              <Badge variant="secondary" className="h-4.5 px-1.5 py-0 text-[10px] font-mono">
                {logs.length}
              </Badge>
            )}
            {counts.error > 0 && (
              <Badge
                variant="destructive"
                className="h-4.5 px-1.5 py-0 text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40 gap-1 animate-pulse"
              >
                <AlertCircle className="size-2.5" />
                {counts.error} {counts.error === 1 ? "error" : "errors"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            {!isOpen && logs.length > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-mono">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            )}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px]">{isOpen ? "Hide console" : "Show console"}</span>
              {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Expanded Terminal Panel */}
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="relative border-t border-zinc-800 bg-zinc-950 text-zinc-200">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/90 text-xs">
            {/* Left: Search and Category Pills */}
            <div className="flex items-center gap-2 flex-1 min-w-[320px] max-w-2xl">
              <div className="relative w-48 sm:w-56">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full h-6.5 pl-7 pr-6 rounded bg-zinc-950/90 border border-zinc-700/60 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-primary transition-colors"
                />
                {filterQuery && (
                  <button
                    onClick={() => setFilterQuery("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    title="Clear filter"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                <button
                  onClick={() => setFilterCategory("all")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    filterCategory === "all"
                      ? "bg-zinc-700 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  All ({counts.total})
                </button>
                <button
                  onClick={() => setFilterCategory("error")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                    filterCategory === "error"
                      ? "bg-rose-500/30 text-rose-300 font-semibold border border-rose-500/40"
                      : counts.error > 0
                      ? "text-rose-400 hover:bg-rose-500/15"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {counts.error > 0 && <AlertCircle className="size-2.5" />}
                  Errors ({counts.error})
                </button>
                <button
                  onClick={() => setFilterCategory("warn")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                    filterCategory === "warn"
                      ? "bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40"
                      : counts.warn > 0
                      ? "text-amber-400 hover:bg-amber-500/15"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {counts.warn > 0 && <AlertTriangle className="size-2.5" />}
                  Warnings ({counts.warn})
                </button>
                <button
                  onClick={() => setFilterCategory("commands")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    filterCategory === "commands"
                      ? "bg-sky-500/30 text-sky-300 font-semibold border border-sky-500/40"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  Commands ({counts.commands})
                </button>
                <button
                  onClick={() => setFilterCategory("daemon")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    filterCategory === "daemon"
                      ? "bg-purple-500/30 text-purple-300 font-semibold border border-purple-500/40"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  Daemon ({counts.daemon})
                </button>
              </div>

              {filterQuery && (
                <span className="text-[11px] text-zinc-400 shrink-0">
                  {filteredLogs.length} match{filteredLogs.length === 1 ? "" : "es"}
                </span>
              )}
            </div>

            {/* Right: Controls & Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-[11px] gap-1 cursor-pointer ${
                  autoScroll ? "text-primary bg-primary/10" : "text-zinc-400 hover:text-zinc-100"
                }`}
                onClick={() => setAutoScroll(!autoScroll)}
                title={autoScroll ? "Auto-scroll ON (click to pause)" : "Auto-scroll OFF (click to enable)"}
              >
                <ArrowDownToLine className="size-3" />
                <span className="hidden sm:inline">Auto-scroll</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-[11px] gap-1 cursor-pointer ${
                  wrapLines ? "text-zinc-200 bg-zinc-800" : "text-zinc-400 hover:text-zinc-100"
                }`}
                onClick={() => setWrapLines(!wrapLines)}
                title={wrapLines ? "Word Wrap ON" : "Word Wrap OFF"}
              >
                <WrapText className="size-3" />
                <span className="hidden sm:inline">Wrap</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-[11px] gap-1 cursor-pointer ${
                  isExpandedHeight ? "text-zinc-200 bg-zinc-800" : "text-zinc-400 hover:text-zinc-100"
                }`}
                onClick={() => setIsExpandedHeight(!isExpandedHeight)}
                title={isExpandedHeight ? "Collapse Height" : "Expand Height"}
              >
                {isExpandedHeight ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-zinc-400 hover:text-zinc-100 gap-1 cursor-pointer"
                onClick={handleCopyLogs}
                disabled={filteredLogs.length === 0}
                title="Copy displayed logs"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-zinc-400 hover:text-zinc-100 gap-1 cursor-pointer"
                onClick={handleExportLogs}
                disabled={logs.length === 0}
                title="Export all logs to .log file"
              >
                <Download className="size-3" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-zinc-400 hover:text-rose-400 gap-1 cursor-pointer"
                onClick={() => setLogs([])}
                disabled={logs.length === 0}
                title="Clear current logs"
              >
                <Trash2 className="size-3" />
                <span>Clear</span>
              </Button>
            </div>
          </div>

          {/* Log Lines Stream Area */}
          <ScrollArea
            ref={scrollRef}
            className={`${
              isExpandedHeight ? "h-96 sm:h-[480px]" : "h-64"
            } w-full px-3 py-2 font-mono text-[11px] leading-5 tracking-tight transition-all duration-200`}
          >
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-zinc-500 italic space-y-1.5">
                <Terminal className="size-7 opacity-35 text-zinc-400 mb-1" />
                <span className="font-semibold text-zinc-400">Waiting for Telepresence daemon logs...</span>
                <span className="text-[10px] text-zinc-500">
                  Cluster connection events, traffic manager routing, and intercept output will stream here in real time.
                </span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-500 italic py-8 text-center space-y-1">
                <span>No logs match current filters</span>
                {filterQuery && (
                  <span className="text-[10px] text-zinc-600">Query: &quot;{filterQuery}&quot;</span>
                )}
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={log.id || index}
                  className={`flex items-start gap-2 hover:bg-zinc-900/75 py-0.5 rounded px-1.5 -mx-1 transition-colors ${
                    log.level === "error"
                      ? "bg-rose-950/20"
                      : log.level === "warn"
                      ? "bg-amber-950/15"
                      : ""
                  }`}
                >
                  {/* Line Number */}
                  <span className="text-zinc-600 select-none text-[10px] w-7 text-right shrink-0 pt-0.5">
                    {index + 1}
                  </span>

                  {/* Timestamp */}
                  <span className="text-zinc-500 select-none text-[10px] shrink-0 pt-0.5 font-mono">
                    {log.timestamp}
                  </span>

                  {/* Level Pill */}
                  <span
                    className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0 border ${getLevelBadgeClass(
                      log.level
                    )}`}
                  >
                    {log.level === "error"
                      ? "ERR"
                      : log.level === "warn"
                      ? "WRN"
                      : log.level === "success"
                      ? "OK"
                      : log.level === "debug"
                      ? "DBG"
                      : "INF"}
                  </span>

                  {/* Source Tag */}
                  <span className="text-zinc-400 font-semibold text-[10px] shrink-0">
                    [{log.source}]
                  </span>

                  {/* Message Content */}
                  <span
                    className={`flex-1 ${
                      wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
                    } ${getLogTextClass(log.level)}`}
                  >
                    {highlightMatch(log.message)}
                  </span>
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
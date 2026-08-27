import { useEffect, useMemo, useRef, useState } from "react"
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
  Filter,
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

const MAX_LOG_LINES = 1000

interface LogPanelProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function getLogLineClass(line: string) {
  const lower = line.toLowerCase()
  if (lower.includes("err") || lower.includes("fail") || lower.includes("fatal")) {
    return "text-rose-400 font-medium"
  }
  if (lower.includes("warn") || lower.includes("wrn")) {
    return "text-amber-400"
  }
  if (lower.includes("inf") || lower.includes("info")) {
    return "text-sky-300"
  }
  if (lower.includes("success") || lower.includes("ready") || lower.includes("connected")) {
    return "text-emerald-400"
  }
  return "text-zinc-300"
}

export function LogPanel({ isOpen: controlledOpen, onOpenChange: setControlledOpen }: LogPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen

  const [logs, setLogs] = useState<string[]>([])
  const [filterQuery, setFilterQuery] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    EventsOn("daemon-log", (newLine: string) => {
      setLogs((prevLogs) => {
        const updated = [...prevLogs, newLine]
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
  }, [logs, isOpen, autoScroll])

  const filteredLogs = useMemo(() => {
    if (!filterQuery.trim()) return logs
    const q = filterQuery.toLowerCase()
    return logs.filter((l) => l.toLowerCase().includes(q))
  }, [logs, filterQuery])

  const handleCopyLogs = async () => {
    if (logs.length === 0) return
    try {
      await navigator.clipboard.writeText(logs.join("\n"))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy logs", err)
    }
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t border-border/80 bg-card/95 backdrop-blur-md shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.3)] transition-all"
    >
      {/* Trigger Bar */}
      <CollapsibleTrigger>
        <div className="flex h-9 cursor-pointer select-none items-center justify-between px-4 text-xs font-medium hover:bg-muted/60 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-5 rounded bg-primary/10 text-primary">
              <Terminal className="size-3.5" />
            </div>
            <span className="font-semibold text-foreground">Daemon Logs</span>
            {logs.length > 0 && (
              <Badge variant="secondary" className="h-4.5 px-1.5 py-0 text-[10px] font-mono">
                {logs.length}
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
        <div className="relative border-t border-border/50 bg-zinc-950 text-zinc-200">
          {/* Action & Filter Toolbar */}
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/90 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full h-6 pl-7 pr-6 rounded bg-zinc-950/80 border border-zinc-700/60 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-primary"
                />
                {filterQuery && (
                  <button
                    onClick={() => setFilterQuery("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    title="Clear filter"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
              {filterQuery && (
                <span className="text-[11px] text-zinc-400 shrink-0">
                  {filteredLogs.length} match{filteredLogs.length === 1 ? "" : "es"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-[11px] gap-1 ${
                  autoScroll ? "text-primary bg-primary/10" : "text-zinc-400 hover:text-zinc-100"
                }`}
                onClick={() => setAutoScroll(!autoScroll)}
                title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
              >
                <ArrowDownToLine className="size-3" />
                <span>Auto-scroll</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-zinc-400 hover:text-zinc-100 gap-1"
                onClick={handleCopyLogs}
                disabled={logs.length === 0}
                title="Copy all logs"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-zinc-400 hover:text-rose-400 gap-1"
                onClick={() => setLogs([])}
                disabled={logs.length === 0}
                title="Clear logs"
              >
                <Trash2 className="size-3" />
                <span>Clear</span>
              </Button>
            </div>
          </div>

          {/* Log Lines Area */}
          <ScrollArea
            ref={scrollRef}
            className="h-64 w-full px-4 py-2 font-mono text-[11px] leading-5 tracking-tight"
          >
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500 italic space-y-1">
                <Terminal className="size-6 opacity-40 text-zinc-400 mb-1" />
                <span>Waiting for daemon log output...</span>
                <span className="text-[10px] text-zinc-600">Events and routing messages will appear here in real time.</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-zinc-500 italic py-8 text-center">
                No log lines match &quot;{filterQuery}&quot;
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2.5 hover:bg-zinc-900/60 py-0.5 rounded px-1 -mx-1">
                  <span className="text-zinc-600 select-none text-[10px] w-7 text-right shrink-0 pt-0.5">
                    {index + 1}
                  </span>
                  <span className={`whitespace-pre-wrap break-all flex-1 ${getLogLineClass(log)}`}>
                    {log}
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
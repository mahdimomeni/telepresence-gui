import { useState } from "react"
import { Terminal, ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

export function LogPanel() {
  const [isOpen, setIsOpen] = useState(false)

  // Example log state - in reality, you'd stream this from your backend
  const [logs, setLogs] = useState([
    "[13:13:52] Starting telepresence daemon...",
    "[13:13:52] Connecting to traffic manager in namespace default...",
    "[13:13:53] Connected successfully.",
    "[13:14:01] Intercepting traffic for service 'backend'...",
    "[13:14:05] Routing to localhost:8080 active."
  ])

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t bg-background shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]"
    >
      {/* The bottom trigger bar */}
      <CollapsibleTrigger>
        <div className="flex h-10 cursor-pointer items-center justify-between px-4 text-sm hover:bg-muted transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Terminal className="h-4 w-4" />
            <span>Daemon Logs</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {/* Show an indicator if logs are running while closed */}
            {!isOpen && (
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            )}
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </div>
        </div>
      </CollapsibleTrigger>

      {/* The expanding log area */}
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="relative border-t bg-zinc-950 p-2">
          {/* Action buttons inside the terminal */}
          <div className="absolute right-4 top-4 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-zinc-400 hover:text-zinc-50"
              onClick={() => setLogs([])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Log Output */}
          <ScrollArea className="h-62.5 w-full rounded-md px-4 py-2 text-xs font-mono text-zinc-300">
            {logs.length === 0 ? (
              <div className="text-zinc-500 italic">Waiting for logs...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="pb-1 leading-relaxed">
                  {log}
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
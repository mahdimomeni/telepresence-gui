import React, { useEffect, useState, useCallback } from "react"
import {
  WindowMinimise,
  WindowToggleMaximise,
  WindowIsMaximised,
  WindowHide,
} from "../../wailsjs/runtime/runtime"
import { Minus, Square, Copy, X, Terminal, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import Logo from "@/assets/images/logo.svg?react"

interface TitleBarProps {
  isConnected: boolean
  report?: any
  isLogsOpen: boolean
  onToggleLogs: () => void
  onReplaySplash?: () => void
}

export function TitleBar({
  isConnected,
  report,
  isLogsOpen,
  onToggleLogs,
  onReplaySplash,
}: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)

  const checkMaximized = useCallback(async () => {
    try {
      const max = await WindowIsMaximised()
      setIsMaximized(max)
    } catch {
      // Fallback in web dev mode
    }
  }, [])

  useEffect(() => {
    checkMaximized()
    const handleResize = () => {
      checkMaximized()
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [checkMaximized])

  const handleMinimize = () => {
    WindowMinimise()
  }

  const handleToggleMaximize = async () => {
    WindowToggleMaximise()
    setTimeout(checkMaximized, 100)
  }

  const handleClose = () => {
    WindowHide()
  }

  return (
    <header
      className="wails-drag w-full h-11 bg-card/75 dark:bg-background/80 backdrop-blur-xl border-b border-border/40 flex items-center justify-between select-none z-50 shrink-0 transition-colors px-2 sm:px-3"
      onDoubleClick={handleToggleMaximize}
      role="banner"
    >
      {/* Left: App Branding & Version (Click to replay boot splash) */}
      <div
        className="wails-no-drag flex items-center gap-2 cursor-pointer group py-1 px-1.5 rounded-lg hover:bg-muted/40 transition-all shrink-0"
        onClick={onReplaySplash}
        title="Telepresence GUI - Click to replay boot sequence"
      >
        <Logo className="size-5.5 shrink-0 transition-transform group-hover:scale-105" />
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs tracking-tight text-foreground group-hover:text-primary transition-colors">
            Telepresence
          </span>
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1.5 py-0 font-semibold font-mono text-muted-foreground border-border/80 group-hover:border-primary/30 transition-colors"
          >
            GUI
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground/60 hidden md:inline">
            v{__APP_VERSION__}
          </span>
        </div>
      </div>

      {/* Center: Draggable Spacer / Drag Region */}
      <div className="flex-1 flex items-center justify-center h-full px-2 min-w-0 pointer-events-none">
        {isConnected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium animate-page-enter">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span>Active Session</span>
          </div>
        ) : null}
      </div>

      {/* Right: Actions, Status & Window Controls */}
      <div className="wails-no-drag flex items-center gap-1.5 sm:gap-2 h-full shrink-0">
        {/* Prerequisites Missing Alert Badge */}
        {report && !report.allInstalled && (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 px-2 py-0.5 text-[11px] font-medium shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] animate-pulse"
          >
            <AlertTriangle className="size-3 text-amber-500" />
            <span className="hidden sm:inline">Prerequisites Missing</span>
            <span className="sm:hidden">Missing Tools</span>
          </Badge>
        )}

        {/* Disconnected Badge (when not connected and tools installed) */}
        {!isConnected && report?.allInstalled && (
          <Badge
            variant="outline"
            className="border-border bg-muted/40 text-muted-foreground gap-1.5 px-2 py-0.5 text-[11px] hidden sm:inline-flex"
          >
            <span className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
            <span>Disconnected</span>
          </Badge>
        )}

        {/* Daemon Logs Button */}
        <Button
          variant={isLogsOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleLogs}
          className="h-7.5 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          title="Toggle Daemon Logs Console"
        >
          <Terminal className="size-3.5" />
          <span className="hidden sm:inline">Logs</span>
        </Button>

        {/* Theme Mode Toggle */}
        <ModeToggle />

        {/* Vertical Divider before Window Controls */}
        <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

        {/* Window Control Buttons */}
        <div className="flex items-center h-full">
          <button
            type="button"
            onClick={handleMinimize}
            className="w-9 h-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-default"
            title="Minimize"
            aria-label="Minimize Window"
          >
            <Minus className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleMaximize}
            className="w-9 h-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-default"
            title={isMaximized ? "Restore Down" : "Maximize"}
            aria-label={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {isMaximized ? (
              <Copy className="size-3 rotate-180" />
            ) : (
              <Square className="size-3" />
            )}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-white hover:bg-destructive active:scale-95 transition-all cursor-default"
            title="Hide to System Tray"
            aria-label="Close to System Tray"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}

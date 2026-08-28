import { ThemeProvider } from '@/components/theme-provider';
import { ConnectPage } from './pages/connect-page';
import { useCallback, useEffect, useState } from 'react';
import { ListPage } from './pages/list';
import { BrowserOpenURL, EventsOff, EventsOn } from '../wailsjs/runtime/runtime';
import { Button } from './components/ui/button';
import { AtSign, Terminal, Activity, Radio, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Github from './assets/images/github.svg?react';
import { Toaster } from './components/ui/toast';
import { UpdateToast } from './components/update-toast';
import { LogPanel } from './components/log-panel';
import { Badge } from './components/ui/badge';
import { ModeToggle } from './components/mode-toggle';
import { SplashScreen } from './components/splash-screen';
import { useToolsStore } from './stores/useToolsStore';
import { MissingToolsView } from './components/missing-tools-view';

function App() {
    const [isConnected, setIsConnected] = useState(false)
    const [isLogsOpen, setIsLogsOpen] = useState(false)
    const [showSplash, setShowSplash] = useState(true)

    const report = useToolsStore((state) => state.report)
    const isCheckingTools = useToolsStore((state) => state.isChecking)
    const checkTools = useToolsStore((state) => state.checkTools)
    const setReport = useToolsStore((state) => state.setReport)

    const handleConnectSuccess = useCallback(() => {
        setIsConnected(true)
    }, [])

    const handleDisconnectSuccess = useCallback(() => {
        setIsConnected(false)
    }, [])

    useEffect(() => {
        // Initial tools check on startup
        checkTools()

        EventsOn("system-tools:status", (statusReport: any) => {
            setReport(statusReport)
        })

        EventsOn("connection-changed", (status: boolean) => {
            setIsConnected(status)
        })

        if (!import.meta.env.PROD) {
            return () => {
                EventsOff("connection-changed", "connection-pending", "system-tools:status")
            }
        }

        const handleContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null
            const isInputField =
                target?.tagName === 'INPUT' ||
                target?.tagName === 'TEXTAREA' ||
                target?.isContentEditable

            if (!isInputField) {
                e.preventDefault()
            }
        }
        window.addEventListener('contextmenu', handleContextMenu)

        return () => {
            EventsOff("connection-changed", "connection-pending", "system-tools:status")
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [checkTools, setReport])

    return (
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
            {showSplash && (
                <SplashScreen onComplete={() => setShowSplash(false)} />
            )}

            <div id="App" className="relative min-h-screen bg-background text-foreground flex flex-col overflow-hidden pb-10">
                {/* Cyber Grid Background */}
                <div className="absolute inset-0 cyber-grid-bg opacity-40 pointer-events-none" />

                {/* Atmospheric Ambient Glows with Organic Drift */}
                <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-primary/20 rounded-full blur-[150px] pointer-events-none transform-gpu animate-aurora-1" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none transform-gpu animate-aurora-2" />

                {/* Top App Header */}
                <header className="relative z-20 w-full border-b border-border/40 bg-card/60 backdrop-blur-md px-5 py-2.5 flex items-center justify-between shadow-xs transition-colors">
                    <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setShowSplash(true)}
                        title="Click to replay system boot sequence"
                    >
                        <div className="relative flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-xs border border-primary/20 transition-transform group-hover:scale-105 group-hover:border-primary/40">
                            <Radio className="size-4 animate-pulse text-primary" />
                            <div className="absolute inset-0 rounded-lg border border-primary/30 animate-ping opacity-25 pointer-events-none" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                                    Telepresence
                                </span>
                                <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 py-0 font-semibold font-mono text-muted-foreground border-border/80 group-hover:border-primary/30 transition-colors">
                                    GUI
                                </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground leading-none flex items-center gap-1">
                                Kubernetes Local Interceptor
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Live Connection Status / Tools Status Indicator */}
                        {report && !report.allInstalled ? (
                            <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 px-2.5 py-1 text-xs font-medium shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] transition-all animate-pulse"
                            >
                                <AlertTriangle className="size-3 text-amber-500" />
                                <span>Prerequisites Missing</span>
                            </Badge>
                        ) : isConnected ? (
                            <Badge
                                variant="outline"
                                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 px-2.5 py-1 text-xs font-medium shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] transition-all animate-pulse"
                            >
                                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                Active Session
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-border bg-muted/40 text-muted-foreground gap-1.5 px-2.5 py-1 text-xs transition-all"
                            >
                                <span className="size-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                                Disconnected
                            </Badge>
                        )}

                        <div className="h-4 w-px bg-border/60 mx-1" />

                        {/* Daemon Logs Button */}
                        <Button
                            variant={isLogsOpen ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setIsLogsOpen(!isLogsOpen)}
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-transform active:scale-95"
                            title="Toggle Daemon Logs Console"
                        >
                            <Terminal className="size-3.5" />
                            <span className="hidden sm:inline">Logs</span>
                        </Button>

                        <ModeToggle />
                    </div>
                </header>

                {/* Main Content Area with View Enter Animation */}
                <main className="relative z-10 w-full flex-1 flex items-center justify-center p-4">
                    {report && !report.allInstalled ? (
                        <MissingToolsView
                            report={report}
                            isChecking={isCheckingTools}
                            onRecheck={checkTools}
                        />
                    ) : (
                        <div key={isConnected ? "connected" : "disconnected"} className="w-full flex items-center justify-center animate-page-enter">
                            {!isConnected ? (
                                <ConnectPage onConnectSuccess={handleConnectSuccess} />
                            ) : (
                                <ListPage onDisconnect={handleDisconnectSuccess} />
                            )}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="relative z-10 w-full py-3 flex flex-col items-center justify-center gap-2 text-xs font-medium tracking-wide text-muted-foreground/70">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon-xs"
                            onClick={() => BrowserOpenURL("https://github.com/mahdimomeni/telepresence-gui")}
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer transition-transform hover:scale-110"
                            title="View source repository on GitHub"
                        >
                            <Github className="size-3.5" />
                            <span className="sr-only">GitHub</span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon-xs"
                            onClick={() => BrowserOpenURL("mailto:mahdimomeni012@gmail.com")}
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer transition-transform hover:scale-110"
                            title="Send feedback or report issue via Email"
                        >
                            <AtSign className="size-3.5" />
                            <span className="sr-only">Contact Email</span>
                        </Button>
                    </div>
                    <span className="text-[11px] font-mono">Telepresence GUI v{__APP_VERSION__}</span>
                </footer>

                <Toaster />
                <UpdateToast />
                <LogPanel isOpen={isLogsOpen} onOpenChange={setIsLogsOpen} />
            </div>
        </ThemeProvider>
    )
}

export default App

import { ThemeProvider } from '@/components/theme-provider';
import { ConnectPage } from './pages/connect-page';
import { useCallback, useEffect, useState } from 'react';
import { ListPage } from './pages/list';
import { BrowserOpenURL, EventsOff, EventsOn } from '../wailsjs/runtime/runtime';
import { Button } from './components/ui/button';
import { AtSign, Terminal, Activity, Radio } from 'lucide-react';
import Github from './assets/images/github.svg?react';
import { Toaster } from './components/ui/toast';
import { UpdateToast } from './components/update-toast';
import { LogPanel } from './components/log-panel';
import { Badge } from './components/ui/badge';
import { ModeToggle } from './components/mode-toggle';

function App() {
    const [isConnected, setIsConnected] = useState(false)
    const [isLogsOpen, setIsLogsOpen] = useState(false)

    const handleConnectSuccess = useCallback(() => {
        setIsConnected(true)
    }, [])

    const handleDisconnectSuccess = useCallback(() => {
        setIsConnected(false)
    }, [])

    useEffect(() => {
        EventsOn("connection-changed", (status: boolean) => {
            setIsConnected(status)
        })

        if (!import.meta.env.PROD) {
            return () => {
                EventsOff("connection-changed", "connection-pending")
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
            EventsOff("connection-changed", "connection-pending")
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [])

    return (
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
            <div id="App" className="relative min-h-screen bg-background text-foreground flex flex-col overflow-hidden pb-10">
                {/* Atmospheric Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-primary/20 rounded-full blur-[140px] pointer-events-none transform-gpu will-change-transform" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none transform-gpu will-change-transform" />

                {/* Top App Header */}
                <header className="relative z-20 w-full border-b border-border/40 bg-card/60 backdrop-blur-md px-5 py-2.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-xs border border-primary/20">
                            <Radio className="size-4 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm tracking-tight text-foreground">Telepresence</span>
                                <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 py-0 font-semibold font-mono text-muted-foreground border-border/80">
                                    GUI
                                </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground leading-none">
                                Kubernetes Local Interceptor
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Live Connection Status Indicator */}
                        {isConnected ? (
                            <Badge
                                variant="outline"
                                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 px-2.5 py-1 text-xs font-medium"
                            >
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                Active Session
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-border bg-muted/40 text-muted-foreground gap-1.5 px-2.5 py-1 text-xs"
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
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            title="Toggle Daemon Logs Console"
                        >
                            <Terminal className="size-3.5" />
                            <span className="hidden sm:inline">Logs</span>
                        </Button>

                        <ModeToggle />
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="relative z-10 w-full flex-1 flex items-center justify-center p-4">
                    {!isConnected ? (
                        <ConnectPage onConnectSuccess={handleConnectSuccess} />
                    ) : (
                        <ListPage onDisconnect={handleDisconnectSuccess} />
                    )}
                </main>

                {/* Footer */}
                <footer className="relative z-10 w-full py-3 flex flex-col items-center justify-center gap-2 text-xs font-medium tracking-wide text-muted-foreground/70">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon-xs"
                            onClick={() => BrowserOpenURL("https://github.com/mahdimomeni/telepresence-gui")}
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View source repository on GitHub"
                        >
                            <Github className="size-3.5" />
                            <span className="sr-only">GitHub</span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon-xs"
                            onClick={() => BrowserOpenURL("mailto:mahdimomeni012@gmail.com")}
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Send feedback or report issue via Email"
                        >
                            <AtSign className="size-3.5" />
                            <span className="sr-only">Contact Email</span>
                        </Button>
                    </div>
                    <span className="text-[11px]">Telepresence GUI v{__APP_VERSION__}</span>
                </footer>

                <Toaster />
                <UpdateToast />
                <LogPanel isOpen={isLogsOpen} onOpenChange={setIsLogsOpen} />
            </div>
        </ThemeProvider>
    )
}


export default App

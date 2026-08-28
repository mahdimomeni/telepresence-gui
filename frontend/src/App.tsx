import { ThemeProvider } from '@/components/theme-provider';
import { ConnectPage } from './pages/connect-page';
import { useCallback, useEffect, useState } from 'react';
import { ListPage } from './pages/list';
import { BrowserOpenURL, EventsOff, EventsOn } from '../wailsjs/runtime/runtime';
import { Button } from './components/ui/button';
import { AtSign } from 'lucide-react';
import Github from './assets/images/github.svg?react';
import { Toaster } from './components/ui/toast';
import { UpdateToast } from './components/update-toast';
import { LogPanel } from './components/log-panel';
import { SplashScreen } from './components/splash-screen';
import { useToolsStore } from './stores/useToolsStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { MissingToolsView } from './components/missing-tools-view';
import { TitleBar } from './components/title-bar';
import { SettingsDialog } from './components/settings-dialog';

function App() {
    const [isConnected, setIsConnected] = useState(false)
    const [isLogsOpen, setIsLogsOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [showSplash, setShowSplash] = useState(() => {
        try {
            const raw = localStorage.getItem("telepresence-gui-app-settings")
            if (raw) {
                const parsed = JSON.parse(raw)
                if (parsed.showSplashScreen === false) return false
            }
        } catch {}
        return true
    })

    const report = useToolsStore((state) => state.report)
    const isCheckingTools = useToolsStore((state) => state.isChecking)
    const checkTools = useToolsStore((state) => state.checkTools)
    const setReport = useToolsStore((state) => state.setReport)

    const settings = useSettingsStore((state) => state.settings)
    const loadSettings = useSettingsStore((state) => state.loadSettings)

    const handleConnectSuccess = useCallback(() => {
        setIsConnected(true)
    }, [])

    const handleDisconnectSuccess = useCallback(() => {
        setIsConnected(false)
    }, [])

    useEffect(() => {
        // Initial load of settings and system tools
        loadSettings().then((loaded) => {
            if (loaded && !loaded.showSplashScreen) {
                setShowSplash(false)
            }
        })
        checkTools()

        EventsOn("system-tools:status", (statusReport: any) => {
            setReport(statusReport)
        })

        EventsOn("connection-changed", (status: boolean) => {
            setIsConnected(status)
        })

        EventsOn("open-settings", () => {
            setIsSettingsOpen(true)
        })

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault()
                setIsSettingsOpen((prev) => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)

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
            EventsOff("connection-changed", "connection-pending", "system-tools:status", "open-settings")
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [checkTools, setReport, loadSettings])

    return (
        <ThemeProvider defaultTheme={settings.theme as any || 'dark'} storageKey='vite-ui-theme'>
            {showSplash && (
                <SplashScreen onComplete={() => setShowSplash(false)} />
            )}

            <div id="App" className="relative h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
                {/* Unified Frameless Title Bar & Navigation */}
                <TitleBar
                    isConnected={isConnected}
                    report={report}
                    isLogsOpen={isLogsOpen}
                    onToggleLogs={() => setIsLogsOpen(!isLogsOpen)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onReplaySplash={() => setShowSplash(true)}
                />

                {/* Cyber Grid Background */}
                <div className="absolute inset-0 cyber-grid-bg opacity-40 pointer-events-none" />

                {/* Atmospheric Ambient Glows (Controlled by settings.enableGlowEffects) */}
                {settings.enableGlowEffects && (
                    <>
                        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-primary/20 rounded-full blur-[150px] pointer-events-none transform-gpu animate-aurora-1" />
                        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none transform-gpu animate-aurora-2" />
                    </>
                )}

                {/* Main Content Area with View Enter Animation & Smooth Vertical Scroll */}
                <main className="relative z-10 w-full flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 flex flex-col items-center justify-start min-h-0">
                    <div className="w-full max-w-6xl my-auto flex items-center justify-center">
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
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 w-full py-2 border-t border-border/20 bg-background/60 backdrop-blur-xs flex items-center justify-between px-4 sm:px-6 text-xs font-medium tracking-wide text-muted-foreground/70 shrink-0">
                    <span className="text-[11px] font-mono">Telepresence GUI v{__APP_VERSION__}</span>
                    <div className="flex items-center gap-1">
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
                </footer>

                <Toaster />
                <UpdateToast />
                <LogPanel isOpen={isLogsOpen} onOpenChange={setIsLogsOpen} />
                <SettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    onReplaySplash={() => setShowSplash(true)}
                />
            </div>
        </ThemeProvider>
    )
}

export default App



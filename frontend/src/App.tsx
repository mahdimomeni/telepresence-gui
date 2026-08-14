import './App.css';

import { ThemeProvider } from '@/components/theme-provider';
import { ConnectPage } from './pages/connect-page';
import { useEffect, useState } from 'react';
import { ListPage } from './pages/list';
import { EventsOff, EventsOn } from '../wailsjs/runtime/runtime';
import { Spinner } from './components/ui/spinner';

function App() {
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        const unsubscribeConnectionChanged = EventsOn("connection-changed", (status: boolean) => {
            setIsConnected(status)
        })

        console.log("ENV ", import.meta.env.PROD)

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
            EventsOff("connection-changed", "connection-pending"),
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [])

    return (
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
            <div id="App" className="relative min-h-screen bg-background text-foreground flex items-center justify-center overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 w-full flex justify-center backdrop-blur-sm">
                    {!isConnected ? (
                        <ConnectPage onConnectSuccess={() => setIsConnected(true)} />
                    ) : (
                        <ListPage onDisconnect={() => setIsConnected(false)} />
                    )}
                </div>
            </div>
        </ThemeProvider>
    )
}

export default App

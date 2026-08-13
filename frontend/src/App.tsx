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

        return () => {
            EventsOff("connection-changed", "connection-pending")
        }
    }, [])

    return (
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
            <div id="App" className="min-h-screen bg-background text-foreground flex items-center justify-center">
                {!isConnected ? (
                    <ConnectPage onConnectSuccess={() => setIsConnected(true)} />
                ) : (
                    <ListPage onDisconnect={() => setIsConnected(false)} />
                )}
            </div>
        </ThemeProvider>
    )
}

export default App

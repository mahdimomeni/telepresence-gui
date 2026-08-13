import './App.css';

import { ThemeProvider } from '@/components/theme-provider';
import { ConnectPage } from './pages/connect-page';
import { useState } from 'react';
import { ListPage } from './pages/list';

function App() {
    const [isConnected, setIsConnected] = useState(false)
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

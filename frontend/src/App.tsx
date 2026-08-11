import {useState} from 'react';
import './App.css';
import {Greet} from "../wailsjs/go/main/App";

import { Button } from "@/components/ui/button"
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import { ConnectPage } from './pages/connect';

function App() {
    const [resultText, setResultText] = useState("Please enter your name below 👇");
    const [name, setName] = useState('');
    const updateName = (e: any) => setName(e.target.value);
    const updateResultText = (result: string) => setResultText(result);

    function greet() {
        Greet(name).then(updateResultText);
    }

    return (
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
            <div id="App">
                <ConnectPage />
            </div>
        </ThemeProvider>
    )
}

export default App

import {useState} from 'react';
import './App.css';
import {Greet} from "../wailsjs/go/main/App";

import { Button } from "@/components/ui/button"
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';

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
                <h1 className="text-3xl font-bold underline">
                    Hello world!
                </h1>
                <div id="result" className="result">{resultText}</div>
                <div id="input" className="input-box">
                    <input id="name" className="input" onChange={updateName} autoComplete="off" name="input" type="text"/>
                    <Button variant="outline" onClick={greet}>Greet</Button>
                </div>
                <ModeToggle />
            </div>
        </ThemeProvider>
    )
}

export default App
